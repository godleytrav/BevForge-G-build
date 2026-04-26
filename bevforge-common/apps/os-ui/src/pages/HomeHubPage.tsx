import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { suiteRouteUrl, type SuiteId } from '@/lib/suite-links';

const suites = [
  {
    id: 'os' as SuiteId,
    title: 'OS',
    description: 'System Core and source of truth.',
    route: '/os',
  },
  {
    id: 'ops' as SuiteId,
    title: 'OPS',
    description: 'Business, warehouse, and compliance.',
    route: '/ops',
  },
  {
    id: 'lab' as SuiteId,
    title: 'LAB',
    description: 'Recipe authoring and export.',
    route: '/lab',
  },
  {
    id: 'flow' as SuiteId,
    title: 'FLOW',
    description: 'Keg and tap operations.',
    route: '/flow',
  },
  {
    id: 'connect' as SuiteId,
    title: 'CONNECT',
    description: 'Employee hub and collaboration.',
    route: '/connect',
  },
];

export default function HomeHubPage() {
  return (
    <AppShell pageTitle="Dashboard Home">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">BevForge Suites</h1>
          <p className="text-muted-foreground mt-1">
            Unified hub for OS, OPS, LAB, FLOW, and CONNECT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suites.map((suite) => (
            <Card
              key={suite.id}
              className="cursor-pointer transition-shadow hover:shadow-glow-lg"
              onClick={() => {
                window.location.href = suiteRouteUrl(suite.id, suite.route);
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{suite.title}</CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription>{suite.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-mono">{suite.route}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
