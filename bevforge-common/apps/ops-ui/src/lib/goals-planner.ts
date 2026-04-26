export type GoalsReviewPeriod = 'monthly' | 'quarterly' | 'annual';
export type GoalsLockMode = 'annual' | 'monthly';
export type GoalsPlanningMode = 'revenue-led' | 'coverage-led';
export type CapacityState = 'healthy' | 'caution' | 'over-cap';
export type GoalsTargetLock =
  | 'none'
  | 'wholesaleAccountsNeeded'
  | 'clubMembersNeeded'
  | 'monthlyCases'
  | 'monthlyTotalKegs'
  | 'monthlyHalfBblKegs'
  | 'monthlySixthBblKegs'
  | 'annualGallons';

export interface GoalsAssumptions {
  base4PackWholesale: number;
  premium4PackWholesale: number;
  baseHalfBblWholesale: number;
  baseSixthBblWholesale: number;
  premiumSixthBblWholesale: number;
  clubMonthlyFee: number;
  halfBblGallons: number;
  sixthBblGallons: number;
  cansPerGallon: number;
  cansPerCase: number;
  cansPer4Pack: number;
  avgMonthlyAccountRevenue: number;
  avgMonthlyKegsPerAccount: number;
  avgMonthlyHalfBblKegSharePct: number;
  avgMonthlySixthBblKegSharePct: number;
  avgQuarterlyAllocationPerMember: number;
  productionCapGallons: number;
  grossMarginPct: number;
}

export interface GoalsMix {
  wholesalePct: number;
  directPct: number;
  kegPct: number;
  canPct: number;
  basePct: number;
  premiumPct: number;
  halfBblPct: number;
  sixthBblPct: number;
  clubPct: number;
  wholesaleGeneralPct: number;
  onsiteDirectPct: number;
  marketRetailPct: number;
  eventSalesPct: number;
}

export interface GoalsStressTest {
  enabled: boolean;
  accountChurnPct: number;
  clubChurnPct: number;
  priceDropPct: number;
  productionLossPct: number;
}

export interface GoalsCoverageTargets {
  wholesaleAccounts: number;
  clubMembers: number;
}

export interface GoalsDerivedOutputs {
  revenue: {
    annualTarget: number;
    monthlyTarget: number;
    quarterlyTarget: number;
    wholesaleTarget: number;
    directTarget: number;
    clubTarget: number;
    directNonClubTarget: number;
    wholesaleKegTarget: number;
    wholesaleCanTarget: number;
    baseKegTarget: number;
    premiumKegTarget: number;
    baseCanTarget: number;
    premiumCanTarget: number;
  };
  units: {
    halfBblKegs: number;
    baseSixthBblKegs: number;
    premiumSixthBblKegs: number;
    totalSixthBblKegs: number;
    fourPacks: number;
    cans: number;
    cases: number;
    annualUnitsEstimate: number;
  };
  gallons: {
    halfBblGallons: number;
    sixthBblGallons: number;
    canGallons: number;
    annualGallons: number;
    monthlyGallons: number;
    quarterlyGallons: number;
  };
  targets: {
    wholesaleAccountsNeeded: number;
    clubMembersNeeded: number;
    monthlyHalfBblKegs: number;
    monthlySixthBblKegs: number;
    monthlyCases: number;
    monthlyRevenueTarget: number;
    quarterlyRevenueTarget: number;
  };
  channelBreakdown: Array<{ label: string; value: number; pct: number }>;
  packageBreakdown: Array<{
    label: string;
    units: number;
    gallons: number;
    revenue: number;
  }>;
  validations: {
    productionCapGallons: number;
    utilizationPct: number;
    overCapGallons: number;
    state: CapacityState;
    grossProfitEstimate: number;
    grossProfitGap: number;
  };
  stress: {
    enabled: boolean;
    stressedAnnualRevenue: number;
    revenueShortfall: number;
    stressedProductionCapGallons: number;
    stressedUtilizationPct: number;
    stressedOverCapGallons: number;
    additionalAccountsNeeded: number;
    additionalClubMembersNeeded: number;
    state: CapacityState;
  };
}

export interface GoalsScenario {
  id: string;
  name: string;
  planningMode: GoalsPlanningMode;
  goalLock: GoalsLockMode;
  targetLock: GoalsTargetLock;
  targetLockValue?: number;
  coverageTargets: GoalsCoverageTargets;
  reviewPeriod: GoalsReviewPeriod;
  annualRevenueGoal: number;
  monthlyRevenueGoal: number;
  annualUnitsGoal?: number;
  annualGrossProfitGoal?: number;
  mix: GoalsMix;
  assumptions: GoalsAssumptions;
  stress: GoalsStressTest;
  derived: GoalsDerivedOutputs;
  createdAt: string;
  updatedAt: string;
}

export interface GoalsScenarioInput
  extends Omit<GoalsScenario, 'derived' | 'createdAt' | 'updatedAt'> {
  createdAt?: string;
  updatedAt?: string;
}

export type NormalizedGoalsScenarioInput = GoalsScenarioInput & {
  createdAt: string;
  updatedAt: string;
};

const round = (value: number, places = 2): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const pct = (value: number): number => clamp(round(value, 2), 0, 100);

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const nowIso = (): string => new Date().toISOString();

const createScenarioId = (): string =>
  `goals-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const capacityStateFromUtilization = (utilizationPct: number): CapacityState => {
  if (utilizationPct > 100) return 'over-cap';
  if (utilizationPct >= 90) return 'caution';
  return 'healthy';
};

export const defaultGoalsAssumptions = (): GoalsAssumptions => ({
  base4PackWholesale: 11,
  premium4PackWholesale: 13,
  baseHalfBblWholesale: 155,
  baseSixthBblWholesale: 75,
  premiumSixthBblWholesale: 90,
  clubMonthlyFee: 15,
  halfBblGallons: 15.5,
  sixthBblGallons: 5.16,
  cansPerGallon: 8,
  cansPerCase: 24,
  cansPer4Pack: 4,
  avgMonthlyAccountRevenue: 4500,
  avgMonthlyKegsPerAccount: 4,
  avgMonthlyHalfBblKegSharePct: 25,
  avgMonthlySixthBblKegSharePct: 75,
  avgQuarterlyAllocationPerMember: 120,
  productionCapGallons: 10000,
  grossMarginPct: 45,
});

export const defaultGoalsMix = (): GoalsMix => ({
  wholesalePct: 60,
  directPct: 40,
  kegPct: 50,
  canPct: 50,
  basePct: 70,
  premiumPct: 30,
  halfBblPct: 45,
  sixthBblPct: 55,
  clubPct: 35,
  wholesaleGeneralPct: 65,
  onsiteDirectPct: 0,
  marketRetailPct: 0,
  eventSalesPct: 0,
});

export const defaultGoalsStress = (): GoalsStressTest => ({
  enabled: false,
  accountChurnPct: 20,
  clubChurnPct: 12,
  priceDropPct: 5,
  productionLossPct: 8,
});

const normalizeMix = (mixInput: Partial<GoalsMix> | undefined): GoalsMix => {
  const defaults = defaultGoalsMix();
  const wholesalePct = pct(toNumber(mixInput?.wholesalePct, defaults.wholesalePct));
  const kegPct = pct(toNumber(mixInput?.kegPct, defaults.kegPct));
  const basePct = pct(toNumber(mixInput?.basePct, defaults.basePct));
  const halfBblPct = pct(toNumber(mixInput?.halfBblPct, defaults.halfBblPct));
  const clubPct = pct(toNumber(mixInput?.clubPct, defaults.clubPct));

  return {
    wholesalePct,
    directPct: round(100 - wholesalePct, 2),
    kegPct,
    canPct: round(100 - kegPct, 2),
    basePct,
    premiumPct: round(100 - basePct, 2),
    halfBblPct,
    sixthBblPct: round(100 - halfBblPct, 2),
    clubPct,
    wholesaleGeneralPct: round(100 - clubPct, 2),
    onsiteDirectPct: pct(toNumber(mixInput?.onsiteDirectPct, defaults.onsiteDirectPct)),
    marketRetailPct: pct(
      toNumber(mixInput?.marketRetailPct, defaults.marketRetailPct)
    ),
    eventSalesPct: pct(toNumber(mixInput?.eventSalesPct, defaults.eventSalesPct)),
  };
};

const normalizeAssumptions = (
  assumptionsInput: Partial<GoalsAssumptions> | undefined
): GoalsAssumptions => {
  const defaults = defaultGoalsAssumptions();
  const halfSharePct = pct(
    toNumber(
      assumptionsInput?.avgMonthlyHalfBblKegSharePct,
      defaults.avgMonthlyHalfBblKegSharePct
    )
  );

  return {
    base4PackWholesale: round(
      clamp(
        toNumber(assumptionsInput?.base4PackWholesale, defaults.base4PackWholesale),
        0.01,
        10000
      )
    ),
    premium4PackWholesale: round(
      clamp(
        toNumber(
          assumptionsInput?.premium4PackWholesale,
          defaults.premium4PackWholesale
        ),
        0.01,
        10000
      )
    ),
    baseHalfBblWholesale: round(
      clamp(
        toNumber(
          assumptionsInput?.baseHalfBblWholesale,
          defaults.baseHalfBblWholesale
        ),
        0.01,
        100000
      )
    ),
    baseSixthBblWholesale: round(
      clamp(
        toNumber(
          assumptionsInput?.baseSixthBblWholesale,
          defaults.baseSixthBblWholesale
        ),
        0.01,
        100000
      )
    ),
    premiumSixthBblWholesale: round(
      clamp(
        toNumber(
          assumptionsInput?.premiumSixthBblWholesale,
          defaults.premiumSixthBblWholesale
        ),
        0.01,
        100000
      )
    ),
    clubMonthlyFee: round(
      clamp(toNumber(assumptionsInput?.clubMonthlyFee, defaults.clubMonthlyFee), 0.01, 5000)
    ),
    halfBblGallons: round(
      clamp(toNumber(assumptionsInput?.halfBblGallons, defaults.halfBblGallons), 0.1, 1000),
      4
    ),
    sixthBblGallons: round(
      clamp(toNumber(assumptionsInput?.sixthBblGallons, defaults.sixthBblGallons), 0.1, 1000),
      4
    ),
    cansPerGallon: round(
      clamp(toNumber(assumptionsInput?.cansPerGallon, defaults.cansPerGallon), 0.1, 1000),
      4
    ),
    cansPerCase: round(
      clamp(toNumber(assumptionsInput?.cansPerCase, defaults.cansPerCase), 1, 1000),
      2
    ),
    cansPer4Pack: round(
      clamp(toNumber(assumptionsInput?.cansPer4Pack, defaults.cansPer4Pack), 1, 1000),
      2
    ),
    avgMonthlyAccountRevenue: round(
      clamp(
        toNumber(
          assumptionsInput?.avgMonthlyAccountRevenue,
          defaults.avgMonthlyAccountRevenue
        ),
        0.01,
        1000000
      )
    ),
    avgMonthlyKegsPerAccount: round(
      clamp(
        toNumber(
          assumptionsInput?.avgMonthlyKegsPerAccount,
          defaults.avgMonthlyKegsPerAccount
        ),
        1,
        500
      ),
      2
    ),
    avgMonthlyHalfBblKegSharePct: halfSharePct,
    avgMonthlySixthBblKegSharePct: round(100 - halfSharePct, 2),
    avgQuarterlyAllocationPerMember: round(
      clamp(
        toNumber(
          assumptionsInput?.avgQuarterlyAllocationPerMember,
          defaults.avgQuarterlyAllocationPerMember
        ),
        0,
        100000
      ),
      2
    ),
    productionCapGallons: round(
      clamp(
        toNumber(assumptionsInput?.productionCapGallons, defaults.productionCapGallons),
        1,
        100000000
      ),
      2
    ),
    grossMarginPct: pct(toNumber(assumptionsInput?.grossMarginPct, defaults.grossMarginPct)),
  };
};

const normalizeStress = (
  stressInput: Partial<GoalsStressTest> | undefined
): GoalsStressTest => {
  const defaults = defaultGoalsStress();
  return {
    enabled: Boolean(stressInput?.enabled),
    accountChurnPct: pct(
      toNumber(stressInput?.accountChurnPct, defaults.accountChurnPct)
    ),
    clubChurnPct: pct(toNumber(stressInput?.clubChurnPct, defaults.clubChurnPct)),
    priceDropPct: pct(toNumber(stressInput?.priceDropPct, defaults.priceDropPct)),
    productionLossPct: pct(
      toNumber(stressInput?.productionLossPct, defaults.productionLossPct)
    ),
  };
};

const normalizeGoalMode = (value: unknown): GoalsLockMode =>
  value === 'monthly' ? 'monthly' : 'annual';

const normalizeTargetLock = (value: unknown): GoalsTargetLock => {
  switch (value) {
    case 'wholesaleAccountsNeeded':
    case 'clubMembersNeeded':
    case 'monthlyCases':
    case 'monthlyTotalKegs':
    case 'monthlyHalfBblKegs':
    case 'monthlySixthBblKegs':
    case 'annualGallons':
      return value;
    default:
      return 'none';
  }
};

const normalizeReviewPeriod = (value: unknown): GoalsReviewPeriod => {
  if (value === 'quarterly') return 'quarterly';
  if (value === 'annual') return 'annual';
  return 'monthly';
};

const normalizePlanningMode = (
  value: unknown,
  legacyTargetLock: GoalsTargetLock
): GoalsPlanningMode => {
  if (value === 'coverage-led') return 'coverage-led';
  if (value === 'revenue-led') return 'revenue-led';
  if (
    legacyTargetLock === 'wholesaleAccountsNeeded' ||
    legacyTargetLock === 'clubMembersNeeded'
  ) {
    return 'coverage-led';
  }
  return 'revenue-led';
};

const buildCoverageTargetsFromRevenue = (
  annualRevenueGoal: number,
  mix: GoalsMix,
  assumptions: GoalsAssumptions
): GoalsCoverageTargets => {
  const wholesaleTarget = (annualRevenueGoal * mix.wholesalePct) / 100;
  const directTarget = annualRevenueGoal - wholesaleTarget;
  const clubTarget = (directTarget * mix.clubPct) / 100;

  const wholesaleAccounts = round(
    clamp(wholesaleTarget / (assumptions.avgMonthlyAccountRevenue * 12), 0.01, 10000000),
    2
  );
  const clubMembers = round(
    clamp(clubTarget / (assumptions.clubMonthlyFee * 12), 0.01, 10000000),
    2
  );

  return { wholesaleAccounts, clubMembers };
};

const normalizeCoverageTargets = (
  coverageInput: Partial<GoalsCoverageTargets> | undefined,
  fallback: GoalsCoverageTargets
): GoalsCoverageTargets => ({
  wholesaleAccounts: round(
    clamp(toNumber(coverageInput?.wholesaleAccounts, fallback.wholesaleAccounts), 0.01, 10000000),
    2
  ),
  clubMembers: round(
    clamp(toNumber(coverageInput?.clubMembers, fallback.clubMembers), 0.01, 10000000),
    2
  ),
});

export const normalizeGoalsScenario = (
  input: Partial<GoalsScenarioInput>
): NormalizedGoalsScenarioInput => {
  const goalLock = normalizeGoalMode(input.goalLock);
  const targetLock = normalizeTargetLock(input.targetLock);
  const planningMode = normalizePlanningMode(input.planningMode, targetLock);
  const annualRevenueInput = toNumber(input.annualRevenueGoal, 120000);
  const monthlyRevenueInput = toNumber(input.monthlyRevenueGoal, annualRevenueInput / 12);
  const annualRevenueGoal =
    goalLock === 'monthly' ? monthlyRevenueInput * 12 : annualRevenueInput;
  const monthlyRevenueGoal =
    goalLock === 'monthly' ? monthlyRevenueInput : annualRevenueGoal / 12;
  const mix = normalizeMix(input.mix);
  const assumptions = normalizeAssumptions(input.assumptions);
  const fallbackCoverageTargets = buildCoverageTargetsFromRevenue(
    annualRevenueGoal,
    mix,
    assumptions
  );
  const coverageTargets = normalizeCoverageTargets(input.coverageTargets, {
    wholesaleAccounts:
      targetLock === 'wholesaleAccountsNeeded' && input.targetLockValue !== undefined
        ? input.targetLockValue
        : fallbackCoverageTargets.wholesaleAccounts,
    clubMembers:
      targetLock === 'clubMembersNeeded' && input.targetLockValue !== undefined
        ? input.targetLockValue
        : fallbackCoverageTargets.clubMembers,
  });

  return {
    id: typeof input.id === 'string' && input.id.trim() ? input.id : createScenarioId(),
    name: typeof input.name === 'string' && input.name.trim() ? input.name.trim() : 'Balanced Phase 1',
    planningMode,
    goalLock,
    targetLock,
    targetLockValue:
      targetLock === 'none'
        ? undefined
        : round(clamp(toNumber(input.targetLockValue, 0), 0.01, 1000000000), 2),
    coverageTargets,
    reviewPeriod: normalizeReviewPeriod(input.reviewPeriod),
    annualRevenueGoal: round(clamp(annualRevenueGoal, 1, 1000000000), 2),
    monthlyRevenueGoal: round(clamp(monthlyRevenueGoal, 0.01, 100000000), 2),
    annualUnitsGoal:
      input.annualUnitsGoal === undefined || input.annualUnitsGoal === null
        ? undefined
        : round(clamp(toNumber(input.annualUnitsGoal, 0), 0, 1000000000), 2),
    annualGrossProfitGoal:
      input.annualGrossProfitGoal === undefined || input.annualGrossProfitGoal === null
        ? undefined
        : round(clamp(toNumber(input.annualGrossProfitGoal, 0), 0, 1000000000), 2),
    mix,
    assumptions,
    stress: normalizeStress(input.stress),
    createdAt:
      typeof input.createdAt === 'string' && input.createdAt
        ? input.createdAt
        : nowIso(),
    updatedAt:
      typeof input.updatedAt === 'string' && input.updatedAt
        ? input.updatedAt
        : nowIso(),
  };
};

export const calculateGoalsDerivedOutputs = (
  scenario: NormalizedGoalsScenarioInput
): GoalsDerivedOutputs => {
  const annualGoal = round(scenario.annualRevenueGoal, 2);
  const monthlyGoal = round(annualGoal / 12, 2);
  const quarterlyGoal = round(annualGoal / 4, 2);

  const wholesaleTarget = round((annualGoal * scenario.mix.wholesalePct) / 100, 2);
  const directTarget = round(annualGoal - wholesaleTarget, 2);
  const clubTarget = round((directTarget * scenario.mix.clubPct) / 100, 2);
  const directNonClubTarget = round(directTarget - clubTarget, 2);

  const wholesaleKegTarget = round((wholesaleTarget * scenario.mix.kegPct) / 100, 2);
  const wholesaleCanTarget = round(wholesaleTarget - wholesaleKegTarget, 2);

  const baseKegTarget = round((wholesaleKegTarget * scenario.mix.basePct) / 100, 2);
  const premiumKegTarget = round(wholesaleKegTarget - baseKegTarget, 2);
  const baseCanTarget = round((wholesaleCanTarget * scenario.mix.basePct) / 100, 2);
  const premiumCanTarget = round(wholesaleCanTarget - baseCanTarget, 2);

  const baseHalfBblRevenue = round(
    (baseKegTarget * scenario.mix.halfBblPct) / 100,
    2
  );
  const baseSixthBblRevenue = round(baseKegTarget - baseHalfBblRevenue, 2);
  const premiumSixthBblRevenue = premiumKegTarget;

  const halfBblKegs = round(
    baseHalfBblRevenue / scenario.assumptions.baseHalfBblWholesale,
    3
  );
  const baseSixthBblKegs = round(
    baseSixthBblRevenue / scenario.assumptions.baseSixthBblWholesale,
    3
  );
  const premiumSixthBblKegs = round(
    premiumSixthBblRevenue / scenario.assumptions.premiumSixthBblWholesale,
    3
  );
  const totalSixthBblKegs = round(baseSixthBblKegs + premiumSixthBblKegs, 3);

  const base4Packs = round(
    baseCanTarget / scenario.assumptions.base4PackWholesale,
    2
  );
  const premium4Packs = round(
    premiumCanTarget / scenario.assumptions.premium4PackWholesale,
    2
  );
  const fourPacks = round(base4Packs + premium4Packs, 2);
  const cans = round(fourPacks * scenario.assumptions.cansPer4Pack, 2);
  const cases = round(cans / scenario.assumptions.cansPerCase, 2);

  const halfBblGallons = round(halfBblKegs * scenario.assumptions.halfBblGallons, 2);
  const sixthBblGallons = round(
    totalSixthBblKegs * scenario.assumptions.sixthBblGallons,
    2
  );
  const canGallons = round(cans / scenario.assumptions.cansPerGallon, 2);
  const annualGallons = round(halfBblGallons + sixthBblGallons + canGallons, 2);
  const monthlyGallons = round(annualGallons / 12, 2);
  const quarterlyGallons = round(annualGallons / 4, 2);

  const wholesaleAccountsByRevenue = round(
    wholesaleTarget / (scenario.assumptions.avgMonthlyAccountRevenue * 12),
    2
  );
  const monthlyHalfBblKegs = round(halfBblKegs / 12, 2);
  const monthlySixthBblKegs = round(totalSixthBblKegs / 12, 2);
  const accountHalfBblCapacity = Math.max(
    0.01,
    round(
      (scenario.assumptions.avgMonthlyKegsPerAccount *
        scenario.assumptions.avgMonthlyHalfBblKegSharePct) /
        100,
      2
    )
  );
  const accountSixthBblCapacity = Math.max(
    0.01,
    round(
      (scenario.assumptions.avgMonthlyKegsPerAccount *
        scenario.assumptions.avgMonthlySixthBblKegSharePct) /
        100,
      2
    )
  );
  const wholesaleAccountsByHalfBblLoad = round(
    monthlyHalfBblKegs / accountHalfBblCapacity,
    2
  );
  const wholesaleAccountsBySixthBblLoad = round(
    monthlySixthBblKegs / accountSixthBblCapacity,
    2
  );
  const wholesaleAccountsByKegVolume = round(
    Math.max(wholesaleAccountsByHalfBblLoad, wholesaleAccountsBySixthBblLoad),
    2
  );
  const wholesaleAccountsNeeded = round(
    Math.max(wholesaleAccountsByRevenue, wholesaleAccountsByKegVolume),
    2
  );
  const clubMembersNeeded = round(
    clubTarget / (scenario.assumptions.clubMonthlyFee * 12),
    2
  );

  const grossProfitEstimate = round(
    (annualGoal * scenario.assumptions.grossMarginPct) / 100,
    2
  );
  const grossProfitGap = round(
    (scenario.annualGrossProfitGoal ?? grossProfitEstimate) - grossProfitEstimate,
    2
  );

  const utilizationPct = round(
    (annualGallons / scenario.assumptions.productionCapGallons) * 100,
    2
  );
  const overCapGallons = round(
    Math.max(0, annualGallons - scenario.assumptions.productionCapGallons),
    2
  );
  const state = capacityStateFromUtilization(utilizationPct);

  const accountFactor = 1 - scenario.stress.accountChurnPct / 100;
  const clubFactor = 1 - scenario.stress.clubChurnPct / 100;
  const priceFactor = 1 - scenario.stress.priceDropPct / 100;
  const productionFactor = 1 - scenario.stress.productionLossPct / 100;

  const stressedWholesaleRevenue = round(wholesaleTarget * accountFactor * priceFactor, 2);
  const stressedDirectNonClubRevenue = round(directNonClubTarget * priceFactor, 2);
  const stressedClubRevenue = round(clubTarget * clubFactor, 2);
  const stressedAnnualRevenue = round(
    stressedWholesaleRevenue + stressedDirectNonClubRevenue + stressedClubRevenue,
    2
  );
  const revenueShortfall = round(Math.max(0, annualGoal - stressedAnnualRevenue), 2);
  const additionalAccountsNeeded = round(
    revenueShortfall / (scenario.assumptions.avgMonthlyAccountRevenue * 12),
    2
  );
  const additionalClubMembersNeeded = round(
    revenueShortfall / (scenario.assumptions.clubMonthlyFee * 12),
    2
  );

  const stressedProductionCapGallons = round(
    scenario.assumptions.productionCapGallons * productionFactor,
    2
  );
  const stressedUtilizationPct = round(
    (annualGallons / stressedProductionCapGallons) * 100,
    2
  );
  const stressedOverCapGallons = round(
    Math.max(0, annualGallons - stressedProductionCapGallons),
    2
  );
  const stressedState = capacityStateFromUtilization(stressedUtilizationPct);

  return {
    revenue: {
      annualTarget: annualGoal,
      monthlyTarget: monthlyGoal,
      quarterlyTarget: quarterlyGoal,
      wholesaleTarget,
      directTarget,
      clubTarget,
      directNonClubTarget,
      wholesaleKegTarget,
      wholesaleCanTarget,
      baseKegTarget,
      premiumKegTarget,
      baseCanTarget,
      premiumCanTarget,
    },
    units: {
      halfBblKegs,
      baseSixthBblKegs,
      premiumSixthBblKegs,
      totalSixthBblKegs,
      fourPacks,
      cans,
      cases,
      annualUnitsEstimate: round(halfBblKegs + totalSixthBblKegs + cases, 2),
    },
    gallons: {
      halfBblGallons,
      sixthBblGallons,
      canGallons,
      annualGallons,
      monthlyGallons,
      quarterlyGallons,
    },
    targets: {
      wholesaleAccountsNeeded,
      clubMembersNeeded,
      monthlyHalfBblKegs,
      monthlySixthBblKegs,
      monthlyCases: round(cases / 12, 2),
      monthlyRevenueTarget: monthlyGoal,
      quarterlyRevenueTarget: quarterlyGoal,
    },
    channelBreakdown: [
      { label: 'Wholesale', value: wholesaleTarget, pct: scenario.mix.wholesalePct },
      { label: 'Direct (non-club)', value: directNonClubTarget, pct: scenario.mix.directPct - scenario.mix.clubPct * (scenario.mix.directPct / 100) },
      { label: 'Club', value: clubTarget, pct: round((clubTarget / annualGoal) * 100, 2) },
    ],
    packageBreakdown: [
      {
        label: '1/2 bbl Kegs',
        units: halfBblKegs,
        gallons: halfBblGallons,
        revenue: baseHalfBblRevenue,
      },
      {
        label: '1/6 bbl Kegs',
        units: totalSixthBblKegs,
        gallons: sixthBblGallons,
        revenue: round(baseSixthBblRevenue + premiumSixthBblRevenue, 2),
      },
      {
        label: 'Cases (from 4-packs)',
        units: cases,
        gallons: canGallons,
        revenue: round(baseCanTarget + premiumCanTarget, 2),
      },
    ],
    validations: {
      productionCapGallons: scenario.assumptions.productionCapGallons,
      utilizationPct,
      overCapGallons,
      state,
      grossProfitEstimate,
      grossProfitGap,
    },
    stress: {
      enabled: scenario.stress.enabled,
      stressedAnnualRevenue,
      revenueShortfall,
      stressedProductionCapGallons,
      stressedUtilizationPct,
      stressedOverCapGallons,
      additionalAccountsNeeded,
      additionalClubMembersNeeded,
      state: stressedState,
    },
  };
};

const solveRevenueLed = (
  scenario: NormalizedGoalsScenarioInput
): NormalizedGoalsScenarioInput => {
  const annualRevenueGoal =
    scenario.goalLock === 'monthly'
      ? scenario.monthlyRevenueGoal * 12
      : scenario.annualRevenueGoal;
  const monthlyRevenueGoal =
    scenario.goalLock === 'monthly'
      ? scenario.monthlyRevenueGoal
      : annualRevenueGoal / 12;

  return {
    ...scenario,
    annualRevenueGoal: round(clamp(annualRevenueGoal, 1, 1000000000), 2),
    monthlyRevenueGoal: round(clamp(monthlyRevenueGoal, 0.01, 100000000), 2),
    coverageTargets: buildCoverageTargetsFromRevenue(
      annualRevenueGoal,
      scenario.mix,
      scenario.assumptions
    ),
    targetLock: 'none',
    targetLockValue: undefined,
  };
};

const solveCoverageLed = (
  scenario: NormalizedGoalsScenarioInput
): NormalizedGoalsScenarioInput => {
  const wholesaleAnnualRevenue =
    scenario.coverageTargets.wholesaleAccounts *
    scenario.assumptions.avgMonthlyAccountRevenue *
    12;
  const clubAnnualRevenue =
    scenario.coverageTargets.clubMembers * scenario.assumptions.clubMonthlyFee * 12;

  const wholesaleShare = Math.max(0.0001, scenario.mix.wholesalePct / 100);
  const clubShareOfAnnual = Math.max(
    0.0001,
    (scenario.mix.directPct / 100) * (scenario.mix.clubPct / 100)
  );

  const annualFromWholesale = wholesaleAnnualRevenue / wholesaleShare;
  const annualFromClub = clubAnnualRevenue / clubShareOfAnnual;
  const annualRevenueGoal = round(
    clamp(Math.max(annualFromWholesale, annualFromClub, 1), 1, 1000000000),
    2
  );

  return {
    ...scenario,
    goalLock: 'annual',
    annualRevenueGoal,
    monthlyRevenueGoal: round(annualRevenueGoal / 12, 2),
    targetLock: 'none',
    targetLockValue: undefined,
  };
};

const applyPlanningModeSolve = (
  scenario: NormalizedGoalsScenarioInput
): NormalizedGoalsScenarioInput =>
  scenario.planningMode === 'coverage-led'
    ? solveCoverageLed(scenario)
    : solveRevenueLed(scenario);

export const recalculateGoalsScenario = (
  input: Partial<GoalsScenarioInput>
): GoalsScenario => {
  const normalized = normalizeGoalsScenario(input);
  const solved = applyPlanningModeSolve(normalized);
  const derived = calculateGoalsDerivedOutputs(solved);
  return {
    ...solved,
    derived,
  };
};

export const createDefaultGoalsScenario = (
  name = 'Balanced Phase 1'
): GoalsScenario =>
  recalculateGoalsScenario({
    id: createScenarioId(),
    name,
    goalLock: 'annual',
    targetLock: 'none',
    reviewPeriod: 'monthly',
    annualRevenueGoal: 120000,
    monthlyRevenueGoal: 10000,
    mix: defaultGoalsMix(),
    assumptions: defaultGoalsAssumptions(),
    stress: defaultGoalsStress(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
