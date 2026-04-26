import { a as appendRecipeRunReading } from './GET-DTywQnbH.js';

const toOptionalNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : void 0;
};
const toCelsius = (fahrenheit) => (fahrenheit - 32) * 5 / 9;
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
    const body = req.body;
    const temperatureC = toOptionalNumber(body.temperatureC) ?? (toOptionalNumber(body.temperatureF) !== void 0 ? toCelsius(Number(body.temperatureF)) : void 0);
    const reading = await appendRecipeRunReading({
      runId: String(runId).trim(),
      stepId: body.stepId,
      kind: body.kind,
      source: body.source === "sensor" ? "sensor" : "manual",
      recordedAt: body.recordedAt,
      temperatureC,
      sg: toOptionalNumber(body.sg),
      ph: toOptionalNumber(body.ph),
      abvPct: toOptionalNumber(body.abvPct),
      note: body.note
    });
    return res.status(200).json({
      success: true,
      data: reading
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to append recipe reading.";
    const statusCode = message.startsWith("Recipe run not found") ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}

export { handler as h };
