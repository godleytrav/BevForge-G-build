import { AppShell } from '@/components/AppShell';

export default function ReportsPage() {
  return (
    <AppShell pageTitle="Reports">
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-2 text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">
            Access comprehensive reports and analytics across all suites.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold text-foreground">Sales Reports</h3>
            <p className="text-sm text-muted-foreground">Revenue and transaction data</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-2 font-semibold text-foreground">Operational Reports</h3>
            <p className="text-sm text-muted-foreground">Efficiency and performance metrics</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
