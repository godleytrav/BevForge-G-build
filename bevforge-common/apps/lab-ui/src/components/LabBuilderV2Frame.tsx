import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type LabBuilderFamily = 'beer' | 'cider' | 'wine';

interface LabBuilderV2FrameProps {
  title: string;
  description: string;
  family?: LabBuilderFamily;
  actions?: ReactNode;
  children: ReactNode;
}

const familyLinks: Array<{ family: LabBuilderFamily; label: string; route: string; note: string }> = [
  { family: 'beer', label: 'Beer', route: '/lab/builder-v2/beer', note: 'Brewhouse recipe authoring' },
  { family: 'cider', label: 'Cider', route: '/lab/builder-v2/cider', note: 'Juice, concentrate, and compliance planning' },
  { family: 'wine', label: 'Wine', route: '/lab/builder-v2/wine', note: 'Must, acid, tannin, and cellar planning' },
];

export function LabBuilderV2Frame({ title, description, family, actions, children }: LabBuilderV2FrameProps) {
  return (
    <section className="lab-v2-route">
      <header className="lab-page-head lab-v2-route-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="lab-actions">{actions}</div> : null}
      </header>

      <nav className="lab-v2-family-switcher" aria-label="Builder family switcher">
        <Link
          to="/lab/builder-v2"
          className={`lab-v2-family-card ${family ? '' : 'lab-v2-family-card--active'} lab-v2-family-card--hub`}
        >
          <span className="lab-v2-family-card-eyebrow">Builder Hub</span>
          <strong>Choose Workspace</strong>
          <small>Split authoring pages and dedicated solver tracks.</small>
        </Link>
        {familyLinks.map((entry) => (
          <Link
            key={entry.family}
            to={entry.route}
            className={`lab-v2-family-card ${family === entry.family ? 'lab-v2-family-card--active' : ''}`}
          >
            <span className="lab-v2-family-card-eyebrow">{entry.label}</span>
            <strong>{entry.label} Builder</strong>
            <small>{entry.note}</small>
          </Link>
        ))}
      </nav>

      {children}
    </section>
  );
}
