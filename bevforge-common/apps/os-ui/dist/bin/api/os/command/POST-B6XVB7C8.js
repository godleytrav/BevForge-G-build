import { d as db, h as hardwareEndpoints, c as commandLog, a as alarmEvents, s as safetyInterlocks, e as endpointCurrent, i as interlockEvaluations, b as telemetryReadings } from '../../../index-BiQ9ukMS.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function handler(req, res) {
  try {
    const { endpointId, value, commandType = "write", tileId, correlationId, requestedBy } = req.body;
    if (!endpointId || value === void 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "endpointId and value are required"
      });
    }
    if (!["write", "toggle", "pulse"].includes(commandType)) {
      return res.status(400).json({
        error: "Invalid commandType",
        message: "commandType must be one of: write, toggle, pulse"
      });
    }
    const [endpoint] = await db.select().from(hardwareEndpoints).where(eq(hardwareEndpoints.id, endpointId));
    if (!endpoint) {
      return res.status(404).json({
        error: "Endpoint not found",
        message: `No endpoint found with id ${endpointId}`
      });
    }
    if (endpoint.status !== "active") {
      return res.status(400).json({
        error: "Endpoint not active",
        message: `Endpoint ${endpointId} is ${endpoint.status}`
      });
    }
    const writableKinds = ["DO", "AO", "PWM", "VIRTUAL"];
    if (!writableKinds.includes(endpoint.endpointKind)) {
      return res.status(400).json({
        error: "Endpoint not writable",
        message: `Endpoint kind ${endpoint.endpointKind} is read-only`
      });
    }
    const interlockResult = await evaluateInterlocks(endpointId, value, tileId);
    const commandId = randomUUID();
    const now = /* @__PURE__ */ new Date();
    if (interlockResult.blocked) {
      await db.insert(commandLog).values({
        commandId,
        correlationId: correlationId || null,
        endpointId,
        tileId: tileId || null,
        commandType,
        requestedValue: JSON.stringify(value),
        status: "blocked",
        requestedAt: now,
        requestedBy: requestedBy || "system",
        errorMessage: interlockResult.reason
      });
      if (interlockResult.interlockId) {
        await db.insert(alarmEvents).values({
          status: "active",
          severity: interlockResult.severity || "warning",
          tileId: tileId || null,
          endpointId,
          interlockId: interlockResult.interlockId,
          triggeredAt: now,
          message: `Command blocked: ${interlockResult.reason}`
        });
      }
      return res.status(403).json({
        commandId,
        status: "blocked",
        message: interlockResult.reason,
        interlockId: interlockResult.interlockId
      });
    }
    await db.insert(commandLog).values({
      commandId,
      correlationId: correlationId || null,
      endpointId,
      tileId: tileId || null,
      commandType,
      requestedValue: JSON.stringify(value),
      status: "queued",
      requestedAt: now,
      requestedBy: requestedBy || "system"
    });
    const simulationResult = await simulateNodeCommunication(
      commandId,
      endpoint,
      value,
      commandType
    );
    if (!simulationResult.success) {
      return res.status(500).json({
        commandId,
        status: "failed",
        message: simulationResult.error
      });
    }
    await updateEndpointState(endpointId, simulationResult.actualValue, endpoint);
    return res.status(200).json({
      commandId,
      status: "succeeded",
      message: "Command executed successfully",
      actualValue: simulationResult.actualValue
    });
  } catch (error) {
    console.error("Error executing command:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: String(error)
    });
  }
}
async function evaluateInterlocks(endpointId, value, tileId) {
  const interlocks = await db.select().from(safetyInterlocks).where(eq(safetyInterlocks.isActive, true));
  const relevantInterlocks = tileId ? interlocks.filter((il) => {
    const affectedTiles = il.affectedTiles;
    return affectedTiles && affectedTiles.includes(tileId);
  }) : interlocks;
  for (const interlock of relevantInterlocks) {
    const condition = interlock.condition;
    let violated = false;
    let reason = "";
    if (condition?.type === "range" && condition.endpointId) {
      const [currentState] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, condition.endpointId));
      if (currentState && currentState.valueNum !== null) {
        const currentValue = currentState.valueNum;
        if (currentValue < condition.min || currentValue > condition.max) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} value ${currentValue}°F outside safe range [${condition.min}, ${condition.max}]`;
        }
      }
    }
    if (condition?.type === "require_level" && condition.endpointId) {
      const [currentState] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, condition.endpointId));
      if (currentState && currentState.valueBool !== null) {
        if (currentState.valueBool !== condition.requiredState) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} level check failed (required: ${condition.requiredState}, actual: ${currentState.valueBool})`;
        }
      }
    }
    if (condition?.type === "require_closed" && condition.endpointId) {
      const [currentState] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, condition.endpointId));
      if (currentState && currentState.valueBool !== null) {
        if (currentState.valueBool !== false) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} must be closed (door/valve open)`;
        }
      }
    }
    if (condition?.type === "require_state" && condition.endpointId) {
      const [currentState] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, condition.endpointId));
      if (currentState) {
        const actualValue = currentState.valueBool ?? currentState.valueNum ?? currentState.valueString;
        if (actualValue !== condition.requiredValue) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} state mismatch (required: ${condition.requiredValue}, actual: ${actualValue})`;
        }
      }
    }
    await db.insert(interlockEvaluations).values({
      interlockId: interlock.id,
      evaluatedAt: /* @__PURE__ */ new Date(),
      passed: !violated,
      failedCondition: violated ? JSON.stringify(condition) : null,
      actionTaken: violated ? interlock.onViolationAction : null
    });
    if (violated && (interlock.mode === "trip" || interlock.mode === "permissive")) {
      return {
        blocked: true,
        reason: `Interlock '${interlock.name}': ${reason}`,
        interlockId: interlock.id,
        severity: interlock.severity
      };
    }
  }
  return { blocked: false };
}
async function simulateNodeCommunication(commandId, endpoint, requestedValue, commandType) {
  const now = /* @__PURE__ */ new Date();
  try {
    await db.update(commandLog).set({
      status: "sent",
      sentAt: now
    }).where(eq(commandLog.commandId, commandId));
    await new Promise((resolve) => setTimeout(resolve, 50));
    await db.update(commandLog).set({
      status: "acked",
      ackedAt: /* @__PURE__ */ new Date()
    }).where(eq(commandLog.commandId, commandId));
    await new Promise((resolve) => setTimeout(resolve, 50));
    let actualValue = requestedValue;
    if (commandType === "toggle") {
      const [current] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, endpoint.id));
      actualValue = current?.valueBool ? false : true;
    } else if (commandType === "pulse") {
      actualValue = true;
    }
    await db.update(commandLog).set({
      status: "succeeded",
      completedAt: /* @__PURE__ */ new Date(),
      actualValue: JSON.stringify(actualValue)
    }).where(eq(commandLog.commandId, commandId));
    return { success: true, actualValue };
  } catch (error) {
    await db.update(commandLog).set({
      status: "failed",
      completedAt: /* @__PURE__ */ new Date(),
      errorMessage: String(error)
    }).where(eq(commandLog.commandId, commandId));
    return { success: false, error: String(error) };
  }
}
async function updateEndpointState(endpointId, value, endpoint) {
  const now = /* @__PURE__ */ new Date();
  const valueColumns = {
    valueBool: null,
    valueNum: null,
    valueString: null,
    valueJson: null
  };
  if (endpoint.valueType === "bool") {
    valueColumns.valueBool = Boolean(value);
  } else if (endpoint.valueType === "float" || endpoint.valueType === "int") {
    valueColumns.valueNum = Number(value);
  } else if (endpoint.valueType === "string") {
    valueColumns.valueString = String(value);
  } else {
    valueColumns.valueJson = JSON.stringify(value);
  }
  const [existing] = await db.select().from(endpointCurrent).where(eq(endpointCurrent.endpointId, endpointId));
  if (existing) {
    await db.update(endpointCurrent).set({
      timestamp: now,
      ...valueColumns,
      quality: "good",
      source: "command"
    }).where(eq(endpointCurrent.endpointId, endpointId));
  } else {
    await db.insert(endpointCurrent).values({
      endpointId,
      timestamp: now,
      ...valueColumns,
      quality: "good",
      source: "command"
    });
  }
  await db.insert(telemetryReadings).values({
    endpointId,
    timestamp: now,
    ...valueColumns,
    quality: "good",
    source: "command"
  });
}

export { handler as h };
