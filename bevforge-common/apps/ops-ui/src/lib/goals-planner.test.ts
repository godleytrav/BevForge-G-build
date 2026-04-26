import { describe, expect, it } from 'vitest';
import {
  createDefaultGoalsScenario,
  recalculateGoalsScenario,
} from './goals-planner';

describe('goals-planner', () => {
  it('keeps paired percentages aligned to 100', () => {
    const scenario = recalculateGoalsScenario({
      ...createDefaultGoalsScenario('Pairing Test'),
      mix: {
        ...createDefaultGoalsScenario().mix,
        wholesalePct: 72,
        kegPct: 61,
        basePct: 83,
        halfBblPct: 22,
        clubPct: 44,
      },
    });

    expect(scenario.mix.wholesalePct + scenario.mix.directPct).toBe(100);
    expect(scenario.mix.kegPct + scenario.mix.canPct).toBe(100);
    expect(scenario.mix.basePct + scenario.mix.premiumPct).toBe(100);
    expect(scenario.mix.halfBblPct + scenario.mix.sixthBblPct).toBe(100);
    expect(scenario.mix.clubPct + scenario.mix.wholesaleGeneralPct).toBe(100);
  });

  it('flags over-cap utilization and computes stress shortfall', () => {
    const scenario = recalculateGoalsScenario({
      ...createDefaultGoalsScenario('Capacity Test'),
      annualRevenueGoal: 500000,
      assumptions: {
        ...createDefaultGoalsScenario().assumptions,
        productionCapGallons: 1200,
      },
      stress: {
        enabled: true,
        accountChurnPct: 20,
        clubChurnPct: 10,
        priceDropPct: 5,
        productionLossPct: 20,
      },
    });

    expect(scenario.derived.validations.state).toBe('over-cap');
    expect(scenario.derived.validations.overCapGallons).toBeGreaterThan(0);
    expect(scenario.derived.stress.revenueShortfall).toBeGreaterThan(0);
    expect(scenario.derived.stress.stressedProductionCapGallons).toBeLessThan(
      scenario.assumptions.productionCapGallons
    );
  });

  it('uses keg-per-account guardrail for wholesale account targets', () => {
    const defaults = createDefaultGoalsScenario('Account Guard Test');
    const scenario = recalculateGoalsScenario({
      ...defaults,
      assumptions: {
        ...defaults.assumptions,
        avgMonthlyAccountRevenue: 10000,
        avgMonthlyKegsPerAccount: 4,
      },
      mix: {
        ...defaults.mix,
        wholesalePct: 75,
        kegPct: 80,
      },
    });

    const revenueOnlyAccounts = (scenario.derived.revenue.wholesaleTarget / 12) / 10000;
    expect(scenario.derived.targets.wholesaleAccountsNeeded).toBeGreaterThan(revenueOnlyAccounts);
    expect(scenario.derived.targets.monthlyHalfBblKegs + scenario.derived.targets.monthlySixthBblKegs).toBeGreaterThan(0);
  });

  it('responds to account keg-type split for capacity planning', () => {
    const defaults = createDefaultGoalsScenario('Keg Split Test');
    const sixthHeavyDemand = {
      ...defaults,
      mix: {
        ...defaults.mix,
        wholesalePct: 80,
        kegPct: 85,
        halfBblPct: 10,
      },
      assumptions: {
        ...defaults.assumptions,
        avgMonthlyKegsPerAccount: 4,
      },
    };

    const halfLightCapacity = recalculateGoalsScenario({
      ...sixthHeavyDemand,
      assumptions: {
        ...sixthHeavyDemand.assumptions,
        avgMonthlyHalfBblKegSharePct: 20,
      },
    });

    const halfMatchedCapacity = recalculateGoalsScenario({
      ...sixthHeavyDemand,
      assumptions: {
        ...sixthHeavyDemand.assumptions,
        avgMonthlyHalfBblKegSharePct: 80,
      },
    });

    expect(halfLightCapacity.assumptions.avgMonthlySixthBblKegSharePct).toBe(80);
    expect(halfMatchedCapacity.assumptions.avgMonthlySixthBblKegSharePct).toBe(20);
    expect(halfLightCapacity.derived.targets.wholesaleAccountsNeeded).toBeLessThan(
      halfMatchedCapacity.derived.targets.wholesaleAccountsNeeded
    );
  });

  it('keeps coverage targets in sync from revenue in revenue-led mode', () => {
    const baseline = createDefaultGoalsScenario('Revenue-Led Sync Test');
    const solved = recalculateGoalsScenario({
      ...baseline,
      planningMode: 'revenue-led',
      annualRevenueGoal: 240000,
      goalLock: 'annual',
    });

    expect(solved.coverageTargets.wholesaleAccounts).toBeGreaterThan(
      baseline.coverageTargets.wholesaleAccounts
    );
    expect(solved.coverageTargets.clubMembers).toBeGreaterThan(
      baseline.coverageTargets.clubMembers
    );
  });

  it('solves annual revenue from coverage inputs in coverage-led mode', () => {
    const baseline = createDefaultGoalsScenario('Coverage-Led Solve Test');
    const solved = recalculateGoalsScenario({
      ...baseline,
      planningMode: 'coverage-led',
      coverageTargets: {
        ...baseline.coverageTargets,
        wholesaleAccounts: Math.round(baseline.coverageTargets.wholesaleAccounts * 2),
      },
    });

    expect(solved.annualRevenueGoal).toBeGreaterThan(baseline.annualRevenueGoal);
    expect(solved.monthlyRevenueGoal).toBeCloseTo(solved.annualRevenueGoal / 12, 2);
    expect(solved.derived.targets.wholesaleAccountsNeeded).toBeGreaterThanOrEqual(
      solved.coverageTargets.wholesaleAccounts - 0.5
    );
  });

  it('coverage-led demand increases package volume when account targets rise', () => {
    const baseline = createDefaultGoalsScenario('Coverage-Led Demand Test');
    const higherCoverage = recalculateGoalsScenario({
      ...baseline,
      planningMode: 'coverage-led',
      coverageTargets: {
        wholesaleAccounts: baseline.coverageTargets.wholesaleAccounts * 1.5,
        clubMembers: baseline.coverageTargets.clubMembers * 1.5,
      },
    });

    const baselineMonthlyKegs =
      baseline.derived.targets.monthlyHalfBblKegs +
      baseline.derived.targets.monthlySixthBblKegs;
    const higherMonthlyKegs =
      higherCoverage.derived.targets.monthlyHalfBblKegs +
      higherCoverage.derived.targets.monthlySixthBblKegs;

    expect(higherMonthlyKegs).toBeGreaterThan(baselineMonthlyKegs);
    expect(higherCoverage.derived.targets.monthlyCases).toBeGreaterThan(
      baseline.derived.targets.monthlyCases
    );
  });
});
