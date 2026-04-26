import { Link } from 'react-router-dom';
import { LabBuilderV2Frame, type LabBuilderFamily } from '../components/LabBuilderV2Frame';

interface LabBuilderStubPageProps {
  family: LabBuilderFamily;
  title: string;
  description: string;
  summary: string;
}

export function LabBuilderStubPage({ family, title, description, summary }: LabBuilderStubPageProps) {
  return (
    <LabBuilderV2Frame
      family={family}
      title={title}
      description={description}
      actions={
        <>
          <Link className="button" to="/lab/builder-v2/cider">
            Open Cider Builder
          </Link>
          <Link className="button button-muted" to="/lab/builder-v2">
            Builder Hub
          </Link>
          <Link className="button button-muted" to="/lab/library">
            Library
          </Link>
        </>
      }
    >
      <article className="card lab-v2-family-launch-card lab-v2-family-launch-card--stub">
        <span className="lab-v2-family-card-eyebrow">Dedicated Track</span>
        <h2>{title}</h2>
        <p>{summary}</p>
        <div className="lab-v2-stub-checklist">
          <div>
            <span>Route</span>
            <strong>{`/lab/builder-v2/${family}`}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>Stubbed in split architecture</strong>
          </div>
          <div>
            <span>Next Phase</span>
            <strong>Dedicated solver + process editor</strong>
          </div>
        </div>
        <p className="hint small">
          This page is intentionally separate now so we stop blending product logic. The solver and process authority for
          this family will be implemented in the next phases of the split-builder plan.
        </p>
      </article>
    </LabBuilderV2Frame>
  );
}
