import type { Request, Response } from 'express';
import { upsertCrmCertificateFile } from '../../../../lib/crm-certificate-store.js';

export default async function handler(req: Request, res: Response) {
  try {
    const result = await upsertCrmCertificateFile({
      clientId: typeof req.body?.clientId === 'string' ? req.body.clientId : '',
      fileName: typeof req.body?.fileName === 'string' ? req.body.fileName : '',
      mimeType: typeof req.body?.mimeType === 'string' ? req.body.mimeType : '',
      base64Content:
        typeof req.body?.base64Content === 'string'
          ? req.body.base64Content
          : typeof req.body?.dataUrl === 'string'
            ? req.body.dataUrl
            : '',
    });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.startsWith('Validation:') ? 400 : 500;
    if (statusCode === 500) {
      console.error('Failed to upload CRM certificate file:', error);
    }
    return res.status(statusCode).json({
      error: statusCode === 400 ? message.replace('Validation:', '').trim() : 'Failed to upload certificate file.',
      message: statusCode === 500 ? message : undefined,
    });
  }
}
