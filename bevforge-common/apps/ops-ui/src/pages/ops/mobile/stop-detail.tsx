import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import { saveOpsMobileProofAttachment } from "@/features/ops-mobile/proof-attachments";
import {
  formatMobileCurrency,
  formatMobileDateTime,
  mobileGlassClass,
  queueStatusClass,
  stopStatusClass,
} from "@/features/ops-mobile/ui";
import { ArrowLeft, Camera, CheckCheck, FileSignature, FileUp, MessageSquareText, TriangleAlert } from "lucide-react";

export default function OpsMobileStopDetailPage() {
  const { stopId } = useParams();
  const {
    view,
    enqueueQueueEvent,
    checkInStop,
    checkOutStop,
    setStopStatus,
  } = useOpsMobile();
  const stop = view.stops.find((candidate) => candidate.id === stopId);
  const [noteText, setNoteText] = useState("");
  const [issueText, setIssueText] = useState("");
  const [proofRecipient, setProofRecipient] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofAttachmentName, setProofAttachmentName] = useState("");
  const [proofSaving, setProofSaving] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<globalThis.File | null>(null);
  const proofUploadInputRef = useRef<HTMLInputElement | null>(null);
  const proofCameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!stop) {
    return (
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardContent className="space-y-4 p-4">
          <p className="text-lg font-semibold text-white">Stop not found</p>
          <p className="text-sm text-white/65">
            This stop is not present in the current mobile cache.
          </p>
          <Link
            to="/ops/mobile/routes"
            className="inline-flex items-center gap-2 text-sm text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to routes
          </Link>
        </CardContent>
      </Card>
    );
  }

  const addNote = () => {
    if (!noteText.trim()) {
      return;
    }
    enqueueQueueEvent({
      type: "note_logged",
      summary: `Note added at ${stop.siteName}`,
      detail: noteText.trim(),
      routeId: stop.routeId,
      stopId: stop.id,
      siteId: stop.siteId,
      accountId: stop.siteId,
      truckId: stop.truckId,
      payload: {
        note: noteText.trim(),
      },
    });
    setNoteText("");
  };

  const addIssue = () => {
    if (!issueText.trim()) {
      return;
    }
    enqueueQueueEvent({
      type: "issue_logged",
      summary: `Issue logged at ${stop.siteName}`,
      detail: issueText.trim(),
      routeId: stop.routeId,
      stopId: stop.id,
      siteId: stop.siteId,
      accountId: stop.siteId,
      truckId: stop.truckId,
      payload: {
        issue: issueText.trim(),
      },
    });
    setIssueText("");
  };

  const addProof = async () => {
    if (!proofRecipient.trim() && !proofNote.trim() && !proofFile) {
      return;
    }

    setProofSaving(true);
    setProofError(null);
    try {
      const attachment = proofFile
        ? await saveOpsMobileProofAttachment(proofFile)
        : null;

      const detailBits = [proofRecipient.trim(), proofNote.trim()];
      if (attachment?.fileName) {
        detailBits.push(`Photo: ${attachment.fileName}`);
      }

      enqueueQueueEvent({
        type: "proof_logged",
        summary: `Proof captured for ${stop.siteName}`,
        detail: detailBits.filter(Boolean).join(" · "),
        routeId: stop.routeId,
        stopId: stop.id,
        siteId: stop.siteId,
        accountId: stop.siteId,
        truckId: stop.truckId,
        payload: {
          recipient: proofRecipient.trim(),
          note: proofNote.trim(),
          proofAttachmentId: attachment?.id,
          proofAttachmentName: attachment?.fileName,
          proofAttachmentMimeType: attachment?.mimeType,
          proofAttachmentSizeBytes: attachment?.sizeBytes,
        },
      });
      setProofRecipient("");
      setProofNote("");
      setProofFile(null);
      setProofAttachmentName("");
      if (proofUploadInputRef.current) {
        proofUploadInputRef.current.value = "";
      }
      if (proofCameraInputRef.current) {
        proofCameraInputRef.current.value = "";
      }
    } catch (error) {
      setProofError(
        error instanceof Error
          ? error.message
          : "Failed to store the proof attachment on this device.",
      );
    } finally {
      setProofSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to={`/ops/mobile/routes/${stop.routeId}`}
        className="inline-flex items-center gap-2 text-sm text-cyan-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to route
      </Link>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">{stop.siteName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-white/65">
                {stop.routeLabel} · {stop.address || "Address missing"}
              </p>
              <p className="mt-1 text-sm text-white/65">
                {stop.contactName || "No contact"} · {stop.phone || "No phone"}
              </p>
            </div>
            <Badge className={stopStatusClass(stop.localStatus)}>
              {stop.localStatus.replace("-", " ")}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Value
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatMobileCurrency(stop.totalValue)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Expected
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {stop.expectedCodes.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Delivered
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {stop.eventSnapshot.deliveredCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Queue
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {stop.pendingCount} pending
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => checkInStop(stop, "Checked in from OPS Mobile")}
              disabled={!stop.truckId}
            >
              Check in
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
              onClick={() => checkOutStop(stop, "Checked out from OPS Mobile")}
              disabled={!stop.truckId}
            >
              Check out
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/16"
              onClick={() => setStopStatus(stop, "servicing", "Working the stop")}
            >
              Mark servicing
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/16"
              onClick={() => setStopStatus(stop, "completed", "Stop completed on mobile")}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Complete stop
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-red-400/30 bg-red-400/10 text-red-100 hover:bg-red-400/16"
              onClick={() => setStopStatus(stop, "issue", "Issue state set on mobile")}
            >
              <TriangleAlert className="mr-2 h-4 w-4" />
              Flag issue
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {stop.expectedCodes.map((code) => (
              <span
                key={`${stop.id}-${code.kind}-${code.value}`}
                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
              >
                {code.label}: {code.value}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="manifest" className="space-y-3">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-[24px] bg-white/6 p-2 text-white/65">
          <TabsTrigger value="manifest" className="rounded-2xl px-4 py-2 data-[state=active]:bg-white/12">
            Manifest
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-2xl px-4 py-2 data-[state=active]:bg-white/12">
            Notes
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-2xl px-4 py-2 data-[state=active]:bg-white/12">
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manifest">
          <Card className={`${mobileGlassClass} rounded-[26px]`}>
            <CardContent className="space-y-4 p-4">
              {stop.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {order.orderNumber}
                      </p>
                      <p className="mt-1 text-sm text-white/60">
                        {order.status.replace("-", " ")} · {formatMobileCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <Link
                      to={`/ops/mobile/accounts/${stop.siteId}`}
                      className="text-sm text-cyan-100"
                    >
                      Account
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    {order.lineItems.map((lineItem) => (
                      <div
                        key={lineItem.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {lineItem.productName}
                            </p>
                            <p className="mt-1 text-xs text-white/55">
                              {lineItem.quantity} {lineItem.containerType}
                            </p>
                          </div>
                          <Badge className="border-white/15 bg-white/8 text-white/75">
                            {lineItem.packageType ?? "Standard pack"}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stop.expectedCodes
                            .filter((code) => {
                              if (code.kind === "skuId") {
                                return code.value === lineItem.skuId;
                              }
                              if (code.kind === "packageLotCode") {
                                return code.value === lineItem.packageLotCode;
                              }
                              if (code.kind === "batchCode") {
                                return code.value === lineItem.batchCode;
                              }
                              return code.value === lineItem.assetCode;
                            })
                            .map((code) => (
                              <span
                                key={`${lineItem.id}-${code.kind}-${code.value}`}
                                className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100"
                              >
                                {code.label}: {code.value}
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className={`${mobileGlassClass} rounded-[26px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <MessageSquareText className="h-4 w-4" />
                  Add note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Receiving notes, dock updates, account context..."
                  className="min-h-28 border-white/12 bg-white/6 text-white placeholder:text-white/35"
                />
                <Button
                  className="w-full rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                  onClick={addNote}
                >
                  Save note
                </Button>
              </CardContent>
            </Card>

            <Card className={`${mobileGlassClass} rounded-[26px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <TriangleAlert className="h-4 w-4" />
                  Log issue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={issueText}
                  onChange={(event) => setIssueText(event.target.value)}
                  placeholder="Short shipment, refusal, damaged goods, access issue..."
                  className="min-h-28 border-white/12 bg-white/6 text-white placeholder:text-white/35"
                />
                <Button
                  className="w-full rounded-full border border-red-400/30 bg-red-400/12 text-red-100 hover:bg-red-400/18"
                  onClick={addIssue}
                >
                  Save issue
                </Button>
              </CardContent>
            </Card>

            <Card className={`${mobileGlassClass} rounded-[26px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <FileSignature className="h-4 w-4" />
                  Proof of delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white/75">Recipient</Label>
                  <Input
                    value={proofRecipient}
                    onChange={(event) => setProofRecipient(event.target.value)}
                    placeholder="Signed by / received by"
                    className="border-white/12 bg-white/6 text-white placeholder:text-white/35"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/75">Proof note</Label>
                  <Textarea
                    value={proofNote}
                    onChange={(event) => setProofNote(event.target.value)}
                    placeholder="Photo captured, signature captured, left at dock..."
                    className="min-h-20 border-white/12 bg-white/6 text-white placeholder:text-white/35"
                  />
                </div>
                <input
                  ref={proofUploadInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setProofFile(nextFile);
                    setProofAttachmentName(nextFile?.name ?? "");
                    setProofError(null);
                  }}
                />
                <input
                  ref={proofCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setProofFile(nextFile);
                    setProofAttachmentName(nextFile?.name ?? "");
                    setProofError(null);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/8 text-white hover:bg-white/14"
                    onClick={() => proofCameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Take photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/15 bg-white/8 text-white hover:bg-white/14"
                    onClick={() => proofUploadInputRef.current?.click()}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload image
                  </Button>
                </div>
                {proofAttachmentName ? (
                  <p className="text-xs text-white/70">
                    Attached locally: {proofAttachmentName}
                  </p>
                ) : null}
                {proofError ? (
                  <p className="text-xs text-red-200">{proofError}</p>
                ) : null}
                <Button
                  className="w-full rounded-full border border-white/15 bg-white/8 text-white hover:bg-white/14"
                  onClick={() => {
                    void addProof();
                  }}
                  disabled={proofSaving}
                >
                  {proofSaving ? "Saving proof..." : "Save proof note"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className={`${mobileGlassClass} rounded-[26px]`}>
            <CardContent className="space-y-3 p-4">
              {stop.timeline.map((item) => (
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
                    {item.detail ?? "Local mobile stop event"}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/40">
                    {formatMobileDateTime(item.createdAt)}
                  </p>
                </div>
              ))}

              {stop.timeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
                  No local stop timeline entries yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
