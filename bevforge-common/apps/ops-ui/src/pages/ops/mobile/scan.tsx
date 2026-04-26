import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  describeOpsMobileLookupLocation,
  findOpsMobileLookupResult,
} from "@/features/ops-mobile/lookup";
import { mobileGlassClass, queueStatusClass } from "@/features/ops-mobile/ui";
import type { OpsMobileScanMode } from "@/features/ops-mobile/data";
import { normalizeScannedIdentifier } from "@/lib/driver-scan";
import { Camera, CheckCircle2, PackageSearch, ScanLine } from "lucide-react";

type OpsMobileScanExperience = "workflow" | "lookup";

const scanModes: Array<{ value: OpsMobileScanMode; label: string }> = [
  { value: "delivery", label: "Delivery" },
  { value: "load", label: "Load" },
  { value: "unload", label: "Unload" },
  { value: "return", label: "Return" },
  { value: "empty", label: "Empty" },
  { value: "damaged", label: "Damaged" },
];

export default function OpsMobileScanPage() {
  const navigate = useNavigate();
  const { view, recordScan } = useOpsMobile();
  const currentStop = view.currentStop;
  const [scanExperience, setScanExperience] =
    useState<OpsMobileScanExperience>("workflow");
  const [mode, setMode] = useState<OpsMobileScanMode>("delivery");
  const [routeId, setRouteId] = useState<string>(currentStop?.routeId ?? "none");
  const [stopId, setStopId] = useState<string>(currentStop?.id ?? "none");
  const [scanValue, setScanValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveScannerActive, setLiveScannerActive] = useState(false);
  const [liveScannerLoading, setLiveScannerLoading] = useState(false);
  const liveVideoRef = useRef<globalThis.HTMLVideoElement | null>(null);

  const canUseLiveScanner =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (currentStop && routeId === "none") {
      setRouteId(currentStop.routeId);
      setStopId(currentStop.id);
    }
  }, [currentStop, routeId]);

  const selectedRoute =
    view.routes.find((candidate) => candidate.id === routeId) ?? null;
  const routeStops = selectedRoute?.stops ?? [];
  const selectedStop =
    routeStops.find((candidate) => candidate.id === stopId) ??
    view.stops.find((candidate) => candidate.id === stopId) ??
    null;

  const recentScans = view.recentQueue
    .filter((item) => item.type === "scan_recorded")
    .slice(0, 8);

  const workflowScanDisabled =
    scanValue.trim().length === 0 ||
    ((mode === "delivery" || mode === "return") && !selectedStop);
  const cameraActionDisabled =
    scanExperience === "workflow" &&
    (mode === "delivery" || mode === "return") &&
    !selectedStop;

  const contextCodes = useMemo(
    () => selectedStop?.expectedCodes.slice(0, 8) ?? [],
    [selectedStop],
  );

  const lookupIdentifier = useMemo(
    () => normalizeScannedIdentifier(scanValue).identifier.trim(),
    [scanValue],
  );
  const lookupPreview = useMemo(
    () => findOpsMobileLookupResult(view, lookupIdentifier),
    [lookupIdentifier, view],
  );

  const recordWorkflowScan = useCallback(
    (rawValue: string, source: "manual" | "camera") => {
      const trimmed = rawValue.trim();
      const result = recordScan({
        mode,
        rawValue: trimmed,
        routeId: selectedRoute?.id,
        stopId: selectedStop?.id,
        siteId: selectedStop?.siteId,
        truckId: selectedStop?.truckId,
      });

      if (!result) {
        setFeedback(
          source === "camera"
            ? "Camera read a QR code, but it did not contain a usable identifier."
            : "Enter a scan value before recording.",
        );
        return;
      }

      setFeedback(
        result.matchedExpected
          ? `${result.normalizedId} matched ${result.matchedKind ?? "expected manifest data"}${source === "camera" ? " via camera." : "."}`
          : `${result.normalizedId} recorded locally${source === "camera" ? " from the camera" : ""} with no manifest match.`,
      );
      setScanValue("");
    },
    [
      mode,
      recordScan,
      selectedRoute?.id,
      selectedStop?.id,
      selectedStop?.siteId,
      selectedStop?.truckId,
    ],
  );

  const openLookup = useCallback(
    (rawValue: string, source: "manual" | "camera") => {
      const normalized = normalizeScannedIdentifier(rawValue);
      const nextValue = normalized.identifier.trim();
      if (!nextValue) {
        setFeedback(
          source === "camera"
            ? "Camera read a QR code, but it did not contain a usable identifier."
            : "Enter a scan value before opening item details.",
        );
        return;
      }

      const result = findOpsMobileLookupResult(view, nextValue);
      setFeedback(
        result
          ? `Opening ${nextValue} details${source === "camera" ? " from camera" : ""}.`
          : `${nextValue} is not in the current mobile cache yet, but you can still open the lookup view.`,
      );
      setScanValue("");
      navigate(`/ops/mobile/lookup/${encodeURIComponent(nextValue)}`);
    },
    [navigate, view],
  );

  const handlePrimaryAction = () => {
    if (scanExperience === "lookup") {
      openLookup(scanValue, "manual");
      return;
    }
    recordWorkflowScan(scanValue, "manual");
  };

  useEffect(() => {
    if (!canUseLiveScanner || !liveScannerActive || !liveVideoRef.current) {
      return undefined;
    }

    const reader = new BrowserQRCodeReader();
    let controls: IScannerControls | null = null;
    let stopped = false;
    setLiveScannerLoading(true);
    setCameraError(null);
    setFeedback(null);

    void reader
      .decodeFromVideoDevice(undefined, liveVideoRef.current, (result, error, nextControls) => {
        controls = nextControls;
        if (!stopped) {
          setLiveScannerLoading(false);
        }

        if (result) {
          const value = result.getText().trim();
          if (!value) {
            return;
          }

          stopped = true;
          nextControls.stop();
          setLiveScannerActive(false);

          if (scanExperience === "lookup") {
            openLookup(value, "camera");
          } else {
            recordWorkflowScan(value, "camera");
          }
          setFeedback("Live scan decoded successfully.");
          return;
        }

        if (error && !stopped) {
          const message = error instanceof Error ? error.message : String(error);
          if (
            !message.includes("No MultiFormat Readers were able to detect the code") &&
            !message.includes("No barcode found")
          ) {
            setCameraError(message);
          }
        }
      })
      .catch((error) => {
        if (stopped) {
          return;
        }
        setLiveScannerActive(false);
        setLiveScannerLoading(false);
        setCameraError(
          error instanceof Error
            ? error.message
            : "OPS Mobile could not start the live camera scanner.",
        );
      });

    return () => {
      stopped = true;
      controls?.stop();
      setLiveScannerLoading(false);
    };
  }, [canUseLiveScanner, liveScannerActive, openLookup, recordWorkflowScan, scanExperience]);

  return (
    <div className="space-y-4">
      <Tabs
        value={scanExperience}
        onValueChange={(value) => {
          setScanExperience(value as OpsMobileScanExperience);
          setCameraError(null);
          setFeedback(null);
        }}
        className="space-y-4"
      >
        <Card className={`${mobileGlassClass} rounded-[26px]`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-white">Mobile scan flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canUseLiveScanner ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                True in-app scanning needs a secure OPS host. On this dev/LAN host, use the native
                phone camera app to scan the QR and open OPS Mobile directly.
              </div>
            ) : null}

            <TabsList className="grid h-auto w-full grid-cols-2 rounded-[22px] bg-white/6 p-1 text-white/60">
              <TabsTrigger
                value="workflow"
                className="rounded-[18px] px-4 py-3 data-[state=active]:bg-cyan-300/16 data-[state=active]:text-cyan-100"
              >
                Workflow
              </TabsTrigger>
              <TabsTrigger
                value="lookup"
                className="rounded-[18px] px-4 py-3 data-[state=active]:bg-cyan-300/16 data-[state=active]:text-cyan-100"
              >
                Lookup
              </TabsTrigger>
            </TabsList>

            {liveScannerActive ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Live scanner</p>
                    <p className="mt-1 text-xs text-white/60">
                      Hold the QR inside the frame and OPS Mobile will open it automatically.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/12 bg-white/6 text-white hover:bg-white/10"
                    onClick={() => setLiveScannerActive(false)}
                  >
                    Stop
                  </Button>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <video
                    ref={liveVideoRef}
                    className="aspect-[3/4] w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>

                {liveScannerLoading ? (
                  <p className="mt-3 text-xs text-cyan-100/80">Starting camera scanner…</p>
                ) : null}
              </div>
            ) : null}

            <TabsContent value="workflow" className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/75">Scan mode</Label>
                    <Select
                      value={mode}
                      onValueChange={(value) =>
                        setMode(value as OpsMobileScanMode)
                      }
                    >
                      <SelectTrigger className="border-white/12 bg-white/6 text-white">
                        <SelectValue placeholder="Choose mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {scanModes.map((entry) => (
                          <SelectItem key={entry.value} value={entry.value}>
                            {entry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Route context</Label>
                    <Select
                      value={routeId}
                      onValueChange={(value) => {
                        setRouteId(value);
                        setStopId("none");
                      }}
                    >
                      <SelectTrigger className="border-white/12 bg-white/6 text-white">
                        <SelectValue placeholder="Choose route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No route context</SelectItem>
                        {view.routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Stop context</Label>
                    <Select value={stopId} onValueChange={setStopId}>
                      <SelectTrigger className="border-white/12 bg-white/6 text-white">
                        <SelectValue placeholder="Choose stop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Route-level only</SelectItem>
                        {routeStops.map((stop) => (
                          <SelectItem key={stop.id} value={stop.id}>
                            {stop.siteName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/75">Scan value</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={scanValue}
                          onChange={(event) => setScanValue(event.target.value)}
                          placeholder="Scan package lot, asset code, batch code, or SKU"
                          className="h-12 border-white/12 bg-white/6 text-white placeholder:text-white/35"
                        />
                        {canUseLiveScanner ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-white/12 bg-white/6 px-4 text-white hover:bg-white/10"
                            onClick={() => {
                              setFeedback(null);
                              setCameraError(null);
                              setLiveScannerActive(true);
                            }}
                            disabled={cameraActionDisabled}
                          >
                            <Camera className="h-4 w-4" />
                            <span className="ml-2 text-sm">Live Scan</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-white/12 bg-white/6 px-4 text-white hover:bg-white/10"
                            disabled
                          >
                            <Camera className="h-4 w-4" />
                            <span className="ml-2 text-sm">Secure Host Required</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                    onClick={handlePrimaryAction}
                    disabled={workflowScanDisabled}
                  >
                    <ScanLine className="mr-2 h-4 w-4" />
                    Record workflow scan
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Workflow context
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {selectedStop?.siteName ??
                        selectedRoute?.label ??
                        "Unscoped mobile scan"}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      {selectedStop
                        ? `${selectedStop.eventSnapshot.deliveredCount}/${selectedStop.expectedCodes.length} delivered matches`
                        : "Use route-level scans for truck loading and unloading."}
                    </p>
                    {cameraActionDisabled ? (
                      <p className="mt-2 text-xs text-amber-100/80">
                        Delivery and return camera scans need a stop selected first.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Expected codes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contextCodes.length > 0 ? (
                        contextCodes.map((code) => (
                          <span
                            key={`${code.kind}-${code.value}`}
                            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                          >
                            {code.label}: {code.value}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-white/60">
                          No manifest codes are available for the selected context.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lookup" className="mt-0">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/75">Lookup value</Label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={scanValue}
                          onChange={(event) => setScanValue(event.target.value)}
                          placeholder="Scan a keg, package lot, batch, or SKU QR"
                          className="h-12 border-white/12 bg-white/6 text-white placeholder:text-white/35"
                        />
                        {canUseLiveScanner ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-white/12 bg-white/6 px-4 text-white hover:bg-white/10"
                            onClick={() => {
                              setFeedback(null);
                              setCameraError(null);
                              setLiveScannerActive(true);
                            }}
                          >
                            <Camera className="h-4 w-4" />
                            <span className="ml-2 text-sm">Live Scan</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-12 rounded-full border-white/12 bg-white/6 px-4 text-white hover:bg-white/10"
                            disabled
                          >
                            <Camera className="h-4 w-4" />
                            <span className="ml-2 text-sm">Secure Host Required</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                    onClick={handlePrimaryAction}
                    disabled={scanValue.trim().length === 0}
                  >
                    <PackageSearch className="mr-2 h-4 w-4" />
                    Open item details
                  </Button>

                  <p className="text-xs text-white/50">
                    Lookup scans resolve a QR into the human-readable identifier and
                    open its mobile detail page.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Resolved value
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {lookupIdentifier || "Waiting for scan"}
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      Open a cache-backed detail view for keg/package lookup instead
                      of recording a route event.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Lookup preview
                    </p>
                    {lookupPreview ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {lookupPreview.identifier}
                            </p>
                            <p className="mt-1 text-sm text-white/60">
                              {describeOpsMobileLookupLocation(lookupPreview)}
                            </p>
                          </div>
                          {lookupPreview.matchedLabel ? (
                            <Badge className="border-cyan-300/25 bg-cyan-300/12 text-cyan-100">
                              {lookupPreview.matchedLabel}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                              Stops
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {lookupPreview.expectedStops.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                              Delivered
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {lookupPreview.deliveredStops.length}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                              Returned
                            </p>
                            <p className="mt-2 text-lg font-semibold text-white">
                              {lookupPreview.returnedStops.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-white/60">
                        {lookupIdentifier
                          ? "This identifier is not in the current mobile cache yet."
                          : "Scan or enter a value to preview the matching item detail."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {feedback ? (
              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
                {feedback}
              </div>
            ) : null}

            {cameraError ? (
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {cameraError}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </Tabs>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Recent scan events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentScans.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.summary}</p>
                <Badge className={queueStatusClass(item.syncStatus)}>
                  {item.syncStatus}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-white/65">
                {item.detail ?? "Local scan event"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/40">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {item.createdAt}
              </div>
            </div>
          ))}

          {recentScans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
              No scans have been captured yet in this mobile queue.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
