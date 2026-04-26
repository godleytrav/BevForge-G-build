import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeRecipeRunsState } from './commissioning-store.js';
import { appendRecipeRunReading, listRecipeRunReadings } from './recipe-readings-store.js';

const resolveRepoRoot = (): string => {
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, 'apps', 'os-ui'))) {
    return cwd;
  }
  if (cwd.endsWith(path.join('apps', 'os-ui'))) {
    return path.resolve(cwd, '../..');
  }
  return cwd;
};

const repoRoot = resolveRepoRoot();
const recipeRunsFile = path.join(repoRoot, 'commissioning', 'os', 'recipe-runs.json');
const readingsFile = path.join(repoRoot, 'commissioning', 'os', 'recipe-readings.json');

const readOptionalFile = async (filePath: string): Promise<string | null> => {
  if (!existsSync(filePath)) return null;
  return fs.readFile(filePath, 'utf8');
};

const restoreFile = async (filePath: string, original: string | null): Promise<void> => {
  if (original === null) {
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }
    return;
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, original, 'utf8');
};

describe('recipe-readings-store', () => {
  it('appends and lists readings for a recipe run', async () => {
    const runId = `run-test-${Date.now().toString(36)}`;
    const originalRuns = await readOptionalFile(recipeRunsFile);
    const originalReadings = await readOptionalFile(readingsFile);

    try {
      await writeRecipeRunsState({
        schemaVersion: '0.1.0',
        id: 'recipe-runs',
        updatedAt: new Date().toISOString(),
        runs: [
          {
            runId,
            recipeId: 'recipe-test',
            recipeName: 'Recipe Test',
            executionMode: 'manual',
            status: 'running',
            startedAt: new Date().toISOString(),
            currentStepIndex: 0,
            steps: [],
          },
        ],
      });

      const created = await appendRecipeRunReading({
        runId,
        source: 'manual',
        temperatureC: 18.6,
        sg: 1.012,
        ph: 4.21,
        note: 'Daily cellar check',
      });

      expect(created.runId).toBe(runId);
      expect(created.temperatureC).toBeCloseTo(18.6);
      expect(created.sg).toBeCloseTo(1.012);
      expect(created.note).toBe('Daily cellar check');

      const readings = await listRecipeRunReadings(runId, 10);
      expect(readings.length).toBeGreaterThan(0);
      expect(readings[0].runId).toBe(runId);
      expect(readings[0].id).toBe(created.id);
    } finally {
      await restoreFile(recipeRunsFile, originalRuns);
      await restoreFile(readingsFile, originalReadings);
    }
  });
});
