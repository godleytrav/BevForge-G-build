import { randomUUID } from 'node:crypto';
import type { ImportedRecipe } from '../../features/canvas/types.js';
import {
  readRecipeRunsState,
  writeRecipeRunsState,
  type RecipeRunRecord,
  type RecipeRunStepState,
} from './commissioning-store.js';

const nowIso = () => new Date().toISOString();

const toNumber = (value: unknown): number | undefined => {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
};

const normalizeTrigger = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase();

type RunAction = 'pause' | 'resume' | 'confirm' | 'next' | 'stop';
type RecipeExecutionMode = 'automated' | 'hybrid' | 'manual';

class RecipeRunner {
  private runs = new Map<string, RecipeRunRecord>();
  private initialized = false;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      const state = await readRecipeRunsState();
      for (const run of state.runs) {
        this.runs.set(run.runId, run);
      }
      this.initialized = true;
    }
    if (!this.ticker) {
      this.ticker = setInterval(() => {
        void this.tick();
      }, 1000);
      if (typeof this.ticker.unref === 'function') {
        this.ticker.unref();
      }
    }
  }

  async shutdown() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }

  private async persist() {
    await writeRecipeRunsState({
      schemaVersion: '0.1.0',
      id: 'recipe-runs',
      updatedAt: nowIso(),
      runs: [...this.runs.values()],
    });
  }

  async snapshot(): Promise<RecipeRunRecord[]> {
    await this.ensureInitialized();
    return [...this.runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async resetRuns(): Promise<string[]> {
    await this.ensureInitialized();
    const clearedRunIds = [...this.runs.keys()];
    this.runs.clear();
    await this.persist();
    return clearedRunIds;
  }

  private coerceStepValue(value: string | number | boolean | undefined): string | number | boolean | undefined {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return numeric;
    return trimmed;
  }

  async startRun(
    recipe: ImportedRecipe,
    options?: {
      executionMode?: RecipeExecutionMode;
    }
  ): Promise<RecipeRunRecord> {
    await this.ensureInitialized();

    const runId = randomUUID();
    const executionMode: RecipeExecutionMode = options?.executionMode ?? 'automated';
    const run: RecipeRunRecord = {
      runId,
      recipeId: recipe.id,
      recipeName: recipe.name,
      executionMode,
      sourceFile: recipe.rawFile,
      status: 'running',
      startedAt: nowIso(),
      currentStepIndex: recipe.steps.length > 0 ? 0 : -1,
      steps: recipe.steps.map((step, index): RecipeRunStepState => ({
        id: step.id ?? `step-${index + 1}`,
        name: step.name ?? `Step ${index + 1}`,
        stage: step.stage,
        action: step.action,
        triggerWhen: step.triggerWhen,
        command: step.command,
        targetDeviceId: step.targetDeviceId,
        value: this.coerceStepValue(step.value),
        durationMin: step.durationMin,
        temperatureC: step.temperatureC,
        requiresUserConfirm: step.requiresUserConfirm,
        autoProceed: step.autoProceed,
        status: 'pending',
      })),
    };

    if (run.steps.length === 0) {
      run.status = 'completed';
      run.endedAt = nowIso();
      run.currentStepIndex = -1;
    }

    this.runs.set(runId, run);
    await this.persist();
    return run;
  }

  private resolveCurrentStep(run: RecipeRunRecord): RecipeRunStepState | undefined {
    if (run.currentStepIndex < 0) return undefined;
    return run.steps[run.currentStepIndex];
  }

  private completeCurrentStep(run: RecipeRunRecord, message?: string) {
    const step = this.resolveCurrentStep(run);
    if (!step) return;
    step.status = 'completed';
    step.endedAt = nowIso();
    if (message) {
      step.message = message;
    }
  }

  private advanceStep(run: RecipeRunRecord) {
    const nextIndex = run.currentStepIndex + 1;
    if (nextIndex >= run.steps.length) {
      run.currentStepIndex = run.steps.length - 1;
      run.status = 'completed';
      run.endedAt = nowIso();
      return;
    }
    run.currentStepIndex = nextIndex;
    if (run.status !== 'paused') {
      run.status = 'running';
    }
  }

  async controlRun(runId: string, action: RunAction): Promise<RecipeRunRecord | null> {
    await this.ensureInitialized();
    const run = this.runs.get(runId);
    if (!run) return null;

    if (action === 'stop') {
      run.status = 'canceled';
      run.endedAt = nowIso();
      await this.persist();
      return run;
    }

    if (action === 'pause') {
      if (run.status === 'running' || run.status === 'waiting_confirm') {
        run.status = 'paused';
      }
      await this.persist();
      return run;
    }

    if (action === 'resume') {
      if (run.status === 'paused') {
        const step = this.resolveCurrentStep(run);
        run.status = step?.status === 'waiting_confirm' ? 'waiting_confirm' : 'running';
      }
      await this.persist();
      return run;
    }

    if (action === 'confirm') {
      const step = this.resolveCurrentStep(run);
      if (step && step.status === 'waiting_confirm') {
        this.completeCurrentStep(run, 'User confirmed step.');
        this.advanceStep(run);
      }
      await this.persist();
      return run;
    }

    if (action === 'next') {
      const step = this.resolveCurrentStep(run);
      if (step && step.status !== 'completed') {
        this.completeCurrentStep(run, 'Advanced manually by brewer.');
      }
      this.advanceStep(run);
      await this.persist();
      return run;
    }

    return run;
  }

  async updateStep(
    runId: string,
    stepId: string,
    patch: {
      name?: string;
      durationMin?: number | null;
      temperatureC?: number | null;
      value?: string | number | boolean | null;
      targetDeviceId?: string | null;
      command?: string | null;
      triggerWhen?: string | null;
      requiresUserConfirm?: boolean;
      autoProceed?: boolean;
    }
  ): Promise<RecipeRunRecord | null> {
    await this.ensureInitialized();
    const run = this.runs.get(runId);
    if (!run) return null;
    const step = run.steps.find((candidate) => candidate.id === stepId);
    if (!step) return null;

    if (patch.name !== undefined) step.name = patch.name;
    if (patch.durationMin !== undefined) {
      step.durationMin = patch.durationMin === null ? undefined : patch.durationMin;
    }
    if (patch.temperatureC !== undefined) {
      step.temperatureC = patch.temperatureC === null ? undefined : patch.temperatureC;
    }
    if (patch.value !== undefined) {
      step.value = patch.value === null ? undefined : this.coerceStepValue(patch.value);
    }
    if (patch.targetDeviceId !== undefined) {
      step.targetDeviceId = patch.targetDeviceId ?? undefined;
    }
    if (patch.command !== undefined) {
      step.command = patch.command ?? undefined;
    }
    if (patch.triggerWhen !== undefined) {
      step.triggerWhen = patch.triggerWhen ?? undefined;
    }
    if (patch.requiresUserConfirm !== undefined) {
      step.requiresUserConfirm = patch.requiresUserConfirm;
    }
    if (patch.autoProceed !== undefined) {
      step.autoProceed = patch.autoProceed;
    }

    await this.persist();
    return run;
  }

  private async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.ensureInitialized();
      let changed = false;
      const nowMs = Date.now();

      for (const run of this.runs.values()) {
        if (run.status !== 'running' && run.status !== 'waiting_confirm') {
          continue;
        }
        const step = this.resolveCurrentStep(run);
        if (!step) {
          run.status = 'completed';
          run.endedAt = nowIso();
          changed = true;
          continue;
        }

        if (step.status === 'pending') {
          step.startedAt = nowIso();
          const durationMin = toNumber(step.durationMin);
          const manualTimedStep =
            run.executionMode === 'manual' &&
            durationMin !== undefined &&
            durationMin > 0;
          const trigger = normalizeTrigger(step.triggerWhen);
          if (trigger.includes('transfer_complete')) {
            step.status = 'waiting_confirm';
            step.message = 'Waiting for transfer completion confirmation.';
            run.status = 'waiting_confirm';
            changed = true;
            continue;
          }
          step.message = step.targetDeviceId
            ? `Target ${step.targetDeviceId} scheduled (${step.command ?? 'trigger'}).`
            : run.executionMode === 'manual'
              ? 'Manual mode step: run physically and confirm when complete.'
              : 'No target mapped. Step running as instruction-only.';
          if (step.requiresUserConfirm === true && !manualTimedStep) {
            step.status = 'waiting_confirm';
            run.status = 'waiting_confirm';
          } else {
            step.status = 'running';
            run.status = 'running';
          }
          changed = true;
          continue;
        }

        if (step.status === 'waiting_confirm') {
          run.status = 'waiting_confirm';
          continue;
        }

        if (step.status !== 'running') {
          continue;
        }

        const durationMin = toNumber(step.durationMin);
        if (durationMin !== undefined && durationMin > 0) {
          const startedMs = step.startedAt ? Date.parse(step.startedAt) : nowMs;
          if (Number.isFinite(startedMs) && nowMs - startedMs >= durationMin * 60_000) {
            if (run.executionMode === 'manual') {
              step.status = 'waiting_confirm';
              run.status = 'waiting_confirm';
              step.message = 'Timer complete. Confirm step to continue.';
            } else {
              this.completeCurrentStep(run);
              this.advanceStep(run);
            }
            changed = true;
            continue;
          }
          run.status = 'running';
          continue;
        }

        if (step.autoProceed === true && run.executionMode !== 'manual') {
          this.completeCurrentStep(run);
          this.advanceStep(run);
          changed = true;
          continue;
        }

        step.status = 'waiting_confirm';
        run.status = 'waiting_confirm';
        changed = true;
      }

      if (changed) {
        await this.persist();
      }
    } finally {
      this.ticking = false;
    }
  }
}

export const recipeRunner = new RecipeRunner();
