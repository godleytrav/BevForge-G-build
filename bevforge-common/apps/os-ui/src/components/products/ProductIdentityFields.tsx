import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { BeverageClass, ProductIdentityDraft } from '@/features/products/types';
import { suggestProductCode } from '@/lib/identity-codes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductIdentityFieldsProps {
  value: ProductIdentityDraft;
  onChange: (next: ProductIdentityDraft) => void;
  disabled?: boolean;
}

const readFileAsDataUrl = async (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

const normalizeUploadImage = async (file: File): Promise<string> => {
  if (file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Failed to load image for processing.'));
      element.src = objectUrl;
    });

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to prepare image canvas.');
    }
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/webp', 0.86);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export default function ProductIdentityFields({
  value,
  onChange,
  disabled = false,
}: ProductIdentityFieldsProps) {
  const [showAdvancedImageFields, setShowAdvancedImageFields] = useState(false);

  const updateField = <K extends keyof ProductIdentityDraft>(field: K, next: ProductIdentityDraft[K]) => {
    onChange({
      ...value,
      [field]: next,
    });
  };

  const primaryImageUrl = useMemo(
    () => value.cardImageUrl || value.fullImageUrl || value.thumbnailUrl || '',
    [value.cardImageUrl, value.fullImageUrl, value.thumbnailUrl]
  );
  const suggestedProductCode = useMemo(
    () => suggestProductCode({ productName: value.productName || 'Product' }),
    [value.productName]
  );

  const hasCustomImageVariants =
    Boolean(value.thumbnailUrl || value.cardImageUrl || value.fullImageUrl) &&
    !(
      (value.thumbnailUrl ?? '') === (value.cardImageUrl ?? '') &&
      (value.cardImageUrl ?? '') === (value.fullImageUrl ?? '')
    );

  useEffect(() => {
    if (hasCustomImageVariants) {
      setShowAdvancedImageFields(true);
    }
  }, [hasCustomImageVariants]);

  const updatePrimaryImage = (next: string) => {
    onChange({
      ...value,
      thumbnailUrl: next || undefined,
      cardImageUrl: next || undefined,
      fullImageUrl: next || undefined,
    });
  };

  const handleImageFile = async (
    field: 'thumbnailUrl' | 'cardImageUrl' | 'fullImageUrl',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await normalizeUploadImage(file);
      if (field === 'cardImageUrl') {
        updatePrimaryImage(dataUrl);
      } else {
        updateField(field, dataUrl);
      }
    } catch (error) {
      console.error('Failed to load image asset:', error);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Product ID (optional)</Label>
          <Input
            value={value.productId ?? ''}
            onChange={(event) => updateField('productId', event.target.value)}
            placeholder="Auto-generated if blank"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label>Product Name</Label>
          <Input
            value={value.productName}
            onChange={(event) => updateField('productName', event.target.value)}
            placeholder="Dry Cider"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label>Product Code (optional)</Label>
          <Input
            value={value.productCode ?? ''}
            onChange={(event) => updateField('productCode', event.target.value)}
            placeholder={suggestedProductCode}
            disabled={disabled}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Suggested: {suggestedProductCode}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              disabled={disabled}
              onClick={() => updateField('productCode', suggestedProductCode)}
            >
              Use suggested code
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Beverage Class</Label>
          <Select
            value={value.beverageClass}
            onValueChange={(next) => updateField('beverageClass', next as BeverageClass)}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cider">Cider</SelectItem>
              <SelectItem value="wine">Wine</SelectItem>
              <SelectItem value="beer">Beer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Label Image</Label>
            <Input
              value={primaryImageUrl}
              onChange={(event) => updatePrimaryImage(event.target.value)}
              placeholder="Image URL or data URL"
              disabled={disabled}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageFile('cardImageUrl', event)}
              disabled={disabled}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Default workflow: upload one image and BevForge reuses it for thumbnail, card, and full views. Uploaded files are normalized in the browser before save so OS can persist them more reliably.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setShowAdvancedImageFields((current) => !current)}
            >
              {showAdvancedImageFields ? 'Hide' : 'Show'} Advanced Image Overrides
            </Button>
            {hasCustomImageVariants ? (
              <span className="text-xs text-muted-foreground">Custom size overrides active</span>
            ) : null}
          </div>
          {showAdvancedImageFields ? (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/80 p-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Thumbnail Override</Label>
                <Input
                  value={value.thumbnailUrl ?? ''}
                  onChange={(event) => updateField('thumbnailUrl', event.target.value)}
                  placeholder="Optional override"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Card Override</Label>
                <Input
                  value={value.cardImageUrl ?? ''}
                  onChange={(event) => updateField('cardImageUrl', event.target.value)}
                  placeholder="Optional override"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label>Full Override</Label>
                <Input
                  value={value.fullImageUrl ?? ''}
                  onChange={(event) => updateField('fullImageUrl', event.target.value)}
                  placeholder="Optional override"
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          {primaryImageUrl ? (
            <img
              src={primaryImageUrl}
              alt={value.productName || 'Product preview'}
              className="h-44 w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              No image selected yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
