import type { LabComplianceProfile, ProposalIngredient } from './lab-types';

export type CiderCarbonationMode = 'unknown' | 'still' | 'effervescent';

export interface CiderComplianceAssessment {
  inferredAbv: number;
  carbonationMode: CiderCarbonationMode;
  labelingAuthority: 'ttb' | 'fda';
  colaRequired: boolean;
  hardCiderEligible: boolean;
  formulaReviewRequired: boolean;
  taxClass: string;
  classDesignation: string;
  productCategory: string;
  findings: Array<{
    severity: 'info' | 'warning' | 'blocker';
    title: string;
    detail: string;
    source: 'ttb' | 'inference';
  }>;
  reasons: string[];
}

const FRUIT_KEYWORDS = [
  'blackberry',
  'blueberry',
  'raspberry',
  'strawberry',
  'cherry',
  'peach',
  'mango',
  'pineapple',
  'plum',
  'currant',
  'grape',
  'cranberry',
  'pomegranate',
  'fruit',
];

const APPLE_PEAR_KEYWORDS = ['apple', 'pear', 'perry'];
const FLAVORING_KEYWORDS = ['flavor', 'flavour', 'extract', 'honey', 'spice', 'botanical', 'herb'];

const hasKeyword = (value: string, keywords: string[]): boolean => {
  const normalized = value.trim().toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const inferNonApplePearFruit = (ingredients: ProposalIngredient[]): boolean =>
  ingredients.some((ingredient) => {
    const name = String(ingredient.name ?? '').toLowerCase();
    if (!name.trim()) return false;
    if (hasKeyword(name, APPLE_PEAR_KEYWORDS)) return false;
    return hasKeyword(name, FRUIT_KEYWORDS);
  });

const inferFlavoring = (ingredients: ProposalIngredient[]): boolean =>
  ingredients.some((ingredient) => hasKeyword(String(ingredient.name ?? ''), FLAVORING_KEYWORDS));

const inferHopReview = (ingredients: ProposalIngredient[]): boolean =>
  ingredients.some((ingredient) => ingredient.kind === 'hop');

export const assessCiderCompliance = (params: {
  abv: number;
  ingredients: ProposalIngredient[];
  carbonationMode: CiderCarbonationMode;
  interstateSale: boolean;
}): CiderComplianceAssessment => {
  const inferredAbv = round(Number(params.abv ?? 0), 2);
  const hasNonApplePearFruit = inferNonApplePearFruit(params.ingredients);
  const hasFlavoring = inferFlavoring(params.ingredients);
  const hopReviewRequired = inferHopReview(params.ingredients);
  const labelingAuthority = inferredAbv < 7 ? 'fda' : 'ttb';
  const colaRequired = labelingAuthority === 'ttb' && params.interstateSale;
  const reasons: string[] = [];
  const findings: CiderComplianceAssessment['findings'] = [];

  if (inferredAbv >= 8.5) {
    reasons.push('ABV is 8.5% or higher.');
    findings.push({
      severity: 'blocker',
      title: 'Hard cider tax class lost at 8.5% ABV',
      detail:
        'TTB hard cider eligibility requires less than 8.5% ABV. At or above 8.5%, classify and tax under broader wine handling.',
      source: 'ttb',
    });
  } else {
    findings.push({
      severity: 'info',
      title: 'ABV stays under the hard cider ceiling',
      detail: 'Current projected ABV is below the 8.5% hard cider threshold.',
      source: 'ttb',
    });
  }

  if (hasNonApplePearFruit) {
    reasons.push('Non-apple/pear fruit detected in ingredient names.');
    findings.push({
      severity: 'blocker',
      title: 'Other fruit breaks hard cider eligibility',
      detail:
        'TTB hard cider eligibility excludes other fruit products or fruit flavorings beyond apple and pear. This recipe needs wine/specialty review.',
      source: 'ttb',
    });
  }

  if (params.carbonationMode === 'effervescent') {
    reasons.push('Effervescent carbonation selected.');
    findings.push({
      severity: 'blocker',
      title: 'Effervescence breaks hard cider tax eligibility',
      detail:
        'TTB hard cider eligibility requires a still product. Sparkling or carbonated cider does not qualify for the hard cider tax rate.',
      source: 'ttb',
    });
  } else if (params.carbonationMode === 'unknown') {
    reasons.push('Carbonation has not been confirmed.');
    findings.push({
      severity: 'warning',
      title: 'Carbonation still needs review',
      detail:
        'Builder V2 can flag carbonation status, but hard cider tax eligibility should not be finalized until CO2 handling is confirmed.',
      source: 'ttb',
    });
  }

  if (hasFlavoring) {
    reasons.push('Flavor/spice/honey style additive detected in ingredient names.');
    findings.push({
      severity: 'warning',
      title: 'Formula review likely required',
      detail:
        'TTB states cider with added flavoring materials such as honey, spices, or flavors requires formula approval before production.',
      source: 'ttb',
    });
  }

  if (hopReviewRequired) {
    reasons.push('Hop ingredient detected.');
    findings.push({
      severity: 'warning',
      title: 'Hop usage needs compliance review',
      detail:
        'Hops move this recipe away from standard cider assumptions. Treat as a specialty review path and confirm formula/label treatment before release.',
      source: 'inference',
    });
  }

  if (labelingAuthority === 'fda') {
    findings.push({
      severity: 'info',
      title: 'FDA food-label path applies below 7% ABV',
      detail:
        'TTB COLA rules do not apply below 7% ABV, but FDA food labeling still applies and the alcohol health warning remains required at 0.5%+ ABV.',
      source: 'ttb',
    });
  } else {
    findings.push({
      severity: 'info',
      title: 'TTB wine-label path applies at 7%+ ABV',
      detail:
        'At 7% ABV and above, cider moves into TTB wine labeling requirements and may need COLA review depending on distribution path.',
      source: 'ttb',
    });
  }

  if (colaRequired) {
    findings.push({
      severity: 'warning',
      title: 'Interstate sale means COLA planning matters',
      detail:
        'Because interstate sale is selected and ABV is 7%+, plan for COLA handling before release unless an exemption applies.',
      source: 'ttb',
    });
  }

  const hardCiderEligible =
    inferredAbv >= 0.5 &&
    inferredAbv < 8.5 &&
    params.carbonationMode === 'still' &&
    !hasNonApplePearFruit &&
    !hasFlavoring &&
    !hopReviewRequired;

  return {
    inferredAbv,
    carbonationMode: params.carbonationMode,
    labelingAuthority,
    colaRequired,
    hardCiderEligible,
    formulaReviewRequired: hasFlavoring || hasNonApplePearFruit || hopReviewRequired,
    taxClass: hardCiderEligible
      ? 'hard_cider'
      : labelingAuthority === 'fda'
        ? 'wine_under_7pct_review'
        : 'wine_specialty_review',
    classDesignation: hardCiderEligible
      ? 'Hard Cider'
      : hasNonApplePearFruit
        ? 'Cider / Fruit Wine Review'
        : 'Cider Specialty Review',
    productCategory: hardCiderEligible ? 'Cider' : 'Cider/Wine Review',
    findings,
    reasons,
  };
};

export const buildCiderComplianceProfile = (params: {
  recipeName: string;
  styleKey: string;
  existing?: LabComplianceProfile;
  assessment: CiderComplianceAssessment;
  interstateSale: boolean;
  carbonationTargetVolumes?: number;
}): LabComplianceProfile => {
  const existing = params.existing;
  return {
    schemaVersion: existing?.schemaVersion ?? '0.1.0',
    id: existing?.id ?? `compliance-${params.recipeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cider'}`,
    profileName: existing?.profileName ?? `${params.recipeName || 'Recipe'} Compliance`,
    jurisdiction: existing?.jurisdiction ?? {
      countryCode: 'US',
      regionCode: '',
      agency: 'TTB',
      permitId: '',
    },
    ttb: {
      brewerNoticeNumber: existing?.ttb.brewerNoticeNumber ?? '',
      formulaCode: existing?.ttb.formulaCode ?? '',
      taxClass: params.assessment.taxClass,
      processType: params.assessment.classDesignation,
    },
    abc: {
      stateCode: existing?.abc.stateCode ?? '',
      licenseNumber: existing?.abc.licenseNumber ?? '',
      productCategory: params.assessment.productCategory,
    },
    cola: {
      required: params.assessment.colaRequired,
      colaRegistryNumber: existing?.cola.colaRegistryNumber ?? '',
      brandName: existing?.cola.brandName ?? params.recipeName,
      classDesignation:
        existing?.cola.classDesignation ?? params.styleKey ?? params.assessment.classDesignation,
      labelerName: existing?.cola.labelerName ?? '',
    },
    planner: {
      beverageFamily: 'cider',
      carbonationMode: params.assessment.carbonationMode,
      carbonationTargetVolumes: params.carbonationTargetVolumes,
      interstateSale: params.interstateSale,
      hardCiderEligible: params.assessment.hardCiderEligible,
      formulaReviewRequired: params.assessment.formulaReviewRequired,
      labelAuthority: params.assessment.labelingAuthority,
      classificationReasons: params.assessment.reasons,
    },
    notes: params.assessment.findings.map((item) => `${item.severity.toUpperCase()}: ${item.title} - ${item.detail}`).join('\n'),
  };
};
