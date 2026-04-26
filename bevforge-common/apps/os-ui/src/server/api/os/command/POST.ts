import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import {
  commandLog,
  hardwareEndpoints,
  safetyInterlocks,
  interlockEvaluations,
  endpointCurrent,
  telemetryReadings,
  alarmEvents,
} from '../../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * POST /api/os/command
 *
 * Single canonical command entry point
 *
 * Request body:
 * {
 *   "endpointId": number,
 *   "value": boolean | number | string | object,
 *   "commandType": "write" | "toggle" | "pulse",
 *   "tileId": number (optional),
 *   "correlationId": string (optional, for grouping related commands),
 *   "requestedBy": string (optional, user/system identifier)
 * }
 *
 * Pipeline:
 * 1. Validate request
 * 2. Check endpoint exists and is writable
 * 3. Evaluate interlocks (log evaluation)
 * 4. If blocked → log command as blocked, create alarm, return 403
 * 5. If allowed → log command as queued, simulate node communication
 * 6. Update command_log status (sent → acked → succeeded/failed)
 * 7. On success → update endpoint_current + telemetry_readings
 *
 * Returns: { commandId, status, message }
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { endpointId, value, commandType = 'write', tileId, correlationId, requestedBy } = req.body;

    // ============================================================
    // STEP 1: VALIDATE REQUEST
    // ============================================================
    if (!endpointId || value === undefined) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'endpointId and value are required',
      });
    }

    if (!['write', 'toggle', 'pulse'].includes(commandType)) {
      return res.status(400).json({
        error: 'Invalid commandType',
        message: 'commandType must be one of: write, toggle, pulse',
      });
    }

    // ============================================================
    // STEP 2: CHECK ENDPOINT EXISTS AND IS WRITABLE
    // ============================================================
    const [endpoint] = await db
      .select()
      .from(hardwareEndpoints)
      .where(eq(hardwareEndpoints.id, endpointId));

    if (!endpoint) {
      return res.status(404).json({
        error: 'Endpoint not found',
        message: `No endpoint found with id ${endpointId}`,
      });
    }

    if (endpoint.status !== 'active') {
      return res.status(400).json({
        error: 'Endpoint not active',
        message: `Endpoint ${endpointId} is ${endpoint.status}`,
      });
    }

    // Check if endpoint is writable (DO, AO, PWM, VIRTUAL)
    const writableKinds = ['DO', 'AO', 'PWM', 'VIRTUAL'];
    if (!writableKinds.includes(endpoint.endpointKind)) {
      return res.status(400).json({
        error: 'Endpoint not writable',
        message: `Endpoint kind ${endpoint.endpointKind} is read-only`,
      });
    }

    // ============================================================
    // STEP 3: EVALUATE INTERLOCKS
    // ============================================================
    const interlockResult = await evaluateInterlocks(endpointId, value, tileId);

    // Generate commandId
    const commandId = randomUUID();
    const now = new Date();

    // ============================================================
    // STEP 4: IF BLOCKED → LOG AND RETURN 403
    // ============================================================
    if (interlockResult.blocked) {
      // Log command as blocked
      await db.insert(commandLog).values({
        commandId,
        correlationId: correlationId || null,
        endpointId,
        tileId: tileId || null,
        commandType,
        requestedValue: JSON.stringify(value),
        status: 'blocked',
        requestedAt: now,
        requestedBy: requestedBy || 'system',
        errorMessage: interlockResult.reason,
      });

      // Create alarm for blocked command
      if (interlockResult.interlockId) {
        await db.insert(alarmEvents).values({
          status: 'active',
          severity: interlockResult.severity || 'warning',
          tileId: tileId || null,
          endpointId,
          interlockId: interlockResult.interlockId,
          triggeredAt: now,
          message: `Command blocked: ${interlockResult.reason}`,
        });
      }

      return res.status(403).json({
        commandId,
        status: 'blocked',
        message: interlockResult.reason,
        interlockId: interlockResult.interlockId,
      });
    }

    // ============================================================
    // STEP 5: IF ALLOWED → LOG AS QUEUED
    // ============================================================
    await db.insert(commandLog).values({
      commandId,
      correlationId: correlationId || null,
      endpointId,
      tileId: tileId || null,
      commandType,
      requestedValue: JSON.stringify(value),
      status: 'queued',
      requestedAt: now,
      requestedBy: requestedBy || 'system',
    });

    // ============================================================
    // STEP 6: SIMULATE NODE COMMUNICATION (MOCK)
    // ============================================================
    // In production, this would be async (message queue, WebSocket, etc.)
    // For now, simulate immediate success
    const simulationResult = await simulateNodeCommunication(
      commandId,
      endpoint,
      value,
      commandType
    );

    if (!simulationResult.success) {
      return res.status(500).json({
        commandId,
        status: 'failed',
        message: simulationResult.error,
      });
    }

    // ============================================================
    // STEP 7: UPDATE STATE ON SUCCESS
    // ============================================================
    await updateEndpointState(endpointId, simulationResult.actualValue, endpoint);

    return res.status(200).json({
      commandId,
      status: 'succeeded',
      message: 'Command executed successfully',
      actualValue: simulationResult.actualValue,
    });
  } catch (error) {
    console.error('Error executing command:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: String(error),
    });
  }
}

// ============================================================
// HELPER: EVALUATE INTERLOCKS
// ============================================================
interface InterlockResult {
  blocked: boolean;
  reason?: string;
  interlockId?: number;
  severity?: string;
}

async function evaluateInterlocks(
  endpointId: number,
  value: any,
  tileId?: number
): Promise<InterlockResult> {
  // Get all active interlocks
  const interlocks = await db
    .select()
    .from(safetyInterlocks)
    .where(eq(safetyInterlocks.isActive, true));

  // Filter interlocks by affected tiles if tileId provided
  const relevantInterlocks = tileId
    ? interlocks.filter((il) => {
        const affectedTiles = il.affectedTiles as number[];
        return affectedTiles && affectedTiles.includes(tileId);
      })
    : interlocks;

  for (const interlock of relevantInterlocks) {
    const condition = interlock.condition as any;
    let violated = false;
    let reason = '';

    // CONDITION TYPE: range (check endpoint current value against min/max)
    if (condition?.type === 'range' && condition.endpointId) {
      // Fetch current value from endpoint_current
      const [currentState] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, condition.endpointId));

      if (currentState && currentState.valueNum !== null) {
        const currentValue = currentState.valueNum;
        if (currentValue < condition.min || currentValue > condition.max) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} value ${currentValue}°F outside safe range [${condition.min}, ${condition.max}]`;
        }
      }
    }

    // CONDITION TYPE: require_level (check boolean endpoint state)
    if (condition?.type === 'require_level' && condition.endpointId) {
      const [currentState] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, condition.endpointId));

      if (currentState && currentState.valueBool !== null) {
        if (currentState.valueBool !== condition.requiredState) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} level check failed (required: ${condition.requiredState}, actual: ${currentState.valueBool})`;
        }
      }
    }

    // CONDITION TYPE: require_closed (check door/valve is closed)
    if (condition?.type === 'require_closed' && condition.endpointId) {
      const [currentState] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, condition.endpointId));

      if (currentState && currentState.valueBool !== null) {
        if (currentState.valueBool !== false) {
          // false = closed
          violated = true;
          reason = `Endpoint ${condition.endpointId} must be closed (door/valve open)`;
        }
      }
    }

    // CONDITION TYPE: require_state (generic state check)
    if (condition?.type === 'require_state' && condition.endpointId) {
      const [currentState] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, condition.endpointId));

      if (currentState) {
        const actualValue =
          currentState.valueBool ?? currentState.valueNum ?? currentState.valueString;
        if (actualValue !== condition.requiredValue) {
          violated = true;
          reason = `Endpoint ${condition.endpointId} state mismatch (required: ${condition.requiredValue}, actual: ${actualValue})`;
        }
      }
    }

    // Log evaluation
    await db.insert(interlockEvaluations).values({
      interlockId: interlock.id,
      evaluatedAt: new Date(),
      passed: !violated,
      failedCondition: violated ? JSON.stringify(condition) : null,
      actionTaken: violated ? interlock.onViolationAction : null,
    });

    // If violated and mode is trip or permissive, block
    if (violated && (interlock.mode === 'trip' || interlock.mode === 'permissive')) {
      return {
        blocked: true,
        reason: `Interlock '${interlock.name}': ${reason}`,
        interlockId: interlock.id,
        severity: interlock.severity,
      };
    }
  }

  return { blocked: false };
}

// ============================================================
// HELPER: SIMULATE NODE COMMUNICATION
// ============================================================
interface SimulationResult {
  success: boolean;
  actualValue?: any;
  error?: string;
}

async function simulateNodeCommunication(
  commandId: string,
  endpoint: any,
  requestedValue: any,
  commandType: string
): Promise<SimulationResult> {
  const now = new Date();

  try {
    // Update command_log: queued → sent
    await db
      .update(commandLog)
      .set({
        status: 'sent',
        sentAt: now,
      })
      .where(eq(commandLog.commandId, commandId));

    // Simulate network delay (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Update command_log: sent → acked
    await db
      .update(commandLog)
      .set({
        status: 'acked',
        ackedAt: new Date(),
      })
      .where(eq(commandLog.commandId, commandId));

    // Simulate processing delay (50ms)
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Determine actual value based on command type
    let actualValue = requestedValue;

    if (commandType === 'toggle') {
      // For toggle, flip boolean value
      const [current] = await db
        .select()
        .from(endpointCurrent)
        .where(eq(endpointCurrent.endpointId, endpoint.id));

      actualValue = current?.valueBool ? false : true;
    } else if (commandType === 'pulse') {
      // For pulse, set true then immediately false (simulated)
      actualValue = true;
    }

    // Update command_log: acked → succeeded
    await db
      .update(commandLog)
      .set({
        status: 'succeeded',
        completedAt: new Date(),
        actualValue: JSON.stringify(actualValue),
      })
      .where(eq(commandLog.commandId, commandId));

    return { success: true, actualValue };
  } catch (error) {
    // Update command_log: failed
    await db
      .update(commandLog)
      .set({
        status: 'failed',
        completedAt: new Date(),
        errorMessage: String(error),
      })
      .where(eq(commandLog.commandId, commandId));

    return { success: false, error: String(error) };
  }
}

// ============================================================
// HELPER: UPDATE ENDPOINT STATE
// ============================================================
async function updateEndpointState(endpointId: number, value: any, endpoint: any) {
  const now = new Date();

  // Determine which value column to use based on endpoint valueType
  const valueColumns: any = {
    valueBool: null,
    valueNum: null,
    valueString: null,
    valueJson: null,
  };

  if (endpoint.valueType === 'bool') {
    valueColumns.valueBool = Boolean(value);
  } else if (endpoint.valueType === 'float' || endpoint.valueType === 'int') {
    valueColumns.valueNum = Number(value);
  } else if (endpoint.valueType === 'string') {
    valueColumns.valueString = String(value);
  } else {
    valueColumns.valueJson = JSON.stringify(value);
  }

  // Update endpoint_current (upsert)
  const [existing] = await db
    .select()
    .from(endpointCurrent)
    .where(eq(endpointCurrent.endpointId, endpointId));

  if (existing) {
    await db
      .update(endpointCurrent)
      .set({
        timestamp: now,
        ...valueColumns,
        quality: 'good',
        source: 'command',
      })
      .where(eq(endpointCurrent.endpointId, endpointId));
  } else {
    await db.insert(endpointCurrent).values({
      endpointId,
      timestamp: now,
      ...valueColumns,
      quality: 'good',
      source: 'command',
    });
  }

  // Insert to telemetry_readings (historical record)
  await db.insert(telemetryReadings).values({
    endpointId,
    timestamp: now,
    ...valueColumns,
    quality: 'good',
    source: 'command',
  });
}
