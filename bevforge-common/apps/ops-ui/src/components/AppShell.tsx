import { type ReactNode, useMemo, useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Calendar,
  Settings,
  User,
  Home,
  FileText,
  Cog,
  Users,
  CheckCircle,
  Truck,
  Route,
  MapPin,
  Package,
  Droplet,
  Beaker,
  TrendingUp,
  Target,
  Shield,
  ReceiptText,
  Inbox,
  MessageSquare,
  Megaphone,
  Clock3,
  ScanLine,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  bevForgeShellContract,
  type SuiteId,
} from "@bevforge/ui-shared/app-shell-contract";
import { bevForgeSuiteThemes } from "@bevforge/ui-shared/suite-theme-contract";
import { suiteRouteUrl } from "@/lib/suite-links";

const suiteIconById: Record<SuiteId, string> = {
  os: "⬡",
  ops: "◇",
  lab: "◆",
  flow: "◈",
  connect: "◉",
};

const globalIconByRoute: Record<string, LucideIcon> = {
  "/": Home,
  "/calendar": Calendar,
  "/directory": Users,
  "/tasks": CheckCircle,
  "/reports": FileText,
  "/settings": Cog,
};

const suites = bevForgeShellContract.suites.map((suite) => ({
  ...suite,
  icon: suiteIconById[suite.id],
}));

const globalLinks = bevForgeShellContract.global.map((link) => ({
  ...link,
  icon: globalIconByRoute[link.route] ?? FileText,
}));

const opsLinks = [
  { label: "OPS Overview", route: "/ops", icon: Home },
  { label: "Logistics Canvas", route: "/ops/logistics", icon: Truck },
  { label: "Driver App", route: "/ops/logistics/driver", icon: ScanLine },
  { label: "Route Planner", route: "/ops/logistics/routes", icon: Route },
  { label: "Sites", route: "/ops/logistics/sites", icon: MapPin },
  { label: "CRM Clients", route: "/ops/crm", icon: Users },
  { label: "Orders", route: "/ops/orders", icon: ReceiptText },
  { label: "Products & Inventory", route: "/ops/products", icon: Package },
  { label: "Batches", route: "/ops/batches", icon: Beaker },
  { label: "Forecast", route: "/ops/forecast", icon: TrendingUp },
  { label: "Goals Planner", route: "/ops/goals", icon: Target },
  { label: "Compliance", route: "/ops/compliance", icon: Shield },
];

const connectLinks = [
  { label: "Inbox", route: "/connect/inbox", icon: Inbox },
  { label: "Messages", route: "/connect/messages", icon: MessageSquare },
  { label: "Employees", route: "/connect/employees", icon: Users },
  { label: "Tasks", route: "/connect/tasks", icon: CheckCircle },
  { label: "Campaigns", route: "/connect/campaigns", icon: Megaphone },
  { label: "Timesheets", route: "/connect/timesheets", icon: Clock3 },
  { label: "Accounts", route: "/connect/accounts", icon: Users },
  { label: "Contacts", route: "/connect/contacts", icon: Users },
  { label: "Threads", route: "/connect/threads", icon: MessageSquare },
];

const flowLinks = [
  { label: "Flow Overview", route: "/flow", icon: Home },
  { label: "Taps", route: "/flow/taps", icon: Droplet },
  { label: "Kiosk", route: "/flow/kiosk", icon: FileText },
  { label: "Sessions", route: "/flow/sessions", icon: Users },
  { label: "Analytics", route: "/flow/analytics", icon: TrendingUp },
];

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
  currentSuite?: string;
  showNavigationDrawer?: boolean;
}

const isSuiteId = (value: string): value is SuiteId =>
  value === "os" ||
  value === "ops" ||
  value === "lab" ||
  value === "flow" ||
  value === "connect";

const hexToRgba = (hexColor: string, alpha: number): string => {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(139, 92, 246, ${alpha})`;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return `rgba(139, 92, 246, ${alpha})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const suiteGradientById: Record<SuiteId, string> = {
  os: `linear-gradient(180deg, rgba(7,11,16,1) 0%, ${hexToRgba(bevForgeSuiteThemes.os.deep, 0.52)} 58%, ${hexToRgba(bevForgeSuiteThemes.os.primary, 0.34)} 100%)`,
  ops: `linear-gradient(180deg, rgba(8,11,16,1) 0%, ${hexToRgba(bevForgeSuiteThemes.ops.deep, 0.5)} 58%, ${hexToRgba(bevForgeSuiteThemes.ops.primary, 0.34)} 100%)`,
  lab: `linear-gradient(180deg, rgba(12,11,7,1) 0%, ${hexToRgba(bevForgeSuiteThemes.lab.deep, 0.5)} 58%, ${hexToRgba(bevForgeSuiteThemes.lab.primary, 0.34)} 100%)`,
  flow: `linear-gradient(180deg, rgba(7,13,9,1) 0%, ${hexToRgba(bevForgeSuiteThemes.flow.deep, 0.54)} 58%, ${hexToRgba(bevForgeSuiteThemes.flow.primary, 0.34)} 100%)`,
  connect: `linear-gradient(180deg, rgba(13,10,16,1) 0%, ${hexToRgba(bevForgeSuiteThemes.connect.deep, 0.52)} 58%, ${hexToRgba(bevForgeSuiteThemes.connect.primary, 0.34)} 100%)`,
};

export function AppShell({
  children,
  pageTitle = "Dashboard",
  currentSuite,
  showNavigationDrawer = true,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const suiteId = useMemo(() => {
    if (currentSuite) {
      const normalized = currentSuite.toLowerCase();
      if (isSuiteId(normalized)) {
        return normalized;
      }
    }

    const detected = suites.find((suite) =>
      location.pathname.startsWith(suite.route),
    );
    return detected?.id;
  }, [currentSuite, location.pathname]);

  const activeSuite = suites.find((suite) => suite.id === suiteId);
  const suiteTheme = suiteId ? bevForgeSuiteThemes[suiteId] : undefined;
  const isOpsContext =
    suiteId === "ops" || location.pathname.startsWith("/ops");
  const calendarRoute = isOpsContext ? "/calendar?suite=ops" : "/calendar";

  const activeLinkStyles = suiteTheme
    ? {
        borderColor: hexToRgba(suiteTheme.soft, 0.7),
        background: hexToRgba(suiteTheme.primary, 0.16),
        color: "#F4F4FF",
      }
    : undefined;

  const renderDrawerLinks = (
    links: Array<{ label: string; route: string; icon: LucideIcon }>,
  ) => {
    return links.map((link) => {
      const Icon = link.icon;
      const resolvedRoute =
        link.route === "/calendar" ? calendarRoute : link.route;
      const routePath = resolvedRoute.split("?")[0];
      const isActive =
        location.pathname === routePath ||
        location.pathname.startsWith(`${routePath}/`);

      return (
        <Link
          key={resolvedRoute}
          to={resolvedRoute}
          onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-accent/10"
          style={isActive ? activeLinkStyles : undefined}
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{link.label}</span>
        </Link>
      );
    });
  };

  return (
    <div
      className="min-h-screen"
      data-suite={suiteId}
      style={{
        background: suiteId
          ? suiteGradientById[suiteId]
          : "hsl(var(--background))",
      }}
    >
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showNavigationDrawer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(true)}
                className="hover:bg-accent/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary">
                <span className="text-lg font-bold">⬡</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none text-foreground">
                  BevForge
                </span>
                {activeSuite && suiteTheme && (
                  <span
                    className="mt-0.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      borderColor: hexToRgba(suiteTheme.soft, 0.8),
                      color: suiteTheme.soft,
                      boxShadow: suiteTheme.glow,
                    }}
                  >
                    {activeSuite.label}
                  </span>
                )}
              </div>
            </Link>
          </div>

          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  Suites
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {suites.map((suite) => (
                  <DropdownMenuItem key={`suite-menu-${suite.id}`} asChild>
                    <a href={suiteRouteUrl(suite.id, suite.route)} className="cursor-pointer">
                      {suite.label} - {suite.subtitle}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent/10 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to={calendarRoute}>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent/10"
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-accent/10"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-accent/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {showNavigationDrawer && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
            <SheetHeader className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary">
                  <span className="text-lg font-bold">⬡</span>
                </div>
                <SheetTitle className="text-foreground">
                  BevForge Navigation
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-4">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Suites
                </h3>
                <nav className="flex flex-col gap-1">
                  {suites.map((suite) => {
                    const isActive = location.pathname.startsWith(suite.route);
                    const theme = bevForgeSuiteThemes[suite.id];

                    return (
                      <a
                        key={suite.id}
                        href={suiteRouteUrl(suite.id, suite.route)}
                        onClick={() => setDrawerOpen(false)}
                        className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-border hover:bg-accent/10"
                        style={isActive ? activeLinkStyles : undefined}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-md border"
                          style={{
                            color: theme.soft,
                            borderColor: hexToRgba(theme.soft, 0.6),
                            background: hexToRgba(theme.primary, 0.12),
                          }}
                        >
                          <span className="text-sm">{suite.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span
                            className="text-sm font-medium"
                            style={{ color: theme.soft }}
                          >
                            {suite.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {suite.subtitle}
                          </span>
                        </div>
                      </a>
                    );
                  })}
                </nav>
              </div>

              {(suiteId === "ops" || location.pathname.startsWith("/ops")) && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    OPS
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {renderDrawerLinks(opsLinks)}
                  </nav>
                </div>
              )}

              {(suiteId === "connect" ||
                location.pathname.startsWith("/connect")) && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    CONNECT
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {renderDrawerLinks(connectLinks)}
                  </nav>
                </div>
              )}

              {(suiteId === "flow" ||
                location.pathname.startsWith("/flow")) && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    FLOW
                  </h3>
                  <nav className="flex flex-col gap-1">
                    {renderDrawerLinks(flowLinks)}
                  </nav>
                </div>
              )}

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Global
                </h3>
                <nav className="flex flex-col gap-1">
                  {renderDrawerLinks(globalLinks)}
                </nav>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Help & Support
                </h3>
                <nav className="flex flex-col gap-1">
                  <Link
                    to="/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                  >
                    Docs
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                  >
                    Support
                  </Link>
                </nav>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      <main className="pt-16">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
