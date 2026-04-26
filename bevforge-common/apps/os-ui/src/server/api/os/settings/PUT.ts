import type { Request, Response } from 'express';
import {
  writeSiteSettings,
  type ComplianceGuidanceSettings,
  type DashboardSettings,
  type ReportingCalendarSettings,
} from '../../../lib/commissioning-store.js';

const normalizeVolumeUnit = (value: unknown): string => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'bbl' || normalized === 'barrel' || normalized === 'barrels' || normalized === 'bbls') {
    return 'bbl';
  }
  if (normalized === 'gal' || normalized === 'gallon' || normalized === 'gallons' || normalized === 'gals' || normalized === 'g') {
    return 'gal';
  }
  if (normalized === 'l' || normalized === 'liter' || normalized === 'liters' || normalized === 'litre' || normalized === 'litres') {
    return 'L';
  }
  if (normalized === 'ml' || normalized === 'milliliter' || normalized === 'milliliters' || normalized === 'millilitre' || normalized === 'millilitres') {
    return 'mL';
  }
  return 'bbl';
};

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      siteName?: string;
      defaultSiteId?: string;
      defaultVolumeUnit?: string;
      temperatureUnit?: 'C' | 'F';
      timezone?: string;
      batchPrefix?: string;
      requireRecipeBeforeBatch?: boolean;
      dashboard?: Partial<DashboardSettings>;
      complianceGuidance?: Partial<ComplianceGuidanceSettings>;
      reportingCalendar?: Partial<ReportingCalendarSettings>;
    };

    const settings = await writeSiteSettings({
      siteName: body.siteName,
      defaultSiteId: body.defaultSiteId,
      defaultVolumeUnit: normalizeVolumeUnit(body.defaultVolumeUnit),
      temperatureUnit: body.temperatureUnit === 'F' ? 'F' : 'C',
      timezone: body.timezone,
      batchPrefix: body.batchPrefix,
      requireRecipeBeforeBatch: Boolean(body.requireRecipeBeforeBatch),
      dashboard: body.dashboard,
      complianceGuidance: body.complianceGuidance,
      reportingCalendar: body.reportingCalendar,
    });

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save settings.',
    });
  }
}
