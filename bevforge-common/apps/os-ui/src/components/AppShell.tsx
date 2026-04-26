import { useState, type ReactNode } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { suiteRouteUrl, type SuiteId } from '@/lib/suite-links';

interface Suite {
  id: SuiteId;
  label: string;
  subtitle: string;
  route: string;
  icon: string;
}

const suites: Suite[] = [
  { id: 'os', label: 'OS', subtitle: 'System Core & Home', route: '/os', icon: '⬡' },
  { id: 'flow', label: 'Flow', subtitle: 'Keg / Tap Management', route: '/flow', icon: '◈' },
  { id: 'lab', label: 'Lab', subtitle: 'Recipes & Brewing Science', route: '/lab', icon: '◆' },
  { id: 'ops', label: 'Ops', subtitle: 'Business Operations', route: '/ops', icon: '◇' },
  { id: 'connect', label: 'Connect', subtitle: 'Employee Hub', route: '/connect', icon: '◉' },
];

const globalLinks = [
  { label: 'Dashboard Home', route: '/', icon: Home },
  { label: 'Calendar', route: '/calendar', icon: Calendar },
  { label: 'Directory', route: '/directory', icon: Users },
  { label: 'Tasks & Approvals', route: '/tasks', icon: CheckCircle },
  { label: 'Reports', route: '/reports', icon: FileText },
  { label: 'Settings', route: '/settings', icon: Cog },
];

interface AppShellProps {
  children: ReactNode;
  pageTitle?: string;
  currentSuite?: string;
  fullWidth?: boolean;
}

export function AppShell({
  children,
  pageTitle = 'Dashboard',
  currentSuite,
  fullWidth = false,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const getCurrentSuite = () => {
    if (currentSuite) return currentSuite;
    const path = location.pathname;
    const suite = suites.find((s) => path.startsWith(s.route));
    return suite?.label;
  };

  const activeSuite = getCurrentSuite();

  // Determine suite ID from currentSuite prop or route
  const getSuiteId = () => {
    if (currentSuite) {
      return currentSuite.toLowerCase();
    }
    const path = location.pathname;
    const suite = suites.find((s) => path.startsWith(s.route));
    return suite?.id;
  };

  const suiteId = getSuiteId();
  const resolvedSuiteId = suites.find((suite) => suite.id === suiteId)?.id;
  const suiteHomeHref = resolvedSuiteId ? suiteRouteUrl(resolvedSuiteId, `/${resolvedSuiteId}`) : '/';

  return (
    <div
      className="min-h-screen"
      data-suite={suiteId}
      style={{
        background:
          suiteId === 'os'
            ? 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(220, 60%, 18%) 60%, hsl(220, 70%, 22%) 100%)'
            : suiteId === 'flow'
              ? 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(45, 60%, 18%) 60%, hsl(45, 70%, 22%) 100%)'
              : suiteId === 'lab'
                ? 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(160, 60%, 18%) 60%, hsl(160, 70%, 22%) 100%)'
                : suiteId === 'ops'
                  ? 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(200, 15%, 18%) 60%, hsl(200, 15%, 22%) 100%)'
                  : suiteId === 'connect'
                    ? 'linear-gradient(180deg, hsl(0, 0%, 8%) 0%, hsl(270, 50%, 18%) 60%, hsl(270, 60%, 22%) 100%)'
                    : 'hsl(var(--background))',
      }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-full items-center justify-between px-4">
          {/* Left: Hamburger + Branding */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="hover:bg-accent/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <a href={suiteHomeHref} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary">
                <span className="text-lg font-bold">⬡</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-none text-foreground">BevForge</span>
                {activeSuite && (
                  <span className="text-xs leading-none text-muted-foreground">{activeSuite}</span>
                )}
              </div>
            </a>
          </div>

          {/* Center: Page Title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          </div>

          {/* Right: Utility Icons */}
          <div className="flex items-center gap-2">
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10 relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10">
                <Calendar className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* User Menu */}
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

      {/* Navigation Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/20 text-primary">
                <span className="text-lg font-bold">⬡</span>
              </div>
              <SheetTitle className="text-foreground">BevForge Navigation</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-6 p-4">
            {/* Suites Section */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Suites
              </h3>
              <nav className="flex flex-col gap-1">
                {suites.map((suite) => {
                  const isActive = location.pathname.startsWith(suite.route);
                  const targetUrl = suiteRouteUrl(suite.id, suite.route);
                  return (
                    <a
                      key={suite.id}
                      href={targetUrl}
                      onClick={() => setDrawerOpen(false)}
                      className={`group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-all hover:border-border hover:bg-accent/10 ${
                        isActive ? `suite-${suite.id}-active border-border bg-accent/5` : ''
                      }`}
                    >
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-medium"
                          style={{
                            color:
                              suite.id === 'os'
                                ? 'hsl(190, 95%, 60%)'
                                : suite.id === 'flow'
                                  ? 'hsl(45, 95%, 55%)'
                                  : suite.id === 'lab'
                                    ? 'hsl(160, 75%, 50%)'
                                    : suite.id === 'ops'
                                      ? 'hsl(200, 15%, 65%)'
                                      : 'hsl(270, 70%, 60%)',
                          }}
                        >
                          {suite.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{suite.subtitle}</span>
                      </div>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Global Section */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Global
              </h3>
              <nav className="flex flex-col gap-1">
                {globalLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.route;
                  return (
                    <Link
                      key={link.route}
                      to={link.route}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/10 ${
                        isActive ? 'bg-accent/5 text-primary' : 'text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Help Section */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Help & Support
              </h3>
              <nav className="flex flex-col gap-1">
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                >
                  Docs
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
                >
                  Support
                </a>
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="pt-16">
        {fullWidth ? children : <div className="container mx-auto p-6">{children}</div>}
      </main>
    </div>
  );
}
