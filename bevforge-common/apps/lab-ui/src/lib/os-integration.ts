export interface OsImportResult {
  success: boolean;
  data?: {
    id: string;
    name: string;
    format: string;
    rawFile: string;
  };
  error?: string;
  message?: string;
}

export interface LabHandoffAuditEntryInput {
  status: 'sent' | 'success' | 'failed' | 'blocked';
  recipeId?: string;
  recipeName?: string;
  importedRecipeId?: string;
  importedFormat?: string;
  osBaseUrl?: string;
  dryRunOk?: boolean;
  warningCount?: number;
  errorCount?: number;
  message?: string;
  source?: string;
}

export const normalizeOsBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

const tokenHeader = (token?: string): HeadersInit =>
  token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};

export async function sendBevForgeToOs(
  osBaseUrl: string,
  fileName: string,
  content: string,
  options?: {
    importToken?: string;
  }
): Promise<OsImportResult> {
  const baseUrl = normalizeOsBaseUrl(osBaseUrl);
  if (!baseUrl) {
    return {
      success: false,
      error: 'OS base URL is required.',
    };
  }

  try {
    const importToken = options?.importToken?.trim();
    const response = await fetch(`${baseUrl}/api/os/recipes/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenHeader(importToken),
      },
      body: JSON.stringify({
        filename: fileName,
        content,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as OsImportResult;

    if (!response.ok) {
      return {
        success: false,
        error: payload.error ?? `OS import failed (${response.status})`,
        message: payload.message,
      };
    }

    return payload;
  } catch (error) {
    return {
      success: false,
      error: 'Could not reach OS import endpoint.',
      message: error instanceof Error ? error.message : 'Network request failed',
    };
  }
}

export async function writeLabHandoffAudit(
  osBaseUrl: string,
  entry: LabHandoffAuditEntryInput,
  options?: {
    importToken?: string;
  }
): Promise<void> {
  const baseUrl = normalizeOsBaseUrl(osBaseUrl);
  if (!baseUrl) return;

  try {
    const importToken = options?.importToken?.trim();
    await fetch(`${baseUrl}/api/os/lab/handoff-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenHeader(importToken),
      },
      body: JSON.stringify({
        entry,
      }),
    });
  } catch {
    // best-effort audit logging
  }
}
