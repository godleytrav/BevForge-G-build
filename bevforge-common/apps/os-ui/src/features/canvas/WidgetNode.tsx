import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CanvasNode } from './types';
import { useCanvasRuntime } from './runtime-context';

const flowTypes = new Set(['vessel', 'pump', 'valve', 'sensor', 'heater']);

const labelByType: Record<string, string> = {
  vessel: 'Vessel',
  pump: 'Pump',
  valve: 'Valve',
  packaging: 'Packaging',
  sensor: 'Sensor',
  heater: 'Heater',
  pid: 'PID',
  button: 'Button',
  switch: 'Switch',
  slider: 'Slider',
  glycol_controller: 'Glycol Ctrl',
  hlt_controller: 'HLT Ctrl',
  co2_controller: 'CO2 Ctrl',
  transfer_controller: 'Transfer Ctrl',
  recipe_executor: 'Recipe Exec',
  automation: 'Automation',
  display: 'Display',
  note: 'Note',
};

const accentByType: Record<string, string> = {
  vessel: '#0ea5e9',
  pump: '#2563eb',
  valve: '#06b6d4',
  packaging: '#ec4899',
  sensor: '#f59e0b',
  heater: '#ef4444',
  pid: '#8b5cf6',
  button: '#22c55e',
  switch: '#16a34a',
  slider: '#f97316',
  glycol_controller: '#0ea5e9',
  hlt_controller: '#f97316',
  co2_controller: '#22c55e',
  transfer_controller: '#2563eb',
  recipe_executor: '#7c3aed',
  automation: '#6366f1',
  display: '#14b8a6',
  note: '#64748b',
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const WidgetNode = ({ id, data, selected }: NodeProps<CanvasNode>) => {
  const { mode, onControl } = useCanvasRuntime();
  const isFlowType = flowTypes.has(data.widgetType);
  const isThreeWayValve =
    data.widgetType === 'valve' && data.config.valveType === '3way';

  const stateValue =
    data.widgetType === 'valve'
      ? data.config.position ?? (isThreeWayValve ? 'c_to_a' : 'closed')
      : data.config.state ?? data.config.value ?? '--';
  const unitSuffix = data.config.unit ? ` ${data.config.unit}` : '';
  const accent = accentByType[data.widgetType] ?? '#64748b';
  const primaryValue =
    data.widgetType === 'sensor' || data.widgetType === 'slider'
      ? `${String(data.config.value ?? '--')}${unitSuffix}`
      : data.widgetType === 'glycol_controller'
      ? data.config.state === 'on'
        ? 'COOLING'
        : 'IDLE'
      : data.widgetType === 'hlt_controller'
      ? data.config.hltController?.enabled === false
        ? 'DISABLED'
        : data.config.state === 'on'
        ? 'HEATING'
        : 'IDLE'
      : data.widgetType === 'co2_controller'
      ? data.config.co2Controller?.runtimeState === 'safety_stop'
        ? 'SAFETY'
        : data.config.co2Controller?.runtimeState === 'pressurizing'
        ? 'PRESSURIZING'
        : data.config.co2Controller?.runtimeState === 'venting'
        ? 'VENTING'
        : data.config.co2Controller?.enabled === false
        ? 'DISABLED'
        : 'HOLD'
      : data.widgetType === 'transfer_controller'
      ? data.config.transferController?.enabled === false
        ? 'DISABLED'
        : data.config.transferController?.runtimeState === 'running'
        ? 'RUNNING'
        : 'IDLE'
      : data.widgetType === 'packaging'
      ? String(data.config.packagingNode?.packageType ?? 'packaging').toUpperCase()
      : data.widgetType === 'recipe_executor'
      ? data.config.recipeExecutor?.enabled === false
        ? 'DISABLED'
        : data.config.recipeExecutor?.runtimeState === 'completed'
        ? 'DONE'
        : data.config.recipeExecutor?.runtimeState === 'waiting_confirm'
        ? 'CONFIRM'
        : data.config.recipeExecutor?.runtimeState === 'paused'
        ? 'PAUSED'
        : data.config.recipeExecutor?.runtimeState === 'running'
        ? 'RUNNING'
        : 'IDLE'
      : data.widgetType === 'valve'
      ? String(stateValue).replaceAll('_', ' ').toUpperCase()
      : data.widgetType === 'automation'
      ? 'READY'
      : String(stateValue).toUpperCase();
  const vesselCapacity = Number(data.config.capacity ?? 100);
  const vesselLevel = Number(data.config.currentLevel ?? 0);
  const vesselType = data.config.vesselType ?? 'fermentor_conical';
  const vesselFillPct = clamp(
    vesselCapacity > 0 ? (vesselLevel / vesselCapacity) * 100 : 0,
    0,
    100
  );
  const vesselFluidColor =
    data.config.temperature && Number(data.config.temperature) >= 78
      ? '#fb7185'
      : '#38bdf8';
  const vesselTemp = Number(data.config.temperature ?? 0);
  const vesselFlow = Number(data.config.flowRate ?? 0);
  const pumpIsOn = data.config.state === 'on';
  const valveIsOpen =
    data.config.position === 'open' ||
    data.config.position === 'c_to_a' ||
    data.config.position === 'c_to_b';
  const packagingConfig = data.config.packagingNode;
  const packagingLineKind = packagingConfig?.lineKind ?? 'keg_line';
  const packagingMode = packagingConfig?.lineMode ?? 'manual';
  const packagingType = packagingConfig?.packageType ?? 'keg';
  const packagingFormats = packagingConfig?.supportedFormats ?? [];
  const packagingSize = packagingConfig?.defaultFillSize ?? '--';
  const packagingClass = packagingConfig?.beverageClass ?? 'other';

  return (
    <div
      className={`group relative min-w-[170px] rounded-md border border-white/30 bg-background/65 p-2 text-card-foreground shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md ${
        selected ? 'ring-2 ring-primary' : ''
      }`}
      style={{
        borderColor: `${accent}80`,
        boxShadow: `0 0 0 1px ${accent}2e, 0 10px 30px rgba(0,0,0,0.15), 0 0 22px ${accent}26`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="data-in"
        style={{ background: '#f59e0b' }}
      />
      <span className="pointer-events-none absolute -left-14 top-[48%] rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100">
        Data In
      </span>
      <Handle
        type="source"
        position={Position.Right}
        id="data-out"
        style={{ background: '#f59e0b' }}
      />
      <span className="pointer-events-none absolute -right-16 top-[48%] rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100">
        Data Out
      </span>

      {data.widgetType === 'vessel' && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="glycol-in"
            style={{ top: '64%', background: '#06b6d4' }}
          />
          <span className="pointer-events-none absolute -left-16 top-[61%] rounded bg-cyan-100 px-1 py-0.5 text-[10px] text-cyan-900 opacity-0 transition-opacity group-hover:opacity-100">
            Glycol In
          </span>
          <Handle
            type="source"
            position={Position.Right}
            id="glycol-out"
            style={{ top: '64%', background: '#06b6d4' }}
          />
          <span className="pointer-events-none absolute -right-16 top-[61%] rounded bg-cyan-100 px-1 py-0.5 text-[10px] text-cyan-900 opacity-0 transition-opacity group-hover:opacity-100">
            Glycol Out
          </span>
          <Handle
            type="target"
            position={Position.Top}
            id="gas-in"
            style={{ left: '72%', background: '#f59e0b' }}
          />
          <span className="pointer-events-none absolute left-[72%] top-0 -translate-x-1/2 -translate-y-5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100">
            Gas In
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="gas-out"
            style={{ left: '72%', background: '#f59e0b' }}
          />
          <span className="pointer-events-none absolute bottom-0 left-[72%] -translate-x-1/2 translate-y-5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-900 opacity-0 transition-opacity group-hover:opacity-100">
            Gas Out
          </span>
        </>
      )}

      {isThreeWayValve ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="fluid-in-c"
            style={{ top: '30%', background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute -left-16 top-[28%] rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid In C
          </span>
          <Handle
            type="source"
            position={Position.Top}
            id="fluid-out-a"
            style={{ background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid Out A
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="fluid-out-b"
            style={{ background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid Out B
          </span>
        </>
      ) : data.widgetType === 'packaging' ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="fluid-in"
            style={{ background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid In
          </span>
        </>
      ) : (
        isFlowType && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="fluid-in"
            style={{ background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid In
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="fluid-out"
            style={{ background: '#0ea5e9' }}
          />
          <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5 rounded bg-sky-100 px-1 py-0.5 text-[10px] text-sky-900 opacity-0 transition-opacity group-hover:opacity-100">
            Fluid Out
          </span>
        </>
      ))}

      {(data.widgetType === 'pump' || data.widgetType === 'heater' || data.widgetType === 'pid') && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="power-in"
            style={{ top: '78%', background: '#dc2626' }}
          />
          <span className="pointer-events-none absolute -left-16 top-[74%] rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-900 opacity-0 transition-opacity group-hover:opacity-100">
            Power In
          </span>
          <Handle
            type="target"
            position={Position.Left}
            id="ground-in"
            style={{ top: '90%', background: '#111827' }}
          />
          <span className="pointer-events-none absolute -left-[4.2rem] top-[88%] rounded bg-slate-200 px-1 py-0.5 text-[10px] text-slate-900 opacity-0 transition-opacity group-hover:opacity-100">
            Ground In
          </span>
        </>
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase text-muted-foreground">
            {labelByType[data.widgetType] ?? data.widgetType}
          </p>
          <p className="truncate text-sm font-semibold">{data.label}</p>
        </div>
        <div className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] uppercase">
          {mode}
        </div>
      </div>

      <div className="rounded-md border border-white/25 bg-white/20 px-2 py-1">
        <p className="text-lg font-semibold leading-tight">{primaryValue}</p>
      </div>

      {data.widgetType === 'vessel' && (
        <div className="mt-2 rounded-lg border border-slate-600/70 bg-[#1a2137] p-2 text-slate-100">
          <svg viewBox="0 0 120 96" className="h-24 w-full">
            <defs>
              <linearGradient id={`tank-glass-${id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id={`tank-fluid-${id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={vesselFluidColor} stopOpacity="0.92" />
                <stop offset="100%" stopColor={vesselFluidColor} stopOpacity="0.68" />
              </linearGradient>
              <clipPath id={`tank-clip-${id}`}>
                {vesselType === 'fermentor_conical' && (
                  <path d="M30 16 Q30 10 36 10 L84 10 Q90 10 90 16 L90 62 Q90 66 86 70 L68 86 Q64 90 60 90 Q56 90 52 86 L34 70 Q30 66 30 62 Z" />
                )}
                {vesselType === 'bright_tank' && (
                  <rect x="24" y="18" width="72" height="56" rx="20" />
                )}
                {vesselType === 'mash_tun' && (
                  <path d="M24 24 Q24 16 32 16 L88 16 Q96 16 96 24 L92 72 Q91 80 82 80 L38 80 Q29 80 28 72 Z" />
                )}
                {vesselType === 'hlt' && (
                  <path d="M28 14 Q28 10 32 10 L88 10 Q92 10 92 14 L92 82 Q92 86 88 86 L32 86 Q28 86 28 82 Z" />
                )}
                {vesselType === 'brew_kettle' && (
                  <>
                    <ellipse cx="60" cy="20" rx="40" ry="8" />
                    <rect x="20" y="20" width="80" height="54" />
                    <ellipse cx="60" cy="74" rx="40" ry="8" />
                  </>
                )}
                {vesselType === 'generic' && <rect x="30" y="10" width="60" height="76" rx="10" />}
              </clipPath>
            </defs>
            {vesselType === 'fermentor_conical' && (
              <path
                d="M30 16 Q30 10 36 10 L84 10 Q90 10 90 16 L90 62 Q90 66 86 70 L68 86 Q64 90 60 90 Q56 90 52 86 L34 70 Q30 66 30 62 Z"
                fill={`url(#tank-glass-${id})`}
                stroke="#a5b4fc"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
            )}
            {vesselType === 'bright_tank' && (
              <rect x="24" y="18" width="72" height="56" rx="20" fill={`url(#tank-glass-${id})`} stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
            )}
            {vesselType === 'mash_tun' && (
              <path
                d="M24 24 Q24 16 32 16 L88 16 Q96 16 96 24 L92 72 Q91 80 82 80 L38 80 Q29 80 28 72 Z"
                fill={`url(#tank-glass-${id})`}
                stroke="#a5b4fc"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
            )}
            {vesselType === 'hlt' && (
              <path
                d="M28 14 Q28 10 32 10 L88 10 Q92 10 92 14 L92 82 Q92 86 88 86 L32 86 Q28 86 28 82 Z"
                fill={`url(#tank-glass-${id})`}
                stroke="#a5b4fc"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
            )}
            {vesselType === 'brew_kettle' && (
              <>
                <ellipse cx="60" cy="20" rx="40" ry="8" fill={`url(#tank-glass-${id})`} stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
                <line x1="20" y1="20" x2="20" y2="74" stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
                <line x1="100" y1="20" x2="100" y2="74" stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
                <ellipse cx="60" cy="74" rx="40" ry="8" fill={`url(#tank-glass-${id})`} stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
                <path d="M38 84 Q42 88 46 84 Q50 80 54 84 Q58 88 62 84 Q66 80 70 84 Q74 88 78 84 Q82 80 86 84" stroke="#ef4444" strokeWidth="1.5" fill="none" />
              </>
            )}
            {vesselType === 'generic' && (
              <rect x="30" y="10" width="60" height="76" rx="10" fill={`url(#tank-glass-${id})`} stroke="#a5b4fc" strokeOpacity="0.7" strokeWidth="1.2" />
            )}
            <g clipPath={`url(#tank-clip-${id})`}>
              <rect
                x={
                  vesselType === 'bright_tank' ? 24 :
                  vesselType === 'mash_tun' ? 24 :
                  vesselType === 'hlt' ? 28 :
                  vesselType === 'brew_kettle' ? 20 :
                  30
                }
                y={
                  vesselType === 'brew_kettle'
                    ? 82 - (62 * vesselFillPct) / 100
                    : 90 - (78 * vesselFillPct) / 100
                }
                width={
                  vesselType === 'bright_tank' ? 72 :
                  vesselType === 'mash_tun' ? 72 :
                  vesselType === 'hlt' ? 64 :
                  vesselType === 'brew_kettle' ? 80 :
                  60
                }
                height={vesselType === 'brew_kettle' ? (62 * vesselFillPct) / 100 : (78 * vesselFillPct) / 100}
                fill={`url(#tank-fluid-${id})`}
              >
                <animate
                  attributeName="y"
                  dur="0.45s"
                  fill="freeze"
                  to={String(
                    vesselType === 'brew_kettle'
                      ? 82 - (62 * vesselFillPct) / 100
                      : 90 - (78 * vesselFillPct) / 100
                  )}
                />
                <animate
                  attributeName="height"
                  dur="0.45s"
                  fill="freeze"
                  to={String(vesselType === 'brew_kettle' ? (62 * vesselFillPct) / 100 : (78 * vesselFillPct) / 100)}
                />
              </rect>
            </g>
            {vesselType !== 'bright_tank' && <rect x="53" y="4" width="14" height="6" rx="2" fill="#94a3b8" />}
            {vesselType === 'mash_tun' && <rect x="20" y="24" width="6" height="22" rx="2" fill="#64748b" />}
            {vesselType === 'hlt' && <circle cx="80" cy="30" r="5" fill="#f59e0b" />}
            {vesselType === 'brew_kettle' && (
              <>
                <rect x="102" y="34" width="8" height="34" rx="2" fill="none" stroke="#a5b4fc" strokeWidth="1" />
                <rect
                  x="103"
                  y={68 - (30 * vesselFillPct) / 100}
                  width="6"
                  height={(30 * vesselFillPct) / 100}
                  fill={vesselFluidColor}
                  opacity="0.8"
                />
              </>
            )}
            <text x="60" y="52" textAnchor="middle" className="fill-slate-200 text-[8px] font-semibold">
              {Math.round(vesselFillPct)}%
            </text>
          </svg>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px]">
            <div>
              <p className="text-slate-400">Temp</p>
              <p className="font-semibold text-slate-100">
                {Number.isFinite(vesselTemp) ? vesselTemp.toFixed(1) : '--'}
                {unitSuffix || ' C'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Level</p>
              <p className="font-semibold text-slate-100">{Math.round(vesselFillPct)}%</p>
            </div>
            <div>
              <p className="text-slate-400">Rate</p>
              <p className="font-semibold text-slate-100">{vesselFlow.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {data.widgetType === 'pump' && (
        <div className="mt-2 rounded-md border border-white/25 bg-white/15 p-2">
          <svg viewBox="0 0 120 64" className="h-16 w-full">
            <circle cx="42" cy="32" r="18" fill={pumpIsOn ? '#93c5fd' : '#e2e8f0'} stroke="#64748b" strokeWidth="2" />
            <path d="M42 20 L49 32 L42 44 L35 32 Z" fill={pumpIsOn ? '#2563eb' : '#94a3b8'} />
            <rect x="60" y="24" width="26" height="16" rx="4" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.6" />
            <rect x="18" y="28" width="10" height="8" rx="2" fill="#cbd5e1" />
            <rect x="86" y="28" width="10" height="8" rx="2" fill="#cbd5e1" />
          </svg>
        </div>
      )}

      {data.widgetType === 'valve' && (
        <div className="mt-2 rounded-md border border-white/25 bg-white/15 p-2">
          <svg viewBox="0 0 120 64" className="h-16 w-full">
            <line x1="20" y1="32" x2="100" y2="32" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <circle cx="60" cy="32" r="14" fill={valveIsOpen ? '#67e8f9' : '#e2e8f0'} stroke="#64748b" strokeWidth="2" />
            {isThreeWayValve ? (
              <>
                <line x1="60" y1="18" x2="60" y2="6" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                <line
                  x1="60"
                  y1="32"
                  x2={data.config.position === 'c_to_b' ? 68 : 52}
                  y2={data.config.position === 'c_to_b' ? 40 : 24}
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <line
                x1="50"
                y1={valveIsOpen ? 22 : 18}
                x2="70"
                y2={valveIsOpen ? 42 : 46}
                stroke="#0f172a"
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>
      )}

      {data.widgetType === 'packaging' && (
        <div className="mt-2 rounded-md border border-white/25 bg-white/15 p-2">
          <svg viewBox="0 0 120 64" className="h-16 w-full">
            <line x1="12" y1="32" x2="42" y2="32" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <circle cx="48" cy="32" r="8" fill="#38bdf8" opacity="0.9" />
            <path d="M56 32 H68" stroke="#f472b6" strokeWidth="5" strokeLinecap="round" />
            {packagingType === 'keg' && (
              <>
                <rect x="72" y="16" width="24" height="34" rx="6" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
                <rect x="78" y="10" width="12" height="6" rx="2" fill="#fbcfe8" stroke="#9f1239" strokeWidth="1.3" />
              </>
            )}
            {packagingType === 'can' && (
              <>
                <rect x="72" y="14" width="22" height="36" rx="8" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
                <ellipse cx="83" cy="14" rx="11" ry="3.5" fill="#fbcfe8" stroke="#9f1239" strokeWidth="1.3" />
              </>
            )}
            {packagingType === 'bottle' && (
              <>
                <path d="M82 10 h8 v10 l6 8 v16 a6 6 0 0 1 -6 6 h-8 a6 6 0 0 1 -6 -6 v-16 l6 -8 z" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
              </>
            )}
            {packagingType === 'case' && (
              <rect x="70" y="22" width="28" height="22" rx="3" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
            )}
            {packagingType === 'pallet' && (
              <>
                <rect x="70" y="18" width="30" height="20" rx="2" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
                <line x1="72" y1="42" x2="100" y2="42" stroke="#9f1239" strokeWidth="2" />
                <line x1="76" y1="46" x2="96" y2="46" stroke="#9f1239" strokeWidth="2" />
              </>
            )}
            {packagingType === 'custom' && (
              <rect x="72" y="18" width="24" height="28" rx="4" fill="#fce7f3" stroke="#9f1239" strokeWidth="1.8" />
            )}
          </svg>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[10px]">
            <div>
              <p className="text-muted-foreground">Mode</p>
              <p className="font-semibold uppercase">{packagingMode}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fill</p>
              <p className="font-semibold">{packagingSize}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Class</p>
              <p className="font-semibold uppercase">{packagingClass}</p>
            </div>
          </div>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {packagingLineKind.replaceAll('_', ' ')}
            {packagingFormats.length > 0 ? ` · ${packagingFormats.join(', ')}` : ''}
          </p>
        </div>
      )}

      {mode === 'draft' && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          Device: {data.logicalDeviceId ?? 'unbound'}
        </div>
      )}

      {mode === 'published' && data.widgetType === 'sensor' && (
        <div className="mt-1 text-[10px] text-muted-foreground">
          {data.config.sensorType ?? 'custom'}
        </div>
      )}

      {mode === 'published' && data.widgetType === 'sensor' && data.config.dummyMode && (
        <input
          className="bf-no-pan mt-2 w-full"
          type="number"
          min={Number(data.config.min ?? 0)}
          max={Number(data.config.max ?? 100)}
          step={Number(data.config.step ?? 1)}
          value={Number(data.config.value ?? data.config.dummyValue ?? 0)}
          onChange={(event) => {
            const next = Number(event.target.value);
            onControl(id, 'set_value', next);
          }}
        />
      )}

      {mode === 'published' && data.widgetType === 'button' && (
        <button
          className="mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onControl(id, 'trigger', true);
          }}
          type="button"
        >
          Trigger
        </button>
      )}

      {mode === 'published' && data.widgetType === 'switch' && (
        <button
          className="mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          onClick={(event) => {
            event.stopPropagation();
            const next = data.config.state === 'on' ? 'off' : 'on';
            onControl(id, 'toggle', next);
          }}
          type="button"
        >
          {data.config.state === 'on' ? 'Switch Off' : 'Switch On'}
        </button>
      )}

      {mode === 'published' && data.widgetType === 'slider' && (
        <input
          className="bf-no-pan bf-range-thermo mt-2 w-full"
          type="range"
          min={Number(data.config.min ?? 0)}
          max={Number(data.config.max ?? 100)}
          step={Number(data.config.step ?? 1)}
          value={Number(data.config.value ?? 0)}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerMove={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onMouseMove={(event) => event.stopPropagation()}
          onMouseUp={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
          onTouchEnd={(event) => event.stopPropagation()}
          onChange={(event) => {
            const next = Number(event.target.value);
            onControl(id, 'set_value', next);
          }}
        />
      )}

      {data.widgetType === 'glycol_controller' && (
        <div className="mt-2 space-y-1 rounded-md border border-sky-200/60 bg-sky-50/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-sky-900/80">Actual</span>
            <span className="text-base font-semibold text-sky-950">
              {Number(data.config.value ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-sky-900/80">Target</span>
            <span className="text-sm font-semibold text-sky-950">
              {Number(data.config.setpoint ?? data.config.glycolController?.threshold ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          {mode === 'published' && (
            <input
              className="bf-no-pan bf-range-thermo mt-1 w-full"
              type="range"
              min={Number(data.config.min ?? 32)}
              max={Number(data.config.max ?? 80)}
              step={Number(data.config.step ?? 0.5)}
              value={Number(data.config.setpoint ?? data.config.glycolController?.threshold ?? 65)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseMove={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
              onChange={(event) => {
                const next = Number(event.target.value);
                onControl(id, 'set_value', next);
              }}
            />
          )}
        </div>
      )}

      {data.widgetType === 'hlt_controller' && (
        <div className="mt-2 space-y-1 rounded-md border border-orange-200/60 bg-orange-50/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-orange-900/80">Actual</span>
            <span className="text-base font-semibold text-orange-950">
              {Number(data.config.value ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-orange-900/80">Target</span>
            <span className="text-sm font-semibold text-orange-950">
              {Number(data.config.setpoint ?? data.config.hltController?.threshold ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          {mode === 'published' && (
            <input
              className="bf-no-pan bf-range-thermo mt-1 w-full"
              type="range"
              min={Number(data.config.min ?? 50)}
              max={Number(data.config.max ?? 180)}
              step={Number(data.config.step ?? 0.5)}
              value={Number(data.config.setpoint ?? data.config.hltController?.threshold ?? 152)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseMove={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
              onChange={(event) => {
                const next = Number(event.target.value);
                onControl(id, 'set_value', next);
              }}
            />
          )}
        </div>
      )}

      {data.widgetType === 'co2_controller' && (
        <div className="mt-2 space-y-1 rounded-md border border-emerald-200/60 bg-emerald-50/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-emerald-900/80">Actual</span>
            <span className="text-base font-semibold text-emerald-950">
              {Number(data.config.value ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-emerald-900/80">Target</span>
            <span className="text-sm font-semibold text-emerald-950">
              {Number(data.config.setpoint ?? data.config.co2Controller?.threshold ?? 0).toFixed(1)}
              {unitSuffix}
            </span>
          </div>
          {mode === 'published' && (
            <>
              <input
                className="bf-no-pan bf-range-thermo mt-1 w-full"
                type="range"
                min={Number(data.config.min ?? 0)}
                max={Number(data.config.max ?? 40)}
                step={Number(data.config.step ?? 0.1)}
                value={Number(data.config.setpoint ?? data.config.co2Controller?.threshold ?? 12)}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onMouseMove={(event) => event.stopPropagation()}
                onMouseUp={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  onControl(id, 'set_value', next);
                }}
              />
              <button
                className="mt-1 w-full rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  onControl(
                    id,
                    'trigger_purge',
                    !(data.config.co2Controller?.purgeActive ?? false)
                  );
                }}
                type="button"
              >
                {(data.config.co2Controller?.purgeActive ?? false) ? 'Stop Purge' : 'Start Purge'}
              </button>
            </>
          )}
        </div>
      )}

      {data.widgetType === 'transfer_controller' && (
        <div className="mt-2 space-y-1 rounded-md border border-blue-200/60 bg-blue-50/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-blue-900/80">Pump Mode</span>
            <span className="text-sm font-semibold text-blue-950">
              {String(data.config.transferController?.pumpMode ?? 'fsd').toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-blue-900/80">Speed</span>
            <span className="text-sm font-semibold text-blue-950">
              {Number(data.config.transferController?.transferSpeedPct ?? data.config.value ?? 0).toFixed(0)}%
            </span>
          </div>
          {mode === 'published' && (
            <>
              <button
                className="mt-1 w-full rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  onControl(
                    id,
                    'trigger_transfer',
                    !(data.config.transferController?.transferActive ?? false)
                  );
                }}
                type="button"
              >
                {(data.config.transferController?.transferActive ?? false) ? 'Stop Transfer' : 'Start Transfer'}
              </button>
              {(data.config.transferController?.pumpMode ?? 'fsd') === 'vsd' && (
                <input
                  className="bf-no-pan bf-range-thermo mt-1 w-full"
                  type="range"
                  min={Number(data.config.min ?? 0)}
                  max={Number(data.config.max ?? 100)}
                  step={Number(data.config.step ?? 1)}
                  value={Number(data.config.transferController?.transferSpeedPct ?? data.config.value ?? 60)}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onPointerMove={(event) => event.stopPropagation()}
                  onPointerUp={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                  onMouseMove={(event) => event.stopPropagation()}
                  onMouseUp={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  onTouchEnd={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    onControl(id, 'set_value', next);
                  }}
                />
              )}
            </>
          )}
        </div>
      )}

      {data.widgetType === 'recipe_executor' && (
        <div className="mt-2 space-y-1 rounded-md border border-violet-200/60 bg-violet-50/40 p-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-violet-900/80">Recipe</span>
            <span className="max-w-[8rem] truncate text-sm font-semibold text-violet-950">
              {String(data.config.recipeName ?? 'Unloaded')}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] uppercase text-violet-900/80">Step</span>
            <span className="text-sm font-semibold text-violet-950">
              {Math.min(
                Number(data.config.recipeExecutor?.currentStepIndex ?? 0) + 1,
                Math.max(1, Number(data.config.recipeSteps?.length ?? 0))
              )}
              /{Math.max(0, Number(data.config.recipeSteps?.length ?? 0))}
            </span>
          </div>
          {mode === 'published' && (
            <>
              <button
                className="mt-1 w-full rounded bg-violet-600 px-2 py-1 text-xs font-medium text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  if (data.config.recipeExecutor?.running) {
                    onControl(id, 'recipe_stop', true);
                  } else {
                    onControl(id, 'recipe_start', true);
                  }
                }}
                type="button"
              >
                {data.config.recipeExecutor?.running ? 'Stop Recipe' : 'Start Recipe'}
              </button>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <button
                  className="rounded bg-violet-500 px-2 py-1 text-[11px] font-medium text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    onControl(
                      id,
                      'recipe_pause',
                      !(data.config.recipeExecutor?.paused ?? false)
                    );
                  }}
                  type="button"
                >
                  {(data.config.recipeExecutor?.paused ?? false) ? 'Resume' : 'Pause'}
                </button>
                <button
                  className="rounded bg-violet-500 px-2 py-1 text-[11px] font-medium text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    onControl(id, 'recipe_next', true);
                  }}
                  type="button"
                >
                  Next Step
                </button>
              </div>
              {(data.config.recipeExecutor?.awaitingConfirm ?? false) && (
                <button
                  className="mt-1 w-full rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    onControl(id, 'recipe_confirm', true);
                  }}
                  type="button"
                >
                  Confirm Step
                </button>
              )}
            </>
          )}
        </div>
      )}

      {mode === 'published' && data.widgetType === 'automation' && (
        <button
          className="mt-2 w-full rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onControl(id, 'trigger', true);
          }}
          type="button"
        >
          Run Sequence
        </button>
      )}

      {mode === 'draft' && null}
    </div>
  );
};

export default memo(WidgetNode);
