import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { commissioningPaths } from './commissioning-store.js';
import importRecipeHandler from '../api/os/recipes/import/POST.js';
import type { ImportedRecipe } from '../../features/canvas/types.js';

const DEFAULT_SYSTEM_INBOX = '/var/bevforge/os/queue/recipes';

interface InboxValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface IngestJobRecord {
  jobId: string;
  sourceFile: string;
  status: 'ingested' | 'rejected' | 'error';
  reason?: string;
  warnings?: string[];
  recipe?: {
    id: string;
    name: string;
    format: ImportedRecipe['format'];
    stepCount: number;
  };
  createdAt: string;
  jobDir?: string;
  rejectedFile?: string;
}

export interface RecipeInboxScanResult {
  scannedAt: string;
  activeInboxDir: string;
  usingFallbackInbox: boolean;
  filesSeen: number;
  ingested: number;
  rejected: number;
  errors: number;
  jobs: IngestJobRecord[];
}

export interface RecipeInboxStatus {
  started: boolean;
  activeInboxDir: string;
  usingFallbackInbox: boolean;
  pollingMs: number;
  lastScan?: RecipeInboxScanResult;
}

const nowIso = () => new Date().toISOString();

const makeJobId = () =>
  `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const safeFileName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9._-]/g, '_');

const readJson = (content: string): unknown => JSON.parse(content);

const validateBevForgeContract = (value: unknown): InboxValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: ['Payload is not a JSON object.'],
      warnings,
    };
  }
  const input = value as Record<string, unknown>;
  const meta = input.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') {
    errors.push('Missing `meta` block.');
  } else if (typeof meta.version !== 'string' || !meta.version.trim()) {
    warnings.push('Missing `meta.version`; default routing may be used.');
  }
  if (!input.process && !Array.isArray(input.actions) && !Array.isArray(input.steps)) {
    errors.push('Missing executable content (`process`, `actions`, or `steps`).');
  }
  if (!input.metrics && !input.targets) {
    warnings.push('Missing `metrics`/`targets` block.');
  }
  if (!input.hardware_prep) {
    warnings.push('Missing `hardware_prep` block.');
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

const moveFile = async (sourcePath: string, destinationPath: string) => {
  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'EXDEV') {
      await fs.copyFile(sourcePath, destinationPath);
      await fs.unlink(sourcePath);
      return;
    }
    throw error;
  }
};

const toExpressReq = (filename: string, content: string) =>
  ({ body: { filename, content } }) as any;

const toExpressRes = () => {
  let code = 200;
  let jsonBody: any = null;
  const res = {
    status(nextCode: number) {
      code = nextCode;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
  };
  return {
    res: res as any,
    getCode: () => code,
    getJson: () => jsonBody,
  };
};

class RecipeInboxService {
  private started = false;
  private activeInboxDir = commissioningPaths.queueInboxDir;
  private usingFallbackInbox = true;
  private timer: ReturnType<typeof setInterval> | null = null;
  private scanInProgress = false;
  private lastScan: RecipeInboxScanResult | undefined;
  private readonly pollingMs = 5000;

  private resolveSystemInboxDir(): string {
    const configured = process.env.BEVFORGE_OS_RECIPE_INBOX?.trim();
    return configured && configured.length > 0 ? configured : DEFAULT_SYSTEM_INBOX;
  }

  private async chooseInboxDir() {
    const systemDir = this.resolveSystemInboxDir();
    try {
      await fs.mkdir(systemDir, { recursive: true });
      await fs.access(systemDir, fsConstants.R_OK | fsConstants.W_OK);
      this.activeInboxDir = systemDir;
      this.usingFallbackInbox = false;
      return;
    } catch {
      await fs.mkdir(commissioningPaths.queueInboxDir, { recursive: true });
      this.activeInboxDir = commissioningPaths.queueInboxDir;
      this.usingFallbackInbox = true;
    }
  }

  private async writeQueueStatus(result: RecipeInboxScanResult) {
    await fs.mkdir(path.dirname(commissioningPaths.queueStatusFile), { recursive: true });
    await fs.writeFile(
      commissioningPaths.queueStatusFile,
      `${JSON.stringify(result, null, 2)}\n`,
      'utf8'
    );
  }

  async start() {
    if (this.started) return;
    this.started = true;
    await this.chooseInboxDir();
    await this.scanNow();
    this.timer = setInterval(() => {
      void this.scanNow();
    }, this.pollingMs);
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  async stop() {
    this.started = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  status(): RecipeInboxStatus {
    return {
      started: this.started,
      activeInboxDir: this.activeInboxDir,
      usingFallbackInbox: this.usingFallbackInbox,
      pollingMs: this.pollingMs,
      lastScan: this.lastScan,
    };
  }

  async scanNow(): Promise<RecipeInboxScanResult> {
    if (this.scanInProgress) {
      return (
        this.lastScan ?? {
          scannedAt: nowIso(),
          activeInboxDir: this.activeInboxDir,
          usingFallbackInbox: this.usingFallbackInbox,
          filesSeen: 0,
          ingested: 0,
          rejected: 0,
          errors: 0,
          jobs: [],
        }
      );
    }
    this.scanInProgress = true;
    try {
      await this.chooseInboxDir();
      await fs.mkdir(commissioningPaths.jobsDir, { recursive: true });
      await fs.mkdir(commissioningPaths.queueRejectedDir, { recursive: true });
      const entries = await fs.readdir(this.activeInboxDir, { withFileTypes: true });
      const candidateFiles = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => name.toLowerCase().endsWith('.bevforge.json'));

      const jobs: IngestJobRecord[] = [];
      let ingested = 0;
      let rejected = 0;
      let errors = 0;

      for (const fileName of candidateFiles) {
        const sourcePath = path.join(this.activeInboxDir, fileName);
        const jobId = makeJobId();
        const createdAt = nowIso();
        try {
          const content = await fs.readFile(sourcePath, 'utf8');
          const parsed = readJson(content);
          const validation = validateBevForgeContract(parsed);
          if (!validation.valid) {
            const rejectedName = `${jobId}-${safeFileName(fileName)}`;
            const rejectedPath = path.join(commissioningPaths.queueRejectedDir, rejectedName);
            await moveFile(sourcePath, rejectedPath);
            const reasonLogPath = `${rejectedPath}.reason.json`;
            await fs.writeFile(
              reasonLogPath,
              `${JSON.stringify(
                {
                  rejectedAt: createdAt,
                  sourceFile: fileName,
                  errors: validation.errors,
                  warnings: validation.warnings,
                },
                null,
                2
              )}\n`,
              'utf8'
            );
            rejected += 1;
            jobs.push({
              jobId,
              sourceFile: fileName,
              status: 'rejected',
              reason: validation.errors.join(' '),
              warnings: validation.warnings,
              createdAt,
              rejectedFile: rejectedPath,
            });
            continue;
          }

          const ext = path.extname(fileName).toLowerCase() || '.json';
          const jobDir = path.join(commissioningPaths.jobsDir, jobId);
          await fs.mkdir(jobDir, { recursive: true });
          const inputFile = path.join(jobDir, `input${ext}`);
          await moveFile(sourcePath, inputFile);

          const req = toExpressReq(fileName, content);
          const fake = toExpressRes();
          await importRecipeHandler(req, fake.res);
          const payload = fake.getJson();
          if (fake.getCode() >= 400 || !payload?.success) {
            throw new Error(String(payload?.error ?? 'Import handler failed'));
          }

          const imported = payload.data as ImportedRecipe;
          const statusFile = path.join(jobDir, 'status.json');
          await fs.writeFile(
            statusFile,
            `${JSON.stringify(
              {
                jobId,
                status: 'ingested',
                createdAt,
                inputFile,
                recipe: {
                  id: imported.id,
                  name: imported.name,
                  format: imported.format,
                  stepCount: imported.steps.length,
                },
                warnings: validation.warnings,
              },
              null,
              2
            )}\n`,
            'utf8'
          );

          if (validation.warnings.length > 0) {
            const warningSidecar = path.join(jobDir, 'warnings.json');
            await fs.writeFile(
              warningSidecar,
              `${JSON.stringify(validation.warnings, null, 2)}\n`,
              'utf8'
            );
          }

          ingested += 1;
          jobs.push({
            jobId,
            sourceFile: fileName,
            status: 'ingested',
            createdAt,
            warnings: validation.warnings,
            recipe: {
              id: imported.id,
              name: imported.name,
              format: imported.format,
              stepCount: imported.steps.length,
            },
            jobDir,
          });
        } catch (error) {
          errors += 1;
          const reason = error instanceof Error ? error.message : 'Unknown error';
          try {
            const rejectedName = `${jobId}-${safeFileName(fileName)}`;
            const rejectedPath = path.join(commissioningPaths.queueRejectedDir, rejectedName);
            await moveFile(sourcePath, rejectedPath);
          } catch {
            // no-op
          }
          jobs.push({
            jobId,
            sourceFile: fileName,
            status: 'error',
            reason,
            createdAt,
          });
        }
      }

      const result: RecipeInboxScanResult = {
        scannedAt: nowIso(),
        activeInboxDir: this.activeInboxDir,
        usingFallbackInbox: this.usingFallbackInbox,
        filesSeen: candidateFiles.length,
        ingested,
        rejected,
        errors,
        jobs,
      };

      this.lastScan = result;
      await this.writeQueueStatus(result);
      return result;
    } finally {
      this.scanInProgress = false;
    }
  }
}

export const recipeInboxService = new RecipeInboxService();
