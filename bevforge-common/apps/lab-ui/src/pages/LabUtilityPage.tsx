import { Link } from 'react-router-dom';

interface LabUtilityPageProps {
  title: string;
  description: string;
}

export function LabUtilityPage({ title, description }: LabUtilityPageProps) {
  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="lab-actions">
          <Link className="button" to="/lab">
            Back To LAB
          </Link>
          <Link className="button button-muted" to="/lab/builder-v2">
            Open Builder V2
          </Link>
        </div>
      </header>

      <article className="card lab-v2-config-card">
        <div className="standard-panel-head">
          <h2>Universal Shell Surface</h2>
          <span className="hint small">LAB now carries the same top-level utility affordances as OS.</span>
        </div>
        <p className="hint small">
          This local LAB route is a suite-ready placeholder so navigation remains stable while we continue wiring shared
          global calendar, notification, and settings experiences across the BevForge suites.
        </p>
      </article>
    </section>
  );
}
