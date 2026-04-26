import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CiderIngredientPlanCard,
  CiderProcessEditorCard,
  CiderTargetEditorCard,
  type BatchUnit,
  type CiderCarbonationMode,
  type CiderStylePreset,
  type CarbonationPreset,
  type GuidedCiderSetupDraft,
  type ResidualSugarPreset,
} from '../components/LabCiderPlanningCards';
import { LabGuidedFlowShell, type LabGuidedFlowStep } from '../components/LabGuidedFlowShell';
import { getActiveRecipeId, getSavedRecipe } from '../lib/lab-store';
import { LabBuilderV2Page } from './LabBuilderV2Page';

const batchUnitLabels: Record<BatchUnit, { long: string; step: number }> = {
  gal: { long: 'Gallons (US)', step: 0.25 },
  bbl: { long: 'Barrels (US)', step: 0.1 },
  l: { long: 'Liters', step: 0.5 },
};

const ciderStylePresets: CiderStylePreset[] = [
  {
    key: 'modern_dry_cider',
    label: 'Modern Dry',
    detail: 'Crisp, bright, clean finish',
    abv: 6.2,
    residualSugarPct: 1,
    ph: 3.35,
    carbonationTargetVols: 2.5,
    carbonationMode: 'effervescent',
    yeastName: 'Champagne Cider Yeast',
    primaryTempC: 14,
    primaryDays: 12,
    conditioningDays: 7,
  },
  {
    key: 'pub_semi_dry_cider',
    label: 'Pub Semi-Dry',
    detail: 'Balanced fruit and finish',
    abv: 5.8,
    residualSugarPct: 2.5,
    ph: 3.4,
    carbonationTargetVols: 2.2,
    carbonationMode: 'effervescent',
    yeastName: 'English Cider Yeast',
    primaryTempC: 15,
    primaryDays: 14,
    conditioningDays: 7,
  },
  {
    key: 'still_farmhouse_cider',
    label: 'Still Farmhouse',
    detail: 'Rustic, low-carb, cellar driven',
    abv: 6.5,
    residualSugarPct: 1.5,
    ph: 3.45,
    carbonationTargetVols: 0.2,
    carbonationMode: 'still',
    yeastName: 'Farmhouse Cider Yeast',
    primaryTempC: 16,
    primaryDays: 18,
    conditioningDays: 10,
  },
  {
    key: 'semi_sweet_refreshing_cider',
    label: 'Semi-Sweet',
    detail: 'Rounder fruit and softer finish',
    abv: 5.2,
    residualSugarPct: 4,
    ph: 3.45,
    carbonationTargetVols: 2.4,
    carbonationMode: 'effervescent',
    yeastName: 'Fruit-Forward Cider Yeast',
    primaryTempC: 13,
    primaryDays: 10,
    conditioningDays: 6,
  },
];

const residualSugarPresets: ResidualSugarPreset[] = [
  { label: 'Bone Dry', value: 0.5 },
  { label: 'Dry', value: 1 },
  { label: 'Semi-Dry', value: 2.5 },
  { label: 'Semi-Sweet', value: 4 },
  { label: 'Sweet', value: 6 },
];

const carbonationPresets: CarbonationPreset[] = [
  { label: 'Still', target: 0.2, mode: 'still' },
  { label: 'Low', target: 1.8, mode: 'effervescent' },
  { label: 'Standard', target: 2.4, mode: 'effervescent' },
  { label: 'Sparkling', target: 3, mode: 'effervescent' },
];

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const defaultGuidedDraft = (): GuidedCiderSetupDraft => ({
  recipeName: 'BSG Select Cider Draft',
  styleKey: 'modern_dry_cider',
  styleLabel: 'Modern Dry',
  batchValue: 5,
  batchUnit: 'gal',
  abv: 5.8,
  residualSugarPct: 1,
  ph: 3.35,
  carbonationTargetVols: 0,
  carbonationMode: 'unknown',
  interstateSale: false,
  yeastName: 'Champagne Cider Yeast',
  primaryTempC: 14,
  primaryDays: 12,
  conditioningDays: 7,
  includeYeastNutrient: true,
  includePecticEnzyme: false,
});

export function LabCiderBuilderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [guidedOpen, setGuidedOpen] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedPrompted, setGuidedPrompted] = useState(false);
  const [guidedDraft, setGuidedDraft] = useState<GuidedCiderSetupDraft>(defaultGuidedDraft);

  const activeCiderDraft = useMemo(() => {
    const activeId = getActiveRecipeId();
    if (!activeId) return undefined;
    const draft = getSavedRecipe(activeId);
    return draft?.beverage === 'cider' ? draft : undefined;
  }, [searchParams]);

  const selectedStylePreset =
    ciderStylePresets.find((preset) => preset.key === guidedDraft.styleKey) ?? ciderStylePresets[0];

  useEffect(() => {
    if (guidedPrompted) return;
    if (searchParams.get('view') === 'recipe') return;
    setGuidedOpen(true);
    setGuidedPrompted(true);
  }, [guidedPrompted, searchParams]);

  const applyDraftPatch = (patch: Partial<GuidedCiderSetupDraft>) => {
    setGuidedDraft((current) => {
      const next = { ...current, ...patch };
      if (typeof patch.batchValue === 'number') next.batchValue = round(Math.max(0.1, patch.batchValue), 2);
      if (typeof patch.abv === 'number') next.abv = round(Math.max(0, patch.abv), 1);
      if (typeof patch.residualSugarPct === 'number') next.residualSugarPct = round(Math.max(0, patch.residualSugarPct), 1);
      if (typeof patch.ph === 'number') next.ph = round(Math.max(2.8, patch.ph), 2);
      if (typeof patch.carbonationTargetVols === 'number') next.carbonationTargetVols = round(Math.max(0, patch.carbonationTargetVols), 1);
      if (typeof patch.primaryTempC === 'number') next.primaryTempC = round(patch.primaryTempC, 1);
      if (typeof patch.primaryDays === 'number') next.primaryDays = round(Math.max(1, patch.primaryDays), 0);
      if (typeof patch.conditioningDays === 'number') next.conditioningDays = round(Math.max(0, patch.conditioningDays), 0);
      return next;
    });
  };

  const resetDraft = () => {
    if (!activeCiderDraft) {
      setGuidedDraft(defaultGuidedDraft());
      setGuidedStep(0);
      return;
    }

    const preset = ciderStylePresets.find((entry) => entry.key === activeCiderDraft.style_key) ?? ciderStylePresets[0];
    const sourceIngredients =
      activeCiderDraft.manual_ingredients && activeCiderDraft.manual_ingredients.length > 0
        ? activeCiderDraft.manual_ingredients
        : activeCiderDraft.ingredients;
    const yeastName = sourceIngredients.find((entry) => entry.kind === 'yeast')?.name ?? preset.yeastName;
    const primaryStep = activeCiderDraft.fermentation_steps.find((entry) => entry.stage === 'primary') ?? activeCiderDraft.fermentation_steps[0];
    const conditioningStep =
      activeCiderDraft.fermentation_steps.find((entry) => entry.stage === 'conditioning') ??
      activeCiderDraft.fermentation_steps.find((entry) => entry.stage === 'secondary') ??
      activeCiderDraft.fermentation_steps.find((entry) => entry.stage === 'cold_crash');

    setGuidedDraft({
      recipeName: activeCiderDraft.name || 'BSG Select Cider Draft',
      styleKey: activeCiderDraft.style_key || preset.key,
      styleLabel: preset.label,
      batchValue: round(activeCiderDraft.proposal.batch_size_l ?? 18.9, 1),
      batchUnit: 'l',
      abv: round((activeCiderDraft.targets.abv.min + activeCiderDraft.targets.abv.max) / 2, 1),
      residualSugarPct: round(
        ((activeCiderDraft.targets.residual_sugar?.min ?? preset.residualSugarPct) +
          (activeCiderDraft.targets.residual_sugar?.max ?? preset.residualSugarPct)) /
          2,
        1
      ),
      ph: round(
        ((activeCiderDraft.targets.ph?.min ?? preset.ph) + (activeCiderDraft.targets.ph?.max ?? preset.ph)) / 2,
        2
      ),
      carbonationTargetVols: round(activeCiderDraft.compliance_profile?.planner?.carbonationTargetVolumes ?? preset.carbonationTargetVols, 1),
      carbonationMode: (activeCiderDraft.compliance_profile?.planner?.carbonationMode ?? preset.carbonationMode) as CiderCarbonationMode,
      interstateSale: Boolean(activeCiderDraft.compliance_profile?.planner?.interstateSale),
      yeastName,
      primaryTempC: round(primaryStep?.temp_c ?? preset.primaryTempC, 1),
      primaryDays: round(primaryStep?.duration_days ?? preset.primaryDays, 0),
      conditioningDays: round(conditioningStep?.duration_days ?? preset.conditioningDays, 0),
      includeYeastNutrient: sourceIngredients.some((entry) => entry.name.toLowerCase().includes('nutrient')),
      includePecticEnzyme: sourceIngredients.some((entry) => entry.name.toLowerCase().includes('pectic')),
    });
    setGuidedStep(0);
  };

  const openGuidedSetup = () => {
    resetDraft();
    setGuidedOpen(true);
  };

  const applyStylePreset = (styleKey: string) => {
    const preset = ciderStylePresets.find((entry) => entry.key === styleKey);
    if (!preset) return;
    setGuidedDraft((current) => ({
      ...current,
      styleKey: preset.key,
      styleLabel: preset.label,
      abv: preset.abv,
      residualSugarPct: preset.residualSugarPct,
      ph: preset.ph,
      carbonationTargetVols: preset.carbonationTargetVols,
      carbonationMode: preset.carbonationMode,
      yeastName: preset.yeastName,
      primaryTempC: preset.primaryTempC,
      primaryDays: preset.primaryDays,
      conditioningDays: preset.conditioningDays,
      recipeName:
        current.recipeName === 'BSG Select Cider Draft' || current.recipeName.trim().length === 0
          ? `BSG ${preset.label} Cider`
          : current.recipeName,
    }));
  };

  const launchGuidedDraft = () => {
    setGuidedOpen(false);
    setSearchParams({
      view: 'recipe',
      guidedSetup: '1',
      guidedStamp: String(Date.now()),
      guidedName: guidedDraft.recipeName,
      guidedStyleKey: guidedDraft.styleKey,
      guidedBatchValue: String(guidedDraft.batchValue),
      guidedBatchUnit: guidedDraft.batchUnit,
      guidedAbv: String(guidedDraft.abv),
      guidedResidualSugarPct: String(guidedDraft.residualSugarPct),
      guidedPh: String(guidedDraft.ph),
      guidedCarbTarget: String(guidedDraft.carbonationTargetVols),
      guidedCarbMode: guidedDraft.carbonationMode,
      guidedInterstate: guidedDraft.interstateSale ? '1' : '0',
      guidedYeast: guidedDraft.yeastName,
      guidedPrimaryTempC: String(guidedDraft.primaryTempC),
      guidedPrimaryDays: String(guidedDraft.primaryDays),
      guidedConditioningDays: String(guidedDraft.conditioningDays),
      guidedIncludeNutrient: guidedDraft.includeYeastNutrient ? '1' : '0',
      guidedIncludePecticEnzyme: guidedDraft.includePecticEnzyme ? '1' : '0',
    });
  };

  const guidedSteps: LabGuidedFlowStep[] = [
    {
      label: 'Name + Base',
      detail: `${guidedDraft.styleLabel} · ${guidedDraft.recipeName || 'Choose the cider product and base.'}`,
      state: guidedOpen && guidedStep === 0 ? 'current' : guidedDraft.recipeName ? 'done' : 'pending',
    },
    {
      label: 'Batch + Targets',
      detail: `${guidedDraft.batchValue} ${guidedDraft.batchUnit} · ${guidedDraft.abv.toFixed(1)}% ABV target`,
      state: guidedOpen && guidedStep === 1 ? 'current' : guidedDraft.batchValue > 0 ? 'done' : 'pending',
    },
    {
      label: 'Packaging + Compliance',
      detail: `${guidedDraft.carbonationTargetVols.toFixed(1)} vols CO2 · ${guidedDraft.interstateSale ? 'Interstate review on' : 'Local review path'}`,
      state:
        guidedOpen && guidedStep === 2
          ? 'current'
          : guidedDraft.carbonationMode !== 'unknown' || guidedDraft.interstateSale
            ? 'done'
            : 'pending',
    },
    {
      label: 'Workspace Review',
      detail: 'Launch into the temporary mixed workspace with the draft pre-shaped.',
      state: searchParams.get('view') === 'recipe' ? 'done' : guidedOpen && guidedStep === 3 ? 'current' : 'pending',
    },
  ];

  const ciderProcessGuidance = useMemo(() => {
    if (guidedDraft.styleKey === 'still_farmhouse_cider') {
      return {
        title: 'Still cellar path',
        steps: [
          'Blend base + water',
          `Pitch ${guidedDraft.yeastName}`,
          `Primary ferment at ${guidedDraft.primaryTempC} C for about ${guidedDraft.primaryDays} days`,
          `Condition still for about ${guidedDraft.conditioningDays} days`,
          'Package with minimal CO2 pickup',
        ],
      };
    }
    if (guidedDraft.carbonationTargetVols >= 2.8) {
      return {
        title: 'Sparkling production path',
        steps: [
          'Blend base + water',
          `Pitch ${guidedDraft.yeastName}`,
          `Primary ferment at ${guidedDraft.primaryTempC} C for about ${guidedDraft.primaryDays} days`,
          'Bright / filter if needed',
          'Carbonate to sparkling target',
        ],
      };
    }
    return {
      title: 'Standard craft cider path',
      steps: [
        'Blend base + water',
        `Pitch ${guidedDraft.yeastName}`,
        `Primary ferment at ${guidedDraft.primaryTempC} C for about ${guidedDraft.primaryDays} days`,
        `Condition / clarify for about ${guidedDraft.conditioningDays} days`,
        'Carbonate to serving target',
      ],
    };
  }, [guidedDraft]);

  const prelude = (
    <>
      <LabGuidedFlowShell
        eyebrow="Guided Authoring"
        title="Temporary Cider Guided Start"
        description="This route now owns the cider onboarding flow. It still hands off to the temporary mixed workspace underneath, but customers start with guided product questions instead of the full data surface."
        status="Dedicated Cider Route"
        steps={guidedSteps}
        primaryAction={
          <button type="button" className="button" onClick={openGuidedSetup}>
            {activeCiderDraft ? 'Restart Guided Setup' : 'Start Guided Setup'}
          </button>
        }
        secondaryAction={
          <button type="button" className="button button-muted" onClick={() => setSearchParams({ view: 'recipe' })}>
            Resume Workspace
          </button>
        }
        note={
          <p className="hint small">
            The cider route now owns the planning brief. The mixed workspace underneath is only the detailed transition surface while beer, cider, and wine separate into their own real builders.
          </p>
        }
      />

      <section className="lab-cider-route-grid lab-cider-route-grid--planning">
        <CiderTargetEditorCard
          draft={guidedDraft}
          batchUnitLabels={batchUnitLabels}
          residualSugarPresets={residualSugarPresets}
          carbonationPresets={carbonationPresets}
          onDraftChange={applyDraftPatch}
          onApplyToWorkspace={launchGuidedDraft}
          onOpenGuidedSetup={openGuidedSetup}
          workspaceActive={searchParams.get('view') === 'recipe'}
        />

        <CiderProcessEditorCard
          draft={guidedDraft}
          stylePresets={ciderStylePresets}
          selectedStylePreset={selectedStylePreset}
          onSelectStylePreset={applyStylePreset}
          onDraftChange={applyDraftPatch}
        />

        <CiderIngredientPlanCard draft={guidedDraft} onDraftChange={applyDraftPatch} />

        <article className="card lab-cider-route-card">
          <span className="lab-v2-live-eyebrow">Current Route Summary</span>
          <h3>{ciderProcessGuidance.title}</h3>
          <div className="lab-cider-route-metrics">
            <div>
              <span>Style</span>
              <strong>{guidedDraft.styleLabel}</strong>
            </div>
            <div>
              <span>Yeast</span>
              <strong>{guidedDraft.yeastName}</strong>
            </div>
            <div>
              <span>Primary</span>
              <strong>
                {guidedDraft.primaryTempC.toFixed(1)} C · {guidedDraft.primaryDays.toFixed(0)} d
              </strong>
            </div>
            <div>
              <span>Conditioning</span>
              <strong>{guidedDraft.conditioningDays.toFixed(0)} d</strong>
            </div>
          </div>
          <ul className="summary-shortages">
            {ciderProcessGuidance.steps.map((step) => (
              <li key={step}>
                <span>Step</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {guidedOpen && (
        <div className="modal-overlay" onClick={() => setGuidedOpen(false)}>
          <div className="modal modal--wide lab-guided-modal" onClick={(event) => event.stopPropagation()}>
            <header className="modal-head">
              <div>
                <p className="lab-v2-live-eyebrow">Guided Cider Setup</p>
                <h2>
                  {guidedStep === 0
                    ? 'Step 1: Product + Base'
                    : guidedStep === 1
                      ? 'Step 2: Batch + Targets'
                      : guidedStep === 2
                        ? 'Step 3: Packaging + Compliance'
                        : 'Step 4: Review + Launch'}
                </h2>
              </div>
              <button type="button" className="button button-muted" onClick={() => setGuidedOpen(false)}>
                Close
              </button>
            </header>

            <div className="lab-guided-modal-body">
              <div className="lab-guided-modal-progress">
                {guidedSteps.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className={`lab-guided-modal-progress-step ${
                      index === guidedStep
                        ? 'lab-guided-modal-progress-step--active'
                        : index < guidedStep
                          ? 'lab-guided-modal-progress-step--done'
                          : ''
                    }`}
                  >
                    <span>{index + 1}</span>
                    <strong>{step.label}</strong>
                  </div>
                ))}
              </div>

              {guidedStep === 0 && (
                <div className="lab-guided-modal-grid">
                  <label>
                    Recipe Name
                    <input value={guidedDraft.recipeName} onChange={(event) => applyDraftPatch({ recipeName: event.target.value })} />
                  </label>
                  <article className="card lab-guided-base-card">
                    <span className="lab-v2-live-eyebrow">Primary Base</span>
                    <h3>BSG Select CiderBase</h3>
                    <p className="hint small">
                      45 Brix concentrate, pH 3.3 to 3.4, production-focused cider base. This remains the primary guided starter during the extraction phase.
                    </p>
                  </article>
                  <div className="lab-guided-preset-group lab-guided-preset-group--full">
                    <span className="lab-v2-live-eyebrow">Style Presets</span>
                    <div className="lab-guided-preset-grid">
                      {ciderStylePresets.map((preset) => (
                        <button
                          key={preset.key}
                          type="button"
                          className={`lab-guided-preset-card ${guidedDraft.styleKey === preset.key ? 'lab-guided-preset-card--active' : ''}`}
                          onClick={() => applyStylePreset(preset.key)}
                        >
                          <strong>{preset.label}</strong>
                          <span>{preset.detail}</span>
                          <small>
                            {preset.abv.toFixed(1)}% ABV · {preset.residualSugarPct.toFixed(1)}% RS · {preset.carbonationTargetVols.toFixed(1)} vols
                          </small>
                          <small>
                            {preset.yeastName} · {preset.primaryTempC} C ferment
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {guidedStep === 1 && (
                <div className="lab-guided-modal-grid">
                  <label>
                    Batch Size
                    <div className="batch-size-row">
                      <input
                        type="number"
                        min={0.1}
                        step={batchUnitLabels[guidedDraft.batchUnit].step}
                        value={guidedDraft.batchValue}
                        onChange={(event) => {
                          const numeric = Number(event.target.value);
                          if (!Number.isFinite(numeric) || numeric <= 0) return;
                          applyDraftPatch({ batchValue: numeric });
                        }}
                      />
                      <select value={guidedDraft.batchUnit} onChange={(event) => applyDraftPatch({ batchUnit: event.target.value as BatchUnit })}>
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
                      value={guidedDraft.abv}
                      onChange={(event) => {
                        const numeric = Number(event.target.value);
                        if (!Number.isFinite(numeric)) return;
                        applyDraftPatch({ abv: numeric });
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
                      value={guidedDraft.residualSugarPct}
                      onChange={(event) => {
                        const numeric = Number(event.target.value);
                        if (!Number.isFinite(numeric)) return;
                        applyDraftPatch({ residualSugarPct: numeric });
                      }}
                    />
                    <div className="lab-guided-pill-row">
                      {residualSugarPresets.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          className={`lab-guided-pill ${Math.abs(guidedDraft.residualSugarPct - preset.value) < 0.15 ? 'lab-guided-pill--active' : ''}`}
                          onClick={() => applyDraftPatch({ residualSugarPct: preset.value })}
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
                      value={guidedDraft.ph}
                      onChange={(event) => {
                        const numeric = Number(event.target.value);
                        if (!Number.isFinite(numeric)) return;
                        applyDraftPatch({ ph: numeric });
                      }}
                    />
                  </label>
                </div>
              )}

              {guidedStep === 2 && (
                <div className="lab-guided-modal-grid">
                  <label>
                    Carbonation Target
                    <div className="batch-size-row">
                      <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.1}
                        value={guidedDraft.carbonationTargetVols}
                        onChange={(event) => {
                          const numeric = Number(event.target.value);
                          if (!Number.isFinite(numeric) || numeric < 0) return;
                          applyDraftPatch({ carbonationTargetVols: numeric });
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
                            Math.abs(guidedDraft.carbonationTargetVols - preset.target) < 0.15 &&
                            guidedDraft.carbonationMode === preset.mode
                              ? 'lab-guided-pill--active'
                              : ''
                          }`}
                          onClick={() => applyDraftPatch({ carbonationTargetVols: preset.target, carbonationMode: preset.mode })}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label>
                    Carbonation Mode
                    <select value={guidedDraft.carbonationMode} onChange={(event) => applyDraftPatch({ carbonationMode: event.target.value as CiderCarbonationMode })}>
                      <option value="unknown">Confirm Later</option>
                      <option value="still">Still</option>
                      <option value="effervescent">Effervescent / Carbonated</option>
                    </select>
                  </label>
                  <label className="lab-v2-compliance-toggle">
                    <span>Interstate Sale Planned</span>
                    <input type="checkbox" checked={guidedDraft.interstateSale} onChange={(event) => applyDraftPatch({ interstateSale: event.target.checked })} />
                  </label>
                </div>
              )}

              {guidedStep === 3 && (
                <div className="lab-guided-review-grid">
                  <div className="lab-v2-bsg-stat">
                    <span>Style</span>
                    <strong>{guidedDraft.styleLabel}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Recipe</span>
                    <strong>{guidedDraft.recipeName || 'BSG Select Cider Draft'}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Batch</span>
                    <strong>
                      {guidedDraft.batchValue} {guidedDraft.batchUnit}
                    </strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>ABV Target</span>
                    <strong>{guidedDraft.abv.toFixed(1)}%</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Residual Sugar</span>
                    <strong>{guidedDraft.residualSugarPct.toFixed(1)}%</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>pH Target</span>
                    <strong>{guidedDraft.ph.toFixed(2)}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Carbonation</span>
                    <strong>{guidedDraft.carbonationTargetVols.toFixed(1)} vols</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Yeast</span>
                    <strong>{guidedDraft.yeastName}</strong>
                  </div>
                  <div className="lab-v2-bsg-stat">
                    <span>Ferment</span>
                    <strong>
                      {guidedDraft.primaryTempC.toFixed(1)} C · {guidedDraft.primaryDays.toFixed(0)} d
                    </strong>
                  </div>
                  <article className="card lab-guided-base-card">
                    <span className="lab-v2-live-eyebrow">Launch Note</span>
                    <p className="hint small">
                      LAB will shape a BSG Select CiderBase draft and open the temporary mixed workspace. The cider route now owns the planning brief, yeast choice, and starter additions before handoff.
                    </p>
                  </article>
                </div>
              )}
            </div>

            <div className="lab-guided-modal-actions">
              <button
                type="button"
                className="button button-muted"
                onClick={() => {
                  if (guidedStep === 0) {
                    setGuidedOpen(false);
                    return;
                  }
                  setGuidedStep((current) => Math.max(0, current - 1));
                }}
              >
                {guidedStep === 0 ? 'Cancel' : 'Back'}
              </button>
              {guidedStep < 3 ? (
                <button type="button" className="button" onClick={() => setGuidedStep((current) => Math.min(3, current + 1))}>
                  Next
                </button>
              ) : (
                <button type="button" className="button" onClick={launchGuidedDraft}>
                  Launch Guided Draft
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return <LabBuilderV2Page builderFamily="cider" prelude={prelude} />;
}
