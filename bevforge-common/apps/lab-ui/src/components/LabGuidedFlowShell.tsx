import type { ReactNode } from 'react';

export interface LabGuidedFlowStep {
  label: string;
  detail: string;
  state: 'done' | 'current' | 'pending';
}

interface LabGuidedFlowShellProps {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  steps: LabGuidedFlowStep[];
  primaryAction: ReactNode;
  secondaryAction?: ReactNode;
  note?: ReactNode;
}

export function LabGuidedFlowShell({
  eyebrow,
  title,
  description,
  status,
  steps,
  primaryAction,
  secondaryAction,
  note,
}: LabGuidedFlowShellProps) {
  return (
    <article className="card lab-guided-shell">
      <div className="lab-guided-shell-head">
        <div>
          <p className="lab-v2-live-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="hint small">{description}</p>
        </div>
        <span className="lab-guided-shell-status">{status}</span>
      </div>

      <div className="lab-guided-shell-steps">
        {steps.map((step, index) => (
          <div key={`${step.label}-${index}`} className={`lab-guided-step lab-guided-step--${step.state}`}>
            <span className="lab-guided-step-index">{index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <p>{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="lab-guided-shell-actions">
        {primaryAction}
        {secondaryAction}
      </div>

      {note ? <div className="lab-guided-shell-note">{note}</div> : null}
    </article>
  );
}
