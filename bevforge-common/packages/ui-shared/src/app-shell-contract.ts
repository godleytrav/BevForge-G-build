export type SuiteId = 'os' | 'ops' | 'lab' | 'flow' | 'connect';

export interface SuiteNavItem {
  id: SuiteId;
  label: string;
  subtitle: string;
  route: string;
}

export interface GlobalNavItem {
  label: string;
  route: string;
}

export interface AppShellContract {
  suites: SuiteNavItem[];
  global: GlobalNavItem[];
  requiredOsRoutes: string[];
}

export const bevForgeShellContract: AppShellContract = {
  suites: [
    { id: 'os', label: 'OS', subtitle: 'System Core & Home', route: '/os' },
    { id: 'ops', label: 'Ops', subtitle: 'Business Operations', route: '/ops' },
    { id: 'lab', label: 'Lab', subtitle: 'Recipes & Brewing Science', route: '/lab' },
    { id: 'flow', label: 'Flow', subtitle: 'Keg / Tap Management', route: '/flow' },
    {
      id: 'connect',
      label: 'Connect',
      subtitle: 'Employee, CRM & Client Connect',
      route: '/connect',
    },
  ],
  global: [
    { label: 'Dashboard Home', route: '/' },
    { label: 'Calendar', route: '/calendar' },
    { label: 'Directory', route: '/directory' },
    { label: 'Tasks & Approvals', route: '/tasks' },
    { label: 'Reports', route: '/reports' },
    { label: 'Settings', route: '/settings' },
  ],
  requiredOsRoutes: [
    '/os/control-panel',
    '/os/recipe-execution',
    '/os/inventory',
    '/os/batches',
  ],
};
