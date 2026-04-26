import authorityRaw from '../data/seed_catalog_authority_v1.json';
import type { CatalogIngredient } from './lab-types';

type SeedType = 'malt' | 'hop' | 'yeast' | 'adjunct';

interface AuthorityEntry {
  type: string;
  name: string;
  spec_json?: Record<string, unknown>;
  source_refs?: Array<{ label?: string; url?: string; captured_at?: string }>;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const round = (value: number, digits = 3): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const asRange = (value: unknown): [number, number] | undefined => {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const min = asNumber(value[0]);
  const max = asNumber(value[1]);
  if (min === undefined || max === undefined) return undefined;
  return min <= max ? [min, max] : [max, min];
};

const rangeMid = (value: unknown): number | undefined => {
  const range = asRange(value);
  if (!range) return undefined;
  return (range[0] + range[1]) / 2;
};

const slugify = (value: string): string =>
  value
    .trim()
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const catalogType = (value: string): SeedType => {
  if (value === 'malt' || value === 'hop' || value === 'yeast' || value === 'adjunct') return value;
  return 'adjunct';
};

export const resolveCatalogPpg = (spec: Record<string, unknown>): number | undefined => {
  const direct = asNumber(spec.ppg);
  if (direct !== undefined && direct > 0) return direct;
  const typical = asNumber(spec.ppg_typical);
  if (typical !== undefined && typical > 0) return typical;
  const fromRange = rangeMid(spec.ppg_range);
  if (fromRange !== undefined && fromRange > 0) return fromRange;

  const extractMin = asNumber(spec.extract_fgdb_min_pct);
  const extractRangeMid = rangeMid(spec.extract_fgdb_range_pct);
  const extract = extractRangeMid ?? extractMin;
  if (extract !== undefined && extract > 0) {
    return round((extract / 100) * 46, 1);
  }

  return undefined;
};

export const resolveCatalogColorSrm = (spec: Record<string, unknown>): number | undefined => {
  const direct = asNumber(spec.color_srm);
  if (direct !== undefined && direct > 0) return direct;
  const lovibond = asNumber(spec.lovibond);
  if (lovibond !== undefined && lovibond > 0) return lovibond;
  const colorRangeMid = rangeMid(spec.color_srm_range);
  if (colorRangeMid !== undefined && colorRangeMid > 0) return colorRangeMid;
  const lovibondRangeMid = rangeMid(spec.lovibond_range);
  if (lovibondRangeMid !== undefined && lovibondRangeMid > 0) return lovibondRangeMid;
  return undefined;
};

export const resolveCatalogHopAlpha = (spec: Record<string, unknown>): number | undefined => {
  const actual = asNumber(spec.alpha_acid_actual);
  if (actual !== undefined && actual > 0) return actual <= 1 ? actual : actual / 100;
  const typical = asNumber(spec.alpha_acid_typical);
  if (typical !== undefined && typical > 0) return typical <= 1 ? typical : typical / 100;
  const fromRange = rangeMid(spec.alpha_acid_range);
  if (fromRange !== undefined && fromRange > 0) return fromRange <= 1 ? fromRange : fromRange / 100;
  const alpha = asNumber(spec.alpha_acid);
  if (alpha !== undefined && alpha > 0) return alpha <= 1 ? alpha : alpha / 100;
  return undefined;
};

export const resolveCatalogYeastAttenuation = (spec: Record<string, unknown>): number | undefined => {
  const direct = asNumber(spec.attenuation_mid);
  if (direct !== undefined && direct > 0) return direct;
  const fromRange = rangeMid(spec.attenuation_range);
  if (fromRange !== undefined && fromRange > 0) return fromRange;
  const attenuation = asNumber(spec.attenuation);
  if (attenuation !== undefined && attenuation > 0) return attenuation;
  return undefined;
};

const ensureDerivedSpec = (type: SeedType, incoming: Record<string, unknown>): Record<string, unknown> => {
  const spec: Record<string, unknown> = { ...incoming };

  if (type === 'malt') {
    const ppg = resolveCatalogPpg(spec);
    if (ppg !== undefined) {
      spec.ppg = round(ppg, 1);
      if (spec.ppg_typical === undefined) spec.ppg_typical = round(ppg, 1);
      if (!asRange(spec.ppg_range)) {
        spec.ppg_range = [round(Math.max(0, ppg - 0.8), 1), round(ppg + 0.8, 1)];
      }
    }

    const color = resolveCatalogColorSrm(spec);
    if (color !== undefined) {
      spec.color_srm = round(color, 1);
      if (spec.lovibond === undefined) spec.lovibond = round(color, 1);
      if (!asRange(spec.color_srm_range)) {
        spec.color_srm_range = [round(Math.max(0.2, color * 0.92), 1), round(color * 1.08, 1)];
      }
      if (!asRange(spec.lovibond_range)) {
        spec.lovibond_range = [round(Math.max(0.2, color * 0.92), 1), round(color * 1.08, 1)];
      }
    }
  }

  if (type === 'hop') {
    const alpha = resolveCatalogHopAlpha(spec);
    if (alpha !== undefined) {
      const clamped = clamp(alpha, 0.001, 0.25);
      spec.alpha_acid_typical = round(clamped, 3);
      if (!asRange(spec.alpha_acid_range)) {
        spec.alpha_acid_range = [round(Math.max(0.001, clamped - 0.015), 3), round(clamped + 0.015, 3)];
      }
    }
  }

  if (type === 'yeast') {
    const attenuation = resolveCatalogYeastAttenuation(spec);
    if (attenuation !== undefined) {
      const clamped = clamp(attenuation, 0.6, 0.95);
      spec.attenuation_mid = round(clamped, 3);
      if (!asRange(spec.attenuation_range)) {
        spec.attenuation_range = [round(Math.max(0.6, clamped - 0.03), 3), round(Math.min(0.95, clamped + 0.03), 3)];
      }
    }

    if (spec.temp_c_typical === undefined) {
      const mid = rangeMid(spec.temp_range_c);
      if (mid !== undefined) spec.temp_c_typical = round(mid, 1);
    }
  }

  return spec;
};

const authorityByKey = (authority: AuthorityEntry[]): Map<string, AuthorityEntry> => {
  const map = new Map<string, AuthorityEntry>();
  authority.forEach((entry) => {
    const key = `${catalogType(String(entry.type))}:${slugify(entry.name)}`;
    map.set(key, entry);
  });
  return map;
};

export const buildSeedCatalog = (rawCatalog: Array<Record<string, unknown>>): CatalogIngredient[] => {
  const authority = authorityByKey(authorityRaw as AuthorityEntry[]);

  return rawCatalog.map((raw) => {
    const type = catalogType(String(raw.type ?? 'adjunct'));
    const name = String(raw.name ?? 'Unknown');
    const key = `${type}:${slugify(name)}`;
    const match = authority.get(key);

    const baseSpec = (raw.spec_json as Record<string, unknown>) ?? {};
    const authoritySpec = match?.spec_json ?? {};
    const mergedSpec = ensureDerivedSpec(type, { ...baseSpec, ...authoritySpec });
    if (match?.source_refs && match.source_refs.length > 0) {
      mergedSpec.source_refs = match.source_refs;
    }

    const sensoryInput = (raw.sensory_json as Record<string, unknown>) ?? {};
    const sensory_json: Record<string, number> = {};
    Object.entries(sensoryInput).forEach(([descriptor, value]) => {
      const numeric = asNumber(value);
      if (numeric === undefined) return;
      sensory_json[descriptor] = numeric;
    });

    return {
      id: String(raw.id ?? ''),
      type,
      name,
      spec_json: mergedSpec,
      sensory_json,
      active: raw.active !== false,
    };
  });
};

