interface BatchUnitLabel {
  long: string;
  step: number;
}

export type BatchUnit = 'gal' | 'bbl' | 'l';
export type CiderCarbonationMode = 'unknown' | 'still' | 'effervescent';

export interface GuidedCiderSetupDraft {
  recipeName: string;
  styleKey: string;
  styleLabel: string;
  batchValue: number;
  batchUnit: BatchUnit;
  abv: number;
  residualSugarPct: number;
  ph: number;
  carbonationTargetVols: number;
  carbonationMode: CiderCarbonationMode;
  interstateSale: boolean;
  yeastName: string;
  primaryTempC: number;
  primaryDays: number;
  conditioningDays: number;
  includeYeastNutrient: boolean;
  includePecticEnzyme: boolean;
}

export interface CiderStylePreset {
  key: string;
  label: string;
  detail: string;
  abv: number;
  residualSugarPct: number;
  ph: number;
  carbonationTargetVols: number;
  carbonationMode: CiderCarbonationMode;
  yeastName: string;
  primaryTempC: number;
  primaryDays: number;
  conditioningDays: number;
}

export interface ResidualSugarPreset {
  label: string;
  value: number;
}

export interface CarbonationPreset {
  label: string;
  target: number;
  mode: CiderCarbonationMode;
}

interface DraftPatchHandler {
  (patch: Partial<GuidedCiderSetupDraft>): void;
}

interface CiderTargetEditorCardProps {
  draft: GuidedCiderSetupDraft;
  batchUnitLabels: Record<BatchUnit, BatchUnitLabel>;
  residualSugarPresets: ResidualSugarPreset[];
  carbonationPresets: CarbonationPreset[];
  onDraftChange: DraftPatchHandler;
  onApplyToWorkspace: () => void;
  onOpenGuidedSetup: () => void;
  workspaceActive: boolean;
}

export function CiderTargetEditorCard({
  draft,
  batchUnitLabels,
  residualSugarPresets,
  carbonationPresets,
  onDraftChange,
  onApplyToWorkspace,
  onOpenGuidedSetup,
  workspaceActive,
}: CiderTargetEditorCardProps) {
  return (
    <article className="card lab-cider-route-card lab-cider-route-card--editor">
      <div className="lab-cider-route-card-head">
        <div>
          <span className="lab-v2-live-eyebrow">Cider Targets</span>
          <h3>Editable Production Brief</h3>
        </div>
        <div className="lab-cider-route-actions">
          <button type="button" className="button button-muted" onClick={onOpenGuidedSetup}>
            Guided Setup
          </button>
          <button type="button" className="button" onClick={onApplyToWorkspace}>
            {workspaceActive ? 'Apply To Workspace' : 'Launch Workspace'}
          </button>
        </div>
      </div>
      <div className="lab-cider-route-form-grid">
        <label>
          Batch Size
          <div className="batch-size-row">
            <input
              type="number"
              min={0.1}
              step={batchUnitLabels[draft.batchUnit].step}
              value={draft.batchValue}
              onChange={(event) => {
                const numeric = Number(event.target.value);
                if (!Number.isFinite(numeric) || numeric <= 0) return;
                onDraftChange({ batchValue: numeric });
              }}
            />
            <select
              value={draft.batchUnit}
              onChange={(event) => onDraftChange({ batchUnit: event.target.value as BatchUnit })}
            >
              {(Object.keys(batchUnitLabels) as BatchUnit[]).map((unit) => (
                <option key={unit} value={unit}>
                  {batchUnitLabels[unit].long}
                </option>
              ))}
            </select>
          </div>
        </label>
        <label>
          ABV Target
          <input
            type="number"
            min={0}
            max={14}
            step={0.1}
            value={draft.abv}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric)) return;
              onDraftChange({ abv: numeric });
            }}
          />
        </label>
        <label>
          Residual Sugar (%)
          <input
            type="number"
            min={0}
            max={8}
            step={0.1}
            value={draft.residualSugarPct}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric)) return;
              onDraftChange({ residualSugarPct: numeric });
            }}
          />
          <div className="lab-guided-pill-row">
            {residualSugarPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`lab-guided-pill ${Math.abs(draft.residualSugarPct - preset.value) < 0.15 ? 'lab-guided-pill--active' : ''}`}
                onClick={() => onDraftChange({ residualSugarPct: preset.value })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </label>
        <label>
          pH Target
          <input
            type="number"
            min={2.8}
            max={4.2}
            step={0.1}
            value={draft.ph}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric)) return;
              onDraftChange({ ph: numeric });
            }}
          />
        </label>
        <label className="lab-cider-route-form-grid__full">
          Carbonation Target
          <div className="batch-size-row">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.carbonationTargetVols}
              onChange={(event) => {
                const numeric = Number(event.target.value);
                if (!Number.isFinite(numeric) || numeric < 0) return;
                onDraftChange({ carbonationTargetVols: numeric });
              }}
            />
            <span className="lab-v2-inline-unit">vols CO2</span>
          </div>
          <div className="lab-guided-pill-row">
            {carbonationPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`lab-guided-pill ${
                  Math.abs(draft.carbonationTargetVols - preset.target) < 0.15 && draft.carbonationMode === preset.mode
                    ? 'lab-guided-pill--active'
                    : ''
                }`}
                onClick={() => onDraftChange({ carbonationTargetVols: preset.target, carbonationMode: preset.mode })}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </label>
      </div>
    </article>
  );
}

interface CiderProcessEditorCardProps {
  draft: GuidedCiderSetupDraft;
  stylePresets: CiderStylePreset[];
  selectedStylePreset: CiderStylePreset;
  onSelectStylePreset: (styleKey: string) => void;
  onDraftChange: DraftPatchHandler;
}

export function CiderProcessEditorCard({
  draft,
  stylePresets,
  selectedStylePreset,
  onSelectStylePreset,
  onDraftChange,
}: CiderProcessEditorCardProps) {
  return (
    <article className="card lab-cider-route-card lab-cider-route-card--editor">
      <span className="lab-v2-live-eyebrow">Cider Process</span>
      <h3>Style, Yeast, And Fermentation Plan</h3>
      <div className="lab-guided-preset-grid lab-guided-preset-grid--compact">
        {stylePresets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`lab-guided-preset-card ${draft.styleKey === preset.key ? 'lab-guided-preset-card--active' : ''}`}
            onClick={() => onSelectStylePreset(preset.key)}
          >
            <strong>{preset.label}</strong>
            <span>{preset.detail}</span>
            <small>
              {preset.yeastName} · {preset.primaryTempC} C · {preset.primaryDays} d
            </small>
          </button>
        ))}
      </div>
      <div className="lab-cider-route-form-grid">
        <label>
          Yeast Selection
          <input value={draft.yeastName} onChange={(event) => onDraftChange({ yeastName: event.target.value })} />
        </label>
        <label>
          Primary Temp (C)
          <input
            type="number"
            min={0}
            max={32}
            step={0.5}
            value={draft.primaryTempC}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric)) return;
              onDraftChange({ primaryTempC: numeric });
            }}
          />
        </label>
        <label>
          Primary Days
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            value={draft.primaryDays}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric) || numeric <= 0) return;
              onDraftChange({ primaryDays: numeric });
            }}
          />
        </label>
        <label>
          Conditioning Days
          <input
            type="number"
            min={0}
            max={60}
            step={1}
            value={draft.conditioningDays}
            onChange={(event) => {
              const numeric = Number(event.target.value);
              if (!Number.isFinite(numeric) || numeric < 0) return;
              onDraftChange({ conditioningDays: numeric });
            }}
          />
        </label>
      </div>
      <p className="hint small">
        Presets provide a strong production starting point. You can override the yeast and cellar timing directly when the cider needs a different fermentation profile.
      </p>
      <div className="lab-cider-route-metrics">
        <div>
          <span>Selected Style</span>
          <strong>{selectedStylePreset.label}</strong>
        </div>
        <div>
          <span>Primary</span>
          <strong>
            {draft.primaryTempC.toFixed(1)} C · {Math.round(draft.primaryDays)} d
          </strong>
        </div>
        <div>
          <span>Conditioning</span>
          <strong>{Math.round(draft.conditioningDays)} d</strong>
        </div>
      </div>
    </article>
  );
}

interface CiderIngredientPlanCardProps {
  draft: GuidedCiderSetupDraft;
  onDraftChange: DraftPatchHandler;
}

export function CiderIngredientPlanCard({ draft, onDraftChange }: CiderIngredientPlanCardProps) {
  const notes = ['BSG Select CiderBase', 'Filtered Water', draft.yeastName];
  if (draft.includeYeastNutrient) notes.push('Yeast Nutrient');
  if (draft.includePecticEnzyme) notes.push('Pectic Enzyme');
  if (draft.residualSugarPct >= 3) notes.push('Backsweetening / retention plan');
  if (draft.carbonationMode === 'effervescent') notes.push('Carbonation setup');
  if (draft.interstateSale) notes.push('Compliance review packet');

  return (
    <article className="card lab-cider-route-card lab-cider-route-card--editor">
      <span className="lab-v2-live-eyebrow">Ingredient Planning</span>
      <h3>Starter Inputs And Support Additions</h3>
      <div className="lab-guided-pill-row">
        {notes.map((item) => (
          <span key={item} className="lab-guided-pill lab-guided-pill--active">
            {item}
          </span>
        ))}
      </div>
      <div className="lab-cider-route-toggle-list">
        <label className="lab-v2-compliance-toggle">
          <span>Include yeast nutrient in workspace draft</span>
          <input
            type="checkbox"
            checked={draft.includeYeastNutrient}
            onChange={(event) => onDraftChange({ includeYeastNutrient: event.target.checked })}
          />
        </label>
        <label className="lab-v2-compliance-toggle">
          <span>Include pectic enzyme in workspace draft</span>
          <input
            type="checkbox"
            checked={draft.includePecticEnzyme}
            onChange={(event) => onDraftChange({ includePecticEnzyme: event.target.checked })}
          />
        </label>
        <label className="lab-v2-compliance-toggle">
          <span>Interstate sale planned</span>
          <input
            type="checkbox"
            checked={draft.interstateSale}
            onChange={(event) => onDraftChange({ interstateSale: event.target.checked })}
          />
        </label>
      </div>
      <p className="hint small">
        This card is route-level planning. It shapes the cider starter draft before the temporary workspace opens and makes the launch less dependent on the shared ingredient table.
      </p>
    </article>
  );
}
