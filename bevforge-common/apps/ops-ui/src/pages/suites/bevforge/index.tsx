import { AppShell } from '@/components/AppShell';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { suiteRouteUrl } from '@/lib/suite-links';

export default function IndexPage() {
  const suites = [
    {
      id: 'os',
      label: 'OS',
      title: 'System Core',
      description: 'Central hub for system management and core functionality',
      route: '/os',
      icon: '⬡',
    },
    {
      id: 'flow',
      label: 'Flow',
      title: 'Keg & Tap Management',
      description: 'Manage kegs, taps, and beverage flow operations',
      route: '/flow',
      icon: '◈',
    },
    {
      id: 'lab',
      label: 'Lab',
      title: 'Recipes & R&D',
      description: 'Create and experiment with brewing recipes',
      route: '/lab',
      icon: '◆',
    },
    {
      id: 'ops',
      label: 'Ops',
      title: 'Business Operations',
      description: 'Orders, routing, and compliance powered by OS inventory and batch state',
      route: '/ops',
      icon: '◇',
    },
    {
      id: 'connect',
      label: 'Connect',
      title: 'Employee Hub',
      description: 'Timeclock, tasks, and internal communication',
      route: '/connect',
      icon: '◉',
    },
  ];

  return (
    <AppShell pageTitle="Dashboard Home">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome to BevForge</h1>
          <p className="text-lg text-muted-foreground">
            Your unified platform for brewery management. Select a suite to get started.
          </p>
        </div>

        {/* Suites Grid */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Suites</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suites.map((suite) => (
              <a
                key={suite.id}
                href={suiteRouteUrl(suite.id, suite.route)}
                className={`group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg suite-${suite.id}-card`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl suite-${suite.id}-icon`}>
                    {suite.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{suite.label}</h3>
                    <p className="text-sm text-muted-foreground">{suite.title}</p>
                  </div>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{suite.description}</p>
                <Button variant="ghost" size="sm" className="group-hover:text-primary">
                  Open Suite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Access</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/reports"
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/10"
            >
              <h3 className="mb-1 font-semibold text-foreground">Reports</h3>
              <p className="text-sm text-muted-foreground">View analytics and reports</p>
            </Link>
            <Link
              to="/settings"
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/10"
            >
              <h3 className="mb-1 font-semibold text-foreground">Settings</h3>
              <p className="text-sm text-muted-foreground">Configure system preferences</p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
