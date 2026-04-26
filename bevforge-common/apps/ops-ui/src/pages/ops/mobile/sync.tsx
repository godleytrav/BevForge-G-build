import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpsMobile } from "@/features/ops-mobile/provider";
import {
  gapSeverityClass,
  mobileGlassClass,
  queueStatusClass,
} from "@/features/ops-mobile/ui";
import { RefreshCcw, UploadCloud } from "lucide-react";

export default function OpsMobileSyncPage() {
  const { state, view, refreshData, syncQueue } = useOpsMobile();

  return (
    <div className="space-y-4">
      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Offline sync center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Pending
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {view.queueSummary.pending}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Blocked
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {view.queueSummary.blocked}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Routes cached
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {state.data.routes.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                Accounts cached
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {state.data.accounts.length}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              onClick={() => {
                void syncQueue();
              }}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Run sync
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/15 bg-white/6 text-white hover:bg-white/12"
              onClick={() => {
                void refreshData();
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh cache
            </Button>
          </div>

          <p className="text-sm text-white/65">
            {state.lastSyncMessage ?? "No sync has been attempted yet."}
          </p>
        </CardContent>
      </Card>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Queued write log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {view.recentQueue.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{item.summary}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/40">
                    {item.type.replace(/_/g, " ")} · {item.createdAt}
                  </p>
                </div>
                <Badge className={queueStatusClass(item.syncStatus)}>
                  {item.syncStatus}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-white/65">
                {item.detail ?? "Local mobile event"}
              </p>
              {item.gapMessage ? (
                <p className="mt-2 text-sm text-red-100/80">{item.gapMessage}</p>
              ) : null}
            </div>
          ))}

          {view.recentQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.04] p-4 text-sm text-white/70">
              The mobile write queue is empty.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className={`${mobileGlassClass} rounded-[26px]`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-white">Missing endpoints and fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {view.gaps.map((gap) => (
            <div
              key={gap.id}
              className="rounded-2xl border border-white/10 bg-white/6 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{gap.title}</p>
                <Badge className={gapSeverityClass(gap.severity)}>
                  {gap.scope}
                  {typeof gap.count === "number" ? ` · ${gap.count}` : ""}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-white/65">{gap.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

