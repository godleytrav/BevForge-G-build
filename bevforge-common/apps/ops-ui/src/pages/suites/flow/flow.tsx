import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Droplet, FileText, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowSuiteLayout } from "./FlowSuiteLayout";
import { getFlowOverviewSnapshot } from "./data";
import { flowBadgeStyle, flowGlassPanelStyle, flowSoftBadgeStyle } from "./theme";

const flowMvpPages = [
  {
    route: "/flow/taps",
    title: "Tap Runtime",
    description: "Live tap states, temp/CO2 telemetry cards, and control intents.",
    icon: Droplet,
  },
  {
    route: "/flow/kiosk",
    title: "Kiosk Mode",
    description: "Per-site tap availability, wallet/QR scan stubs, and 6/8/12/22 oz pour actions.",
    icon: FileText,
  },
  {
    route: "/flow/sessions",
    title: "Sessions",
    description: "Session policy, limits, and state controls for self-serve and bartender flows.",
    icon: UsersRound,
  },
  {
    route: "/flow/analytics",
    title: "Analytics",
    description: "Telemetry distributions, queue health, and OS depletion acceptance summaries.",
    icon: BarChart3,
  },
];

export default function FlowPage() {
  const overview = getFlowOverviewSnapshot();

  return (
    <FlowSuiteLayout
      title="FLOW Runtime Hub"
      description="FLOW is the edge runtime for taps, kiosk UX, and pour telemetry while OS remains control-plane authority for accepted depletion."
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OS Accepted Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.osAcceptedEvents}</p>
            <p className="text-xs text-muted-foreground">Committed to OS depletion ledger</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Queue + OS Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.osPendingEvents}</p>
            <p className="text-xs text-muted-foreground">Events emitted by FLOW awaiting reconciliation</p>
          </CardContent>
        </Card>
        <Card style={flowGlassPanelStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.activeSessions}</p>
            <p className="text-xs text-muted-foreground">Self-serve and bartender sessions in-flight</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {flowMvpPages.map((page) => {
          const Icon = page.icon;
          return (
            <Card key={page.route} style={flowGlassPanelStyle}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {page.title}
                </CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-end">
                <Button asChild variant="outline">
                  <Link to={page.route}>
                    Open Page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card style={flowGlassPanelStyle}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Suite Authority Boundaries
          </CardTitle>
          <CardDescription>
            FLOW references OS/OPS identifiers but does not mutate OS quantity, batch, reservation, or OPS order/compliance ledgers directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge style={flowBadgeStyle}>FLOW: tap runtime + telemetry + serving UI</Badge>
            <Badge style={flowSoftBadgeStyle}>OS: quantity + batch + depletion truth</Badge>
            <Badge style={flowSoftBadgeStyle}>OPS: orders + logistics + compliance</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            All FLOW depletion impact is represented as pour events (`eventId`) and accepted by OS through explicit
            contracts.
          </p>
        </CardContent>
      </Card>
    </FlowSuiteLayout>
  );
}
