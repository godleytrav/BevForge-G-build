import type { Request, Response } from 'express';
import { getCrmCertificateContent } from '../../../../../../lib/crm-certificate-store.js';

const readParam = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === 'string' ? value : undefined;
};

export default async function handler(req: Request, res: Response) {
  try {
    const clientId = readParam(req.params.clientId);
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    const content = await getCrmCertificateContent(clientId);
    if (!content) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    res.setHeader('Content-Type', content.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${content.fileName.replace(/"/g, '')}"`);
    return res.status(200).send(content.buffer);
  } catch (error) {
    console.error('Failed to read CRM certificate content:', error);
    return res.status(500).json({ error: 'Failed to read certificate content.' });
  }
}
