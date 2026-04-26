import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { suiteRouteUrl } from '../lib/suite-links';

type SuiteLink = {
  id: 'os' | 'ops' | 'lab' | 'flow' | 'connect';
  label: string;
  subtitle: string;
  route: string;
};

const suites: SuiteLink[] = [
  { id: 'os', label: 'OS', subtitle: 'System Core & Home', route: '/os' },
  { id: 'ops', label: 'Ops', subtitle: 'Business Operations', route: '/ops' },
  { id: 'lab', label: 'Lab', subtitle: 'Recipes & Brewing Science', route: '/lab' },
  { id: 'flow', label: 'Flow', subtitle: 'Keg / Tap Management', route: '/flow' },
  { id: 'connect', label: 'Connect', subtitle: 'Employee Hub', route: '/connect' },
];

const globalLinks = [
  { label: 'Dashboard Home', route: '/' },
  { label: 'Notifications', route: '/notifications' },
  { label: 'Calendar', route: '/calendar' },
  { label: 'Directory', route: '/directory' },
  { label: 'Tasks & Approvals', route: '/tasks' },
  { label: 'Reports', route: '/reports' },
  { label: 'Settings', route: '/settings' },
];

const utilityLinks = [
  { label: 'Notifications', route: '/notifications', icon: '◌' },
  { label: 'Calendar', route: '/calendar', icon: '◫' },
  { label: 'Settings', route: '/settings', icon: '⚙' },
  { label: 'Profile', route: '/profile', icon: '◉' },
];

const pageTitleForPath = (pathname: string): string => {
  if (pathname.startsWith('/lab/builder-v2')) return 'LAB Builder V2';
  if (pathname.startsWith('/lab/builder')) return 'LAB Builder';
  if (pathname.startsWith('/lab/library')) return 'LAB Library';
  if (pathname.startsWith('/lab/exports')) return 'Recipe Exports';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/calendar')) return 'Calendar';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'LAB';
};

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const activeSuite = useMemo(() => {
    const match = suites.find((suite) => location.pathname.startsWith(suite.route));
    return match?.label ?? 'Lab';
  }, [location.pathname]);
  const pageTitle = useMemo(() => pageTitleForPath(location.pathname), [location.pathname]);

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="shell-header-left">
          <button type="button" className="hamburger" onClick={() => setDrawerOpen(true)}>
            ≡
          </button>
          <Link to="/lab" className="brand">
            <span className="brand-icon">⬡</span>
            <span>
              <strong>BevForge</strong>
              <small>{activeSuite}</small>
            </span>
          </Link>
        </div>
        <div className="shell-header-title">
          <strong>{pageTitle}</strong>
        </div>
        <nav className="shell-utilities" aria-label="Global utility links">
          {utilityLinks.map((link) => (
            <Link key={link.route} to={link.route} className={`shell-utility-link ${location.pathname === link.route ? 'shell-utility-link--active' : ''}`}>
              <span className="shell-utility-icon">{link.icon}</span>
              <span className="shell-utility-label">{link.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="drawer" onClick={(event) => event.stopPropagation()}>
            <h3>Suites</h3>
            <nav>
              {suites.map((suite) => (
                <a key={suite.id} href={suiteRouteUrl(suite.id, suite.route)} className="drawer-link">
                  <span>{suite.label}</span>
                  <small>{suite.subtitle}</small>
                </a>
              ))}
            </nav>
            <h3>Global</h3>
            <nav>
              {globalLinks.map((link) => (
                <a key={link.route} href={link.route} className="drawer-link">
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <main className="shell-main">{children}</main>
    </div>
  );
}
