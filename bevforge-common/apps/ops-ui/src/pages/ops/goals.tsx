import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  Building2,
  Copy,
  DollarSign,
  Droplets,
  Gauge,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Target,
  Users,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import {
  createDefaultGoalsScenario,
  recalculateGoalsScenario,
  type CapacityState,
  type GoalsAssumptions,
  type GoalsPlanningMode,
  type GoalsScenario,
} from '@/lib/goals-planner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GoalsScenariosState {
  activeScenarioId?: string;
  scenarios: GoalsScenario[];
}

interface GoalsScenariosResponse {
  success: boolean;
  data: GoalsScenariosState;
}

const currency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const number = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);

const normalizeNumericInput = (value: string): string => value.replace(/[$,\s]/g, '').trim();

const parsePositiveNumber = (value: string): number | undefined => {
  const normalized = normalizeNumericInput(value);
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parsePositiveWholeNumber = (value: string): number | undefined => {
  const parsed = parsePositiveNumber(value);
  return parsed === undefined ? undefined : Math.max(1, Math.round(parsed));
};

const parsePositiveCurrencyNumber = (value: string): number | undefined => {
  const parsed = parsePositiveNumber(value);
  if (parsed === undefined) return undefined;
  return Math.round(parsed * 100) / 100;
};

const dashboardTileStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid hsl(200, 15%, 65%)',
  backdropFilter: 'blur(12px)',
};

const tileValueInputClass =
  'w-full appearance-none border-0 bg-transparent p-0 text-3xl font-bold leading-none tracking-tight text-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0';

type TileValueFormat = 'whole' | 'currency';

const formatTileDisplayValue = (value: number, format: TileValueFormat): string => {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
};

const formatTileEditValue = (value: number, format: TileValueFormat): string => {
  if (format === 'currency') {
    return value.toFixed(2);
  }

  return String(Math.round(value));
};

const statusBadgeClass = (state: CapacityState): string => {
  if (state === 'over-cap') return 'bg-red-500/15 text-red-300 border-red-500/40';
  if (state === 'caution') return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
};

const statusLabel = (state: CapacityState): string => {
  if (state === 'over-cap') return 'Over Cap';
  if (state === 'caution') return 'Caution';
  return 'Healthy';
};

type QueryPlannerIntent =
  | { mode: 'coverage-led'; field: 'wholesaleAccounts' | 'clubMembers'; value: number }
  | null;

const parsePlannerIntentFromQuery = (
  lock: string | null,
  valueRaw: string | null
): QueryPlannerIntent => {
  const parsedValue = Number(valueRaw);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }
  if (lock === 'wholesaleAccountsNeeded') {
    return { mode: 'coverage-led', field: 'wholesaleAccounts', value: parsedValue };
  }
  if (lock === 'clubMembersNeeded') {
    return { mode: 'coverage-led', field: 'clubMembers', value: parsedValue };
  }
  return null;
};

interface MixSliderProps {
  title: string;
  description: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  onLeftChange: (value: number) => void;
}

function MixSlider({
  title,
  description,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  onLeftChange,
}: MixSliderProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-card/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Slider
        value={[leftValue]}
        min={0}
        max={100}
        step={1}
        onValueChange={(values) => onLeftChange(values[0] ?? leftValue)}
      />
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">
          {leftLabel}: {number(leftValue)}%
        </span>
        <span className="text-muted-foreground">
          {rightLabel}: {number(rightValue)}%
        </span>
      </div>
    </div>
  );
}

interface DerivedTargetTileProps {
  label: string;
  value: number;
  onChange?: (raw: string) => void;
  helper?: string;
  helperClassName?: string;
  valueClassName?: string;
  glowColor?: string;
  valueFormat?: TileValueFormat;
  icon?: ReactNode;
  editable?: boolean;
}

function DerivedTargetTile({
  label,
  value,
  onChange,
  helper,
  helperClassName,
  valueClassName = 'text-foreground',
  glowColor = 'rgba(166, 173, 186, 0.35)',
  valueFormat = 'whole',
  icon,
  editable = true,
}: DerivedTargetTileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');

  const displayValue = isEditing
    ? editingValue
    : formatTileDisplayValue(value, valueFormat);

  return (
    <Card
      className="transition-all hover:shadow-lg"
      style={dashboardTileStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.boxShadow = `0 0 20px ${glowColor}`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.boxShadow = '';
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {icon && (
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card/40 ${valueClassName}`}>
              {icon}
            </span>
          )}
        </div>
        <div className="mt-3">
          {editable ? (
            <input
              type="text"
              inputMode={valueFormat === 'currency' ? 'decimal' : 'numeric'}
              aria-label={label}
              className={`${tileValueInputClass} ${valueClassName}`}
              value={displayValue}
              onFocus={() => {
                setIsEditing(true);
                setEditingValue(formatTileEditValue(value, valueFormat));
              }}
              onBlur={() => {
                setIsEditing(false);
                setEditingValue('');
              }}
              onChange={(event) => {
                setEditingValue(event.target.value);
                onChange?.(event.target.value);
              }}
            />
          ) : (
            <div className={`${tileValueInputClass} ${valueClassName}`}>
              {formatTileDisplayValue(value, valueFormat)}
            </div>
          )}
        </div>
        {helper && (
          <p className={`mt-1 text-xs ${helperClassName ?? 'text-muted-foreground'}`}>
            {helper}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function KegIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4h10l1 3v10l-1 3H7l-1-3V7l1-3z" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
      <path d="M6 8h12" />
      <path d="M6 16h12" />
    </svg>
  );
}

function CanIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="7" y="3" width="10" height="18" rx="3" />
      <path d="M9 7h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

export default function GoalsPlannerPage() {
  const [searchParams] = useSearchParams();
  const [scenarios, setScenarios] = useState<GoalsScenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GoalsScenario | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const appliedQueryRef = useRef<string | null>(null);

  const applyState = useCallback((state: GoalsScenariosState): void => {
    const nextScenarios = Array.isArray(state.scenarios) ? state.scenarios : [];
    setScenarios(nextScenarios);

    if (nextScenarios.length === 0) {
      const fallback = createDefaultGoalsScenario('Balanced Phase 1');
      setActiveScenarioId(fallback.id);
      setDraft(fallback);
      return;
    }

    const activeId =
      state.activeScenarioId &&
      nextScenarios.some((scenario) => scenario.id === state.activeScenarioId)
        ? state.activeScenarioId
        : nextScenarios[0].id;
    setActiveScenarioId(activeId);
    const selected = nextScenarios.find((scenario) => scenario.id === activeId) ?? nextScenarios[0];
    setDraft(selected);
  }, []);

  const loadScenarios = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet<GoalsScenariosResponse>('/api/goals/scenarios');
      applyState(response.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load goal scenarios.'
      );
      const fallback = createDefaultGoalsScenario('Balanced Phase 1');
      setScenarios([fallback]);
      setActiveScenarioId(fallback.id);
      setDraft(fallback);
    } finally {
      setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    void loadScenarios();
  }, [loadScenarios]);

  const applyDraftUpdate = useCallback(
    (updater: (current: GoalsScenario) => GoalsScenario) => {
      setDraft((current) => {
        if (!current) return current;
        return recalculateGoalsScenario(updater(current));
      });
    },
    []
  );

  useEffect(() => {
    if (!draft) {
      return;
    }

    const queryKey = searchParams.toString();
    if (appliedQueryRef.current === queryKey) {
      return;
    }
    appliedQueryRef.current = queryKey;

    const intent = parsePlannerIntentFromQuery(
      searchParams.get('lock'),
      searchParams.get('value')
    );
    if (!intent) {
      return;
    }

    applyDraftUpdate((current) => {
      if (intent.field === 'wholesaleAccounts') {
        return {
          ...current,
          planningMode: intent.mode,
          coverageTargets: {
            ...current.coverageTargets,
            wholesaleAccounts: intent.value,
          },
        };
      }
      return {
        ...current,
        planningMode: intent.mode,
        coverageTargets: {
          ...current.coverageTargets,
          clubMembers: intent.value,
        },
      };
    });
  }, [applyDraftUpdate, draft, searchParams]);

  const persistActiveScenario = useCallback(async (scenarioId: string): Promise<void> => {
    try {
      await apiPost<GoalsScenariosResponse>('/api/goals/scenarios/active', { scenarioId });
    } catch {
      // Ignore active-state persistence failures; local selection already changed.
    }
  }, []);

  const handleScenarioSelect = useCallback(
    (scenarioId: string) => {
      const selected = scenarios.find((scenario) => scenario.id === scenarioId);
      if (!selected) return;
      setActiveScenarioId(scenarioId);
      setDraft(selected);
      setStatus(null);
      void persistActiveScenario(scenarioId);
    },
    [persistActiveScenario, scenarios]
  );

  const handleCreateNew = (): void => {
    const next = createDefaultGoalsScenario(`Scenario ${scenarios.length + 1}`);
    setActiveScenarioId(next.id);
    setDraft(next);
    setStatus('New unsaved scenario created. Click Save Scenario to persist.');
  };

  const handleSave = async (): Promise<void> => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);
      const response = await apiPost<GoalsScenariosResponse>('/api/goals/scenarios', draft);
      applyState(response.data);
      setStatus('Scenario saved.');
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Failed to save scenario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (): Promise<void> => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);
      const response = await apiPost<GoalsScenariosResponse>(
        '/api/goals/scenarios/duplicate',
        { scenarioId: draft.id }
      );
      applyState(response.data);
      setStatus('Scenario duplicated.');
    } catch (dupError) {
      setError(
        dupError instanceof Error ? dupError.message : 'Failed to duplicate scenario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (): Promise<void> => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);
      const response = await apiPost<GoalsScenariosResponse>(
        '/api/goals/scenarios/reset',
        { scenarioId: draft.id }
      );
      applyState(response.data);
      setStatus('Scenario reset to defaults.');
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : 'Failed to reset scenario.'
      );
    } finally {
      setSaving(false);
    }
  };

  const applyPlanningMode = useCallback(
    (mode: GoalsPlanningMode) => {
      applyDraftUpdate((current) => ({
        ...current,
        planningMode: mode,
        goalLock: mode === 'coverage-led' ? 'annual' : current.goalLock,
      }));
    },
    [applyDraftUpdate]
  );

  const applyCoverageTargetChange = useCallback(
    (field: 'wholesaleAccounts' | 'clubMembers', rawValue: string) => {
      const next = parsePositiveWholeNumber(rawValue);
      if (next === undefined) return;
      applyDraftUpdate((current) => ({
        ...current,
        planningMode: 'coverage-led',
        coverageTargets: {
          ...current.coverageTargets,
          [field]: next,
        },
      }));
    },
    [applyDraftUpdate]
  );

  const assumptionFields: Array<{
    key: keyof GoalsAssumptions;
    label: string;
    step?: string;
    min?: number;
  }> = useMemo(
    () => [
      { key: 'base4PackWholesale', label: 'Base 4-pack wholesale', step: '0.01', min: 0 },
      {
        key: 'premium4PackWholesale',
        label: 'Premium 4-pack wholesale',
        step: '0.01',
        min: 0,
      },
      {
        key: 'baseHalfBblWholesale',
        label: 'Base 1/2 bbl wholesale',
        step: '0.01',
        min: 0,
      },
      {
        key: 'baseSixthBblWholesale',
        label: 'Base 1/6 bbl wholesale',
        step: '0.01',
        min: 0,
      },
      {
        key: 'premiumSixthBblWholesale',
        label: 'Premium 1/6 bbl wholesale',
        step: '0.01',
        min: 0,
      },
      { key: 'clubMonthlyFee', label: 'Club monthly fee', step: '0.01', min: 0 },
      { key: 'cansPerCase', label: 'Cans per case', step: '1', min: 1 },
      { key: 'cansPer4Pack', label: 'Cans per 4-pack', step: '1', min: 1 },
      { key: 'halfBblGallons', label: 'Gallons per 1/2 bbl', step: '0.01', min: 0.1 },
      { key: 'sixthBblGallons', label: 'Gallons per 1/6 bbl', step: '0.01', min: 0.1 },
      { key: 'cansPerGallon', label: 'Cans per gallon', step: '0.01', min: 0.1 },
      {
        key: 'avgMonthlyAccountRevenue',
        label: 'Avg monthly revenue per wholesale account',
        step: '1',
        min: 0,
      },
      {
        key: 'avgMonthlyKegsPerAccount',
        label: 'Avg monthly kegs per wholesale account (all keg sizes)',
        step: '0.5',
        min: 1,
      },
      {
        key: 'avgQuarterlyAllocationPerMember',
        label: 'Avg quarterly allocation per member',
        step: '1',
        min: 0,
      },
      {
        key: 'productionCapGallons',
        label: 'Production cap (annual gallons)',
        step: '1',
        min: 1,
      },
      { key: 'grossMarginPct', label: 'Gross margin assumption %', step: '0.1', min: 0 },
    ],
    []
  );

  if (loading || !draft) {
    return (
      <AppShell currentSuite="ops">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Gauge className="h-4 w-4 animate-spin" />
                Loading goals planner...
              </div>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const isRevenueLed = draft.planningMode === 'revenue-led';
  const annualRevenueLabel = isRevenueLed ? 'Annual Revenue Goal' : 'Annual Revenue (Solved)';
  const monthlyRevenueLabel = isRevenueLed ? 'Monthly Revenue Goal' : 'Monthly Revenue (Solved)';
  const wholesaleAccountsLabel = isRevenueLed
    ? 'Wholesale Accounts Needed'
    : 'Wholesale Accounts Target';
  const clubMembersLabel = isRevenueLed
    ? 'Club Members Needed'
    : 'Club Members Target';
  const currentDriverLabel =
    isRevenueLed
      ? draft.goalLock === 'monthly'
        ? 'Monthly Revenue Goal'
        : 'Annual Revenue Goal'
      : 'Coverage Targets (Accounts + Members)';
  const monthlyTotalKegs =
    draft.derived.targets.monthlyHalfBblKegs + draft.derived.targets.monthlySixthBblKegs;
  const monthlyCans = draft.derived.units.cans / 12;
  const wholesaleRequestedAccounts = draft.coverageTargets.wholesaleAccounts;
  const wholesaleAchievedAccounts = draft.derived.targets.wholesaleAccountsNeeded;
  const wholesaleLockUnmet =
    !isRevenueLed &&
    Math.abs(wholesaleAchievedAccounts - wholesaleRequestedAccounts) >
      Math.max(0.25, wholesaleRequestedAccounts * 0.01);
  const clubRequestedMembers = draft.coverageTargets.clubMembers;
  const clubAchievedMembers = draft.derived.targets.clubMembersNeeded;
  const clubTargetUnmet =
    !isRevenueLed &&
    Math.abs(clubAchievedMembers - clubRequestedMembers) >
      Math.max(0.25, clubRequestedMembers * 0.01);
  const impliedRevenuePerAccountMonthly =
    wholesaleAchievedAccounts > 0
      ? draft.derived.revenue.wholesaleTarget / 12 / wholesaleAchievedAccounts
      : 0;
  const impliedKegsPerAccountMonthly =
    wholesaleAchievedAccounts > 0 ? monthlyTotalKegs / wholesaleAchievedAccounts : 0;
  const impliedCasesPerAccountMonthly =
    wholesaleAchievedAccounts > 0
      ? draft.derived.targets.monthlyCases / wholesaleAchievedAccounts
      : 0;
  const accentMap = {
    revenue: { valueClassName: 'text-green-500', glowColor: 'rgba(34, 197, 94, 0.35)' },
    wholesale: { valueClassName: 'text-blue-500', glowColor: 'rgba(59, 130, 246, 0.35)' },
    club: { valueClassName: 'text-purple-500', glowColor: 'rgba(168, 85, 247, 0.35)' },
    kegs: { valueClassName: 'text-slate-300', glowColor: 'rgba(148, 163, 184, 0.35)' },
    cases: { valueClassName: 'text-zinc-100', glowColor: 'rgba(244, 244, 245, 0.35)' },
    cans: { valueClassName: 'text-zinc-100', glowColor: 'rgba(244, 244, 245, 0.35)' },
    gallons: { valueClassName: 'text-slate-300', glowColor: 'rgba(148, 163, 184, 0.35)' },
  } as const;

  return (
    <AppShell currentSuite="ops">
      <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">OPS Goals Planner</h1>
          <p className="mt-1 text-muted-foreground">
            Sales-first planning surface. Edit target tiles directly and use Advanced Settings for model tuning.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 flex items-center rounded-md border border-border/60 bg-card/30 p-0.5">
            <Button
              variant={isRevenueLed ? 'default' : 'ghost'}
              size="sm"
              onClick={() => applyPlanningMode('revenue-led')}
              className="h-8"
            >
              Revenue-Led
            </Button>
            <Button
              variant={!isRevenueLed ? 'default' : 'ghost'}
              size="sm"
              onClick={() => applyPlanningMode('coverage-led')}
              className="h-8"
            >
              Coverage-Led
            </Button>
          </div>
          <Button variant="outline" onClick={() => setAdvancedOpen(true)}>
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
          <Button variant="outline" onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Scenario
          </Button>
          <Button variant="outline" onClick={() => void handleDuplicate()} disabled={saving}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Scenario
          </Button>
          <Button variant="outline" onClick={() => void handleReset()} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Defaults
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Scenario'}
          </Button>
        </div>
      </div>

      {status && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 text-sm text-emerald-300">{status}</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Derived Targets</CardTitle>
          <CardDescription>
            Editable inputs depend on planning mode: Revenue-Led edits revenue, Coverage-Led edits accounts/members.
          </CardDescription>
          <div className="pt-1 text-xs text-muted-foreground">
            Currently driving: <span className="font-semibold text-foreground">{currentDriverLabel}</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DerivedTargetTile
            label={annualRevenueLabel}
            value={draft.annualRevenueGoal}
            onChange={
              isRevenueLed
                ? (raw) => {
                    const next = parsePositiveCurrencyNumber(raw);
                    if (next === undefined) return;
                    applyDraftUpdate((current) => ({
                      ...current,
                      goalLock: 'annual',
                      annualRevenueGoal: next,
                    }));
                  }
                : undefined
            }
            editable={isRevenueLed}
            valueClassName={accentMap.revenue.valueClassName}
            glowColor={accentMap.revenue.glowColor}
            valueFormat="currency"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label={monthlyRevenueLabel}
            value={draft.monthlyRevenueGoal}
            onChange={
              isRevenueLed
                ? (raw) => {
                    const next = parsePositiveCurrencyNumber(raw);
                    if (next === undefined) return;
                    applyDraftUpdate((current) => ({
                      ...current,
                      goalLock: 'monthly',
                      monthlyRevenueGoal: next,
                    }));
                  }
                : undefined
            }
            editable={isRevenueLed}
            valueClassName={accentMap.revenue.valueClassName}
            glowColor={accentMap.revenue.glowColor}
            valueFormat="currency"
            icon={<DollarSign className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label={wholesaleAccountsLabel}
            value={
              isRevenueLed
                ? draft.derived.targets.wholesaleAccountsNeeded
                : draft.coverageTargets.wholesaleAccounts
            }
            onChange={
              isRevenueLed
                ? undefined
                : (raw) => applyCoverageTargetChange('wholesaleAccounts', raw)
            }
            editable={!isRevenueLed}
            helper={
              isRevenueLed
                ? 'Derived from revenue + mix. Switch to Coverage-Led to set directly.'
                : wholesaleLockUnmet
                ? `Target ${number(wholesaleRequestedAccounts)}; model requires ${number(wholesaleAchievedAccounts)} with current mix/floors.`
                : `Auto-tunes per-account load (${number(draft.assumptions.avgMonthlyKegsPerAccount)} kegs/mo, min 1).`
            }
            helperClassName={wholesaleLockUnmet ? 'text-amber-300' : undefined}
            valueClassName={accentMap.wholesale.valueClassName}
            glowColor={accentMap.wholesale.glowColor}
            icon={<Building2 className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label={clubMembersLabel}
            value={
              isRevenueLed
                ? draft.derived.targets.clubMembersNeeded
                : draft.coverageTargets.clubMembers
            }
            onChange={
              isRevenueLed ? undefined : (raw) => applyCoverageTargetChange('clubMembers', raw)
            }
            editable={!isRevenueLed}
            helper={
              isRevenueLed
                ? 'Derived from revenue + mix. Switch to Coverage-Led to set directly.'
                : clubTargetUnmet
                ? `Target ${number(clubRequestedMembers)}; model requires ${number(clubAchievedMembers)} at current mix.`
                : undefined
            }
            helperClassName={clubTargetUnmet ? 'text-amber-300' : undefined}
            valueClassName={accentMap.club.valueClassName}
            glowColor={accentMap.club.glowColor}
            icon={<Users className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label="Monthly Total Kegs"
            value={monthlyTotalKegs}
            editable={false}
            valueClassName={accentMap.kegs.valueClassName}
            glowColor={accentMap.kegs.glowColor}
            icon={<KegIcon className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label="Monthly Cases Needed"
            value={draft.derived.targets.monthlyCases}
            editable={false}
            valueClassName={accentMap.cases.valueClassName}
            glowColor={accentMap.cases.glowColor}
            icon={<Boxes className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label="Monthly Cans"
            value={monthlyCans}
            editable={false}
            valueClassName={accentMap.cans.valueClassName}
            glowColor={accentMap.cans.glowColor}
            icon={<CanIcon className="h-4 w-4" />}
          />
          <DerivedTargetTile
            label="Annual Gallons Required"
            value={draft.derived.gallons.annualGallons}
            editable={false}
            valueClassName={accentMap.gallons.valueClassName}
            glowColor={accentMap.gallons.glowColor}
            icon={<Droplets className="h-4 w-4" />}
          />
        </CardContent>
        <CardContent className="pt-0">
          <div className="grid gap-3 rounded-lg border border-border/60 bg-card/30 p-3 md:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Implied $/Account/Month</p>
              <p className="text-sm font-semibold text-foreground">{currency(impliedRevenuePerAccountMonthly)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Implied Kegs/Account/Month</p>
              <p className="text-sm font-semibold text-foreground">{number(impliedKegsPerAccountMonthly)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Implied Cases/Account/Month</p>
              <p className="text-sm font-semibold text-foreground">{number(impliedCasesPerAccountMonthly)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={draft.derived.validations.state === 'over-cap' ? 'border-red-500/50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Capacity + Margin Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusBadgeClass(draft.derived.validations.state)}>
              {statusLabel(draft.derived.validations.state)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Utilization {number(draft.derived.validations.utilizationPct)}% of{' '}
              {number(draft.derived.validations.productionCapGallons)} gal cap
            </span>
          </div>
          {draft.derived.validations.overCapGallons > 0 && (
            <p className="text-sm text-red-300">
              Over cap by {number(draft.derived.validations.overCapGallons)} gallons.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Estimated gross profit: {currency(draft.derived.validations.grossProfitEstimate)}
            {draft.annualGrossProfitGoal !== undefined && (
              <>
                {' '}
                (gap vs target: {currency(draft.derived.validations.grossProfitGap)})
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Summary</CardTitle>
          <CardDescription>
            To hit {currency(draft.derived.revenue.annualTarget)} / year at this mix:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            You need about <span className="font-semibold">{number(draft.derived.targets.wholesaleAccountsNeeded)}</span> wholesale
            accounts and <span className="font-semibold">{number(draft.derived.targets.clubMembersNeeded)}</span> club members.
          </p>
          <p>
            Monthly packaging target is <span className="font-semibold">{number(draft.derived.targets.monthlyHalfBblKegs)}</span> 1/2 bbl kegs,
            <span className="font-semibold"> {number(draft.derived.targets.monthlySixthBblKegs)}</span> 1/6 bbl kegs, and
            <span className="font-semibold"> {number(draft.derived.targets.monthlyCases)}</span> cases.
          </p>
          <p>
            Annual production requirement is <span className="font-semibold">{number(draft.derived.gallons.annualGallons)}</span> gallons.
          </p>
        </CardContent>
      </Card>

      <Dialog open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Settings</DialogTitle>
            <DialogDescription>
              Goal engine controls, mix sliders, assumptions, and stress test tuning.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scenario Controls</CardTitle>
                <CardDescription>Choose and rename your planning scenario.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-select">Scenario</Label>
                  <Select value={activeScenarioId ?? undefined} onValueChange={handleScenarioSelect}>
                    <SelectTrigger id="scenario-select">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={draft.name}
                    onChange={(event) =>
                      applyDraftUpdate((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active Driver</Label>
                  <div className="rounded-md border border-border/60 bg-card/30 px-3 py-2 text-sm">
                    {currentDriverLabel}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Goal Engine</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="planning-mode">Planning Mode</Label>
                  <Select
                    value={draft.planningMode}
                    onValueChange={(value: GoalsPlanningMode) => applyPlanningMode(value)}
                  >
                    <SelectTrigger id="planning-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue-led">Revenue-Led (revenue input)</SelectItem>
                      <SelectItem value="coverage-led">Coverage-Led (accounts/members input)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-period">Review Period</Label>
                  <Select
                    value={draft.reviewPeriod}
                    onValueChange={(value: 'monthly' | 'quarterly' | 'annual') =>
                      applyDraftUpdate((current) => ({ ...current, reviewPeriod: value }))
                    }
                  >
                    <SelectTrigger id="review-period">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-units-goal">Annual Units Goal (optional)</Label>
                  <Input
                    id="annual-units-goal"
                    type="number"
                    min={0}
                    step={10}
                    value={draft.annualUnitsGoal ?? ''}
                    onChange={(event) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        annualUnitsGoal: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-gross-profit-goal">Annual Gross Profit Goal (optional)</Label>
                  <Input
                    id="annual-gross-profit-goal"
                    type="number"
                    min={0}
                    step={1000}
                    value={draft.annualGrossProfitGoal ?? ''}
                    onChange={(event) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        annualGrossProfitGoal: event.target.value
                          ? Number(event.target.value)
                          : undefined,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mix Sliders</CardTitle>
                <CardDescription>Paired sliders stay aligned to 100%.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-2">
                <MixSlider
                  title="Channel Mix"
                  description="Wholesale vs direct channels."
                  leftLabel="Wholesale"
                  rightLabel="Direct"
                  leftValue={draft.mix.wholesalePct}
                  rightValue={draft.mix.directPct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      mix: { ...current.mix, wholesalePct: value },
                    }))
                  }
                />
                <MixSlider
                  title="Package Mix"
                  description="Kegs vs cans allocation within wholesale."
                  leftLabel="Kegs"
                  rightLabel="Cans"
                  leftValue={draft.mix.kegPct}
                  rightValue={draft.mix.canPct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      mix: { ...current.mix, kegPct: value },
                    }))
                  }
                />
                <MixSlider
                  title="Product Mix"
                  description="Base vs premium allocation."
                  leftLabel="Base"
                  rightLabel="Premium"
                  leftValue={draft.mix.basePct}
                  rightValue={draft.mix.premiumPct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      mix: { ...current.mix, basePct: value },
                    }))
                  }
                />
                <MixSlider
                  title="Keg Type Mix"
                  description="Base keg split between 1/2 bbl and 1/6 bbl."
                  leftLabel="1/2 bbl"
                  rightLabel="1/6 bbl"
                  leftValue={draft.mix.halfBblPct}
                  rightValue={draft.mix.sixthBblPct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      mix: { ...current.mix, halfBblPct: value },
                    }))
                  }
                />
                <MixSlider
                  title="Club Allocation"
                  description="Club member revenue share within direct channel."
                  leftLabel="Club"
                  rightLabel="General Direct"
                  leftValue={draft.mix.clubPct}
                  rightValue={draft.mix.wholesaleGeneralPct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      mix: { ...current.mix, clubPct: value },
                    }))
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assumptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {assumptionFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={`assumption-${field.key}`}>{field.label}</Label>
                      <Input
                        id={`assumption-${field.key}`}
                        type="number"
                        step={field.step}
                        min={field.min}
                        value={draft.assumptions[field.key]}
                        onChange={(event) =>
                          applyDraftUpdate((current) => ({
                            ...current,
                            assumptions: {
                              ...current.assumptions,
                              [field.key]: Number(event.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <MixSlider
                  title="Account Keg-Type Load"
                  description="Split average account keg load between 1/2 bbl and 1/6 bbl."
                  leftLabel="1/2 bbl share"
                  rightLabel="1/6 bbl share"
                  leftValue={draft.assumptions.avgMonthlyHalfBblKegSharePct}
                  rightValue={draft.assumptions.avgMonthlySixthBblKegSharePct}
                  onLeftChange={(value) =>
                    applyDraftUpdate((current) => ({
                      ...current,
                      assumptions: {
                        ...current.assumptions,
                        avgMonthlyHalfBblKegSharePct: value,
                      },
                    }))
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stress Test</CardTitle>
                <CardDescription>Downside scenario controls.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.stress.enabled}
                    onChange={(event) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        stress: { ...current.stress, enabled: event.target.checked },
                      }))
                    }
                  />
                  Enable stress test mode
                </label>

                <div className="grid gap-3 lg:grid-cols-2">
                  <MixSlider
                    title="Account Churn"
                    description="What if active wholesale accounts drop?"
                    leftLabel="Churn"
                    rightLabel="Remaining"
                    leftValue={draft.stress.accountChurnPct}
                    rightValue={100 - draft.stress.accountChurnPct}
                    onLeftChange={(value) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        stress: { ...current.stress, accountChurnPct: value },
                      }))
                    }
                  />
                  <MixSlider
                    title="Club Churn"
                    description="Expected club membership churn."
                    leftLabel="Churn"
                    rightLabel="Remaining"
                    leftValue={draft.stress.clubChurnPct}
                    rightValue={100 - draft.stress.clubChurnPct}
                    onLeftChange={(value) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        stress: { ...current.stress, clubChurnPct: value },
                      }))
                    }
                  />
                  <MixSlider
                    title="Price Drop"
                    description="Revenue pressure from discounting."
                    leftLabel="Drop"
                    rightLabel="Retained"
                    leftValue={draft.stress.priceDropPct}
                    rightValue={100 - draft.stress.priceDropPct}
                    onLeftChange={(value) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        stress: { ...current.stress, priceDropPct: value },
                      }))
                    }
                  />
                  <MixSlider
                    title="Production Loss"
                    description="Capacity hit from production disruption."
                    leftLabel="Loss"
                    rightLabel="Retained"
                    leftValue={draft.stress.productionLossPct}
                    rightValue={100 - draft.stress.productionLossPct}
                    onLeftChange={(value) =>
                      applyDraftUpdate((current) => ({
                        ...current,
                        stress: { ...current.stress, productionLossPct: value },
                      }))
                    }
                  />
                </div>

                <div className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={statusBadgeClass(
                        draft.stress.enabled
                          ? draft.derived.stress.state
                          : draft.derived.validations.state
                      )}
                    >
                      {draft.stress.enabled ? 'Stress Enabled' : 'Stress Disabled'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Stressed annual revenue: {currency(draft.derived.stress.stressedAnnualRevenue)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm md:grid-cols-2">
                    <p>
                      Revenue shortfall: {currency(draft.derived.stress.revenueShortfall)}
                    </p>
                    <p>
                      Additional accounts to recover: {number(draft.derived.stress.additionalAccountsNeeded)}
                    </p>
                    <p>
                      Additional members to recover: {number(draft.derived.stress.additionalClubMembersNeeded)}
                    </p>
                    <p>
                      Stressed cap utilization: {number(draft.derived.stress.stressedUtilizationPct)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppShell>
  );
}
