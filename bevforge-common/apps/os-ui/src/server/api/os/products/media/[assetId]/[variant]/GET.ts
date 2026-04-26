import fs from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { commissioningPaths } from '../../../../../../lib/commissioning-store.js';
import { getProductAssetById } from '../../../../../../lib/product-catalog-store.js';

const allowedVariants = new Set(['thumbnail', 'card', 'full']);

export default async function handler(req: Request, res: Response) {
  try {
    const assetIdParam = req.params.assetId;
    const variantParam = req.params.variant;
    const assetId = Array.isArray(assetIdParam) ? assetIdParam[0] : assetIdParam;
    const variant = Array.isArray(variantParam) ? variantParam[0] : variantParam;

    if (!assetId || !variant || !allowedVariants.has(variant)) {
      return res.status(400).json({
        success: false,
        error: 'assetId and variant are required.',
      });
    }

    const assetRecord = await getProductAssetById(assetId);
    if (!assetRecord) {
      return res.status(404).json({
        success: false,
        error: 'Product asset not found.',
      });
    }

    const storage = assetRecord.asset.storage?.variants?.[variant as 'thumbnail' | 'card' | 'full'];
    if (!storage) {
      return res.status(404).json({
        success: false,
        error: 'Stored media variant not found.',
      });
    }

    const filePath = path.join(commissioningPaths.productMediaDir, assetId, storage.fileName);
    const buffer = await fs.readFile(filePath);
    res.setHeader('Content-Type', storage.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Failed to stream product media:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stream product media.',
    });
  }
}
