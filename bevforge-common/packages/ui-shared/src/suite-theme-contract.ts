import type { SuiteId } from './app-shell-contract';

export interface SuiteThemeTokens {
  primary: string;
  soft: string;
  deep: string;
  glow: string;
}

export interface BaseThemeTokens {
  appBackground: string;
  surface: string;
  glass: string;
  border: string;
  textPrimary: string;
}

export const bevForgeBaseTheme: BaseThemeTokens = {
  appBackground: '#0A0D11',
  surface: '#121720',
  glass: 'rgba(18,23,32,0.65)',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#E6EDF3',
};

export const bevForgeSuiteThemes: Record<SuiteId, SuiteThemeTokens> = {
  os: {
    primary: '#00C2FF',
    soft: '#4FD8FF',
    deep: '#0094C7',
    glow: '0 0 16px rgba(0,194,255,0.35)',
  },
  ops: {
    primary: '#3A6EA5',
    soft: '#6F95C2',
    deep: '#274B73',
    glow: '0 0 16px rgba(58,110,165,0.35)',
  },
  lab: {
    primary: '#F59E0B',
    soft: '#FBBF24',
    deep: '#C27707',
    glow: '0 0 20px rgba(245,158,11,0.38)',
  },
  connect: {
    primary: '#8B5CF6',
    soft: '#A78BFA',
    deep: '#6D3FE0',
    glow: '0 0 20px rgba(139,92,246,0.35)',
  },
  flow: {
    primary: '#22C55E',
    soft: '#4ADE80',
    deep: '#15803D',
    glow: '0 0 18px rgba(34,197,94,0.35)',
  },
};
