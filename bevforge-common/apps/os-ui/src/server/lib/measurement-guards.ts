const hasAtMostDecimals = (value: number, maxDecimals: number): boolean => {
  const factor = 10 ** maxDecimals;
  return Math.abs(Math.round(value * factor) - value * factor) < 1e-9;
};

const assertRange = (
  label: string,
  value: number | undefined,
  min: number,
  max: number
): void => {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
};

const assertSpecificGravity = (
  label: string,
  value: number | undefined,
  options: { min: number; max: number; requireOgRange?: boolean }
): void => {
  if (value === undefined) return;
  if (!Number.isFinite(value) || value < options.min || value > options.max) {
    throw new Error(`${label} must be between ${options.min.toFixed(3)} and ${options.max.toFixed(3)}.`);
  }
  if (!hasAtMostDecimals(value, 3)) {
    throw new Error(`${label} must use at most 3 decimal places, like 1.055.`);
  }
  if (options.requireOgRange && value < 1.01) {
    throw new Error(`${label} looks too low for an original gravity reading.`);
  }
};

export interface MeasuredValuesShape {
  og?: number;
  fg?: number;
  sg?: number;
  sgLatest?: number;
  temperatureC?: number;
  ph?: number;
  abvPct?: number;
  brix?: number;
  brixLatest?: number;
  titratableAcidityGpl?: number;
  titratableAcidityGplLatest?: number;
  so2Ppm?: number;
  so2PpmLatest?: number;
  residualSugarGpl?: number;
  residualSugarGplLatest?: number;
  volatileAcidityGpl?: number;
  volatileAcidityGplLatest?: number;
  freeSo2Ppm?: number;
  freeSo2PpmLatest?: number;
  totalSo2Ppm?: number;
  totalSo2PpmLatest?: number;
  dissolvedOxygenPpm?: number;
  dissolvedOxygenPpmLatest?: number;
}

export const validateMeasuredValues = (values: MeasuredValuesShape): void => {
  assertSpecificGravity('OG', values.og, { min: 1.01, max: 1.2, requireOgRange: true });
  assertSpecificGravity('FG', values.fg, { min: 0.9, max: 1.2 });
  assertSpecificGravity('SG', values.sg, { min: 0.9, max: 1.2 });
  assertSpecificGravity('SG', values.sgLatest, { min: 0.9, max: 1.2 });

  assertRange('Temperature C', values.temperatureC, -10, 120);
  assertRange('pH', values.ph, 2, 8);
  assertRange('ABV %', values.abvPct, 0, 25);
  assertRange('Brix', values.brix, 0, 50);
  assertRange('Brix', values.brixLatest, 0, 50);
  assertRange('TA (g/L)', values.titratableAcidityGpl, 0, 25);
  assertRange('TA (g/L)', values.titratableAcidityGplLatest, 0, 25);
  assertRange('SO2 (ppm)', values.so2Ppm, 0, 500);
  assertRange('SO2 (ppm)', values.so2PpmLatest, 0, 500);
  assertRange('Residual Sugar (g/L)', values.residualSugarGpl, 0, 400);
  assertRange('Residual Sugar (g/L)', values.residualSugarGplLatest, 0, 400);
  assertRange('VA (g/L)', values.volatileAcidityGpl, 0, 5);
  assertRange('VA (g/L)', values.volatileAcidityGplLatest, 0, 5);
  assertRange('Free SO2 (ppm)', values.freeSo2Ppm, 0, 500);
  assertRange('Free SO2 (ppm)', values.freeSo2PpmLatest, 0, 500);
  assertRange('Total SO2 (ppm)', values.totalSo2Ppm, 0, 500);
  assertRange('Total SO2 (ppm)', values.totalSo2PpmLatest, 0, 500);
  assertRange('Dissolved Oxygen (ppm)', values.dissolvedOxygenPpm, 0, 50);
  assertRange('Dissolved Oxygen (ppm)', values.dissolvedOxygenPpmLatest, 0, 50);
};
