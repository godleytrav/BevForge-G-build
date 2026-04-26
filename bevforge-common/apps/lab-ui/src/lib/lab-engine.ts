import type {
  CatalogIngredient,
  ClassDesignation,
  CloneCandidate,
  ComputeProposalInput,
  ComputeProposalOutput,
  DescriptorCategory,
  DescriptorLibrary,
  DescriptorOption,
  FermentationStep,
  InventoryLot,
  MashStep,
  ProposalHopFamily,
  ProposalIngredient,
  ProposalOutput,
  SimilarMatch,
  TargetBlock,
  RangeValue,
  ManualPredictionOutput,
} from './lab-types';
import {
  resolveCatalogColorSrm,
  resolveCatalogHopAlpha,
  resolveCatalogPpg,
  resolveCatalogYeastAttenuation,
} from './seed-catalog';
import type { YamlObject, YamlValue } from './yaml-lite';

type CatalogType = 'malt' | 'hop' | 'yeast' | 'adjunct';

const asObject = (value: YamlValue | undefined): YamlObject => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as YamlObject;
};

const asArray = (value: YamlValue | undefined): YamlValue[] => {
  if (!Array.isArray(value)) return [];
  return value;
};

const asString = (value: YamlValue | undefined, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const asNumber = (value: YamlValue | undefined, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback;
};

const deepCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toRange = (value: YamlValue | undefined, fallbackMin: number, fallbackMax: number): RangeValue => {
  const object = asObject(value);
  const min = asNumber(object.min, fallbackMin);
  const max = asNumber(object.max, fallbackMax);
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};

export const normalizeDescriptorLibrary = (raw: YamlObject): DescriptorLibrary => {
  const defaults = asObject(raw.defaults);
  const defaultsProposal = asObject(defaults.proposal);
  const defaultsTargets = asObject(defaults.targets);

  const categoriesRaw = asObject(raw.categories);
  const categories: Record<string, DescriptorCategory> = {};

  Object.entries(categoriesRaw).forEach(([categoryKey, categoryValue]) => {
    const categoryObj = asObject(categoryValue);
    const groupsRaw = asArray(categoryObj.groups);
    const groups = groupsRaw.map((groupValue) => {
      const groupObj = asObject(groupValue);
      const optionsRaw = asArray(groupObj.options);
      const options: DescriptorOption[] = optionsRaw.map((optionValue) => {
        const optionObj = asObject(optionValue);
        const excludes = asArray(optionObj.excludes).map((excludeValue) => {
          const excludeObj = asObject(excludeValue);
          return {
            key: asString(excludeObj.key),
            reason: asString(excludeObj.reason),
          };
        });

        const biasesObj = asObject(optionObj.biases);
        const biasesTargets = asObject(biasesObj.targets);
        const normalizedBiasTargets: Record<string, Partial<RangeValue>> = {};
        Object.entries(biasesTargets).forEach(([metric, metricValue]) => {
          const metricObj = asObject(metricValue);
          normalizedBiasTargets[metric] = {
            min: metricObj.min !== undefined ? asNumber(metricObj.min) : undefined,
            max: metricObj.max !== undefined ? asNumber(metricObj.max) : undefined,
          };
        });

        const proposalObj = asObject(optionObj.proposal);
        const specialties = asArray(asObject(proposalObj).specialties).map((specValue) => {
          const specObj = asObject(specValue);
          return {
            key: asString(specObj.key),
            name: asString(specObj.name, asString(specObj.key)),
            percent: asNumber(specObj.percent),
            cap: asNumber(specObj.cap, asNumber(specObj.percent)),
            ppg: specObj.ppg !== undefined ? asNumber(specObj.ppg) : undefined,
            color_srm: specObj.color_srm !== undefined ? asNumber(specObj.color_srm) : undefined,
          };
        });

        const baseMaltObj = asObject(proposalObj.base_malt);
        const hopFamilyObj = asObject(proposalObj.hop_family);
        const yeastFamilyObj = asObject(proposalObj.yeast_family);

        return {
          key: asString(optionObj.key),
          label: asString(optionObj.label, asString(optionObj.key)),
          biases: {
            targets: normalizedBiasTargets,
            mash_temp_c: biasesObj.mash_temp_c !== undefined ? asNumber(biasesObj.mash_temp_c) : undefined,
            water_bias: biasesObj.water_bias !== undefined ? asString(biasesObj.water_bias) : undefined,
            attenuation: biasesObj.attenuation !== undefined ? asNumber(biasesObj.attenuation) : undefined,
          },
          proposal: {
            base_malt:
              Object.keys(baseMaltObj).length > 0
                ? {
                    name: asString(baseMaltObj.name),
                    percent: asNumber(baseMaltObj.percent),
                    ppg: asNumber(baseMaltObj.ppg),
                    color_srm: asNumber(baseMaltObj.color_srm),
                    priority:
                      baseMaltObj.priority !== undefined ? asNumber(baseMaltObj.priority) : undefined,
                  }
                : undefined,
            specialties,
            hop_family:
              Object.keys(hopFamilyObj).length > 0
                ? {
                    key: asString(hopFamilyObj.key),
                    label: asString(hopFamilyObj.label),
                    variety: asString(hopFamilyObj.variety),
                    alpha_acid: asNumber(hopFamilyObj.alpha_acid, 0.07),
                  }
                : undefined,
            yeast_family:
              Object.keys(yeastFamilyObj).length > 0
                ? {
                    key: asString(yeastFamilyObj.key),
                    name: asString(yeastFamilyObj.name),
                    attenuation_shift:
                      yeastFamilyObj.attenuation_shift !== undefined
                        ? asNumber(yeastFamilyObj.attenuation_shift)
                        : undefined,
                    temp_c: yeastFamilyObj.temp_c !== undefined ? asNumber(yeastFamilyObj.temp_c) : undefined,
                    duration_days:
                      yeastFamilyObj.duration_days !== undefined
                        ? asNumber(yeastFamilyObj.duration_days)
                        : undefined,
                    priority:
                      yeastFamilyObj.priority !== undefined ? asNumber(yeastFamilyObj.priority) : undefined,
                  }
                : undefined,
          },
          excludes,
          category: categoryKey,
          group: asString(groupObj.key),
          exclusive: Boolean(groupObj.exclusive),
        } as DescriptorOption;
      });

      return {
        key: asString(groupObj.key),
        label: asString(groupObj.label, asString(groupObj.key)),
        exclusive: Boolean(groupObj.exclusive),
        options,
      };
    });

    categories[categoryKey] = {
      label: asString(categoryObj.label, categoryKey),
      groups,
    };
  });

  const conflicts = asArray(raw.conflicts).map((entryValue) => {
    const entryObj = asObject(entryValue);
    const keys = asArray(entryObj.keys).map((item) => asString(item)).filter(Boolean);
    return {
      keys,
      reason: asString(entryObj.reason),
    };
  });

  return {
    defaults: {
      beverage: asString(defaults.beverage, 'beer'),
      batch_size_l: asNumber(defaults.batch_size_l, 20),
      efficiency_pct: asNumber(defaults.efficiency_pct, 72),
      attenuation: asNumber(defaults.attenuation, 0.76),
      targets: {
        abv: toRange(defaultsTargets.abv, 4.8, 6.0),
        ibu: toRange(defaultsTargets.ibu, 32, 50),
        srm: toRange(defaultsTargets.srm, 5, 8),
      },
      proposal: {
        base_malt: {
          name: asString(asObject(defaultsProposal.base_malt).name, 'North American Pale Malt'),
          percent: asNumber(asObject(defaultsProposal.base_malt).percent, 78),
          ppg: asNumber(asObject(defaultsProposal.base_malt).ppg, 37),
          color_srm: asNumber(asObject(defaultsProposal.base_malt).color_srm, 2.2),
          priority:
            asObject(defaultsProposal.base_malt).priority !== undefined
              ? asNumber(asObject(defaultsProposal.base_malt).priority)
              : undefined,
        },
        specialties: asArray(defaultsProposal.specialties).map((item) => {
          const specObj = asObject(item);
          const percent = asNumber(specObj.percent);
          return {
            key: asString(specObj.key),
            name: asString(specObj.name, asString(specObj.key)),
            percent,
            cap: asNumber(specObj.cap, percent),
            ppg: specObj.ppg !== undefined ? asNumber(specObj.ppg) : undefined,
            color_srm: specObj.color_srm !== undefined ? asNumber(specObj.color_srm) : undefined,
          };
        }),
        hop_families: asArray(defaultsProposal.hop_families).map((item) => {
          const hopObj = asObject(item);
          return {
            key: asString(hopObj.key),
            label: asString(hopObj.label, asString(hopObj.key)),
            variety: asString(hopObj.variety, asString(hopObj.label)),
            alpha_acid: asNumber(hopObj.alpha_acid, 0.07),
          };
        }),
        yeast_family: {
          key: asString(asObject(defaultsProposal.yeast_family).key, 'american_clean'),
          name: asString(asObject(defaultsProposal.yeast_family).name, 'American Clean Ale'),
          attenuation_shift:
            asObject(defaultsProposal.yeast_family).attenuation_shift !== undefined
              ? asNumber(asObject(defaultsProposal.yeast_family).attenuation_shift)
              : undefined,
          temp_c:
            asObject(defaultsProposal.yeast_family).temp_c !== undefined
              ? asNumber(asObject(defaultsProposal.yeast_family).temp_c)
              : undefined,
          duration_days:
            asObject(defaultsProposal.yeast_family).duration_days !== undefined
              ? asNumber(asObject(defaultsProposal.yeast_family).duration_days)
              : undefined,
          priority:
            asObject(defaultsProposal.yeast_family).priority !== undefined
              ? asNumber(asObject(defaultsProposal.yeast_family).priority)
              : undefined,
        },
        mash_temp_c: asNumber(defaultsProposal.mash_temp_c, 66),
        water_bias: asString(defaultsProposal.water_bias, 'Balanced profile'),
      },
    },
    categories,
    conflicts,
  };
};

export const indexOptions = (library: DescriptorLibrary): Map<string, DescriptorOption> => {
  const index = new Map<string, DescriptorOption>();
  Object.entries(library.categories).forEach(([category, descriptorCategory]) => {
    descriptorCategory.groups.forEach((group) => {
      group.options.forEach((option) => {
        index.set(option.key, {
          ...option,
          category,
          group: group.key,
          exclusive: Boolean(group.exclusive),
        });
      });
    });
  });
  return index;
};

const registerConflict = (
  map: Map<string, Map<string, string>>,
  source: string,
  target: string,
  reason: string
) => {
  if (!map.has(source)) {
    map.set(source, new Map());
  }
  map.get(source)?.set(target, reason);
};

export const buildConflictMap = (
  library: DescriptorLibrary,
  optionIndex: Map<string, DescriptorOption>
): Map<string, Map<string, string>> => {
  const map = new Map<string, Map<string, string>>();

  optionIndex.forEach((option, key) => {
    (option.excludes ?? []).forEach((entry) => {
      if (!entry.key) return;
      const reason = entry.reason || 'Not compatible.';
      registerConflict(map, key, entry.key, reason);
      registerConflict(map, entry.key, key, reason);
    });
  });

  (library.conflicts ?? []).forEach((entry) => {
    const keys = entry.keys ?? [];
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const reason = entry.reason || 'Not compatible.';
        registerConflict(map, keys[i], keys[j], reason);
        registerConflict(map, keys[j], keys[i], reason);
      }
    }
  });

  return map;
};

const cloneSelections = (value: Record<string, string[]>): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  Object.entries(value).forEach(([category, keys]) => {
    result[category] = [...keys];
  });
  return result;
};

export const selectedKeySet = (selections: Record<string, string[]>): Set<string> => {
  const set = new Set<string>();
  Object.values(selections).forEach((keys) => {
    keys.forEach((key) => set.add(key));
  });
  return set;
};

export const toggleSelection = (
  currentSelections: Record<string, string[]>,
  optionKey: string,
  optionIndex: Map<string, DescriptorOption>,
  conflictMap: Map<string, Map<string, string>>
): {
  nextSelections: Record<string, string[]>;
  notice: string;
} => {
  const option = optionIndex.get(optionKey);
  if (!option || !option.category) {
    return {
      nextSelections: cloneSelections(currentSelections),
      notice: '',
    };
  }

  const next = cloneSelections(currentSelections);
  if (!next[option.category]) {
    next[option.category] = [];
  }

  const existing = new Set(next[option.category]);
  if (existing.has(optionKey)) {
    next[option.category] = next[option.category].filter((key) => key !== optionKey);
    return { nextSelections: next, notice: '' };
  }

  const removals: string[] = [];

  if (option.exclusive) {
    next[option.category] = next[option.category].filter((key) => {
      const other = optionIndex.get(key);
      const remove = Boolean(other && other.group === option.group);
      if (remove) removals.push(`${other?.label ?? key}: switched selection`);
      return !remove;
    });
  }

  const active = selectedKeySet(next);
  const directConflicts = conflictMap.get(optionKey);
  if (directConflicts) {
    active.forEach((key) => {
      const reason = directConflicts.get(key);
      if (!reason) return;
      const conflicting = optionIndex.get(key);
      if (
        conflicting &&
        conflicting.category === option.category &&
        conflicting.group === option.group &&
        Boolean(option.exclusive)
      ) {
        return;
      }
      Object.keys(next).forEach((category) => {
        next[category] = next[category].filter((entry) => entry !== key);
      });
      removals.push(`${conflicting?.label ?? key}: ${reason}`);
    });
  }

  if (!next[option.category].includes(optionKey)) {
    next[option.category].push(optionKey);
  }

  return {
    nextSelections: next,
    notice: removals.join(' '),
  };
};

export const computeDisabledReasons = (
  selections: Record<string, string[]>,
  optionIndex: Map<string, DescriptorOption>,
  conflictMap: Map<string, Map<string, string>>
): Map<string, string> => {
  const selected = selectedKeySet(selections);
  const disabled = new Map<string, string>();

  selected.forEach((selectedKey) => {
    const conflicts = conflictMap.get(selectedKey);
    if (!conflicts) return;
    conflicts.forEach((reason, blockedKey) => {
      if (selected.has(blockedKey)) return;
      const selectedOption = optionIndex.get(selectedKey);
      const blockedOption = optionIndex.get(blockedKey);
      if (
        selectedOption &&
        blockedOption &&
        selectedOption.category === blockedOption.category &&
        selectedOption.group === blockedOption.group &&
        Boolean(selectedOption.exclusive)
      ) {
        return;
      }
      if (!disabled.has(blockedKey)) {
        disabled.set(blockedKey, reason);
      }
    });
  });

  return disabled;
};

export const sanitizeSelections = (
  selections: Record<string, string[]>,
  optionIndex: Map<string, DescriptorOption>,
  conflictMap: Map<string, Map<string, string>>
): { selections: Record<string, string[]>; removed: string[] } => {
  const seed: Record<string, string[]> = {};
  Object.keys(selections).forEach((category) => {
    seed[category] = [];
  });

  let next = cloneSelections(seed);
  const orderedKeys: string[] = [];
  const seen = new Set<string>();
  const removed = new Set<string>();

  Object.values(selections).forEach((keys) => {
    keys.forEach((key) => {
      if (!key || seen.has(key)) return;
      seen.add(key);
      orderedKeys.push(key);
    });
  });

  orderedKeys.forEach((key) => {
    const option = optionIndex.get(key);
    if (!option || !option.category) {
      removed.add(key);
      return;
    }

    const before = selectedKeySet(next);
    const { nextSelections } = toggleSelection(next, key, optionIndex, conflictMap);
    const after = selectedKeySet(nextSelections);

    before.forEach((existingKey) => {
      if (!after.has(existingKey)) removed.add(existingKey);
    });
    if (!after.has(key)) removed.add(key);

    next = nextSelections;
  });

  return {
    selections: next,
    removed: [...removed],
  };
};

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const gravityPoints = (og: number): number => Math.max(0, (og - 1) * 1000);

const computeOgFg = (targets: TargetBlock, attenuation: number): { og: number; fg: number } => {
  const abv = (targets.abv.min + targets.abv.max) / 2;
  const delta = abv / 131.25;
  const og = 1 + delta / Math.max(attenuation, 0.5);
  const fg = Math.max(0.998, og - delta);
  return {
    og: round(og, 3),
    fg: round(fg, 3),
  };
};

const reconcileIbuWithBuGu = (og: number, ibu: number, locked = false): number => {
  if (locked) return ibu;
  const gu = Math.max(1, gravityPoints(og));
  const ratio = ibu / gu;
  if (ratio < 0.6) return 0.6 * gu;
  if (ratio > 0.9) return 0.9 * gu;
  return ibu;
};

const totalGrainKg = (og: number, batchSizeL: number, efficiencyPct: number, basePpg: number): number => {
  const efficiency = clamp(efficiencyPct / 100, 0.45, 0.9);
  const volumeGal = batchSizeL * 0.264172;
  const pointsTotal = gravityPoints(og) * volumeGal;
  const effectivePpg = Math.max(10, basePpg * efficiency);
  const grainLb = pointsTotal / effectivePpg;
  const grainKg = grainLb * 0.453592;
  return Math.max(grainKg, 3);
};

const normalizeGrainPercents = (
  baseMalt: { percent: number },
  specialties: Array<{ percent: number }>
) => {
  const basePercent = Number(baseMalt.percent || 0);
  const specialtyPercent = specialties.reduce((sum, specialty) => sum + Number(specialty.percent || 0), 0);
  const total = basePercent + specialtyPercent;
  if (total <= 0) {
    baseMalt.percent = 100;
    specialties.forEach((specialty) => {
      specialty.percent = 0;
    });
    return;
  }
  const scale = 100 / total;
  baseMalt.percent = basePercent * scale;
  specialties.forEach((specialty) => {
    specialty.percent = Number(specialty.percent || 0) * scale;
  });
};

const buildGrainBill = (
  baseMalt: {
    name: string;
    percent: number;
    ppg: number;
    color_srm: number;
  },
  specialties: Array<{
    key: string;
    name: string;
    percent: number;
    cap: number;
    ppg?: number;
    color_srm?: number;
  }>,
  og: number,
  batchSizeL: number,
  efficiencyPct: number
): ProposalIngredient[] => {
  const normalizedBase = { ...baseMalt };
  const normalizedSpecialties = specialties.map((item) => ({ ...item }));
  normalizeGrainPercents(normalizedBase, normalizedSpecialties);

  const totalKg = totalGrainKg(og, batchSizeL, efficiencyPct, normalizedBase.ppg);
  const ingredients: ProposalIngredient[] = [
    {
      kind: 'fermentable',
      name: normalizedBase.name,
      amount: round(totalKg * (normalizedBase.percent / 100), 3),
      unit: 'kg',
      ppg: normalizedBase.ppg,
      color_srm: normalizedBase.color_srm,
    },
  ];

  normalizedSpecialties.forEach((specialty) => {
    if (specialty.percent <= 0) return;
    ingredients.push({
      kind: 'fermentable',
      name: specialty.name,
      amount: round(totalKg * (specialty.percent / 100), 3),
      unit: 'kg',
      ppg: specialty.ppg,
      color_srm: specialty.color_srm,
    });
  });

  return ingredients;
};

const hopWeight = (ibu: number, alpha: number, utilization: number, volumeL: number): number => {
  if (ibu <= 0 || alpha <= 0 || utilization <= 0 || volumeL <= 0) return 0;
  return Math.max(0, (ibu * volumeL) / (alpha * utilization * 1000));
};

const buildHopPlan = (
  ibuRange: RangeValue,
  families: ProposalHopFamily[],
  batchSizeL: number,
  attenuation: number
): { plan: ProposalOutput['hop_plan']; ingredients: ProposalIngredient[] } => {
  const workingFamilies = families.length > 0 ? families : [{
    key: 'citrus',
    label: 'Citrus Cascade',
    variety: 'Cascade',
    alpha_acid: 0.065,
  }];

  const primary = workingFamilies[0];
  const secondary = workingFamilies[1] ?? primary;
  const tertiary = workingFamilies[2] ?? secondary;

  const ibuMid = (ibuRange.min + ibuRange.max) / 2;
  const bitterShare = ibuMid * 0.5;
  const lateShare = ibuMid * 0.25;
  const whirlShare = Math.max(0, ibuMid - bitterShare - lateShare);

  const bitterWeightG = hopWeight(bitterShare, primary.alpha_acid, 0.25, batchSizeL);
  const lateWeightG = hopWeight(lateShare, secondary.alpha_acid, 0.15, batchSizeL);
  const whirlWeightG = hopWeight(whirlShare, tertiary.alpha_acid, 0.1, batchSizeL);

  const dryRate = clamp(1.6 + (attenuation - 0.75) * 4, 0.8, 2.4);
  const dryWeightG = dryRate * batchSizeL;

  const plan: ProposalOutput['hop_plan'] = [
    {
      family: primary.label,
      timings: ['60 min boil', '15 min boil'],
      variety: primary.variety,
    },
  ];

  if (workingFamilies.length > 1) {
    plan.push({
      family: secondary.label,
      timings: ['Whirlpool 20 min'],
      variety: secondary.variety,
    });
  }

  if (workingFamilies.length > 2 || dryWeightG > 0) {
    plan.push({
      family: tertiary.label,
      timings: ['Dry hop'],
      variety: tertiary.variety,
    });
  }

  const ingredients: ProposalIngredient[] = [];
  if (bitterWeightG > 0) {
    ingredients.push({
      kind: 'hop',
      name: primary.variety,
      amount: round(bitterWeightG, 1),
      unit: 'g',
      aa_pct: round(primary.alpha_acid * 100, 1),
      timing: 'boil',
      time_min: 60,
    });
  }
  if (lateWeightG > 0) {
    ingredients.push({
      kind: 'hop',
      name: secondary.variety,
      amount: round(lateWeightG, 1),
      unit: 'g',
      aa_pct: round(secondary.alpha_acid * 100, 1),
      timing: 'boil',
      time_min: 15,
    });
  }
  if (whirlWeightG > 0) {
    ingredients.push({
      kind: 'hop',
      name: tertiary.variety,
      amount: round(whirlWeightG, 1),
      unit: 'g',
      aa_pct: round(tertiary.alpha_acid * 100, 1),
      timing: 'whirlpool',
      time_min: 20,
    });
  }
  if (dryWeightG > 0) {
    ingredients.push({
      kind: 'hop',
      name: tertiary.variety,
      amount: round(dryWeightG, 1),
      unit: 'g',
      aa_pct: round(tertiary.alpha_acid * 100, 1),
      timing: 'ferment',
      day_offset: 4,
    });
  }

  return { plan, ingredients };
};

const toKg = (amount: number, unit: string): number => {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount / 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') {
    return amount * 0.45359237;
  }
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount * 0.028349523125;
  return amount;
};

const toLb = (amount: number, unit: string): number => {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') {
    return amount;
  }
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount * 2.20462262;
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount / 453.59237;
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount / 16;
  return amount;
};

const toG = (amount: number, unit: string): number => {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'g' || normalized === 'gram' || normalized === 'grams') return amount;
  if (normalized === 'kg' || normalized === 'kilogram' || normalized === 'kilograms') return amount * 1000;
  if (normalized === 'lb' || normalized === 'lbs' || normalized === 'pound' || normalized === 'pounds') {
    return amount * 453.59237;
  }
  if (normalized === 'oz' || normalized === 'ounce' || normalized === 'ounces') return amount * 28.349523125;
  return amount;
};

const toKindType = (kind: ProposalIngredient['kind']): CatalogType => {
  if (kind === 'fermentable') return 'malt';
  if (kind === 'hop') return 'hop';
  if (kind === 'yeast') return 'yeast';
  return 'adjunct';
};

const normalizeCatalogType = (value: string): CatalogType => {
  if (value === 'malt' || value === 'hop' || value === 'yeast' || value === 'adjunct') {
    return value;
  }
  return 'adjunct';
};

const slugify = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const nameSimilarity = (a: string, b: string): number => {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let overlap = 0;
  setA.forEach((token) => {
    if (setB.has(token)) overlap += 1;
  });
  return overlap / Math.max(setA.size, setB.size);
};

const sensoryDistance = (a: Record<string, number>, b: Record<string, number>): number => {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  let total = 0;
  keys.forEach((key) => {
    const delta = Number(a[key] ?? 0) - Number(b[key] ?? 0);
    total += delta ** 2;
  });
  return Math.sqrt(total);
};

const specDistance = (kind: CatalogType, a: CatalogIngredient, b: CatalogIngredient): number => {
  if (kind === 'hop') {
    const aAlpha = resolveCatalogHopAlpha(a.spec_json) ?? 0;
    const bAlpha = resolveCatalogHopAlpha(b.spec_json) ?? 0;
    return Math.abs(bAlpha - aAlpha) * 100;
  }
  if (kind === 'malt') {
    const aPpg = resolveCatalogPpg(a.spec_json) ?? 0;
    const bPpg = resolveCatalogPpg(b.spec_json) ?? 0;
    const ppgDiff = Math.abs(bPpg - aPpg) * 2.5;
    const aColor = resolveCatalogColorSrm(a.spec_json) ?? 0;
    const bColor = resolveCatalogColorSrm(b.spec_json) ?? 0;
    const colorDiff = Math.abs(bColor - aColor) * 0.8;
    return ppgDiff + colorDiff;
  }
  if (kind === 'yeast') {
    const aAtt = resolveCatalogYeastAttenuation(a.spec_json) ?? 0;
    const bAtt = resolveCatalogYeastAttenuation(b.spec_json) ?? 0;
    return Math.abs(bAtt - aAtt) * 100;
  }
  return 0;
};

const computeInventoryState = (inventoryLots: InventoryLot[]): {
  stateByCatalogId: Record<string, 'in_stock' | 'out_of_stock'>;
  lotCostByCatalogId: Record<string, number>;
} => {
  const qtyByCatalog: Record<string, number> = {};
  const costByCatalog: Record<string, number> = {};
  inventoryLots.forEach((lot) => {
    qtyByCatalog[lot.catalog_id] = (qtyByCatalog[lot.catalog_id] ?? 0) + Number(lot.qty ?? 0);
    if (lot.cost_per_unit !== undefined && costByCatalog[lot.catalog_id] === undefined) {
      costByCatalog[lot.catalog_id] = Number(lot.cost_per_unit);
    }
  });

  const stateByCatalogId: Record<string, 'in_stock' | 'out_of_stock'> = {};
  Object.keys(qtyByCatalog).forEach((catalogId) => {
    stateByCatalogId[catalogId] = qtyByCatalog[catalogId] > 0 ? 'in_stock' : 'out_of_stock';
  });

  return { stateByCatalogId, lotCostByCatalogId: costByCatalog };
};

const findBestCatalogCandidate = (
  ingredient: ProposalIngredient,
  target: CatalogIngredient | undefined,
  pool: CatalogIngredient[],
  stateByCatalogId: Record<string, 'in_stock' | 'out_of_stock'>,
  preferInStock: boolean
): CatalogIngredient | undefined => {
  let best: CatalogIngredient | undefined;
  let bestScore = Number.POSITIVE_INFINITY;

  pool.forEach((candidate) => {
    const inStock = stateByCatalogId[candidate.id] === 'in_stock';
    let score = 0;

    if (target) {
      score += sensoryDistance(target.sensory_json ?? {}, candidate.sensory_json ?? {}) * 3.5;
      score += specDistance(normalizeCatalogType(candidate.type), target, candidate);
      if (candidate.id !== target.id) score += 0.5;
    } else {
      const similarity = nameSimilarity(ingredient.name, candidate.name);
      score += (1 - similarity) * 8;
    }

    if (!inStock) score += 6;
    if (preferInStock && !inStock) score += 40;

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  });

  return best;
};

const applyCatalogSpecs = (
  ingredient: ProposalIngredient,
  catalogItem: CatalogIngredient,
  lotCostByCatalogId: Record<string, number>
): ProposalIngredient => {
  const next: ProposalIngredient = {
    ...ingredient,
    id: catalogItem.id,
    name: catalogItem.name,
  };

  if (catalogItem.type === 'hop') {
    const alpha = resolveCatalogHopAlpha(catalogItem.spec_json);
    if (alpha !== undefined && Number.isFinite(alpha) && alpha > 0) {
      next.aa_pct = round(alpha * 100, 1);
    }
  }

  if (catalogItem.type === 'malt') {
    const ppg = resolveCatalogPpg(catalogItem.spec_json);
    if (Number.isFinite(ppg) && Number(ppg) > 0) {
      next.ppg = Number(ppg);
    }
    const color = resolveCatalogColorSrm(catalogItem.spec_json);
    if (color !== undefined && Number.isFinite(color) && color > 0) {
      next.color_srm = color;
    }
  }

  if (lotCostByCatalogId[catalogItem.id] !== undefined) {
    next.cost_per_unit = lotCostByCatalogId[catalogItem.id];
  }

  return next;
};

const buildSubstitutionImpact = (
  original: CatalogIngredient | undefined,
  replacement: CatalogIngredient,
  inStock: boolean
): string => {
  if (!original) {
    return `${replacement.name} selected from seeded catalog${inStock ? ' (in stock)' : ''}.`;
  }

  const notes: string[] = [];
  if (original.type === 'hop') {
    const originalAA = resolveCatalogHopAlpha(original.spec_json) ?? 0;
    const replacementAA = resolveCatalogHopAlpha(replacement.spec_json) ?? 0;
    const delta = (replacementAA - originalAA) * 100;
    if (Math.abs(delta) >= 0.1) {
      notes.push(`${delta > 0 ? '+' : '-'}${Math.abs(delta).toFixed(1)}% AA`);
    }
  }
  if (original.type === 'malt') {
    const originalColor = resolveCatalogColorSrm(original.spec_json) ?? 0;
    const replacementColor = resolveCatalogColorSrm(replacement.spec_json) ?? 0;
    const delta = replacementColor - originalColor;
    if (Math.abs(delta) >= 0.5) {
      notes.push(`${delta > 0 ? '+' : '-'}${Math.abs(delta).toFixed(1)} SRM hue`);
    }
  }

  if (inStock) notes.push('in stock');
  if (notes.length === 0) notes.push('maintains similar profile');

  return `${original.name} unavailable -> ${replacement.name} (${notes.join(', ')})`;
};

const applyInventorySubstitutions = (
  proposal: ProposalOutput,
  ingredients: ProposalIngredient[],
  catalog: CatalogIngredient[],
  inventoryLots: InventoryLot[],
  preferInStock: boolean
): { nextIngredients: ProposalIngredient[]; substitutions: ProposalOutput['substitutions'] } => {
  const activeCatalog = catalog.filter((item) => item.active !== false);
  const { stateByCatalogId, lotCostByCatalogId } = computeInventoryState(inventoryLots);
  const byKind: Record<CatalogType, CatalogIngredient[]> = {
    malt: [],
    hop: [],
    yeast: [],
    adjunct: [],
  };

  const bySlug = new Map<string, CatalogIngredient>();
  activeCatalog.forEach((item) => {
    byKind[normalizeCatalogType(item.type)].push(item);
    const slug = slugify(item.name);
    if (!bySlug.has(slug)) bySlug.set(slug, item);
  });

  const substitutions: NonNullable<ProposalOutput['substitutions']> = [];
  const nextIngredients: ProposalIngredient[] = [];

  let fermentableIndex = 0;
  let hopIndex = 0;

  ingredients.forEach((ingredient) => {
    const kindType = toKindType(ingredient.kind);
    const pool = byKind[kindType] ?? [];
    const directTarget = bySlug.get(slugify(ingredient.name));
    const fallbackTarget =
      directTarget ??
      pool
        .map((item) => ({ item, similarity: nameSimilarity(ingredient.name, item.name) }))
        .sort((a, b) => b.similarity - a.similarity)[0]?.item;

    if (!fallbackTarget) {
      nextIngredients.push(ingredient);
      return;
    }

    const fallbackInStock = stateByCatalogId[fallbackTarget.id] === 'in_stock';
    const shouldReplace = preferInStock ? !fallbackInStock : stateByCatalogId[fallbackTarget.id] !== 'in_stock';
    const candidate = shouldReplace
      ? findBestCatalogCandidate(ingredient, fallbackTarget, pool, stateByCatalogId, preferInStock)
      : fallbackTarget;

    if (!candidate) {
      nextIngredients.push(ingredient);
      return;
    }

    const candidateInStock = stateByCatalogId[candidate.id] === 'in_stock';
    const updated = applyCatalogSpecs(ingredient, candidate, lotCostByCatalogId);
    nextIngredients.push(updated);

    const replaced = candidate.id !== fallbackTarget.id || candidate.name !== ingredient.name;
    if (replaced) {
      const impact = buildSubstitutionImpact(fallbackTarget, candidate, candidateInStock);

      if (ingredient.kind === 'fermentable') {
        if (fermentableIndex === 0) {
          proposal.base_malt.name = candidate.name;
          proposal.base_malt.substitution = impact;
          substitutions.push({
            slot: 'base_malt',
            index: 0,
            original_name: ingredient.name,
            replacement_name: candidate.name,
            impact,
          });
        } else {
          const specialtyIndex = fermentableIndex - 1;
          if (proposal.specialty_caps[specialtyIndex]) {
            proposal.specialty_caps[specialtyIndex].name = candidate.name;
            proposal.specialty_caps[specialtyIndex].substitution = impact;
          }
          substitutions.push({
            slot: 'specialty',
            index: specialtyIndex,
            original_name: ingredient.name,
            replacement_name: candidate.name,
            impact,
          });
        }
        fermentableIndex += 1;
      } else if (ingredient.kind === 'hop') {
        if (proposal.hop_plan[hopIndex]) {
          proposal.hop_plan[hopIndex].variety = candidate.name;
          proposal.hop_plan[hopIndex].substitution = impact;
        }
        substitutions.push({
          slot: 'hop',
          index: hopIndex,
          original_name: ingredient.name,
          replacement_name: candidate.name,
          impact,
        });
        hopIndex += 1;
      } else if (ingredient.kind === 'yeast') {
        proposal.yeast_family = candidate.name;
        proposal.yeast_substitution = impact;
        substitutions.push({
          slot: 'yeast',
          index: 0,
          original_name: ingredient.name,
          replacement_name: candidate.name,
          impact,
        });
      }
    } else {
      if (ingredient.kind === 'fermentable') fermentableIndex += 1;
      if (ingredient.kind === 'hop') hopIndex += 1;
    }
  });

  return {
    nextIngredients,
    substitutions: substitutions.length > 0 ? substitutions : undefined,
  };
};

const estimateAttenuation = (ingredients: ProposalIngredient[]): number => {
  const yeastNames = ingredients
    .filter((ingredient) => ingredient.kind === 'yeast')
    .map((ingredient) => ingredient.name.toLowerCase());

  if (yeastNames.some((name) => name.includes('cider') || name.includes('wine') || name.includes('champagne'))) return 0.94;
  if (yeastNames.some((name) => name.includes('saison'))) return 0.82;
  if (yeastNames.some((name) => name.includes('lager'))) return 0.79;
  if (yeastNames.some((name) => name.includes('weizen') || name.includes('hefe'))) return 0.74;
  if (yeastNames.some((name) => name.includes('english'))) return 0.73;
  return 0.76;
};

const hopUtilization = (boilGravity: number, timeMin: number): number => {
  if (timeMin <= 0) return 0;
  return (
    1.65 *
    Math.pow(0.000125, Math.max(boilGravity - 1, 0)) *
    ((1 - Math.exp(-0.04 * timeMin)) / 4.15)
  );
};

const predictionWeightUnits = new Set([
  'kg',
  'kilogram',
  'kilograms',
  'g',
  'gram',
  'grams',
  'lb',
  'lbs',
  'pound',
  'pounds',
  'oz',
  'ounce',
  'ounces',
]);

const predictionVolumeUnits = new Set([
  'l',
  'liter',
  'liters',
  'litre',
  'litres',
  'ml',
  'milliliter',
  'milliliters',
  'gal',
  'gallon',
  'gallons',
]);

const isLiquidMustIngredient = (ingredient: ProposalIngredient): boolean =>
  /(juice|must|cider|apple|pear|concentrate)/i.test(ingredient.name);
const isBsgCiderBaseIngredient = (ingredient: ProposalIngredient): boolean =>
  /bsg.*ciderbase|ciderbase/i.test(ingredient.name);

const toLiters = (amount: number, unit: string): number => {
  const normalized = unit.trim().toLowerCase();
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') return amount;
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters') return amount / 1000;
  if (normalized === 'gal' || normalized === 'gallon' || normalized === 'gallons') return amount * 3.785411784;
  return amount;
};

const computePredictedMetrics = (
  ingredients: ProposalIngredient[],
  batchSizeLiters: number,
  efficiencyPct: number
): { predicted: ManualPredictionOutput['predicted']; warnings: string[] } => {
  const warningSet = new Set<string>();
  const safeBatchLiters = clamp(batchSizeLiters, 0.5, 20000);
  if (safeBatchLiters !== batchSizeLiters) {
    warningSet.add('Batch size was out of range and was normalized for prediction.');
  }

  const efficiency = clamp(efficiencyPct / 100, 0.4, 0.95);
  if (efficiency !== efficiencyPct / 100) {
    warningSet.add('Efficiency was clamped to a practical range for prediction.');
  }

  const maxFermentableKg = Math.max(30, safeBatchLiters * 0.9);
  const maxHopGrams = Math.max(600, safeBatchLiters * 35);

  const fermentables = ingredients
    .filter((ingredient) => ingredient.kind === 'fermentable')
    .map((ingredient) => {
      const unit = ingredient.unit || 'kg';
      const normalizedUnit = unit.trim().toLowerCase();
      if (predictionVolumeUnits.has(normalizedUnit) && isLiquidMustIngredient(ingredient)) {
        const rawAmount = Number(ingredient.amount ?? 0);
        if (!Number.isFinite(rawAmount) || rawAmount < 0) {
          warningSet.add('Some ingredient amounts were invalid and were corrected.');
        }
        const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
        const liters = clamp(toLiters(amount, unit), 0, safeBatchLiters * 1.5);
        if (liters !== toLiters(amount, unit)) {
          warningSet.add('Extreme cider juice volumes were clamped for stable prediction.');
        }

        const rawGravityPoints = Number(ingredient.ppg ?? 50);
        const maxGravityPoints = isBsgCiderBaseIngredient(ingredient) ? 300 : 80;
        const gravityPointsPerGallon = clamp(Number.isFinite(rawGravityPoints) ? rawGravityPoints : 50, 20, maxGravityPoints);
        if (!Number.isFinite(rawGravityPoints) || gravityPointsPerGallon !== rawGravityPoints) {
          warningSet.add('Cider juice gravity points were normalized to realistic bounds.');
        }

        const rawColor = Number(ingredient.color_srm ?? 3);
        const color = clamp(Number.isFinite(rawColor) ? rawColor : 3, 0, 60);

        return {
          weightLb: liters * 0.264172,
          color,
          ppg: 0,
          pointContribution: liters * 0.264172 * gravityPointsPerGallon,
        };
      }
      if (!predictionWeightUnits.has(normalizedUnit)) {
        warningSet.add('Some fermentable entries used unsupported units and were ignored.');
        return { weightLb: 0, color: 0, ppg: 0, pointContribution: 0 };
      }

      const rawAmount = Number(ingredient.amount ?? 0);
      if (!Number.isFinite(rawAmount) || rawAmount < 0) {
        warningSet.add('Some ingredient amounts were invalid and were corrected.');
      }
      const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;

      const rawKg = toKg(amount, unit);
      const weightKg = clamp(rawKg, 0, maxFermentableKg);
      if (weightKg !== rawKg) {
        warningSet.add('Extreme fermentable amounts were clamped for stable prediction.');
      }

      const rawPpg = Number(ingredient.ppg ?? 36);
      const ppg = clamp(Number.isFinite(rawPpg) ? rawPpg : 36, 20, 46);
      if (!Number.isFinite(rawPpg) || ppg !== rawPpg) {
        warningSet.add('Fermentable PPG values were normalized to realistic bounds.');
      }

      const rawColor = Number(ingredient.color_srm ?? 2.5);
      const color = clamp(Number.isFinite(rawColor) ? rawColor : 2.5, 0, 600);
      if (!Number.isFinite(rawColor) || color !== rawColor) {
        warningSet.add('Fermentable color values were normalized for prediction.');
      }

      return {
        weightLb: toLb(weightKg, 'kg'),
        color,
        ppg,
        pointContribution: toLb(weightKg, 'kg') * ppg * efficiency,
      };
    });

  const hops = ingredients
    .filter((ingredient) => ingredient.kind === 'hop')
    .map((ingredient) => {
      const unit = ingredient.unit || 'g';
      const normalizedUnit = unit.trim().toLowerCase();
      if (!predictionWeightUnits.has(normalizedUnit)) {
        warningSet.add('Some hop entries used unsupported units and were ignored.');
        return { grams: 0, alphaFraction: 0, timing: 'boil' as const, timeMin: 0 };
      }

      const rawAmount = Number(ingredient.amount ?? 0);
      if (!Number.isFinite(rawAmount) || rawAmount < 0) {
        warningSet.add('Some ingredient amounts were invalid and were corrected.');
      }
      const amount = Number.isFinite(rawAmount) ? Math.max(0, rawAmount) : 0;
      const rawGrams = toG(amount, unit);
      const grams = clamp(rawGrams, 0, maxHopGrams);
      if (grams !== rawGrams) {
        warningSet.add('Extreme hop amounts were clamped for stable prediction.');
      }

      const rawAa = Number(ingredient.aa_pct ?? 0);
      const alphaFraction = clamp(
        Number.isFinite(rawAa) ? (rawAa > 1 ? rawAa / 100 : rawAa) : 0,
        0,
        0.25
      );
      if (!Number.isFinite(rawAa) || alphaFraction !== (rawAa > 1 ? rawAa / 100 : rawAa)) {
        warningSet.add('Hop alpha-acid values were normalized to realistic bounds.');
      }

      const timing = ingredient.timing ?? 'boil';
      const rawTimeMin =
        ingredient.time_min ??
        (timing === 'boil' ? 60 : timing === 'whirlpool' ? 20 : 0);
      const timeMin = clamp(Number(rawTimeMin), 0, 180);
      if (!Number.isFinite(Number(rawTimeMin)) || Number(rawTimeMin) !== timeMin) {
        warningSet.add('Hop timing inputs were normalized to a practical range.');
      }

      return {
        grams,
        alphaFraction,
        timing,
        timeMin,
      };
    });

  const volumeGal = Math.max(safeBatchLiters * 0.264172, 0.1);
  const points = fermentables.reduce((sum, ingredient) => {
    return sum + ingredient.pointContribution;
  }, 0);

  const og = 1 + points / volumeGal / 1000;
  const attenuation = estimateAttenuation(ingredients);
  const fg = Math.max(0.998, 1 + (og - 1) * (1 - attenuation));
  const abv = (og - fg) * 131.25;

  const ibu = hops.reduce((sum, ingredient) => {
    const utilization =
      ingredient.timing === 'ferment'
        ? 0
        : ingredient.timing === 'whirlpool'
          ? hopUtilization(og, Math.max(10, ingredient.timeMin)) * 0.55
          : hopUtilization(og, ingredient.timeMin);
    if (utilization <= 0 || ingredient.alphaFraction <= 0 || ingredient.grams <= 0) return sum;
    const contribution = (ingredient.alphaFraction * ingredient.grams * utilization * 1000) / Math.max(safeBatchLiters, 0.1);
    return sum + contribution;
  }, 0);

  const mcu = fermentables.reduce((sum, ingredient) => {
    if (ingredient.weightLb <= 0 || ingredient.color <= 0) return sum;
    return sum + (ingredient.weightLb * ingredient.color) / volumeGal;
  }, 0);

  const srm = mcu > 0 ? 1.4922 * Math.pow(mcu, 0.6859) : 0;
  const predicted = {
    og: round(og, 3),
    fg: round(fg, 3),
    abv: round(abv, 2),
    ibu: round(ibu, 1),
    srm: round(srm, 1),
  };

  if (predicted.abv > 20 || predicted.og > 1.2 || predicted.fg > 1.08) {
    warningSet.add('Predicted gravity/ABV is unusually high; review ingredient amounts and units.');
  }
  if (predicted.srm > 60) {
    warningSet.add('Predicted color is unusually high; review grain color and amounts.');
  }

  return {
    predicted,
    warnings: [...warningSet],
  };
};

const findCatalogMatch = (
  ingredient: ProposalIngredient,
  catalog: CatalogIngredient[]
): CatalogIngredient | undefined => {
  const direct = catalog.find((item) => slugify(item.name) === slugify(ingredient.name));
  if (direct) return direct;
  const pool = catalog.filter((item) => normalizeCatalogType(item.type) === toKindType(ingredient.kind));
  if (pool.length === 0) return undefined;
  const ranked = pool
    .map((item) => ({ item, score: nameSimilarity(ingredient.name, item.name) }))
    .sort((a, b) => b.score - a.score);
  if ((ranked[0]?.score ?? 0) < 0.25) return undefined;
  return ranked[0]?.item;
};

const descriptorProfileFromIngredients = (
  ingredients: ProposalIngredient[],
  catalog: CatalogIngredient[]
): Array<{ key: string; score: number }> => {
  const weights: Record<string, number> = {};

  ingredients.forEach((ingredient) => {
    const matched = findCatalogMatch(ingredient, catalog);
    const sensory = matched?.sensory_json ?? {};
    const kindWeight =
      ingredient.kind === 'fermentable'
        ? toKg(Number(ingredient.amount ?? 0), ingredient.unit || 'kg')
        : ingredient.kind === 'hop'
          ? toG(Number(ingredient.amount ?? 0), ingredient.unit || 'g') / 100
          : ingredient.kind === 'yeast'
            ? 1.2
            : 0.8;

    const timingWeight =
      ingredient.kind !== 'hop'
        ? 1
        : ingredient.timing === 'ferment'
          ? 1.5
          : ingredient.timing === 'whirlpool'
            ? 1.2
            : 0.85;

    Object.entries(sensory).forEach(([key, value]) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) return;
      weights[key] = (weights[key] ?? 0) + numeric * kindWeight * timingWeight;
    });
  });

  return Object.entries(weights)
    .map(([key, score]) => ({ key, score: round(score, 2) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
};

const extractSelectionKeywords = (
  selections: Record<string, string[]>,
  optionIndex: Map<string, DescriptorOption>
): string[] => {
  const words = new Set<string>();
  Object.values(selections)
    .flat()
    .forEach((key) => {
      const option = optionIndex.get(key);
      if (!option) return;
      tokenize(option.label).forEach((token) => words.add(token));
      tokenize(option.key.replaceAll('_', ' ')).forEach((token) => words.add(token));
    });
  return [...words];
};

const metricCenter = (range: RangeValue): number => (range.min + range.max) / 2;

const rangeFitScore = (value: number, min: number, max: number): number => {
  const midpoint = (min + max) / 2;
  const halfSpan = Math.max((max - min) / 2, 0.25);
  const normalizedDistance = Math.abs(value - midpoint) / halfSpan;
  return Math.exp(-normalizedDistance);
};

export const computeClassDesignation = (
  proposal: ProposalOutput,
  selectedKeywords: string[],
  styles: Array<{
    style: string;
    abv: [number, number];
    ibu: [number, number];
    srm: [number, number];
    keywords?: string[];
  }>
): ClassDesignation | undefined => {
  if (!styles.length) return undefined;

  const abvCenter = metricCenter(proposal.targets.abv);
  const ibuCenter = metricCenter(proposal.targets.ibu);
  const srmCenter = metricCenter(proposal.targets.srm);

  let best: ClassDesignation | undefined;
  let bestScore = -1;

  styles.forEach((style) => {
    const metricScore =
      (rangeFitScore(abvCenter, style.abv[0], style.abv[1]) +
        rangeFitScore(ibuCenter, style.ibu[0], style.ibu[1]) +
        rangeFitScore(srmCenter, style.srm[0], style.srm[1])) /
      3;

    const keywordSet = new Set((style.keywords ?? []).flatMap((word) => tokenize(word.replaceAll('_', ' '))));
    const overlapCount = selectedKeywords.filter((word) => keywordSet.has(word)).length;
    const keywordScore = keywordSet.size > 0 ? overlapCount / keywordSet.size : 0;

    const score = metricScore * 0.7 + keywordScore * 0.3;
    if (score > bestScore) {
      bestScore = score;
      best = {
        class_name: style.style,
        confidence: clamp(score, 0, 1),
      };
    }
  });

  return best;
};

export const computeSimilarMatches = (
  proposal: ProposalOutput,
  selectedKeywords: string[],
  reference: Array<{
    name: string;
    style: string;
    abv: number;
    ibu: number;
    srm: number;
    descriptors?: string[];
  }>
): SimilarMatch[] => {
  const abv = metricCenter(proposal.targets.abv);
  const ibu = metricCenter(proposal.targets.ibu);
  const srm = metricCenter(proposal.targets.srm);

  const selectedSet = new Set(selectedKeywords);

  return reference
    .map((entry) => {
      const abvDistance = Math.abs(abv - entry.abv) / 1.5;
      const ibuDistance = Math.abs(ibu - entry.ibu) / 20;
      const srmDistance = Math.abs(srm - entry.srm) / 8;
      const metricDistance = abvDistance + ibuDistance + srmDistance;

      const descriptorTokens = new Set(
        (entry.descriptors ?? []).flatMap((word) => tokenize(word.replaceAll('_', ' ')))
      );
      const descriptorOverlap = descriptorTokens.size
        ? [...selectedSet].filter((token) => descriptorTokens.has(token)).length / descriptorTokens.size
        : 0;

      const similarity = clamp(Math.exp(-metricDistance) * 0.75 + descriptorOverlap * 0.25, 0, 1);

      const deltas = [
        { key: 'ABV', value: Math.abs(abv - entry.abv) },
        { key: 'IBU', value: Math.abs(ibu - entry.ibu) },
        { key: 'SRM', value: Math.abs(srm - entry.srm) },
      ].sort((a, b) => b.value - a.value);

      const biggestDelta = deltas[0];
      const note =
        biggestDelta.value < 0.5
          ? 'Very close profile'
          : `${biggestDelta.key} differs by ${round(biggestDelta.value, 1)}`;

      return {
        name: entry.name,
        style: entry.style,
        similarity,
        note,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
};

export const computeProposal = (
  input: ComputeProposalInput,
  library: DescriptorLibrary,
  optionIndex: Map<string, DescriptorOption>,
  catalog: CatalogIngredient[],
  inventoryLots: InventoryLot[],
  baStyles: Array<{
    style: string;
    abv: [number, number];
    ibu: [number, number];
    srm: [number, number];
    keywords?: string[];
  }>,
  cloneReference: Array<{
    name: string;
    style: string;
    abv: number;
    ibu: number;
    srm: number;
    descriptors?: string[];
  }>
): ComputeProposalOutput => {
  const targets = deepCopy(input.targets);

  const working = {
    mash_temp_c: library.defaults.proposal.mash_temp_c,
    water_bias: library.defaults.proposal.water_bias,
    attenuation: library.defaults.attenuation,
    efficiency_pct: input.efficiency_pct,
    batch_size_l: input.batch_size_l,
    base_malt: deepCopy(library.defaults.proposal.base_malt),
    specialties: deepCopy(library.defaults.proposal.specialties),
    hop_families: deepCopy(library.defaults.proposal.hop_families),
    yeast_family: deepCopy(library.defaults.proposal.yeast_family),
  };

  const specialtyMap = new Map<string, ProposalOutput['specialty_caps'][number]>();
  let basePriority = Number(working.base_malt.priority ?? 0);
  let yeastPriority = Number(working.yeast_family.priority ?? 0);

  const selected = selectedKeySet(input.selections);

  selected.forEach((key) => {
    const option = optionIndex.get(key);
    if (!option) return;

    const biases = option.biases ?? {};
    Object.entries(biases.targets ?? {}).forEach(([metric, delta]) => {
      if (!targets[metric]) {
        targets[metric] = { min: 0, max: 0 };
      }
      if (delta.min !== undefined) {
        targets[metric].min += Number(delta.min);
      }
      if (delta.max !== undefined) {
        targets[metric].max += Number(delta.max);
      }
    });

    if (biases.mash_temp_c !== undefined) {
      working.mash_temp_c += Number(biases.mash_temp_c);
    }
    if (biases.water_bias) {
      working.water_bias = biases.water_bias;
    }
    if (biases.attenuation !== undefined) {
      working.attenuation += Number(biases.attenuation);
    }

    const proposal = option.proposal ?? {};
    if (proposal.base_malt) {
      const candidatePriority = Number(proposal.base_malt.priority ?? 0);
      if (candidatePriority >= basePriority) {
        basePriority = candidatePriority;
        working.base_malt = {
          name: proposal.base_malt.name ?? working.base_malt.name,
          percent: Number(proposal.base_malt.percent ?? working.base_malt.percent),
          ppg: Number(proposal.base_malt.ppg ?? working.base_malt.ppg),
          color_srm: Number(proposal.base_malt.color_srm ?? working.base_malt.color_srm),
          priority: candidatePriority,
        };
      }
    }

    (proposal.specialties ?? []).forEach((specialty) => {
      if (!specialty.key) return;
      const current = specialtyMap.get(specialty.key);
      const next = {
        key: specialty.key,
        name: specialty.name ?? specialty.key,
        percent: Number(specialty.percent ?? 0),
        cap: Number(specialty.cap ?? specialty.percent ?? 0),
        ppg: specialty.ppg !== undefined ? Number(specialty.ppg) : undefined,
        color_srm: specialty.color_srm !== undefined ? Number(specialty.color_srm) : undefined,
      };

      if (!current || next.percent >= Number(current.percent ?? 0)) {
        specialtyMap.set(specialty.key, next);
      } else {
        current.cap = Math.max(Number(current.cap ?? 0), next.cap);
      }
    });

    if (proposal.hop_family?.key) {
      if (!working.hop_families.some((family) => family.key === proposal.hop_family?.key)) {
        working.hop_families.push({
          key: proposal.hop_family.key,
          label: proposal.hop_family.label ?? proposal.hop_family.key,
          variety: proposal.hop_family.variety ?? proposal.hop_family.label ?? proposal.hop_family.key,
          alpha_acid: Number(proposal.hop_family.alpha_acid ?? 0.07),
        });
      }
    }

    if (proposal.yeast_family?.key || proposal.yeast_family?.name) {
      const candidatePriority = Number(proposal.yeast_family.priority ?? 0);
      if (candidatePriority >= yeastPriority) {
        yeastPriority = candidatePriority;
        working.yeast_family = {
          key: proposal.yeast_family.key ?? working.yeast_family.key,
          name: proposal.yeast_family.name ?? working.yeast_family.name,
          attenuation_shift:
            proposal.yeast_family.attenuation_shift ?? working.yeast_family.attenuation_shift,
          temp_c: proposal.yeast_family.temp_c ?? working.yeast_family.temp_c,
          duration_days: proposal.yeast_family.duration_days ?? working.yeast_family.duration_days,
          priority: candidatePriority,
        };
      }
    }
  });

  Object.values(targets).forEach((metric) => {
    metric.min = Math.max(0, Number(metric.min ?? 0));
    metric.max = Math.max(metric.min, Number(metric.max ?? metric.min));
    if (metric.min > metric.max) {
      const currentMin = metric.min;
      metric.min = metric.max;
      metric.max = currentMin;
    }
  });

  working.attenuation = clamp(working.attenuation, 0.68, 0.86);
  working.mash_temp_c = clamp(working.mash_temp_c, 60, 69);
  if (working.hop_families.length === 0) {
    working.hop_families = deepCopy(library.defaults.proposal.hop_families);
  }

  const { og, fg } = computeOgFg(targets, working.attenuation);
  const ibuLocked = targets.ibu.min === targets.ibu.max;
  const reconciledIbu = reconcileIbuWithBuGu(og, (targets.ibu.min + targets.ibu.max) / 2, ibuLocked);
  targets.ibu.min = reconciledIbu;
  targets.ibu.max = reconciledIbu;

  const specialtyCaps = [...specialtyMap.values()];
  const grainBill = buildGrainBill(
    {
      name: working.base_malt.name,
      percent: Number(working.base_malt.percent),
      ppg: Number(working.base_malt.ppg),
      color_srm: Number(working.base_malt.color_srm),
    },
    specialtyCaps,
    og,
    working.batch_size_l,
    working.efficiency_pct
  );

  const { plan: hopPlan, ingredients: hopIngredients } = buildHopPlan(
    targets.ibu,
    working.hop_families,
    working.batch_size_l,
    working.attenuation
  );

  const yeastIngredient: ProposalIngredient = {
    kind: 'yeast',
    name: working.yeast_family.name,
    amount: 1,
    unit: 'pkg',
  };

  const proposal: ProposalOutput = {
    targets,
    og,
    fg,
    attenuation: working.attenuation,
    mash_temp_c: round(working.mash_temp_c, 1),
    water_bias: working.water_bias,
    base_malt: {
      name: working.base_malt.name,
      percent: Number(working.base_malt.percent),
    },
    specialty_caps: specialtyCaps,
    hop_plan: hopPlan,
    yeast_family: working.yeast_family.name,
    batch_size_l: working.batch_size_l,
    efficiency_pct: working.efficiency_pct,
  };

  const allIngredients = [...grainBill, ...hopIngredients, yeastIngredient];
  const substitutionResult = applyInventorySubstitutions(
    proposal,
    allIngredients,
    catalog,
    inventoryLots,
    input.prefer_in_stock
  );

  if (substitutionResult.substitutions) {
    proposal.substitutions = substitutionResult.substitutions;
  }

  const selectedKeywords = extractSelectionKeywords(input.selections, optionIndex);
  const classDesignation = computeClassDesignation(proposal, selectedKeywords, baStyles);
  const similarTo = computeSimilarMatches(proposal, selectedKeywords, cloneReference);

  const mashSteps: MashStep[] = [
    {
      order_index: 0,
      name: 'Single Infusion',
      temp_c: round(working.mash_temp_c, 1),
      duration_min: 60,
    },
  ];

  const fermentationSteps: FermentationStep[] = [
    {
      order_index: 0,
      stage: 'primary',
      temp_c: Number(working.yeast_family.temp_c ?? 19),
      duration_days: Number(working.yeast_family.duration_days ?? 7),
    },
  ];

  return {
    proposal,
    ingredients: substitutionResult.nextIngredients,
    mash_steps: mashSteps,
    fermentation_steps: fermentationSteps,
    class_designation: classDesignation,
    similar_to: similarTo,
  };
};

export const computeManualPrediction = (params: {
  ingredients: ProposalIngredient[];
  targets: TargetBlock;
  batch_size_l: number;
  efficiency_pct: number;
  catalog: CatalogIngredient[];
  baStyles: Array<{
    style: string;
    abv: [number, number];
    ibu: [number, number];
    srm: [number, number];
    keywords?: string[];
  }>;
  cloneReference: Array<{
    name: string;
    style: string;
    abv: number;
    ibu: number;
    srm: number;
    descriptors?: string[];
  }>;
  selectedKeywords?: string[];
}): ManualPredictionOutput => {
  const { predicted, warnings } = computePredictedMetrics(
    params.ingredients,
    params.batch_size_l,
    params.efficiency_pct
  );

  const descriptorProfile = descriptorProfileFromIngredients(params.ingredients, params.catalog);
  const descriptorKeywords = descriptorProfile.map((entry) => entry.key);
  const mergedKeywords = [...new Set([...(params.selectedKeywords ?? []), ...descriptorKeywords])];

  const pseudoProposal: ProposalOutput = {
    targets: {
      abv: { min: predicted.abv, max: predicted.abv },
      ibu: { min: predicted.ibu, max: predicted.ibu },
      srm: { min: predicted.srm, max: predicted.srm },
    },
    og: predicted.og,
    fg: predicted.fg,
    attenuation: estimateAttenuation(params.ingredients),
    mash_temp_c: 66,
    water_bias: 'Balanced profile',
    base_malt: { name: 'Manual Base', percent: 100 },
    specialty_caps: [],
    hop_plan: [],
    yeast_family: 'Manual',
    batch_size_l: params.batch_size_l,
    efficiency_pct: params.efficiency_pct,
  };

  const classDesignation = computeClassDesignation(pseudoProposal, mergedKeywords, params.baStyles);
  const similarTo = computeSimilarMatches(pseudoProposal, mergedKeywords, params.cloneReference);

  const targetVsPredicted = {
    abv: {
      target: round((params.targets.abv.min + params.targets.abv.max) / 2, 2),
      predicted: predicted.abv,
      delta: round(predicted.abv - (params.targets.abv.min + params.targets.abv.max) / 2, 2),
    },
    ibu: {
      target: round((params.targets.ibu.min + params.targets.ibu.max) / 2, 1),
      predicted: predicted.ibu,
      delta: round(predicted.ibu - (params.targets.ibu.min + params.targets.ibu.max) / 2, 1),
    },
    srm: {
      target: round((params.targets.srm.min + params.targets.srm.max) / 2, 1),
      predicted: predicted.srm,
      delta: round(predicted.srm - (params.targets.srm.min + params.targets.srm.max) / 2, 1),
    },
  };

  return {
    predicted,
    warnings,
    descriptor_profile: descriptorProfile,
    class_designation: classDesignation,
    similar_to: similarTo,
    target_vs_predicted: targetVsPredicted,
  };
};

export const cloneTargets = (targets: TargetBlock): TargetBlock => deepCopy(targets);

export const defaultSelections = (): Record<string, string[]> => ({
  tasting_notes: [],
  aroma_profile: [],
  mouthfeel: [],
});

export const cloneFromSelectionPayload = (clone: CloneCandidate): Record<string, string[]> => {
  const selections = defaultSelections();
  Object.entries(clone.selections ?? {}).forEach(([category, keys]) => {
    selections[category] = [...keys];
  });
  return selections;
};
