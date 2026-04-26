import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), 'src/pages/ops/geo', relativePath), 'utf8');

describe('google maps static guardrails', () => {
  it('keeps Maps JS loader free of Places library by default', () => {
    const geoMapSurfaceSource = readSource('./GeoMapSurface.tsx');
    const scriptLine = geoMapSurfaceSource
      .split('\n')
      .find((line) => line.includes('script.src = `https://maps.googleapis.com/maps/api/js'));

    expect(scriptLine).toBeTruthy();
    expect(scriptLine).not.toContain('libraries=places');
  });

  it('keeps driver pages free of Google Maps JS initialization', () => {
    const driverPage = readFileSync(
      resolve(process.cwd(), 'src/pages/ops/logistics/driver.tsx'),
      'utf8'
    );
    const driverDetailPage = readFileSync(
      resolve(process.cwd(), 'src/pages/ops/logistics/driver-detail.tsx'),
      'utf8'
    );

    const disallowedPatterns = [
      /GeoMapSurface/,
      /maps\.googleapis\.com\/maps\/api\/js/,
      /google\.maps\./,
    ];

    disallowedPatterns.forEach((pattern) => {
      expect(driverPage).not.toMatch(pattern);
      expect(driverDetailPage).not.toMatch(pattern);
    });
  });
});
