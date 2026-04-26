import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock3 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CanvasProject, ImportedRecipe } from '@/features/canvas/types';
import type { ProductRecord, BeverageClass } from '@/features/products/types';
import { formatVolumeNumber } from '@/lib/volume-format';

type NewBatchStatus = 'planned' | 'in_progress';
type BatchKind = 'source' | 'derived';
type PlannedVesselKind = 'vessel' | 'bright_tank' | 'barrel' | 'package_line' | 'other';
type SweetnessLevel = 'bone_dry' | 'semi_dry' | 'semi_sweet' | 'sweet';

interface BatchRecord {
  id: string;
  siteId: string;
  batchCode?: string;
  lotCode: string;
  batchKind?: BatchKind;
  recipeId?: string;
  recipeName: string;
  skuId?: string;
  status: string;
  producedQty: number;
  allocatedQty: number;
  dispensedQty?: number;
  unit: string;
  containerLabel?: string;
  containerKind?: PlannedVesselKind;
  plannedVesselLabel?: string;
  plannedVesselKind?: PlannedVesselKind;
  updatedAt: string;
  productSnapshot?: {
    productId?: string;
    productCode?: string;
    productName?: string;
    beverageClass?: BeverageClass;
  };
  intendedRecipe?: {
    targets?: {
      targetAbvPct?: number;
      targetResidualSugarPct?: number;
      targetResidualSugarGpl?: number;
      targetSweetnessLevel?: SweetnessLevel;
    };
  };
  actualResults?: {
    sgLatest?: number;
    phLatest?: number;
    abvPct?: number;
    brixLatest?: number;
    titratableAcidityGplLatest?: number;
    so2PpmLatest?: number;
  };
  stageTimeline?: Array<{
    id: string;
    stage?: string;
    timestamp?: string;
  }>;
}

interface RecipeOption {
  key: string;
  label: string;
  recipeId?: string;
  productId?: string;
  productCode?: string;
  skuId?: string;
  beverageClass?: BeverageClass;
  defaultUnit?: string;
  targetAbvPct?: number;
  targetResidualSugarPct?: number;
  targetResidualSugarGpl?: number;
  targetSweetnessLevel?: SweetnessLevel;
  sourceLabel: string;
}

interface DerivedBatchNameOption {
  key: string;
  label: string;
  sourceLabel: string;
}

interface UnitOption {
  value: string;
  label: string;
}

interface SiteSettingsSnapshot {
  defaultSiteId?: string;
  defaultVolumeUnit?: string;
  requireRecipeBeforeBatch?: boolean;
}

const SWEETNESS_LEVEL_OPTIONS: Array<{ value: SweetnessLevel; label: string }> = [
  { value: 'bone_dry', label: 'Bone-dry / Dry' },
  { value: 'semi_dry', label: 'Semi-dry' },
  { value: 'semi_sweet', label: 'Semi-sweet' },
  { value: 'sweet', label: 'Sweet' },
];

interface CanvasVesselOption {
  value: string;
  label: string;
  vesselKind: PlannedVesselKind;
  vesselType: string;
  logicalDeviceId?: string;
  capacity?: number;
}

interface SiteOption {
  value: string;
  label: string;
}

interface LocationRecord {
  siteId: string;
  name: string;
  timezone: string;
  active: boolean;
}

const NEW_RECIPE_OPTION_VALUE = '__new_recipe__';
const NEW_DERIVED_NAME_OPTION_VALUE = '__new_derived_name__';
const BATCH_UNIT_OPTIONS: UnitOption[] = [
  { value: 'bbl', label: 'barrels (bbl)' },
  { value: 'gal', label: 'gallons (gal)' },
  { value: 'L', label: 'liters (L)' },
  { value: 'mL', label: 'milliliters (mL)' },
];

const normalizeBatchUnit = (value: string | undefined): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'bbls' || normalized === 'barrel' || normalized === 'barrels') {
    return 'bbl';
  }
  if (
    normalized === 'gal' ||
    normalized === 'gals' ||
    normalized === 'gallon' ||
    normalized === 'gallons' ||
    normalized === 'g'
  ) {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

const isSupportedBatchUnit = (value: string | undefined): boolean =>
  BATCH_UNIT_OPTIONS.some((option) => option.value === value);

const availableQty = (batch: BatchRecord): number =>
  Math.max(0, batch.producedQty - batch.allocatedQty - (batch.dispensedQty ?? 0));

const vesselLabelForBatch = (batch: BatchRecord): string | undefined => {
  const label = String(batch.containerLabel ?? batch.plannedVesselLabel ?? '').trim();
  return label.length > 0 ? label : undefined;
};

const formatStatusLabel = (value: string | undefined): string =>
  String(value ?? '')
    .trim()
    .replaceAll('_', ' ') || 'unknown';

const latestStageLabel = (batch: BatchRecord): string | undefined => {
  const latest = [...(batch.stageTimeline ?? [])]
    .sort((left, right) => String(right.timestamp ?? '').localeCompare(String(left.timestamp ?? '')))
    .find((entry) => String(entry.stage ?? '').trim().length > 0);
  return latest?.stage
    ? latest.stage.replaceAll('_', ' ')
    : undefined;
};

const formatMetric = (value: number | undefined, digits: number, suffix = ''): string =>
  value !== undefined ? `${value.toFixed(digits)}${suffix}` : '--';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const readRecipeMetadataText = (recipe: ImportedRecipe, keys: string[]): string | undefined => {
  const pools = [
    asRecord(recipe.metadata),
    asRecord(recipe.complianceProfile),
    asRecord(recipe.recipeComplianceSnapshot),
    asRecord(asRecord(recipe.metadata).meta),
  ];
  for (const pool of pools) {
    for (const key of keys) {
      const value = String(pool[key] ?? '').trim();
      if (value) {
        return value;
      }
    }
  }
  return undefined;
};

const readRecipeMetadataNumber = (recipe: ImportedRecipe, keys: string[]): number | undefined => {
  const pools = [
    asRecord(recipe.metadata),
    asRecord(recipe.complianceProfile),
    asRecord(recipe.recipeComplianceSnapshot),
    asRecord(asRecord(recipe.metadata).meta),
  ];
  for (const pool of pools) {
    for (const key of keys) {
      const next = Number(pool[key]);
      if (Number.isFinite(next)) {
        return next;
      }
    }
  }
  return undefined;
};

const normalizeSweetnessLevel = (value: unknown): SweetnessLevel | undefined => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (
    normalized === 'bone_dry' ||
    normalized === 'semi_dry' ||
    normalized === 'semi_sweet' ||
    normalized === 'sweet'
  ) {
    return normalized;
  }
  return undefined;
};

const residualSugarPctToGpl = (value?: number): number | undefined =>
  value !== undefined && Number.isFinite(value) ? Number((value * 10).toFixed(2)) : undefined;

const parseRecipeBeverageClass = (recipe: ImportedRecipe): BeverageClass | undefined => {
  const value = readRecipeMetadataText(recipe, [
    'beverageClass',
    'beverage_class',
    'recipeType',
    'recipe_type',
    'productType',
    'product_type',
  ]);
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'cider' || normalized === 'hard_cider' || normalized === 'perry') {
    return 'cider';
  }
  if (normalized === 'wine') {
    return 'wine';
  }
  if (normalized === 'beer' || normalized === 'malt_beverage' || normalized === 'malt beverage') {
    return 'beer';
  }
  if (normalized === 'other') {
    return 'other';
  }
  return undefined;
};

const buildRecipeOptions = (params: {
  products: ProductRecord[];
  recipes: ImportedRecipe[];
  batches: BatchRecord[];
}): RecipeOption[] => {
  const seen = new Set<string>();
  const options: RecipeOption[] = [];

  params.products.forEach((product) => {
    const key = `product:${product.productId}`;
    seen.add(`product:${product.productCode.toLowerCase()}`);
    options.push({
      key,
      label: product.name,
      productId: product.productId,
      productCode: product.productCode,
      skuId: product.defaultSkuId,
      beverageClass: product.beverageClass,
      sourceLabel: 'Product catalog',
    });
  });

  params.recipes.forEach((recipe) => {
    const dedupeKey = `recipe:${recipe.name.toLowerCase()}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    options.push({
      key: `recipe:${recipe.id}`,
      label: recipe.name,
      recipeId: recipe.id,
      productId: readRecipeMetadataText(recipe, ['productId', 'product_id']),
      productCode: readRecipeMetadataText(recipe, ['productCode', 'product_code']),
      skuId: readRecipeMetadataText(recipe, ['skuId', 'sku_id']),
      beverageClass: parseRecipeBeverageClass(recipe),
      defaultUnit: readRecipeMetadataText(recipe, ['defaultUnit', 'default_unit']),
      targetAbvPct: readRecipeMetadataNumber(recipe, ['targetAbvPct', 'target_abv_pct']),
      targetResidualSugarPct: readRecipeMetadataNumber(recipe, [
        'targetResidualSugarPct',
        'target_residual_sugar_pct',
      ]),
      targetResidualSugarGpl: readRecipeMetadataNumber(recipe, [
        'targetResidualSugarGpl',
        'target_residual_sugar_gpl',
      ]),
      targetSweetnessLevel: normalizeSweetnessLevel(
        readRecipeMetadataText(recipe, ['targetSweetnessLevel', 'target_sweetness_level'])
      ),
      sourceLabel: 'Imported recipe',
    });
  });

  params.batches.forEach((batch) => {
    if (batch.batchKind === 'derived') return;
    const dedupeKey = `batch:${batch.recipeName.toLowerCase()}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    options.push({
      key: `batch:${batch.id}`,
      label: batch.recipeName,
      recipeId: batch.recipeId,
      productId: batch.productSnapshot?.productId,
      productCode: batch.productSnapshot?.productCode,
      skuId: batch.skuId,
      beverageClass: batch.productSnapshot?.beverageClass,
      targetAbvPct: batch.intendedRecipe?.targets?.targetAbvPct,
      targetResidualSugarPct: batch.intendedRecipe?.targets?.targetResidualSugarPct,
      targetResidualSugarGpl: batch.intendedRecipe?.targets?.targetResidualSugarGpl,
      targetSweetnessLevel: batch.intendedRecipe?.targets?.targetSweetnessLevel,
      sourceLabel: 'Recent batch',
    });
  });

  return options.sort((left, right) => left.label.localeCompare(right.label));
};

const buildDerivedBatchNameOptions = (params: {
  batches: BatchRecord[];
  sourceBatch: BatchRecord | null;
}): DerivedBatchNameOption[] => {
  const options: DerivedBatchNameOption[] = [];
  const seen = new Set<string>();

  const addOption = (label: string | undefined, sourceLabel: string) => {
    const normalized = String(label ?? '').trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      key: `derived-name:${key}`,
      label: normalized,
      sourceLabel,
    });
  };

  addOption(params.sourceBatch?.recipeName, 'Source batch');

  params.batches
    .filter((batch) => batch.batchKind === 'derived')
    .forEach((batch) => addOption(batch.recipeName, 'Previous derived batch'));

  return options.sort((left, right) => {
    if (left.sourceLabel !== right.sourceLabel) {
      if (left.sourceLabel === 'Source batch') return -1;
      if (right.sourceLabel === 'Source batch') return 1;
    }
    return left.label.localeCompare(right.label);
  });
};

const isEligibleDerivedSource = (batch: BatchRecord): boolean =>
  batch.batchKind !== 'derived' &&
  batch.status !== 'planned' &&
  batch.status !== 'canceled' &&
  batch.status !== 'shipped' &&
  availableQty(batch) > 0;

const buildCanvasVesselOptions = (project: CanvasProject): CanvasVesselOption[] => {
  const publishedPages = (project.pages ?? []).filter((page) => page.mode === 'published');
  const sourcePages = publishedPages.length > 0 ? publishedPages : (project.pages ?? []);
  const seen = new Set<string>();
  const options: CanvasVesselOption[] = [];

  for (const page of sourcePages) {
    for (const node of page.nodes ?? []) {
      if (node.data.widgetType !== 'vessel') continue;
      const label = String(node.data.label ?? '').trim();
      if (!label) continue;
      const key = `${label.toLowerCase()}::${String(node.data.config?.vesselType ?? 'generic').toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const vesselType = String(node.data.config?.vesselType ?? 'generic').trim() || 'generic';
      options.push({
        value: node.id,
        label,
        vesselKind: vesselType === 'bright_tank' ? 'bright_tank' : 'vessel',
        vesselType,
        logicalDeviceId: node.data.logicalDeviceId ? String(node.data.logicalDeviceId).trim() : undefined,
        capacity:
          typeof node.data.config?.capacity === 'number' && Number.isFinite(node.data.config.capacity)
            ? node.data.config.capacity
            : undefined,
      });
    }
  }

  return options.sort((left, right) => left.label.localeCompare(right.label));
};

const formatCanvasVesselType = (value: string): string =>
  value
    .trim()
    .replaceAll('_', ' ')
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());

const buildSiteOptions = (params: {
  locations: LocationRecord[];
  defaultSiteId?: string;
}): SiteOption[] => {
  const options = params.locations
    .filter((location) => location.active !== false)
    .map((location) => ({
      value: String(location.siteId).trim().toLowerCase(),
      label: String(location.name).trim() || String(location.siteId).trim(),
    }));
  options.sort((left, right) => {
    if (left.value === params.defaultSiteId) return -1;
    if (right.value === params.defaultSiteId) return 1;
    return left.label.localeCompare(right.label);
  });
  return options;
};

const parseDateTimeValue = (value: string): Date | undefined => {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = parse(normalized, "yyyy-MM-dd'T'HH:mm", new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const formatDateTimeValue = (value: Date): string => format(value, "yyyy-MM-dd'T'HH:mm");

const formatDateTimeButtonLabel = (value: string): string => {
  const parsed = parseDateTimeValue(value);
  return parsed ? format(parsed, 'MMM d, yyyy h:mm a') : 'Select date & time';
};

const updateDatePortion = (currentValue: string, nextDate: Date | undefined): string => {
  if (!nextDate) return '';
  const current = parseDateTimeValue(currentValue);
  const hours = current?.getHours() ?? 8;
  const minutes = current?.getMinutes() ?? 0;
  const next = new Date(nextDate);
  next.setHours(hours, minutes, 0, 0);
  return formatDateTimeValue(next);
};

const updateTimePortion = (currentValue: string, nextTime: string): string => {
  const [hoursText, minutesText] = nextTime.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return currentValue;
  }
  const current = parseDateTimeValue(currentValue) ?? new Date();
  const next = new Date(current);
  next.setHours(hours, minutes, 0, 0);
  return formatDateTimeValue(next);
};

function DateTimePickerField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateTimeValue(props.value);
  const timeValue = selectedDate ? format(selectedDate, 'HH:mm') : '08:00';

  return (
    <div className="space-y-1">
      <Label>{props.label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {formatDateTimeButtonLabel(props.value)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="border-b border-border/60 p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(nextDate) => props.onChange(updateDatePortion(props.value, nextDate))}
              initialFocus
            />
          </div>
          <div className="flex items-center gap-2 p-3">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              step="60"
              value={timeValue}
              onChange={(event) => props.onChange(updateTimePortion(props.value, event.target.value))}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function NewBatchPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [siteSettings, setSiteSettings] = useState<SiteSettingsSnapshot>({
    defaultSiteId: 'main',
    defaultVolumeUnit: 'bbl',
    requireRecipeBeforeBatch: true,
  });

  const [recipeOptions, setRecipeOptions] = useState<RecipeOption[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [canvasVesselOptions, setCanvasVesselOptions] = useState<CanvasVesselOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([{ value: 'main', label: 'Main' }]);
  const [selectedRecipeKey, setSelectedRecipeKey] = useState('');
  const [selectedSourceBatchId, setSelectedSourceBatchId] = useState('');
  const [selectedDerivedNameKey, setSelectedDerivedNameKey] = useState('');
  const [selectedCanvasVesselId, setSelectedCanvasVesselId] = useState('');

  const [batchKind, setBatchKind] = useState<BatchKind>('source');
  const [siteId, setSiteId] = useState('main');
  const [unit, setUnit] = useState('bbl');
  const [producedQty, setProducedQty] = useState('');
  const [batchStatus, setBatchStatus] = useState<NewBatchStatus>('planned');
  const [plannedVesselLabel, setPlannedVesselLabel] = useState('');
  const [plannedVesselKind, setPlannedVesselKind] = useState<PlannedVesselKind>('vessel');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [targetAbvPct, setTargetAbvPct] = useState('');
  const [targetResidualSugarPct, setTargetResidualSugarPct] = useState('');
  const [targetSweetnessLevel, setTargetSweetnessLevel] = useState<SweetnessLevel | ''>('');
  const [newRecipeOpen, setNewRecipeOpen] = useState(false);
  const [newRecipeBusy, setNewRecipeBusy] = useState(false);
  const [newRecipeError, setNewRecipeError] = useState('');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeProductCode, setNewRecipeProductCode] = useState('');
  const [newRecipeBeverageClass, setNewRecipeBeverageClass] = useState<BeverageClass>('cider');
  const [newRecipeTargetAbvPct, setNewRecipeTargetAbvPct] = useState('');
  const [newRecipeTargetResidualSugarPct, setNewRecipeTargetResidualSugarPct] = useState('');
  const [newRecipeTargetSweetnessLevel, setNewRecipeTargetSweetnessLevel] = useState<SweetnessLevel | ''>('');
  const [newRecipeDefaultUnit, setNewRecipeDefaultUnit] = useState('bbl');
  const [newDerivedNameOpen, setNewDerivedNameOpen] = useState(false);
  const [newDerivedName, setNewDerivedName] = useState('');
  const [newDerivedNameError, setNewDerivedNameError] = useState('');

  const loadBatchSetup = useCallback(
    async (preferred?: { recipeId?: string; productId?: string }) => {
      setLoading(true);
      try {
        const [productsResponse, recipesResponse, batchesResponse, settingsResponse, canvasResponse, locationsResponse] = await Promise.all([
          fetch('/api/os/products'),
          fetch('/api/os/recipes'),
          fetch('/api/os/batches'),
          fetch('/api/os/settings'),
          fetch('/api/os/canvas/project'),
          fetch('/api/os/locations'),
        ]);
        const [productsPayload, recipesPayload, batchesPayload, settingsPayload, canvasPayload, locationsPayload] = await Promise.all([
          productsResponse.json().catch(() => null),
          recipesResponse.json().catch(() => null),
          batchesResponse.json().catch(() => null),
          settingsResponse.json().catch(() => null),
          canvasResponse.json().catch(() => null),
          locationsResponse.json().catch(() => null),
        ]);

        if (!productsResponse.ok || !productsPayload?.success) {
          throw new Error(productsPayload?.error ?? 'Failed to load products.');
        }
        if (!recipesResponse.ok || !recipesPayload?.success) {
          throw new Error(recipesPayload?.error ?? 'Failed to load recipes.');
        }
        if (!batchesResponse.ok || !batchesPayload?.success) {
          throw new Error(batchesPayload?.error ?? 'Failed to load batches.');
        }
        if (!settingsResponse.ok || !settingsPayload?.success) {
          throw new Error(settingsPayload?.error ?? 'Failed to load settings.');
        }
        if (!canvasResponse.ok || !canvasPayload?.success) {
          throw new Error(canvasPayload?.error ?? 'Failed to load commissioned brewhouse vessels.');
        }
        if (!locationsResponse.ok || !locationsPayload?.success) {
          throw new Error(locationsPayload?.error ?? 'Failed to load commissioned locations.');
        }

        const nextBatches = (batchesPayload.data?.batches ?? []) as BatchRecord[];
        const nextCanvasVessels = buildCanvasVesselOptions((canvasPayload.data ?? {}) as CanvasProject);
        const nextLocations = (locationsPayload.data?.locations ?? []) as LocationRecord[];
        const nextSettings: SiteSettingsSnapshot = {
          defaultSiteId: String(settingsPayload.data?.defaultSiteId ?? 'main').trim() || 'main',
          defaultVolumeUnit: normalizeBatchUnit(settingsPayload.data?.defaultVolumeUnit),
          requireRecipeBeforeBatch:
            typeof settingsPayload.data?.requireRecipeBeforeBatch === 'boolean'
              ? settingsPayload.data.requireRecipeBeforeBatch
              : true,
        };
        const nextOptions = buildRecipeOptions({
          products: (productsPayload.data ?? []) as ProductRecord[],
          recipes: (recipesPayload.data ?? []) as ImportedRecipe[],
          batches: nextBatches,
        });

        setSiteSettings(nextSettings);
        setBatches(nextBatches);
        setCanvasVesselOptions(nextCanvasVessels);
        setSiteOptions(
          buildSiteOptions({
            locations: nextLocations,
            defaultSiteId: nextSettings.defaultSiteId,
          })
        );
        setRecipeOptions(nextOptions);
        setSiteId((current) => {
          const trimmed = current.trim();
          return !trimmed || trimmed === 'main' ? nextSettings.defaultSiteId ?? 'main' : current;
        });
        setUnit((current) => {
          const normalizedCurrent = normalizeBatchUnit(current);
          return normalizedCurrent === 'bbl'
            ? normalizeBatchUnit(nextSettings.defaultVolumeUnit)
            : normalizedCurrent;
        });
        setSelectedRecipeKey((current) => {
          const preferredKey =
            nextOptions.find((option) => option.recipeId === preferred?.recipeId)?.key ??
            nextOptions.find((option) => option.productId === preferred?.productId)?.key;
          return preferredKey ?? current ?? nextOptions[0]?.key ?? '';
        });
        const eligibleSources = nextBatches.filter(isEligibleDerivedSource);
        setSelectedSourceBatchId((current) => current || eligibleSources[0]?.id || '');
        setSelectedCanvasVesselId((current) => {
          if (current && nextCanvasVessels.some((option) => option.value === current)) {
            return current;
          }
          return nextCanvasVessels[0]?.value ?? '';
        });
        setStatusMessage('');
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Failed to load batch setup.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadBatchSetup();
  }, [loadBatchSetup]);

  useEffect(() => {
    if (batchKind === 'derived') {
      setBatchStatus('in_progress');
      setScheduledStartAt('');
      setScheduledEndAt('');
      return;
    }
    setBatchStatus('planned');
  }, [batchKind]);

  const selectedRecipe = useMemo(
    () => recipeOptions.find((option) => option.key === selectedRecipeKey) ?? null,
    [recipeOptions, selectedRecipeKey]
  );

  const selectedCanvasVessel = useMemo(
    () => canvasVesselOptions.find((option) => option.value === selectedCanvasVesselId) ?? null,
    [canvasVesselOptions, selectedCanvasVesselId]
  );

  useEffect(() => {
    if (batchKind !== 'source' || !selectedRecipe?.defaultUnit) {
      return;
    }
    setUnit(normalizeBatchUnit(selectedRecipe.defaultUnit));
  }, [batchKind, selectedRecipe]);

  useEffect(() => {
    if (batchKind !== 'source') {
      return;
    }
    if (!selectedRecipe?.defaultUnit) {
      setUnit(normalizeBatchUnit(siteSettings.defaultVolumeUnit));
    }
  }, [batchKind, selectedRecipe?.defaultUnit, siteSettings.defaultVolumeUnit]);

  const eligibleSourceBatches = useMemo(
    () => batches.filter(isEligibleDerivedSource).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [batches]
  );

  const selectedSourceBatch = useMemo(
    () => eligibleSourceBatches.find((batch) => batch.id === selectedSourceBatchId) ?? null,
    [eligibleSourceBatches, selectedSourceBatchId]
  );

  useEffect(() => {
    if (batchKind === 'derived') {
      setTargetAbvPct(selectedSourceBatch?.intendedRecipe?.targets?.targetAbvPct?.toString() ?? '');
      setTargetResidualSugarPct(
        selectedSourceBatch?.intendedRecipe?.targets?.targetResidualSugarPct?.toString() ?? ''
      );
      setTargetSweetnessLevel(selectedSourceBatch?.intendedRecipe?.targets?.targetSweetnessLevel ?? '');
      return;
    }

    setTargetAbvPct(selectedRecipe?.targetAbvPct?.toString() ?? '');
    setTargetResidualSugarPct(selectedRecipe?.targetResidualSugarPct?.toString() ?? '');
    setTargetSweetnessLevel(selectedRecipe?.targetSweetnessLevel ?? '');
  }, [batchKind, selectedRecipe, selectedSourceBatch]);

  const derivedBatchNameOptions = useMemo(
    () => buildDerivedBatchNameOptions({ batches, sourceBatch: selectedSourceBatch }),
    [batches, selectedSourceBatch]
  );

  const selectedDerivedName = useMemo(
    () => derivedBatchNameOptions.find((option) => option.key === selectedDerivedNameKey) ?? null,
    [derivedBatchNameOptions, selectedDerivedNameKey]
  );

  useEffect(() => {
    if (eligibleSourceBatches.length === 0) {
      if (selectedSourceBatchId) {
        setSelectedSourceBatchId('');
      }
      return;
    }

    const hasCurrentSelection = eligibleSourceBatches.some((batch) => batch.id === selectedSourceBatchId);
    if (!hasCurrentSelection) {
      setSelectedSourceBatchId(eligibleSourceBatches[0]?.id ?? '');
    }
  }, [eligibleSourceBatches, selectedSourceBatchId]);

  useEffect(() => {
    if (canvasVesselOptions.length === 0) {
      if (selectedCanvasVesselId) {
        setSelectedCanvasVesselId('');
      }
      return;
    }
    if (!canvasVesselOptions.some((option) => option.value === selectedCanvasVesselId)) {
      setSelectedCanvasVesselId(canvasVesselOptions[0]?.value ?? '');
    }
  }, [canvasVesselOptions, selectedCanvasVesselId]);

  useEffect(() => {
    if (siteOptions.length === 0) {
      return;
    }
    if (!siteOptions.some((option) => option.value === siteId)) {
      setSiteId(siteOptions[0]?.value ?? 'main');
    }
  }, [siteId, siteOptions]);

  useEffect(() => {
    if (batchKind !== 'derived') {
      return;
    }
    if (derivedBatchNameOptions.length === 0) {
      if (selectedDerivedNameKey) {
        setSelectedDerivedNameKey('');
      }
      return;
    }
    const hasCurrentSelection = derivedBatchNameOptions.some((option) => option.key === selectedDerivedNameKey);
    if (!hasCurrentSelection) {
      setSelectedDerivedNameKey(derivedBatchNameOptions[0]?.key ?? '');
    }
  }, [batchKind, derivedBatchNameOptions, selectedDerivedNameKey]);

  useEffect(() => {
    if (!selectedSourceBatch || batchKind !== 'derived') {
      return;
    }
    setSiteId(selectedSourceBatch.siteId);
    setUnit(normalizeBatchUnit(selectedSourceBatch.unit));
    setProducedQty((current) => (current.trim().length > 0 ? current : String(availableQty(selectedSourceBatch))));
  }, [batchKind, selectedSourceBatch]);

  useEffect(() => {
    if (!selectedCanvasVessel) {
      setPlannedVesselLabel('');
      setPlannedVesselKind('vessel');
      return;
    }
    setPlannedVesselLabel(selectedCanvasVessel.label);
    setPlannedVesselKind(selectedCanvasVessel.vesselKind);
  }, [selectedCanvasVessel]);

  const openNewRecipeDialog = () => {
    setNewRecipeName('');
    setNewRecipeProductCode('');
    setNewRecipeBeverageClass(selectedRecipe?.beverageClass ?? 'cider');
    setNewRecipeTargetAbvPct('');
    setNewRecipeTargetResidualSugarPct('');
    setNewRecipeTargetSweetnessLevel('');
    setNewRecipeDefaultUnit(normalizeBatchUnit(unit));
    setNewRecipeError('');
    setNewRecipeOpen(true);
  };

  const openNewDerivedNameDialog = () => {
    setNewDerivedName(selectedSourceBatch?.recipeName ?? '');
    setNewDerivedNameError('');
    setNewDerivedNameOpen(true);
  };

  const createRecipe = async () => {
    const recipeName = newRecipeName.trim();
    if (!recipeName) {
      setNewRecipeError('Recipe name is required.');
      return;
    }

    setNewRecipeBusy(true);
    try {
      const response = await fetch('/api/os/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeName,
          productCode: newRecipeProductCode.trim() || undefined,
          beverageClass: newRecipeBeverageClass,
          targetAbvPct:
            newRecipeTargetAbvPct.trim().length > 0 ? Number(newRecipeTargetAbvPct) : undefined,
          targetResidualSugarPct:
            newRecipeTargetResidualSugarPct.trim().length > 0
              ? Number(newRecipeTargetResidualSugarPct)
              : undefined,
          targetSweetnessLevel: newRecipeTargetSweetnessLevel || undefined,
          defaultUnit: newRecipeDefaultUnit.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create recipe.');
      }

      setNewRecipeOpen(false);
      setUnit(normalizeBatchUnit(String(payload.data?.recipe?.metadata?.defaultUnit ?? newRecipeDefaultUnit)));
      await loadBatchSetup({
        recipeId: String(payload.data?.recipe?.id ?? ''),
        productId: String(payload.data?.product?.productId ?? ''),
      });
      setStatusMessage(`Recipe created: ${payload.data?.recipe?.name ?? recipeName}`);
    } catch (error) {
      setNewRecipeError(error instanceof Error ? error.message : 'Failed to create recipe.');
    } finally {
      setNewRecipeBusy(false);
    }
  };

  const createBatch = async () => {
    const recipeName =
      batchKind === 'derived' ? selectedDerivedName?.label ?? '' : selectedRecipe?.label ?? '';
    if (!recipeName) {
      setStatusMessage(
        batchKind === 'derived'
          ? 'Pick a source batch and derived batch name before creating a derived batch.'
          : 'Pick a batch name before creating a source batch.'
      );
      return;
    }

    if (!selectedCanvasVessel || !plannedVesselLabel.trim()) {
      setStatusMessage('Select a commissioned vessel from the OS brewhouse canvas before creating a batch.');
      return;
    }

    const qty = Number(producedQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setStatusMessage('Volume must be greater than zero.');
      return;
    }

    const parsedTargetAbvPct =
      targetAbvPct.trim().length > 0 ? Number(targetAbvPct) : undefined;
    const parsedTargetResidualSugarPct =
      targetResidualSugarPct.trim().length > 0 ? Number(targetResidualSugarPct) : undefined;

    setBusy(true);
    try {
      const response = await fetch('/api/os/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchKind,
          recipeName,
          recipeId: selectedRecipe?.recipeId,
          sourceBatchId: batchKind === 'derived' ? selectedSourceBatch?.id : undefined,
          skuId: batchKind === 'source' ? selectedRecipe?.skuId : undefined,
          siteId,
          unit: normalizeBatchUnit(unit),
          producedQty: qty,
          status: batchStatus,
          productionMode: batchKind === 'derived' ? 'cellar' : 'scheduled_runboard',
          scheduledStartAt: scheduledStartAt || undefined,
          scheduledEndAt: scheduledEndAt || undefined,
          plannedVesselLabel: plannedVesselLabel.trim(),
          plannedVesselKind,
          product:
            batchKind === 'source'
              ? {
                  productId: selectedRecipe?.productId,
                  productCode: selectedRecipe?.productCode,
                  productName: recipeName,
                  beverageClass: selectedRecipe?.beverageClass,
                }
              : undefined,
          intendedRecipeTargets: {
            targetAbvPct:
              parsedTargetAbvPct !== undefined && Number.isFinite(parsedTargetAbvPct)
                ? parsedTargetAbvPct
                : undefined,
            targetResidualSugarPct:
              parsedTargetResidualSugarPct !== undefined &&
              Number.isFinite(parsedTargetResidualSugarPct)
                ? parsedTargetResidualSugarPct
                : undefined,
            targetResidualSugarGpl: residualSugarPctToGpl(parsedTargetResidualSugarPct),
            targetSweetnessLevel: targetSweetnessLevel || undefined,
          },
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to create batch.');
      }
      setStatusMessage('Batch created.');
      const createdBatchId = String(payload?.data?.id ?? '').trim();
      if (createdBatchId) {
        navigate(`/os/batches/${encodeURIComponent(createdBatchId)}?tab=process`);
      } else {
        navigate('/os/batches');
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to create batch.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle="New Batch">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Batch</h1>
          <p className="mt-1 text-muted-foreground">
            Start a source batch from a saved name or create a derived batch from a live vessel lot.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Batch Setup</CardTitle>
            <CardDescription>
              OS assigns the backend batch code automatically. The operator only chooses the batch name, volume, and vessel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label>Batch Type</Label>
                <Select value={batchKind} onValueChange={(value) => setBatchKind(value as BatchKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">source batch</SelectItem>
                    <SelectItem value="derived">derived batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Site</Label>
                <Select
                  value={siteId}
                  onValueChange={setSiteId}
                  disabled={batchKind === 'derived'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select
                  value={isSupportedBatchUnit(unit) ? unit : normalizeBatchUnit(unit)}
                  onValueChange={setUnit}
                  disabled={batchKind === 'derived'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BATCH_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {batchKind === 'source' ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Batch Name</Label>
                  <Select
                    value={selectedRecipeKey}
                    onValueChange={(value) => {
                      if (value === NEW_RECIPE_OPTION_VALUE) {
                        openNewRecipeDialog();
                        return;
                      }
                      setSelectedRecipeKey(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved batch name" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NEW_RECIPE_OPTION_VALUE}>New recipe...</SelectItem>
                      {recipeOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRecipe ? (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{selectedRecipe.sourceLabel}</Badge>
                    {selectedRecipe.productCode ? <Badge variant="secondary">{selectedRecipe.productCode}</Badge> : null}
                    {selectedRecipe.skuId ? <Badge variant="secondary">{selectedRecipe.skuId}</Badge> : null}
                    {selectedRecipe.defaultUnit ? <Badge variant="secondary">{selectedRecipe.defaultUnit}</Badge> : null}
                    {selectedRecipe.targetAbvPct !== undefined ? (
                      <Badge variant="secondary">ABV target {selectedRecipe.targetAbvPct.toFixed(1)}%</Badge>
                    ) : null}
                    {selectedRecipe.targetResidualSugarPct !== undefined ? (
                      <Badge variant="secondary">RS target {selectedRecipe.targetResidualSugarPct.toFixed(2)}%</Badge>
                    ) : null}
                    {selectedRecipe.targetSweetnessLevel ? (
                      <Badge variant="secondary">
                        {SWEETNESS_LEVEL_OPTIONS.find((option) => option.value === selectedRecipe.targetSweetnessLevel)?.label ??
                          selectedRecipe.targetSweetnessLevel}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Source Batch</Label>
                  <Select value={selectedSourceBatchId || undefined} onValueChange={setSelectedSourceBatchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a live vessel batch" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {eligibleSourceBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.recipeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Derived Batch Name</Label>
                  <Select
                    value={selectedDerivedNameKey || undefined}
                    onValueChange={(value) => {
                      if (value === NEW_DERIVED_NAME_OPTION_VALUE) {
                        openNewDerivedNameDialog();
                        return;
                      }
                      setSelectedDerivedNameKey(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a derived batch name" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectItem value={NEW_DERIVED_NAME_OPTION_VALUE}>New derived batch...</SelectItem>
                      {derivedBatchNameOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDerivedName ? (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{selectedDerivedName.sourceLabel}</Badge>
                  </div>
                ) : null}

                {selectedSourceBatch ? (
                  <div className="rounded-lg border border-border/60 bg-card/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{vesselLabelForBatch(selectedSourceBatch) ?? 'Vessel not recorded'}</Badge>
                      <Badge variant="secondary">
                        {latestStageLabel(selectedSourceBatch) ?? formatStatusLabel(selectedSourceBatch.status)}
                      </Badge>
                      <Badge variant="secondary">
                        {formatVolumeNumber(availableQty(selectedSourceBatch))} {selectedSourceBatch.unit} available
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
                      <div>
                        <p className="text-xs text-muted-foreground">SG</p>
                        <p className="font-medium">{formatMetric(selectedSourceBatch.actualResults?.sgLatest, 3)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">pH</p>
                        <p className="font-medium">{formatMetric(selectedSourceBatch.actualResults?.phLatest, 2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ABV</p>
                        <p className="font-medium">{formatMetric(selectedSourceBatch.actualResults?.abvPct, 2, '%')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Brix</p>
                        <p className="font-medium">{formatMetric(selectedSourceBatch.actualResults?.brixLatest, 2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">TA</p>
                        <p className="font-medium">
                          {formatMetric(selectedSourceBatch.actualResults?.titratableAcidityGplLatest, 2, ' g/L')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SO2</p>
                        <p className="font-medium">{formatMetric(selectedSourceBatch.actualResults?.so2PpmLatest, 0, ' ppm')}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No eligible source batches are in a live vessel right now.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Target Profile</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Capture the batch target now so OS can flag drift against the intended cellar profile.
                  </p>
                </div>
                {targetResidualSugarPct ? (
                  <Badge variant="secondary">{Number(targetResidualSugarPct).toFixed(2)}% RS target</Badge>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="batch-target-abv">Target ABV</Label>
                  <Input
                    id="batch-target-abv"
                    type="number"
                    min="0"
                    step="0.1"
                    value={targetAbvPct}
                    onChange={(event) => setTargetAbvPct(event.target.value)}
                    placeholder="6.5"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="batch-target-rs-pct">Target Residual Sugar (%)</Label>
                  <Input
                    id="batch-target-rs-pct"
                    type="number"
                    min="0"
                    step="0.01"
                    value={targetResidualSugarPct}
                    onChange={(event) => setTargetResidualSugarPct(event.target.value)}
                    placeholder="0.90"
                  />
                  <p className="text-xs text-muted-foreground">
                    {targetResidualSugarPct
                      ? `${residualSugarPctToGpl(Number(targetResidualSugarPct))?.toFixed(2) ?? '--'} g/L`
                      : '1.00% RS = 10.00 g/L'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Sweetness Level</Label>
                  <Select
                    value={targetSweetnessLevel || undefined}
                    onValueChange={(value) => setTargetSweetnessLevel(value as SweetnessLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target sweetness" />
                    </SelectTrigger>
                    <SelectContent>
                      {SWEETNESS_LEVEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>{batchKind === 'source' ? 'Starting Volume' : 'Volume to Move'}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={producedQty}
                  onChange={(event) => setProducedQty(event.target.value)}
                  placeholder={batchKind === 'source' ? '10.0' : '3.0'}
                />
              </div>
              <div className="space-y-1">
                <Label>Target Vessel</Label>
                <Select
                  value={selectedCanvasVesselId || undefined}
                  onValueChange={setSelectedCanvasVesselId}
                  disabled={canvasVesselOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        canvasVesselOptions.length === 0
                          ? 'No commissioned vessels on OS canvas'
                          : 'Select a commissioned vessel'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {canvasVesselOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCanvasVessel ? (
                  <div className="flex flex-wrap gap-2 pt-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{formatCanvasVesselType(selectedCanvasVessel.vesselType)}</Badge>
                    {selectedCanvasVessel.capacity !== undefined ? (
                      <Badge variant="secondary">
                        Configured capacity {selectedCanvasVessel.capacity}
                      </Badge>
                    ) : null}
                    {selectedCanvasVessel.logicalDeviceId ? (
                      <Badge variant="secondary">{selectedCanvasVessel.logicalDeviceId}</Badge>
                    ) : null}
                  </div>
                ) : (
                  <p className="pt-2 text-xs text-muted-foreground">
                    Create and publish your brewhouse vessels on the OS canvas before creating batches.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Initial State</Label>
                <Select value={batchStatus} onValueChange={(value) => setBatchStatus(value as NewBatchStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">planned</SelectItem>
                    <SelectItem value="in_progress">in progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {batchKind === 'source' ? (
              <div className="rounded-lg border border-border/60 p-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Schedule</Label>
                  <p className="text-xs text-muted-foreground">
                    Scheduled source batches show up on the OS Calendar and the Brewday Runboard automatically.
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DateTimePickerField
                    label="Scheduled Start"
                    value={scheduledStartAt}
                    onChange={setScheduledStartAt}
                  />
                  <DateTimePickerField
                    label="Scheduled End"
                    value={scheduledEndAt}
                    onChange={setScheduledEndAt}
                  />
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/os/batches')} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={() => void createBatch()}
                disabled={busy || loading || canvasVesselOptions.length === 0}
              >
                {batchKind === 'source' ? 'Create Batch' : 'Create Derived Batch'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">{loading ? 'Loading batch options...' : statusMessage}</p>
      </div>

      <Dialog
        open={newRecipeOpen}
        onOpenChange={(open) => {
          setNewRecipeOpen(open);
          if (!open) {
            setNewRecipeError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>New Recipe</DialogTitle>
            <DialogDescription>
              Create a recipe shell here, then continue straight into batch setup.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="new-recipe-name">Recipe Name</Label>
              <Input
                id="new-recipe-name"
                value={newRecipeName}
                onChange={(event) => setNewRecipeName(event.target.value)}
                placeholder="Dry Cider"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-recipe-product-code">Product Code</Label>
              <Input
                id="new-recipe-product-code"
                value={newRecipeProductCode}
                onChange={(event) => setNewRecipeProductCode(event.target.value)}
                placeholder="DRY-CIDER"
              />
            </div>

            <div className="space-y-1">
              <Label>Beverage Class</Label>
              <Select
                value={newRecipeBeverageClass}
                onValueChange={(value) => setNewRecipeBeverageClass(value as BeverageClass)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cider">cider</SelectItem>
                  <SelectItem value="wine">wine</SelectItem>
                  <SelectItem value="beer">beer</SelectItem>
                  <SelectItem value="other">other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-recipe-target-abv">Target ABV</Label>
              <Input
                id="new-recipe-target-abv"
                type="number"
                min="0"
                step="0.1"
                value={newRecipeTargetAbvPct}
                onChange={(event) => setNewRecipeTargetAbvPct(event.target.value)}
                placeholder="6.5"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-recipe-target-rs-pct">Target RS (%)</Label>
              <Input
                id="new-recipe-target-rs-pct"
                type="number"
                min="0"
                step="0.01"
                value={newRecipeTargetResidualSugarPct}
                onChange={(event) => setNewRecipeTargetResidualSugarPct(event.target.value)}
                placeholder="0.90"
              />
            </div>

            <div className="space-y-1">
              <Label>Sweetness Level</Label>
              <Select
                value={newRecipeTargetSweetnessLevel || undefined}
                onValueChange={(value) => setNewRecipeTargetSweetnessLevel(value as SweetnessLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sweetness target" />
                </SelectTrigger>
                <SelectContent>
                  {SWEETNESS_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-recipe-default-unit">Default Unit</Label>
              <Select value={normalizeBatchUnit(newRecipeDefaultUnit)} onValueChange={setNewRecipeDefaultUnit}>
                <SelectTrigger id="new-recipe-default-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {newRecipeError ? <p className="text-xs font-medium text-red-400">{newRecipeError}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNewRecipeOpen(false)} disabled={newRecipeBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void createRecipe()} disabled={newRecipeBusy}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={newDerivedNameOpen}
        onOpenChange={(open) => {
          setNewDerivedNameOpen(open);
          if (!open) {
            setNewDerivedNameError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Derived Batch</DialogTitle>
            <DialogDescription>
              Give this split or cellar branch its own batch name for tracking and reporting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1">
            <Label htmlFor="new-derived-name">Derived Batch Name</Label>
            <Input
              id="new-derived-name"
              value={newDerivedName}
              onChange={(event) => setNewDerivedName(event.target.value)}
              placeholder="Test Cider - Oak Aged"
            />
          </div>

          {newDerivedNameError ? <p className="text-xs font-medium text-red-400">{newDerivedNameError}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNewDerivedNameOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const normalized = newDerivedName.trim();
                if (!normalized) {
                  setNewDerivedNameError('Derived batch name is required.');
                  return;
                }
                const existing =
                  derivedBatchNameOptions.find((option) => option.label.toLowerCase() === normalized.toLowerCase())?.key ??
                  `derived-name:${normalized.toLowerCase()}`;
                if (!derivedBatchNameOptions.some((option) => option.key === existing)) {
                  setSelectedDerivedNameKey(`derived-name:${normalized.toLowerCase()}`);
                } else {
                  setSelectedDerivedNameKey(existing);
                }
                if (!derivedBatchNameOptions.some((option) => option.label.toLowerCase() === normalized.toLowerCase())) {
                  setBatches((current) => [
                    {
                      id: `draft-derived-name:${normalized.toLowerCase()}`,
                      siteId: selectedSourceBatch?.siteId ?? 'main',
                      lotCode: '',
                      batchKind: 'derived',
                      recipeName: normalized,
                      status: 'planned',
                      producedQty: 0,
                      allocatedQty: 0,
                      dispensedQty: 0,
                      unit: normalizeBatchUnit(selectedSourceBatch?.unit ?? unit),
                      updatedAt: new Date().toISOString(),
                    },
                    ...current,
                  ]);
                }
                setNewDerivedNameOpen(false);
              }}
            >
              Use Name
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
