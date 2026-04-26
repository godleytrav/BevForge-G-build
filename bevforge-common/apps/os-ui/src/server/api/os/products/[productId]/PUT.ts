import type { Request, Response } from 'express';
import { updateProductRecord } from '../../../../lib/product-catalog-store.js';
import type { BeverageClass } from '../../../../../features/products/types.js';

export default async function handler(req: Request, res: Response) {
  try {
    const productIdParam = req.params.productId;
    const productId = Array.isArray(productIdParam) ? productIdParam[0] : productIdParam;
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'productId is required.',
      });
    }

    const body = req.body as {
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

    const record = await updateProductRecord({
      productId,
      productCode: body.productCode,
      productName: body.productName,
      skuId: body.skuId,
      beverageClass: body.beverageClass,
      images: body.images,
    });

    return res.status(200).json({
      success: true,
      data: record.product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update product.',
    });
  }
}
