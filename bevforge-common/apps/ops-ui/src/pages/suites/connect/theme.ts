import { bevForgeSuiteThemes } from '@bevforge/ui-shared/suite-theme-contract';

export const connectTheme = bevForgeSuiteThemes.connect;

const hexToRgb = (hexColor: string): [number, number, number] => {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return [139, 92, 246];
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return [139, 92, 246];
  }

  return [red, green, blue];
};

const toRgba = (hexColor: string, alpha: number): string => {
  const [red, green, blue] = hexToRgb(hexColor);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const connectGlassPanelStyle = {
  background: 'rgba(15, 19, 28, 0.72)',
  border: `1px solid ${toRgba(connectTheme.soft, 0.52)}`,
  boxShadow: connectTheme.glow,
  backdropFilter: 'blur(14px)',
} as const;

export const connectMutedPanelStyle = {
  background: 'rgba(12, 16, 24, 0.58)',
  border: `1px solid ${toRgba(connectTheme.soft, 0.3)}`,
  backdropFilter: 'blur(12px)',
} as const;

export const connectBadgeStyle = {
  border: `1px solid ${toRgba(connectTheme.soft, 0.56)}`,
  background: toRgba(connectTheme.primary, 0.2),
  color: '#F3EEFF',
} as const;

export const connectSoftBadgeStyle = {
  border: `1px solid ${toRgba(connectTheme.soft, 0.4)}`,
  background: toRgba(connectTheme.deep, 0.28),
  color: '#EADBFF',
} as const;

export const connectDividerStyle = {
  borderColor: toRgba(connectTheme.soft, 0.32),
} as const;

export const connectOutlineButtonStyle = {
  borderColor: toRgba(connectTheme.soft, 0.55),
  color: '#F2E9FF',
} as const;

export const connectTextColor = '#F4EFFF';

export const statusPillClass = (status: string): string => {
  if (status === 'done' || status === 'resolved' || status === 'closed' || status === 'active') {
    return 'border-green-500/45 bg-green-500/20 text-green-100';
  }

  if (status === 'blocked' || status === 'suspended' || status === 'inactive') {
    return 'border-red-500/45 bg-red-500/20 text-red-100';
  }

  if (status === 'critical' || status === 'high' || status === 'waiting_external') {
    return 'border-amber-500/50 bg-amber-500/20 text-amber-100';
  }

  if (status === 'in_progress') {
    return 'border-sky-500/45 bg-sky-500/20 text-sky-100';
  }

  return 'border-violet-400/45 bg-violet-500/20 text-violet-100';
};

export const formatDateTime = (value?: string): string => {
  if (!value) {
    return 'Not set';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return 'Not set';
  }
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
