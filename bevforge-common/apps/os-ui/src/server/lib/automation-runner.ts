import { randomUUID } from 'node:crypto';
import {
  readAutomationRunsState,
  writeAutomationRunsState,
  type AutomationRunRecord,
  type AutomationRunStepState,
} from './commissioning-store.js';

interface StartRunInput {
  nodeId: string;
  pageId?: string;
  steps: Array<{
    id?: string;
    label?: string;
    targetDeviceId?: string;
    command?: string;
    value?: string | number | boolean;
    delayMs?: number;
  }>;
}

const nowIso = () => new Date().toISOString();

class AutomationRunner {
  private runs = new Map<string, AutomationRunRecord>();
  private stopRequests = new Set<string>();
  private initialized = false;

  private async ensureInitialized() {
    if (this.initialized) return;
    const state = await readAutomationRunsState();
    for (const run of state.runs) {
      this.runs.set(run.runId, run);
    }
    this.initialized = true;
  }

  private async persist() {
    await writeAutomationRunsState({
      schemaVersion: '0.1.0',
      id: 'automation-runs',
      updatedAt: nowIso(),
      runs: [...this.runs.values()],
    });
  }

  async snapshot(): Promise<AutomationRunRecord[]> {
    await this.ensureInitialized();
    return [...this.runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  async startRun(input: StartRunInput): Promise<AutomationRunRecord> {
    await this.ensureInitialized();

    const runId = randomUUID();
    const run: AutomationRunRecord = {
      runId,
      nodeId: input.nodeId,
      pageId: input.pageId,
      status: 'running',
      startedAt: nowIso(),
      currentStepIndex: -1,
      steps: (input.steps ?? []).map((step, index): AutomationRunStepState => ({
        id: step.id ?? `step-${index + 1}`,
        label: step.label,
        targetDeviceId: step.targetDeviceId,
        command: step.command,
        value: step.value,
        delayMs: step.delayMs,
        status: 'pending',
      })),
    };

    this.runs.set(runId, run);
    await this.persist();
    void this.execute(runId);
    return run;
  }

  async stopRun(runId: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.runs.has(runId)) return false;
    this.stopRequests.add(runId);
    return true;
  }

  private async execute(runId: string) {
    const run = this.runs.get(runId);
    if (!run) return;

    try {
      for (let i = 0; i < run.steps.length; i += 1) {
        if (this.stopRequests.has(runId)) {
          run.status = 'canceled';
          run.endedAt = nowIso();
          await this.persist();
          return;
        }

        run.currentStepIndex = i;
        const step = run.steps[i];
        step.status = 'running';
        step.startedAt = nowIso();
        await this.persist();

        const delayMs = Math.max(0, Number(step.delayMs ?? 0));
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        if (!step.targetDeviceId) {
          step.status = 'skipped';
          step.message = 'No target device configured.';
          step.endedAt = nowIso();
          await this.persist();
          continue;
        }

        // Scaffold phase:
        // Runtime command dispatch will move from UI to backend in next increment.
        step.status = 'completed';
        step.message = 'Scaffold runner executed step (dispatch wiring pending).';
        step.endedAt = nowIso();
        await this.persist();
      }

      run.status = 'completed';
      run.endedAt = nowIso();
      await this.persist();
    } catch (error) {
      run.status = 'failed';
      run.endedAt = nowIso();
      const step = run.steps[run.currentStepIndex];
      if (step) {
        step.status = 'failed';
        step.endedAt = nowIso();
        step.message = String(error);
      }
      await this.persist();
    } finally {
      this.stopRequests.delete(runId);
    }
  }
}

export const automationRunner = new AutomationRunner();
