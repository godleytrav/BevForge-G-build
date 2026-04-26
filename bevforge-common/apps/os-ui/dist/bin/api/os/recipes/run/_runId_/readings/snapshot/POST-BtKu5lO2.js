import { d as readCanvasProject } from '../../../../import/POST-B16W0CFH.js';
import { j as recipeRunner } from '../../../../../../../index-BiQ9ukMS.js';
import { a as appendRecipeRunReading } from '../GET-DTywQnbH.js';

const toOptionalNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const sensorValue = (node) => {
  const config = node.data.config ?? {};
  const direct = toOptionalNumber(config.value);
  if (direct !== void 0) return direct;
  const dummy = toOptionalNumber(config.dummyValue);
  if (dummy !== void 0) return dummy;
  return void 0;
};
async function handler(req, res) {
  try {
    const runIdParam = req.params.runId;
    const runId = Array.isArray(runIdParam) ? runIdParam[0] : runIdParam;
    if (!runId) {
      return res.status(400).json({
        success: false,
        error: "runId is required."
      });
    }
    const [project, runs] = await Promise.all([readCanvasProject(), recipeRunner.snapshot()]);
    const run = runs.find((entry) => entry.runId === runId);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: "Run not found."
      });
    }
    const sourcePages = (project.pages ?? []).filter((page) => page.mode === "published").length > 0 ? (project.pages ?? []).filter((page) => page.mode === "published") : project.pages ?? [];
    const sensors = sourcePages.flatMap((page) => page.nodes ?? []).filter((node) => node.data.widgetType === "sensor");
    let temperatureC;
    let sg;
    let ph;
    let abvPct;
    const labels = [];
    for (const sensor of sensors) {
      const type = String(sensor.data.config.sensorType ?? "temperature").toLowerCase();
      const value = sensorValue(sensor);
      if (value === void 0) continue;
      labels.push(sensor.data.label);
      if (type === "temperature" && temperatureC === void 0) {
        const unit = String(sensor.data.config.unit ?? "C").toUpperCase();
        temperatureC = unit === "F" ? (value - 32) * 5 / 9 : value;
      } else if (type === "sg" && sg === void 0) {
        sg = value;
      } else if (type === "ph" && ph === void 0) {
        ph = value;
      } else if (type === "abv" && abvPct === void 0) {
        abvPct = value;
      }
    }
    const step = run.steps[run.currentStepIndex];
    if (temperatureC === void 0 && step?.temperatureC !== void 0) {
      temperatureC = step.temperatureC;
    }
    if (temperatureC === void 0 && sg === void 0 && ph === void 0 && abvPct === void 0) {
      return res.status(409).json({
        success: false,
        error: "No sensor values available to capture."
      });
    }
    const reading = await appendRecipeRunReading({
      runId: String(runId).trim(),
      stepId: step?.id,
      kind: "snapshot",
      source: "sensor",
      temperatureC,
      sg,
      ph,
      abvPct,
      note: labels.length > 0 ? `Canvas snapshot from sensors: ${labels.slice(0, 6).join(", ")}${labels.length > 6 ? "..." : ""}` : "Canvas snapshot from active step"
    });
    return res.status(200).json({
      success: true,
      data: reading
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to capture sensor snapshot.";
    return res.status(500).json({
      success: false,
      error: message
    });
  }
}

export { handler as h };
