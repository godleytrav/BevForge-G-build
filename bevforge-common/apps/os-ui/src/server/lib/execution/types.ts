export type ExecutionStepKind = 'command' | 'delay' | 'condition' | 'notify';

export interface ExecutionStep {
  id: string;
  kind: ExecutionStepKind;
  targetDeviceId?: string;
  command?: 'on_off' | 'open_close' | 'route' | 'set_value' | 'trigger';
  value?: string | number | boolean;
  delayMs?: number;
  requireUserProceed?: boolean;
}

export interface ExecutionPlan {
  schemaVersion: string;
  id: string;
  sourceType: 'canvas_automation' | 'recipe';
  sourceId?: string;
  steps: ExecutionStep[];
  metadata?: Record<string, unknown>;
}

export interface CanvasAutomationDefinition {
  id: string;
  name?: string;
  steps: Array<{
    id?: string;
    targetDeviceId?: string;
    command?: ExecutionStep['command'];
    value?: string | number | boolean;
    delayMs?: number;
  }>;
}

export interface RecipeExecutionDefinition {
  id: string;
  name?: string;
  steps: Array<{
    id?: string;
    durationMin?: number;
    requiresUserConfirm?: boolean;
    command?: ExecutionStep['command'];
    targetDeviceId?: string;
    value?: string | number | boolean;
  }>;
}
