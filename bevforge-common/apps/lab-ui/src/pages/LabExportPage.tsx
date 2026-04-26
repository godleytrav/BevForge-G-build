import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  buildDefaultComplianceProfileForDraft,
  evaluateBevForgePayload,
  payloadRuntimeSteps,
  requirementsFromIngredients,
  requirementsFromText,
  toBeerJsonPayload,
  toBeerXmlPayload,
  toBevForgePayload,
  toBevForgePayloadFromSavedRecipe,
  type LabDraft,
  type RequirementCategory,
} from '../lib/exporters';
import { normalizeOsBaseUrl, sendBevForgeToOs, writeLabHandoffAudit } from '../lib/os-integration';
import { suiteBaseUrl } from '../lib/suite-links';
import {
  getActiveRecipeId,
  getSavedRecipe,
  hydrateRecipesFromOs,
  listSavedRecipes,
  setActiveRecipeId,
} from '../lib/lab-store';
import type { LabComplianceProfile, SavedLabRecipe } from '../lib/lab-types';

const initialDraft: LabDraft = {
  name: 'LAB Draft Recipe',
  style: 'American IPA',
  batchSizeLiters: 20,
  boilMinutes: 60,
  mashTempC: 66,
  mashDurationMin: 60,
  fermentationTempC: 19,
  fermentationDays: 10,
  requirements: [],
};

type NumericDraftField =
  | 'batchSizeLiters'
  | 'boilMinutes'
  | 'mashTempC'
  | 'mashDurationMin'
  | 'fermentationTempC'
  | 'fermentationDays';

const saveDownload = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toRequirementLine = (recipe: SavedLabRecipe): string => {
  const sourceIngredients =
    recipe.ingredients.length > 0 ? recipe.ingredients : recipe.manual_ingredients ?? [];
  return requirementsFromIngredients(sourceIngredients)
    .map((requirement) => {
      const qty =
        requirement.requiredQty !== undefined && Number.isFinite(requirement.requiredQty)
          ? requirement.requiredQty
          : '';
      return `${requirement.name}|${requirement.category}|${qty}|${requirement.unit ?? ''}`;
    })
    .join('\n');
};

const draftFromSavedRecipe = (recipe: SavedLabRecipe): LabDraft => {
  const mashStep =
    recipe.mash_steps.find((step) => /mash|infusion|rest/i.test(step.name)) ?? recipe.mash_steps[0];
  const boilStep = recipe.mash_steps.find((step) => /boil/i.test(step.name));
  const fermStep =
    recipe.fermentation_steps.find((step) => step.stage === 'primary') ?? recipe.fermentation_steps[0];
  return {
    name: recipe.name,
    style: recipe.style_key || recipe.class_designation?.class_name || 'lab_style',
    batchSizeLiters: recipe.proposal.batch_size_l || 20,
    boilMinutes: boilStep?.duration_min ?? 60,
    mashTempC: mashStep?.temp_c ?? recipe.proposal.mash_temp_c ?? 66,
    mashDurationMin: mashStep?.duration_min ?? 60,
    fermentationTempC: fermStep?.temp_c ?? 19,
    fermentationDays: fermStep?.duration_days ?? 7,
    requirements: [],
  };
};

const mergeComplianceProfile = (
  base: LabComplianceProfile,
  patch?: Partial<LabComplianceProfile>
): LabComplianceProfile => ({
  ...base,
  ...patch,
  jurisdiction: {
    ...base.jurisdiction,
    ...(patch?.jurisdiction ?? {}),
  },
  ttb: {
    ...base.ttb,
    ...(patch?.ttb ?? {}),
  },
  abc: {
    ...base.abc,
    ...(patch?.abc ?? {}),
  },
  cola: {
    ...base.cola,
    ...(patch?.cola ?? {}),
  },
});

const complianceFromDraft = (params: {
  recipeId?: string;
  recipeName: string;
  style: string;
  patch?: Partial<LabComplianceProfile>;
}): LabComplianceProfile => {
  const base = buildDefaultComplianceProfileForDraft({
    recipeId: params.recipeId,
    recipeName: params.recipeName,
    style: params.style,
  });
  return mergeComplianceProfile(base, params.patch);
};

const requirementCategoryOrder: RequirementCategory[] = [
  'malt',
  'hops',
  'yeast',
  'fruit',
  'packaging',
  'equipment',
  'other',
];

export function LabExportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedRecipes, setSavedRecipes] = useState<SavedLabRecipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  const [draft, setDraft] = useState<LabDraft>(initialDraft);
  const [complianceProfile, setComplianceProfile] = useState<LabComplianceProfile>(() =>
    complianceFromDraft({
      recipeName: initialDraft.name,
      style: initialDraft.style,
    })
  );
  const [requirementsText, setRequirementsText] = useState(
    'Pale Malt|malt|4.5|kg\nCitra|hops|120|g\nUS-05|yeast|1|pack'
  );
  const [osBaseUrl, setOsBaseUrl] = useState(import.meta.env.VITE_OS_API_BASE || suiteBaseUrl('os'));
  const [osImportToken, setOsImportToken] = useState(import.meta.env.VITE_OS_IMPORT_TOKEN || '');
  const [sendState, setSendState] = useState('');

  const queryRecipeId = searchParams.get('recipeId');

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      await hydrateRecipesFromOs();
      if (!mounted) return;

      const records = listSavedRecipes();
      setSavedRecipes(records);

      const activeRecipeId = getActiveRecipeId();
      const initialId = queryRecipeId || activeRecipeId || records[0]?.id;

      if (!initialId) return;
      const saved = getSavedRecipe(initialId);
      if (!saved) return;

      setSelectedRecipeId(saved.id);
      setDraft(draftFromSavedRecipe(saved));
      setRequirementsText(toRequirementLine(saved));
      setComplianceProfile(
        complianceFromDraft({
          recipeId: saved.id,
          recipeName: saved.name,
          style: saved.style_key || saved.class_designation?.class_name || 'lab_style',
          patch: saved.compliance_profile,
        })
      );
      setActiveRecipeId(saved.id);
      if (queryRecipeId !== saved.id) {
        setSearchParams({ recipeId: saved.id });
      }
    };

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [queryRecipeId, setSearchParams]);

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return undefined;
    return savedRecipes.find((recipe) => recipe.id === selectedRecipeId) ?? getSavedRecipe(selectedRecipeId);
  }, [savedRecipes, selectedRecipeId]);

  const parsedRequirements = useMemo(
    () => requirementsFromText(requirementsText),
    [requirementsText]
  );

  const draftWithRequirements = useMemo(
    () => ({
      ...draft,
      requirements: parsedRequirements,
    }),
    [draft, parsedRequirements]
  );

  const bevForgePayload = useMemo(() => {
    if (selectedRecipe) {
      return toBevForgePayloadFromSavedRecipe(selectedRecipe, {
        name: draft.name,
        style: draft.style,
        batchSizeLiters: draft.batchSizeLiters,
        boilMinutes: draft.boilMinutes,
        mashTempC: draft.mashTempC,
        mashDurationMin: draft.mashDurationMin,
        fermentationTempC: draft.fermentationTempC,
        fermentationDays: draft.fermentationDays,
        requirements: parsedRequirements,
        complianceProfile,
      });
    }
    return toBevForgePayload(draftWithRequirements, {
      complianceProfile,
    });
  }, [selectedRecipe, draft, parsedRequirements, draftWithRequirements, complianceProfile]);

  const dryRun = useMemo(() => evaluateBevForgePayload(bevForgePayload), [bevForgePayload]);
  const runtimePreviewSteps = useMemo(
    () => payloadRuntimeSteps(bevForgePayload),
    [bevForgePayload]
  );

  const payloadText = useMemo(() => `${JSON.stringify(bevForgePayload, null, 2)}\n`, [bevForgePayload]);

  const osExecutionUrl = useMemo(() => {
    const base = normalizeOsBaseUrl(osBaseUrl);
    if (!base) return '';
    return `${base}/os/recipe-execution`;
  }, [osBaseUrl]);

  const stageSummary = useMemo(
    () =>
      Object.entries(dryRun.summary.stageCounts)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([stage, count]) => `${stage}: ${count}`),
    [dryRun.summary.stageCounts]
  );

  const requirementSummary = useMemo(
    () =>
      requirementCategoryOrder
        .map((category) => ({ category, count: dryRun.summary.requirementCategoryCounts[category] }))
        .filter((entry) => entry.count > 0),
    [dryRun.summary.requirementCategoryCounts]
  );

  const onNumber = (key: NumericDraftField, value: string) => {
    const next = Number(value);
    setDraft((current) => ({
      ...current,
      [key]: Number.isFinite(next) ? next : current[key],
    }));
  };

  const onSelectSavedRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    if (!recipeId) {
      setComplianceProfile(
        complianceFromDraft({
          recipeName: draft.name,
          style: draft.style,
        })
      );
      setSendState('Switched to manual draft mode.');
      return;
    }
    const saved = getSavedRecipe(recipeId);
    if (!saved) {
      setSendState('Selected saved recipe was not found.');
      return;
    }
    setDraft(draftFromSavedRecipe(saved));
    setRequirementsText(toRequirementLine(saved));
    setComplianceProfile(
      complianceFromDraft({
        recipeId: saved.id,
        recipeName: saved.name,
        style: saved.style_key || saved.class_designation?.class_name || 'lab_style',
        patch: saved.compliance_profile,
      })
    );
    setActiveRecipeId(saved.id);
    setSearchParams({ recipeId: saved.id });
    setSendState(`Loaded saved draft: ${saved.name}`);
  };

  const onSendToOs = async () => {
    if (!dryRun.ok) {
      setSendState('Dry-run has blocking errors. Fix them before sending to OS.');
      void writeLabHandoffAudit(
        osBaseUrl,
        {
          status: 'blocked',
          recipeId: selectedRecipe?.id,
          recipeName: draft.name,
          osBaseUrl: normalizeOsBaseUrl(osBaseUrl),
          dryRunOk: dryRun.ok,
          warningCount: dryRun.warnings.length,
          errorCount: dryRun.errors.length,
          message: 'Dry-run blocking validation errors prevented import.',
          source: 'lab-export-ui',
        },
        { importToken: osImportToken }
      );
      return;
    }

    setSendState('Sending to OS import endpoint...');
    void writeLabHandoffAudit(
      osBaseUrl,
      {
        status: 'sent',
        recipeId: selectedRecipe?.id,
        recipeName: draft.name,
        osBaseUrl: normalizeOsBaseUrl(osBaseUrl),
        dryRunOk: dryRun.ok,
        warningCount: dryRun.warnings.length,
        errorCount: dryRun.errors.length,
        message: 'LAB export submitted to OS import endpoint.',
        source: 'lab-export-ui',
      },
      { importToken: osImportToken }
    );
    const result = await sendBevForgeToOs(osBaseUrl, 'BevForge.json', payloadText, {
      importToken: osImportToken,
    });
    if (result.success) {
      setSendState(`Imported to OS: ${result.data?.name ?? 'unknown'} (${result.data?.id ?? 'no id'})`);
      void writeLabHandoffAudit(
        osBaseUrl,
        {
          status: 'success',
          recipeId: selectedRecipe?.id,
          recipeName: draft.name,
          importedRecipeId: result.data?.id,
          importedFormat: result.data?.format,
          osBaseUrl: normalizeOsBaseUrl(osBaseUrl),
          dryRunOk: dryRun.ok,
          warningCount: dryRun.warnings.length,
          errorCount: dryRun.errors.length,
          message: 'Recipe import completed successfully.',
          source: 'lab-export-ui',
        },
        { importToken: osImportToken }
      );
      return;
    }

    const fallbackHint = osExecutionUrl
      ? `Fallback: download JSON and import in OS at ${osExecutionUrl}`
      : 'Fallback: download JSON and import in OS recipe execution.';
    setSendState(`OS import failed: ${result.error ?? 'unknown error'} ${result.message ?? ''} · ${fallbackHint}`.trim());
    void writeLabHandoffAudit(
      osBaseUrl,
      {
        status: 'failed',
        recipeId: selectedRecipe?.id,
        recipeName: draft.name,
        osBaseUrl: normalizeOsBaseUrl(osBaseUrl),
        dryRunOk: dryRun.ok,
        warningCount: dryRun.warnings.length,
        errorCount: dryRun.errors.length,
        message: `${result.error ?? 'unknown error'} ${result.message ?? ''}`.trim(),
        source: 'lab-export-ui',
      },
      { importToken: osImportToken }
    );
  };

  return (
    <section className="page">
      <header className="page-header">
        <h1>LAB Export Console</h1>
        <p>Export saved LAB drafts and hand off `BevForge.json` into OS recipe intake.</p>
      </header>

      <div className="card-grid">
        <article className="card">
          <h2>Source Draft</h2>
          <label>
            Saved Recipe
            <select value={selectedRecipeId} onChange={(event) => onSelectSavedRecipe(event.target.value)}>
              <option value="">Manual draft</option>
              {savedRecipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </label>

          {selectedRecipe && (
            <p className="hint">
              Loaded from library · updated {new Date(selectedRecipe.updated_at).toLocaleString()} ·{' '}
              <Link to={`/lab/builder?recipeId=${selectedRecipe.id}`}>edit in builder</Link>
            </p>
          )}

          <label>
            Recipe Name
            <input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            Style
            <input
              value={draft.style}
              onChange={(event) => setDraft((current) => ({ ...current, style: event.target.value }))}
            />
          </label>
          <div className="field-row">
            <label>
              Batch L
              <input
                type="number"
                value={draft.batchSizeLiters}
                onChange={(event) => onNumber('batchSizeLiters', event.target.value)}
              />
            </label>
            <label>
              Boil min
              <input
                type="number"
                value={draft.boilMinutes}
                onChange={(event) => onNumber('boilMinutes', event.target.value)}
              />
            </label>
            <label>
              Mash C
              <input
                type="number"
                value={draft.mashTempC}
                onChange={(event) => onNumber('mashTempC', event.target.value)}
              />
            </label>
          </div>
          <div className="field-row">
            <label>
              Mash min
              <input
                type="number"
                value={draft.mashDurationMin}
                onChange={(event) => onNumber('mashDurationMin', event.target.value)}
              />
            </label>
            <label>
              Ferm C
              <input
                type="number"
                value={draft.fermentationTempC}
                onChange={(event) => onNumber('fermentationTempC', event.target.value)}
              />
            </label>
            <label>
              Ferm days
              <input
                type="number"
                value={draft.fermentationDays}
                onChange={(event) => onNumber('fermentationDays', event.target.value)}
              />
            </label>
          </div>
          <label>
            Requirements (one per line: `name|category|qty|unit`)
            <textarea
              rows={6}
              value={requirementsText}
              onChange={(event) => setRequirementsText(event.target.value)}
            />
          </label>

          <section className="standard-panel">
            <div className="standard-panel-head">
              <h3>Compliance Profile (TTB / ABC / COLA)</h3>
              <span className="hint small">
                {dryRun.publishable.publishable ? 'Publishable' : 'Required fields missing'}
              </span>
            </div>

            <label>
              Profile Name
              <input
                value={complianceProfile.profileName}
                onChange={(event) =>
                  setComplianceProfile((current) => ({ ...current, profileName: event.target.value }))
                }
              />
            </label>

            <div className="field-row">
              <label>
                Country
                <input
                  value={complianceProfile.jurisdiction.countryCode}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      jurisdiction: { ...current.jurisdiction, countryCode: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Region / State
                <input
                  value={complianceProfile.jurisdiction.regionCode}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      jurisdiction: { ...current.jurisdiction, regionCode: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Agency
                <input
                  value={complianceProfile.jurisdiction.agency}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      jurisdiction: { ...current.jurisdiction, agency: event.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                TTB Brewer Notice
                <input
                  value={complianceProfile.ttb.brewerNoticeNumber}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      ttb: { ...current.ttb, brewerNoticeNumber: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                TTB Formula Code
                <input
                  value={complianceProfile.ttb.formulaCode}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      ttb: { ...current.ttb, formulaCode: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                TTB Tax Class
                <input
                  value={complianceProfile.ttb.taxClass}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      ttb: { ...current.ttb, taxClass: event.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                ABC State Code
                <input
                  value={complianceProfile.abc.stateCode}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      abc: { ...current.abc, stateCode: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                ABC License Number
                <input
                  value={complianceProfile.abc.licenseNumber}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      abc: { ...current.abc, licenseNumber: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                ABC Product Category
                <input
                  value={complianceProfile.abc.productCategory}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      abc: { ...current.abc, productCategory: event.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <div className="switch-row">
              <input
                type="checkbox"
                checked={complianceProfile.cola.required}
                onChange={(event) =>
                  setComplianceProfile((current) => ({
                    ...current,
                    cola: { ...current.cola, required: event.target.checked },
                  }))
                }
              />
              <span>COLA Required</span>
            </div>

            <div className="field-row">
              <label>
                COLA Registry Number
                <input
                  value={complianceProfile.cola.colaRegistryNumber ?? ''}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      cola: { ...current.cola, colaRegistryNumber: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Brand Name
                <input
                  value={complianceProfile.cola.brandName}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      cola: { ...current.cola, brandName: event.target.value },
                    }))
                  }
                />
              </label>
              <label>
                Class Designation
                <input
                  value={complianceProfile.cola.classDesignation}
                  onChange={(event) =>
                    setComplianceProfile((current) => ({
                      ...current,
                      cola: { ...current.cola, classDesignation: event.target.value },
                    }))
                  }
                />
              </label>
            </div>

            <label>
              Labeler Name
              <input
                value={complianceProfile.cola.labelerName}
                onChange={(event) =>
                  setComplianceProfile((current) => ({
                    ...current,
                    cola: { ...current.cola, labelerName: event.target.value },
                  }))
                }
              />
            </label>

            <label>
              Compliance Notes
              <textarea
                rows={3}
                value={complianceProfile.notes ?? ''}
                onChange={(event) =>
                  setComplianceProfile((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>
          </section>
        </article>

        <article className="card card-accent">
          <h2>Export + OS Handoff</h2>
          <div className="button-row">
            <button
              type="button"
              className="button"
              onClick={() => saveDownload('BevForge.json', payloadText, 'application/json')}
              disabled={!dryRun.ok}
            >
              Download BevForge.json
            </button>
            <button
              type="button"
              className="button"
              onClick={() =>
                saveDownload(
                  'beer.json',
                  `${JSON.stringify(toBeerJsonPayload(draftWithRequirements), null, 2)}\n`,
                  'application/json'
                )
              }
            >
              Download beer.json
            </button>
            <button
              type="button"
              className="button"
              onClick={() => saveDownload('beer.xml', `${toBeerXmlPayload(draftWithRequirements)}\n`, 'application/xml')}
            >
              Download beer.xml
            </button>
          </div>

          <label>
            OS API Base URL
            <input value={osBaseUrl} onChange={(event) => setOsBaseUrl(event.target.value)} />
          </label>
          <label>
            OS Import Token (optional)
            <input
              type="password"
              placeholder="Matches OS_RECIPE_IMPORT_TOKEN when enabled"
              value={osImportToken}
              onChange={(event) => setOsImportToken(event.target.value)}
            />
          </label>

          <div className="button-row-inline">
            <button type="button" className="button" onClick={onSendToOs} disabled={!dryRun.ok}>
              Send BevForge.json To OS
            </button>
            {osExecutionUrl && (
              <a className="button button-muted" href={osExecutionUrl} target="_blank" rel="noreferrer">
                Open OS Recipe Execution
              </a>
            )}
          </div>

          <p className="status">{sendState || 'No send attempted yet.'}</p>

          <section className="dry-run-panel">
            <div className="standard-panel-head">
              <h3>Dry-Run Validation</h3>
              <span className="hint small">{dryRun.ok ? 'Ready for OS import' : 'Fix blocking payload issues'}</span>
            </div>

            <div className="status-grid dry-run-status-grid">
              <div className="status-chip">Steps {dryRun.summary.stepCount}</div>
            <div className="status-chip">Requirements {dryRun.summary.requirementCount}</div>
            <div className="status-chip">Manual Confirm {dryRun.summary.manualConfirmCount}</div>
            <div className="status-chip">Auto Proceed {dryRun.summary.autoProceedCount}</div>
            <div className="status-chip">
              Compliance {dryRun.summary.compliancePublishable ? 'Publishable' : 'Blocked'}
            </div>
            <div className="status-chip">Revision {dryRun.summary.revision}</div>
          </div>

            {requirementSummary.length > 0 && (
              <div className="dry-run-summary-row">
                {requirementSummary.map((entry) => (
                  <span key={`req-summary-${entry.category}`} className="stock-badge stock-badge--custom">
                    {entry.category} {entry.count}
                  </span>
                ))}
              </div>
            )}

            {stageSummary.length > 0 && <p className="hint small">Stages: {stageSummary.join(' · ')}</p>}

            {dryRun.errors.length > 0 && (
              <ul className="dry-run-list dry-run-list--error">
                {dryRun.errors.map((issue, index) => (
                  <li key={`error-${index}`}>{issue}</li>
                ))}
              </ul>
            )}

            {dryRun.warnings.length > 0 && (
              <ul className="dry-run-list dry-run-list--warning">
                {dryRun.warnings.map((issue, index) => (
                  <li key={`warning-${index}`}>{issue}</li>
                ))}
              </ul>
            )}

            {!dryRun.publishable.publishable && (
              <div className="dry-run-publishable">
                <h4>Publishable Checklist</h4>
                <ul className="dry-run-list dry-run-list--error">
                  {dryRun.publishable.missingFields.map((field, index) => (
                    <li key={`publishable-${index}`}>{field}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="dry-run-preview">
              <h4>Step Preview</h4>
              {runtimePreviewSteps.length === 0 ? (
                <p className="hint small">No steps in payload.</p>
              ) : (
                <ul className="dry-run-step-list">
                  {runtimePreviewSteps.slice(0, 8).map((step) => (
                    <li key={step.id}>
                      <span>
                        {step.name} <small>({step.stage ?? 'unspecified'})</small>
                      </span>
                      <strong>{step.action ?? 'n/a'}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <details className="dry-run-raw">
              <summary>Raw BevForge.json Preview</summary>
              <pre>{payloadText}</pre>
            </details>
          </section>

          <p className="hint">
            Operator run step remains in <code>/os/recipe-execution</code> after import.
          </p>
        </article>
      </div>
    </section>
  );
}
