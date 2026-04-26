import { formatTemperatureWithUnit, type TemperatureUnit } from '@/lib/os-display';

export type ProductionReadinessTone = 'ready' | 'warning' | 'info';

export interface BatchActualResultsLike {
  og?: number;
  fg?: number;
  sgLatest?: number;
  abvPct?: number;
  phLatest?: number;
  brixLatest?: number;
  titratableAcidityGplLatest?: number;
  so2PpmLatest?: number;
  temperatureCLatest?: number;
  finalLabAbvPct?: number;
  finalLabPh?: number;
  finalLabResidualSugarGpl?: number;
  finalLabTitratableAcidityGpl?: number;
  finalLabFreeSo2Ppm?: number;
  finalLabTotalSo2Ppm?: number;
  finalVolumeQty?: number;
  finalVolumeUnit?: string;
}

export interface ProductSnapshotLike {
  productId?: string;
  productCode?: string;
  productName?: string;
  labelAssetId?: string;
  labelVersionId?: string;
  beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
}

export interface ComplianceSnapshotLike {
  beverageClass?: 'cider' | 'wine' | 'beer' | 'other';
  brandName?: string;
  productName?: string;
  classDesignation?: string;
  taxClass?: 'hard_cider' | 'still_wine' | 'sparkling_wine' | 'beer' | 'other';
  colaReference?: string;
  formulaReference?: string;
  abvPct?: number | string;
  netContentsStatement?: string;
  appellation?: string;
  vintageYear?: string;
  sulfiteDeclaration?: string;
  healthWarningIncluded?: boolean;
  interstateSale?: boolean;
  formulaRequired?: boolean;
  fdaLabelReviewComplete?: boolean;
  ingredientStatementReviewed?: boolean;
  allergenReviewComplete?: boolean;
  hardCiderQualified?: boolean;
}

export interface ReadinessItem {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
  detail: string;
}

const hasText = (value: unknown): boolean => String(value ?? '').trim().length > 0;

const hasFiniteNumber = (value: unknown): boolean => Number.isFinite(Number(value));

const alcoholAbvKnown = (value: unknown): boolean => hasFiniteNumber(value) && Number(value) >= 0.5;

export const getBatchOperationalReadiness = (params: {
  batchStatus?: string;
  productSnapshot?: ProductSnapshotLike;
  actualResults?: BatchActualResultsLike;
  recipeRunId?: string;
  packageLotCount?: number;
  temperatureUnit?: TemperatureUnit;
}) => {
  const {
    batchStatus,
    productSnapshot,
    actualResults,
    recipeRunId,
    packageLotCount = 0,
    temperatureUnit = 'C',
  } = params;
  const releasedOrPackaged =
    batchStatus === 'completed' || batchStatus === 'released' || packageLotCount > 0;
  const finalLabReady =
    hasFiniteNumber(actualResults?.finalLabAbvPct) &&
    hasFiniteNumber(actualResults?.finalLabPh) &&
    hasFiniteNumber(actualResults?.finalLabResidualSugarGpl) &&
    hasFiniteNumber(actualResults?.finalLabTitratableAcidityGpl) &&
    hasFiniteNumber(actualResults?.finalLabFreeSo2Ppm) &&
    hasFiniteNumber(actualResults?.finalLabTotalSo2Ppm);
  const isCiderOrWine =
    productSnapshot?.beverageClass === 'cider' || productSnapshot?.beverageClass === 'wine';

  const items: ReadinessItem[] = [
    {
      key: 'product',
      label: 'Product identity linked',
      ok: hasText(productSnapshot?.productCode) || hasText(productSnapshot?.productId),
      required: true,
      detail: hasText(productSnapshot?.productCode)
        ? String(productSnapshot?.productCode)
        : 'Add a product code/name before packaging and release.',
    },
    {
      key: 'og',
      label: 'Original gravity logged',
      ok: hasFiniteNumber(actualResults?.og),
      required: true,
      detail: hasFiniteNumber(actualResults?.og)
        ? `OG ${Number(actualResults?.og).toFixed(3)}`
        : 'Record OG for source-batch traceability.',
    },
    {
      key: 'sg',
      label: 'Current gravity logged',
      ok: hasFiniteNumber(actualResults?.sgLatest) || hasFiniteNumber(actualResults?.fg),
      required: true,
      detail: hasFiniteNumber(actualResults?.fg)
        ? `FG ${Number(actualResults?.fg).toFixed(3)}`
        : hasFiniteNumber(actualResults?.sgLatest)
          ? `Current SG ${Number(actualResults?.sgLatest).toFixed(3)}`
          : 'Record current SG/FG from Tilt or manual reading.',
    },
    {
      key: 'temperature',
      label: 'Cellar temperature logged',
      ok: hasFiniteNumber(actualResults?.temperatureCLatest),
      required: true,
      detail: hasFiniteNumber(actualResults?.temperatureCLatest)
        ? formatTemperatureWithUnit(Number(actualResults?.temperatureCLatest), temperatureUnit, 1)
        : 'Capture fermentation/cellar temperature.',
    },
    {
      key: 'ph',
      label: 'pH captured',
      ok: hasFiniteNumber(actualResults?.phLatest),
      required: false,
      detail: hasFiniteNumber(actualResults?.phLatest)
        ? `pH ${Number(actualResults?.phLatest).toFixed(2)}`
        : 'Recommended for cider QA and cellar records.',
    },
    {
      key: 'brix',
      label: 'Brix captured',
      ok: !isCiderOrWine || hasFiniteNumber(actualResults?.brixLatest),
      required: false,
      detail:
        !isCiderOrWine
          ? 'Optional for this beverage class.'
          : hasFiniteNumber(actualResults?.brixLatest)
            ? `${Number(actualResults?.brixLatest).toFixed(2)} Bx`
            : 'Recommended for cider/wine intake and cellar records.',
    },
    {
      key: 'ta',
      label: 'Titratable acidity captured',
      ok: !isCiderOrWine || hasFiniteNumber(actualResults?.titratableAcidityGplLatest),
      required: false,
      detail:
        !isCiderOrWine
          ? 'Optional for this beverage class.'
          : hasFiniteNumber(actualResults?.titratableAcidityGplLatest)
            ? `${Number(actualResults?.titratableAcidityGplLatest).toFixed(2)} g/L`
            : 'Recommended for cider/wine cellar balancing records.',
    },
    {
      key: 'so2',
      label: 'SO2 / sulfite logged',
      ok: !isCiderOrWine || hasFiniteNumber(actualResults?.so2PpmLatest),
      required: false,
      detail:
        !isCiderOrWine
          ? 'Optional for this beverage class.'
          : hasFiniteNumber(actualResults?.so2PpmLatest)
            ? `${Number(actualResults?.so2PpmLatest).toFixed(0)} ppm`
            : 'Log whenever sulfite additions or checks are part of the process.',
    },
    {
      key: 'abv',
      label: 'Final ABV established',
      ok: hasFiniteNumber(actualResults?.abvPct),
      required: releasedOrPackaged,
      detail: hasFiniteNumber(actualResults?.abvPct)
        ? `${Number(actualResults?.abvPct).toFixed(2)}%`
        : releasedOrPackaged
          ? 'Set FG/ABV before release and packaging sign-off.'
          : 'Can be finalized later in fermentation.',
    },
    {
      key: 'finalLab',
      label: 'Final lab panel recorded',
      ok: !releasedOrPackaged || finalLabReady,
      required: releasedOrPackaged,
      detail: !releasedOrPackaged
        ? 'Can be recorded closer to packaging or release.'
        : finalLabReady
          ? 'Final release lab values are recorded.'
          : 'Record final ABV, pH, RS, TA, and free/total SO2 before completion or release.',
    },
    {
      key: 'packageLots',
      label: 'Package lot created',
      ok: packageLotCount > 0,
      required: batchStatus === 'released',
      detail:
        packageLotCount > 0
          ? `${packageLotCount} linked lot${packageLotCount === 1 ? '' : 's'}`
          : 'No package lots yet.',
    },
    {
      key: 'runLink',
      label: 'Runboard linked',
      ok: hasText(recipeRunId),
      required: false,
      detail: hasText(recipeRunId)
        ? 'Automation/manual run history attached.'
        : 'Manual batches are okay without a linked run.',
    },
  ];

  const requiredItems = items.filter((item) => item.required);
  const requiredPassCount = requiredItems.filter((item) => item.ok).length;
  const overallTone: ProductionReadinessTone =
    requiredItems.every((item) => item.ok)
      ? 'ready'
      : requiredPassCount >= Math.max(1, requiredItems.length - 1)
        ? 'warning'
        : 'info';

  return {
    items,
    requiredPassCount,
    requiredTotal: requiredItems.length,
    overallTone,
  };
};

export const getComplianceSnapshotReadiness = (
  compliance: ComplianceSnapshotLike
) => {
  const beverageClass = compliance.beverageClass ?? 'other';
  const abvKnown = alcoholAbvKnown(compliance.abvPct);
  const isCiderOrWine = beverageClass === 'cider' || beverageClass === 'wine';
  const abv = hasFiniteNumber(compliance.abvPct) ? Number(compliance.abvPct) : undefined;
  const underSevenAlcohol = isCiderOrWine && Number(abv ?? 0) > 0 && Number(abv ?? 0) < 7;
  const colaPath = isCiderOrWine && Number(abv ?? 0) >= 7 && compliance.interstateSale === true;
  const hardCiderPath = beverageClass === 'cider' && compliance.taxClass === 'hard_cider';

  const items: ReadinessItem[] = [
    {
      key: 'productName',
      label: 'Product name',
      ok: hasText(compliance.productName),
      required: true,
      detail: hasText(compliance.productName)
        ? String(compliance.productName)
        : 'Enter the packaged product name.',
    },
    {
      key: 'brandName',
      label: 'Brand / producer name',
      ok: hasText(compliance.brandName),
      required: true,
      detail: hasText(compliance.brandName)
        ? String(compliance.brandName)
        : 'Enter the producer or brand shown on package.',
    },
    {
      key: 'beverageClass',
      label: 'Beverage class',
      ok:
        compliance.beverageClass === 'cider' ||
        compliance.beverageClass === 'wine' ||
        compliance.beverageClass === 'beer' ||
        compliance.beverageClass === 'other',
      required: true,
      detail:
        compliance.beverageClass === 'cider' ||
        compliance.beverageClass === 'wine' ||
        compliance.beverageClass === 'beer' ||
        compliance.beverageClass === 'other'
          ? String(compliance.beverageClass)
          : 'Select the beverage class carried by this package snapshot.',
    },
    {
      key: 'abv',
      label: 'ABV',
      ok: hasFiniteNumber(compliance.abvPct),
      required: true,
      detail: hasFiniteNumber(compliance.abvPct)
        ? `${Number(compliance.abvPct).toFixed(2)}%`
        : 'Enter labeled ABV for package-lot traceability.',
    },
    {
      key: 'netContents',
      label: 'Net contents statement',
      ok: hasText(compliance.netContentsStatement),
      required: true,
      detail: hasText(compliance.netContentsStatement)
        ? String(compliance.netContentsStatement)
        : 'Set the labeled package size statement.',
    },
    {
      key: 'classDesignation',
      label: 'Label designation',
      ok: hasText(compliance.classDesignation),
      required: false,
      detail: hasText(compliance.classDesignation)
        ? String(compliance.classDesignation)
        : 'Optional wording such as cider, hard cider, beer, or wine designation.',
    },
    {
      key: 'taxClass',
      label: 'Tax class reviewed',
      ok:
        compliance.taxClass === 'hard_cider' ||
        compliance.taxClass === 'still_wine' ||
        compliance.taxClass === 'sparkling_wine' ||
        compliance.taxClass === 'beer' ||
        compliance.taxClass === 'other',
      required: false,
      detail:
        compliance.taxClass === 'hard_cider' ||
        compliance.taxClass === 'still_wine' ||
        compliance.taxClass === 'sparkling_wine' ||
        compliance.taxClass === 'beer' ||
        compliance.taxClass === 'other'
          ? String(compliance.taxClass).replaceAll('_', ' ')
          : 'Recommended so removals and tax reports do not rely only on inference.',
    },
    {
      key: 'healthWarning',
      label: 'Health warning acknowledged',
      ok: compliance.healthWarningIncluded === true,
      required: abvKnown,
      detail:
        compliance.healthWarningIncluded === true
          ? 'Marked included.'
          : abvKnown
            ? 'Alcohol products need the health warning statement.'
            : 'Set once final ABV is known.',
    },
    {
      key: 'sulfite',
      label: 'Sulfite declaration reviewed',
      ok: !isCiderOrWine || hasText(compliance.sulfiteDeclaration),
      required: false,
      detail:
        !isCiderOrWine
          ? 'Not typically used for this beverage class.'
          : hasText(compliance.sulfiteDeclaration)
            ? String(compliance.sulfiteDeclaration)
            : 'Review whether sulfite declaration applies for this lot.',
    },
    {
      key: 'interstateSale',
      label: 'Interstate sale path reviewed',
      ok: compliance.interstateSale === true || compliance.interstateSale === false,
      required: false,
      detail:
        compliance.interstateSale === true
          ? 'Marked for interstate sale.'
          : compliance.interstateSale === false
            ? 'Intrastate / local path only.'
            : 'Recommended so OS can guide COLA and release review correctly.',
    },
    {
      key: 'colaReference',
      label: 'COLA reference captured when required',
      ok: !colaPath || hasText(compliance.colaReference),
      required: false,
      detail:
        !colaPath
          ? 'Not currently required on this package path.'
          : hasText(compliance.colaReference)
            ? String(compliance.colaReference)
            : 'Review COLA only when this lot is on the interstate 7%+ cider/wine path.',
    },
    {
      key: 'formulaReference',
      label: 'Formula reference captured when required',
      ok: compliance.formulaRequired !== true || hasText(compliance.formulaReference),
      required: false,
      detail:
        compliance.formulaRequired !== true
          ? 'No formula requirement flagged on this package lot.'
          : hasText(compliance.formulaReference)
            ? String(compliance.formulaReference)
            : 'Review formula reference only when this lot is actually formula-required.',
    },
    {
      key: 'fdaLabel',
      label: 'FDA label review completed',
      ok: !underSevenAlcohol || compliance.fdaLabelReviewComplete === true,
      required: false,
      detail:
        !underSevenAlcohol
          ? 'Not the primary path for this package lot.'
          : compliance.fdaLabelReviewComplete === true
            ? 'Marked reviewed.'
            : 'Review when this lot is following the under-7% FDA label path.',
    },
    {
      key: 'ingredientStatement',
      label: 'Ingredient statement reviewed',
      ok: !underSevenAlcohol || compliance.ingredientStatementReviewed === true,
      required: false,
      detail:
        !underSevenAlcohol
          ? 'Not the primary path for this package lot.'
          : compliance.ingredientStatementReviewed === true
            ? 'Marked reviewed.'
            : 'Review ingredient statement for the FDA label path.',
    },
    {
      key: 'allergen',
      label: 'Allergen review completed',
      ok: !underSevenAlcohol || compliance.allergenReviewComplete === true,
      required: false,
      detail:
        !underSevenAlcohol
          ? 'Optional for this package path.'
          : compliance.allergenReviewComplete === true
            ? 'Marked reviewed.'
            : 'Review allergen handling where applicable.',
    },
    {
      key: 'hardCiderQualified',
      label: 'Hard cider qualification reviewed',
      ok: !hardCiderPath || compliance.hardCiderQualified === true,
      required: false,
      detail:
        !hardCiderPath
          ? 'Not using the hard cider tax class.'
          : compliance.hardCiderQualified === true
            ? 'Marked as reviewed for hard cider treatment.'
            : 'Review hard cider eligibility before trusting this tax class.',
    },
  ];

  const requiredItems = items.filter((item) => item.required);
  const requiredPassCount = requiredItems.filter((item) => item.ok).length;
  const overallTone: ProductionReadinessTone =
    requiredItems.every((item) => item.ok)
      ? 'ready'
      : requiredPassCount >= Math.max(1, requiredItems.length - 1)
        ? 'warning'
        : 'info';

  return {
    items,
    requiredPassCount,
    requiredTotal: requiredItems.length,
    overallTone,
  };
};
