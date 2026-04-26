import { bevForgeSuiteThemes } from "@bevforge/ui-shared/suite-theme-contract";
import type {
  FlowKegAssignment,
  FlowMenuItem,
  FlowOsDepletionStatus,
  FlowSession,
  FlowTap,
} from "./data";

export const flowTheme = bevForgeSuiteThemes.flow;

const hexToRgb = (hexColor: string): [number, number, number] => {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) {
    return [34, 197, 94];
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return [34, 197, 94];
  }

  return [red, green, blue];
};

export const toRgba = (hexColor: string, alpha: number): string => {
  const [red, green, blue] = hexToRgb(hexColor);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const flowGlassPanelStyle = {
  background: "rgba(9, 18, 13, 0.72)",
  border: `1px solid ${toRgba(flowTheme.soft, 0.5)}`,
  boxShadow: flowTheme.glow,
  backdropFilter: "blur(14px)",
} as const;

export const flowMutedPanelStyle = {
  background: "rgba(7, 14, 10, 0.56)",
  border: `1px solid ${toRgba(flowTheme.soft, 0.28)}`,
  backdropFilter: "blur(12px)",
} as const;

export const flowBadgeStyle = {
  border: `1px solid ${toRgba(flowTheme.soft, 0.56)}`,
  background: toRgba(flowTheme.primary, 0.2),
  color: "#EBFFEF",
} as const;

export const flowSoftBadgeStyle = {
  border: `1px solid ${toRgba(flowTheme.soft, 0.38)}`,
  background: toRgba(flowTheme.deep, 0.24),
  color: "#D7FDE2",
} as const;

export const flowOutlineButtonStyle = {
  borderColor: toRgba(flowTheme.soft, 0.55),
  color: "#ECFFF2",
} as const;

export const flowDividerStyle = {
  borderColor: toRgba(flowTheme.soft, 0.3),
} as const;

export const flowTextColor = "#ECFFF3";

export const tapStatusPillClass = (status: FlowTap["status"]): string => {
  if (status === "online") {
    return "border-green-500/45 bg-green-500/20 text-green-100";
  }

  if (status === "maintenance") {
    return "border-amber-500/50 bg-amber-500/20 text-amber-100";
  }

  if (status === "offline" || status === "disabled") {
    return "border-red-500/45 bg-red-500/20 text-red-100";
  }

  return "border-emerald-500/45 bg-emerald-500/20 text-emerald-100";
};

export const assignmentStatusPillClass = (status: FlowKegAssignment["status"]): string => {
  if (status === "active") {
    return "border-green-500/45 bg-green-500/20 text-green-100";
  }
  if (status === "empty") {
    return "border-amber-500/50 bg-amber-500/20 text-amber-100";
  }
  if (status === "error") {
    return "border-red-500/45 bg-red-500/20 text-red-100";
  }
  return "border-slate-400/45 bg-slate-500/20 text-slate-100";
};

export const menuStatusPillClass = (status: FlowMenuItem["status"]): string => {
  if (status === "on_tap") {
    return "border-green-500/45 bg-green-500/20 text-green-100";
  }
  if (status === "coming_soon") {
    return "border-blue-500/45 bg-blue-500/20 text-blue-100";
  }
  if (status === "out_of_stock") {
    return "border-amber-500/50 bg-amber-500/20 text-amber-100";
  }
  return "border-slate-500/45 bg-slate-500/20 text-slate-100";
};

export const sessionStatusPillClass = (status: FlowSession["status"]): string => {
  if (status === "active") {
    return "border-green-500/45 bg-green-500/20 text-green-100";
  }
  if (status === "paused") {
    return "border-amber-500/50 bg-amber-500/20 text-amber-100";
  }
  if (status === "blocked") {
    return "border-red-500/45 bg-red-500/20 text-red-100";
  }
  return "border-slate-400/45 bg-slate-500/20 text-slate-100";
};

export const ledgerStatusPillClass = (
  status: FlowOsDepletionStatus["status"] | "pending"
): string => {
  if (status === "accepted") {
    return "border-green-500/45 bg-green-500/20 text-green-100";
  }
  if (status === "rejected") {
    return "border-red-500/45 bg-red-500/20 text-red-100";
  }
  return "border-amber-500/50 bg-amber-500/20 text-amber-100";
};

export const sourceModePillClass = (
  sourceMode: "bartender" | "self_serve" | "test" | "maintenance"
): string => {
  if (sourceMode === "bartender") {
    return "border-emerald-500/40 bg-emerald-500/20 text-emerald-100";
  }
  if (sourceMode === "self_serve") {
    return "border-teal-500/40 bg-teal-500/20 text-teal-100";
  }
  if (sourceMode === "maintenance") {
    return "border-amber-500/50 bg-amber-500/20 text-amber-100";
  }
  return "border-blue-500/45 bg-blue-500/20 text-blue-100";
};
