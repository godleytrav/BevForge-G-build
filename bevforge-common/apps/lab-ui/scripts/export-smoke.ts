import assert from 'node:assert/strict';
import {
  evaluateBevForgePayload,
  payloadRuntimeSteps,
  toBevForgePayload,
  toBevForgePayloadFromSavedRecipe,
} from '../src/lib/exporters.js';
import type { SavedLabRecipe } from '../src/lib/lab-types.js';

const draftPayload = toBevForgePayload({
  name: 'Smoke Draft',
  style: 'American IPA',
  batchSizeLiters: 20,
  boilMinutes: 60,
  mashTempC: 66,
  mashDurationMin: 60,
  fermentationTempC: 19,
  fermentationDays: 10,
  requirements: [
    { name: 'Pale Malt', category: 'malt', requiredQty: 4.5, unit: 'kg' },
    { name: 'Citra', category: 'hops', requiredQty: 120, unit: 'g' },
    { name: 'US-05', category: 'yeast', requiredQty: 1, unit: 'pack' },
  ],
});

const draftCheck = evaluateBevForgePayload(draftPayload);
assert.equal(draftPayload.schemaVersion, '0.1.0');
assert.ok(Array.isArray(draftPayload.steps));
assert.ok(draftPayload.steps.length > 0, 'expected at least one step');
assert.ok(draftPayload.steps.every((step) => Boolean(step.id && step.type)), 'step contract invalid');
assert.ok(draftPayload.metadata?.process.batch_size_l === 20, 'metadata process batch mismatch');
assert.ok(draftCheck.ok, `draft payload validation failed: ${draftCheck.errors.join(' | ')}`);

const runtimeDraftSteps = payloadRuntimeSteps(draftPayload);
assert.ok(runtimeDraftSteps.some((step) => step.stage === 'mash'));
assert.ok(runtimeDraftSteps.some((step) => step.stage === 'boil'));
assert.ok(runtimeDraftSteps.some((step) => step.stage === 'fermentation'));

const savedRecipe: SavedLabRecipe = {
  id: 'smoke-saved-1',
  name: 'Smoke Saved Recipe',
  beverage: 'beer',
  style_key: 'american_ipa',
  mode: 'hybrid',
  selections: {
    aroma: ['citrus'],
    flavor: ['tropical'],
  },
  targets: {
    abv: { min: 5.5, max: 6.2 },
    ibu: { min: 45, max: 60 },
    srm: { min: 5, max: 8 },
  },
  proposal: {
    targets: {
      abv: { min: 5.5, max: 6.2 },
      ibu: { min: 45, max: 60 },
      srm: { min: 5, max: 8 },
    },
    og: 1.058,
    fg: 1.012,
    attenuation: 0.78,
    mash_temp_c: 66,
    water_bias: 'Balanced profile',
    base_malt: {
      name: 'Pale Malt',
      percent: 82,
    },
    specialty_caps: [],
    hop_plan: [
      {
        family: 'citra',
        timings: ['15 min boil'],
        variety: 'Citra',
      },
    ],
    yeast_family: 'US-05',
    batch_size_l: 20,
    efficiency_pct: 74,
  },
  ingredients: [
    { kind: 'fermentable', name: 'Pale Malt', amount: 4.5, unit: 'kg', ppg: 36, color_srm: 2 },
    { kind: 'hop', name: 'Citra', amount: 120, unit: 'g', aa_pct: 12, timing: 'boil', time_min: 15 },
    { kind: 'yeast', name: 'US-05', amount: 1, unit: 'pack' },
  ],
  mash_steps: [
    { order_index: 0, name: 'Mash Rest', temp_c: 66, duration_min: 60 },
    { order_index: 1, name: 'Boil', temp_c: 100, duration_min: 60 },
  ],
  fermentation_steps: [
    { order_index: 0, stage: 'primary', temp_c: 19, duration_days: 10 },
  ],
  similar_to: [],
  created_at: '2026-03-01T00:00:00.000Z',
  updated_at: '2026-03-01T00:00:00.000Z',
};

const savedPayload = toBevForgePayloadFromSavedRecipe(savedRecipe);
const savedCheck = evaluateBevForgePayload(savedPayload);
assert.ok(savedCheck.ok, `saved payload validation failed: ${savedCheck.errors.join(' | ')}`);
assert.ok((savedPayload.metadata?.requirements?.length ?? 0) >= 3, 'missing requirements in metadata');
assert.equal(savedPayload.id, savedRecipe.id);

console.log('LAB export smoke check passed');
console.log(
  JSON.stringify(
    {
      draftSteps: draftPayload.steps.length,
      savedSteps: savedPayload.steps.length,
      draftWarnings: draftCheck.warnings.length,
      savedWarnings: savedCheck.warnings.length,
    },
    null,
    2
  )
);
