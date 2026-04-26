import { Link } from 'react-router-dom';
import { suiteRouteUrl } from '../lib/suite-links';

export function LabHomePage() {
  return (
    <section className="page">
      <header className="page-header">
        <h1>LAB Suite</h1>
        <p>Descriptor-driven recipe design, clone adaptation, and OS export handoff.</p>
      </header>

      <div className="card-grid">
        <article className="card card-accent">
          <h2>Builder V2</h2>
          <p>
            Unified workflow with merge deltas, validity gate, and source-aware predicted stats.
          </p>
          <Link className="button" to="/lab/builder-v2">
            Open Builder V2
          </Link>
        </article>

        <article className="card">
          <h2>Legacy Builder</h2>
          <p>Original builder remains available while V2 is validated in live usage.</p>
          <Link className="button button-muted" to="/lab/builder">
            Open Legacy
          </Link>
        </article>

        <article className="card">
          <h2>Saved Library</h2>
          <p>Review, reload, and export previously saved LAB drafts.</p>
          <Link className="button button-muted" to="/lab/library">
            Open Library
          </Link>
        </article>

        <article className="card">
          <h2>Export Console</h2>
          <p>Emit `BevForge.json`, `beer.json`, and `beer.xml`, then send to OS import.</p>
          <Link className="button button-muted" to="/lab/exports">
            Open Exports
          </Link>
        </article>

        <article className="card">
          <h2>OS Authority</h2>
          <p>
            LAB authors recipes; OS remains source of truth for inventory, batch state, and
            execution runtime.
          </p>
          <a className="button button-muted" href={suiteRouteUrl('os', '/os/recipe-execution')}>
            Go To OS Recipe Execution
          </a>
        </article>
      </div>
    </section>
  );
}
