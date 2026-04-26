import type { Request, Response } from 'express';
import { upsertCoreProduct } from '../../../lib/product-catalog-store.js';
import type { BeverageClass } from '../../../../features/products/types.js';

export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as {
      productId?: string;
      productCode?: string;
      productName?: string;
      skuId?: string;
      beverageClass?: BeverageClass;
      images?: {
        thumbnailUrl?: string;
        cardImageUrl?: string;
        fullImageUrl?: string;
      };
    };

    const productName = String(body.productName ?? '').trim();
    if (!productName) {
      return res.status(400).json({
        success: false,
        error: 'productName is required.',
      });
    }

    const record = await upsertCoreProduct({
      productId: body.productId,
      productCode: body.productCode,
      productName,
      skuId: body.skuId,
      beverageClass: body.beverageClass,
      images: body.images,
      sourceSuite: 'os',
    });

    return res.status(200).json({
      success: true,
      data: record.product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upsert product.',
    });
  }
}
