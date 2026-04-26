import { formatDate, formatDateTime } from "@/pages/ops/logistics/data";
import type {
  OpsMobileGapSeverity,
  OpsMobileQueueStatus,
  OpsMobileStopLocalStatus,
} from "./data";

export const mobileGlassClass =
  "border-white/10 bg-white/[0.06] shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur";

export const formatMobileCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const formatMobileCount = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

export const formatMobileDate = formatDate;
export const formatMobileDateTime = formatDateTime;

export const stopStatusClass = (
  status: OpsMobileStopLocalStatus,
): string => {
  switch (status) {
    case "completed":
      return "border-emerald-400/35 bg-emerald-400/12 text-emerald-100";
    case "checked-in":
    case "current":
      return "border-cyan-400/35 bg-cyan-400/12 text-cyan-100";
    case "issue":
      return "border-red-400/35 bg-red-400/12 text-red-100";
    case "servicing":
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
    case "checked-out":
      return "border-violet-400/35 bg-violet-400/12 text-violet-100";
    default:
      return "border-white/15 bg-white/8 text-white/75";
  }
};

export const queueStatusClass = (
  status: OpsMobileQueueStatus,
): string => {
  switch (status) {
    case "synced":
      return "border-emerald-400/35 bg-emerald-400/12 text-emerald-100";
    case "blocked":
      return "border-red-400/35 bg-red-400/12 text-red-100";
    default:
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
  }
};

export const gapSeverityClass = (
  severity: OpsMobileGapSeverity,
): string => {
  switch (severity) {
    case "critical":
      return "border-red-400/35 bg-red-400/12 text-red-100";
    case "warning":
      return "border-amber-400/35 bg-amber-400/12 text-amber-100";
    default:
      return "border-cyan-400/35 bg-cyan-400/12 text-cyan-100";
  }
};

