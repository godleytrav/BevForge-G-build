import { randomUUID } from 'node:crypto';
import { a as readAutomationRunsState, b as writeAutomationRunsState, d as readCanvasProject } from '../../recipes/import/POST-B16W0CFH.js';

const nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
class AutomationRunner {
  runs = /* @__PURE__ */ new Map();
  stopRequests = /* @__PURE__ */ new Set();
  initialized = false;
  async ensureInitialized() {
    if (this.initialized) return;
    const state = await readAutomationRunsState();
    for (const run of state.runs) {
      this.runs.set(run.runId, run);
    }
    this.initialized = true;
  }
  async persist() {
    await writeAutomationRunsState({
      schemaVersion: "0.1.0",
      id: "automation-runs",
      updatedAt: nowIso(),
      runs: [...this.runs.values()]
    });
  }
  async snapshot() {
    await this.ensureInitialized();
    return [...this.runs.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }
  async startRun(input) {
    await this.ensureInitialized();
    const runId = randomUUID();
    const run = {
      runId,
      nodeId: input.nodeId,
      pageId: input.pageId,
      status: "running",
      startedAt: nowIso(),
      currentStepIndex: -1,
      steps: (input.steps ?? []).map((step, index) => ({
        id: step.id ?? `step-${index + 1}`,
        label: step.label,
        targetDeviceId: step.targetDeviceId,
        command: step.command,
        value: step.value,
        delayMs: step.delayMs,
        status: "pending"
      }))
    };
    this.runs.set(runId, run);
    await this.persist();
    void this.execute(runId);
    return run;
  }
  async stopRun(runId) {
    await this.ensureInitialized();
    if (!this.runs.has(runId)) return false;
    this.stopRequests.add(runId);
    return true;
  }
  async execute(runId) {
    const run = this.runs.get(runId);
    if (!run) return;
    try {
      for (let i = 0; i < run.steps.length; i += 1) {
        if (this.stopRequests.has(runId)) {
          run.status = "canceled";
          run.endedAt = nowIso();
          await this.persist();
          return;
        }
        run.currentStepIndex = i;
        const step = run.steps[i];
        step.status = "running";
        step.startedAt = nowIso();
        await this.persist();
        const delayMs = Math.max(0, Number(step.delayMs ?? 0));
        if (delayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        if (!step.targetDeviceId) {
          step.status = "skipped";
          step.message = "No target device configured.";
          step.endedAt = nowIso();
          await this.persist();
          continue;
        }
        step.status = "completed";
        step.message = "Scaffold runner executed step (dispatch wiring pending).";
        step.endedAt = nowIso();
        await this.persist();
      }
      run.status = "completed";
      run.endedAt = nowIso();
      await this.persist();
    } catch (error) {
      run.status = "failed";
      run.endedAt = nowIso();
      const step = run.steps[run.currentStepIndex];
      if (step) {
        step.status = "failed";
        step.endedAt = nowIso();
        step.message = String(error);
      }
      await this.persist();
    } finally {
      this.stopRequests.delete(runId);
    }
  }
}
const automationRunner = new AutomationRunner();

const toSteps = (node) => {
  const mode = node.data.config.automationMode ?? "simple";
  if (mode === "advanced") {
    return (node.data.config.automationSteps ?? []).map((step, index) => ({
      id: step.id ?? `step-${index + 1}`,
      label: step.label,
      targetDeviceId: step.targetDeviceId,
      command: step.command,
      value: step.value,
      delayMs: step.delayMs
    }));
  }
  const rule = node.data.config.simpleAutomation;
  if (!rule) return [];
  return [
    {
      id: "simple-on",
      label: "Simple Mode On Action",
      targetDeviceId: rule.targetDeviceId,
      command: rule.command,
      value: rule.onValue,
      delayMs: 0
    }
  ];
};
async function handler(req, res) {
  try {
    const { nodeId } = req.body;
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        error: "nodeId is required."
      });
    }
    const project = await readCanvasProject();
    const page = project.pages.find(
      (candidate) => (candidate.nodes ?? []).some((node2) => node2.id === nodeId)
    );
    const node = page?.nodes?.find((candidate) => candidate.id === nodeId);
    if (!node || node.data.widgetType !== "automation") {
      return res.status(404).json({
        success: false,
        error: "Automation node not found."
      });
    }
    const steps = toSteps(node);
    if (steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Automation node has no runnable steps."
      });
    }
    const run = await automationRunner.startRun({
      nodeId: node.id,
      pageId: page?.id,
      steps
    });
    return res.status(200).json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error("Failed to start automation run:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start automation run."
    });
  }
}

export { automationRunner as a, handler as h };
