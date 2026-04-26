import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FlowRuntimeProvider, type FlowRuntimeTapState, useFlowRuntime } from "./runtime";
import { getFlowProductImageUrl } from "./data";
import { flowGlassPanelStyle } from "./theme";

const pourSizesOz = [6, 8, 12, 22] as const;

const runtimeStateClass: Record<FlowRuntimeTapState, string> = {
  ready: "border-green-500/45 bg-green-500/20 text-green-100",
  pouring: "border-cyan-500/45 bg-cyan-500/20 text-cyan-100",
  blocked: "border-amber-500/50 bg-amber-500/20 text-amber-100",
  offline: "border-red-500/45 bg-red-500/20 text-red-100",
};

export default function FlowKioskPage() {
  return (
    <FlowRuntimeProvider>
      <AppShell currentSuite="flow" pageTitle="FLOW Kiosk">
        <FlowKioskPourCards />
      </AppShell>
    </FlowRuntimeProvider>
  );
}

function FlowKioskPourCards() {
  const {
    activeSiteId,
    assignments,
    menuItems,
    products,
    tapAssignments,
    tapStates,
    setTapState,
    sessions,
    queueEvent,
    buildAuthorizePourRequest,
    authorizePourStub,
  } = useFlowRuntime();

  const activeSessionId = sessions.find(
    (session) => session.siteId === activeSiteId && session.mode === "self_serve" && session.status === "active"
  )?.id;

  const pourCards = useMemo(() => {
    return tapAssignments
      .filter((assignment) => assignment.siteId === activeSiteId)
      .map((tapAssignment) => {
        const menuItem = menuItems.find((item) => item.tapAssignmentId === tapAssignment.tapAssignmentId);
        const product = products.find((item) => item.productId === tapAssignment.productId);
        const mountedAssignment = assignments.find(
          (assignment) =>
            assignment.tapAssignmentId === tapAssignment.tapAssignmentId || assignment.tapId === tapAssignment.tapId
        );
        const imageUrl =
          menuItem?.imageUrl ??
          tapAssignment.imageUrl ??
          getFlowProductImageUrl(tapAssignment.productId, tapAssignment.imageAssetId) ??
          product?.assets.find((asset) => asset.assetId === product.currentAssetId)?.images.cardImageUrl ??
          product?.assets[0]?.images.cardImageUrl;

        return {
          tapAssignment,
          menuItem,
          mountedAssignment,
          imageUrl,
        };
      })
      .filter(({ menuItem, tapAssignment }) => menuItem?.status === "on_tap" && tapAssignment.status === "active");
  }, [activeSiteId, assignments, menuItems, products, tapAssignments]);
  const [selectedPourSizeByItemId, setSelectedPourSizeByItemId] = useState<Record<string, number>>({});

  const getSelectedPourSize = (tapAssignmentId: string, availableSizes?: number[]): number => {
    const defaultSize = availableSizes?.[2] ?? availableSizes?.[0] ?? 12;
    return selectedPourSizeByItemId[tapAssignmentId] ?? defaultSize;
  };

  const handlePour = (tapAssignmentId: string, volumeOz: number) => {
    const tapAssignment = tapAssignments.find((item) => item.tapAssignmentId === tapAssignmentId);
    if (!tapAssignment) {
      return;
    }

    const tapId = tapAssignment.tapId;
    const runtimeState = tapStates[tapId] ?? "offline";
    if (runtimeState !== "ready") {
      return;
    }

    const request = buildAuthorizePourRequest({
      tapAssignmentId,
      tapId,
      productId: tapAssignment.productId,
      productCode: tapAssignment.productCode,
      skuId: tapAssignment.skuId,
      packageLotId: tapAssignment.packageLotId,
      packageLotCode: tapAssignment.packageLotCode,
      assetId: tapAssignment.assetId,
      assetCode: tapAssignment.assetCode,
      labelVersionId: tapAssignment.labelVersionId,
      pourSizeOz: volumeOz,
      mode: "self_serve",
      sessionId: activeSessionId,
      token: "kiosk-local-token",
    });
    const response = authorizePourStub(request);
    if (response.decision === "blocked") {
      setTapState(tapId, "blocked");
      return;
    }

    const mountedAssignment = assignments.find(
      (assignment) => assignment.tapAssignmentId === tapAssignmentId || assignment.tapId === tapId
    );
    setTapState(tapId, "pouring");
    queueEvent({
      eventId: request.eventId,
      siteId: activeSiteId,
      tapId,
      tapAssignmentId,
      assignmentId: mountedAssignment?.id,
      kegAssetId: mountedAssignment?.kegAssetId,
      assetId: tapAssignment.assetId ?? mountedAssignment?.assetId,
      assetCode: tapAssignment.assetCode ?? mountedAssignment?.assetCode,
      productId: tapAssignment.productId ?? mountedAssignment?.productId,
      productCode: tapAssignment.productCode ?? mountedAssignment?.productCode,
      skuId: tapAssignment.skuId,
      batchId: mountedAssignment?.batchId,
      packageLotId: tapAssignment.packageLotId ?? mountedAssignment?.packageLotId,
      packageLotCode: tapAssignment.packageLotCode ?? mountedAssignment?.packageLotCode,
      labelVersionId: tapAssignment.labelVersionId ?? mountedAssignment?.labelVersionId,
      volume: volumeOz,
      uom: "oz",
      sourceMode: "self_serve",
      sessionId: activeSessionId,
      actorId: "kiosk-local-token",
      durationMs: Math.round(volumeOz * 430),
    });

    window.setTimeout(() => {
      setTapState(tapId, "ready");
    }, 900);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {pourCards.map(({ tapAssignment, menuItem, imageUrl }) => {
        if (!menuItem) {
          return null;
        }

        const tapId = tapAssignment.tapId;
        const runtimeState = tapStates[tapId] ?? "offline";
        const selectedPourSize = getSelectedPourSize(tapAssignment.tapAssignmentId, tapAssignment.pourSizesOz);
        const availableSizes = tapAssignment.pourSizesOz ?? pourSizesOz;

        return (
          <Card key={tapAssignment.tapAssignmentId} style={flowGlassPanelStyle}>
            <CardContent className="space-y-3 pt-6">
              <Button
                type="button"
                variant="ghost"
                disabled={runtimeState !== "ready"}
                onClick={() => handlePour(tapAssignment.tapAssignmentId, selectedPourSize)}
                className="h-auto w-full rounded-2xl border border-green-400/30 bg-black/30 p-0 text-left hover:bg-green-500/10 disabled:opacity-60"
              >
                <div className="w-full overflow-hidden rounded-2xl">
                  <div className="relative h-56 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt={menuItem.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-green-500/25 via-black/30 to-black/80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <Badge className={`absolute right-4 top-4 ${runtimeStateClass[runtimeState]}`}>{runtimeState}</Badge>
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-2xl font-semibold text-green-50">{menuItem.name}</p>
                      <p className="mt-1 text-sm text-green-100/85">
                        {[menuItem.style, menuItem.abv ? `${menuItem.abv.toFixed(1)}% ABV` : undefined]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4">
                    <p className="line-clamp-2 min-h-[2.75rem] text-sm text-muted-foreground">
                      {menuItem.tastingNotes ?? tapAssignment.tastingNotes ?? "Ready from the active tap assignment."}
                    </p>
                    <p className="text-sm font-medium text-green-100">Tap to pour {selectedPourSize} oz</p>
                  </div>
                </div>
              </Button>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((volumeOz) => (
                  <Button
                    key={`${tapAssignment.tapAssignmentId}-${volumeOz}`}
                    size="sm"
                    variant={selectedPourSize === volumeOz ? "default" : "outline"}
                    className="h-7 px-2.5 text-xs"
                    onClick={() =>
                      setSelectedPourSizeByItemId((current) => ({
                        ...current,
                        [tapAssignment.tapAssignmentId]: volumeOz,
                      }))
                    }
                  >
                    {volumeOz} oz
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      {pourCards.length === 0 && (
        <Card style={flowGlassPanelStyle}>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No on-tap beverages available for kiosk service.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
