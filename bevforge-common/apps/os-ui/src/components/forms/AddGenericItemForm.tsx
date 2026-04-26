import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GenericItemFormData {
  name: string;
  itemCode: string;
  category: string;
  subcategory: string;
  trackLots: boolean;
  defaultUom: string;
  alternateUom: string;
  conversionFactor: number;
  lastCost: number;
  reorderPoint: number;
  description: string;
  specifications: string;
}

interface AddGenericItemFormProps {
  category: string;
  categoryLabel: string;
  onSubmit: (data: GenericItemFormData) => void;
  onCancel: () => void;
}

export default function AddGenericItemForm({
  category,
  categoryLabel,
  onSubmit,
  onCancel,
}: AddGenericItemFormProps) {
  const [formData, setFormData] = useState<GenericItemFormData>({
    name: '',
    itemCode: '',
    category,
    subcategory: '',
    trackLots: false,
    defaultUom: 'each',
    alternateUom: '',
    conversionFactor: 1,
    lastCost: 0,
    reorderPoint: 5,
    description: '',
    specifications: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof GenericItemFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getUomOptions = () => {
    if (category === 'kegs') {
      return [
        { value: 'each', label: 'Each' },
        { value: 'keg', label: 'Keg' },
        { value: 'barrel', label: 'Barrel' },
      ];
    }
    if (category === 'packaging') {
      return [
        { value: 'each', label: 'Each' },
        { value: 'case', label: 'Case' },
        { value: 'pallet', label: 'Pallet' },
      ];
    }
    return [
      { value: 'each', label: 'Each' },
      { value: 'box', label: 'Box' },
      { value: 'case', label: 'Case' },
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{categoryLabel} Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={`Enter ${categoryLabel.toLowerCase()} name`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code *</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="ITEM-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => updateField('subcategory', e.target.value)}
                placeholder="Optional subcategory"
              />
            </div>
            <div className="flex items-center space-x-2 pt-8">
              <Switch
                id="trackLots"
                checked={formData.trackLots}
                onCheckedChange={(checked) => updateField('trackLots', checked)}
              />
              <Label htmlFor="trackLots">Track Lots</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe this item..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Details */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultUom">Default UOM</Label>
              <Select
                value={formData.defaultUom}
                onValueChange={(value) => updateField('defaultUom', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getUomOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastCost">Last Cost ($)</Label>
              <Input
                id="lastCost"
                type="number"
                step="0.01"
                value={formData.lastCost}
                onChange={(e) => updateField('lastCost', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder Point</Label>
              <Input
                id="reorderPoint"
                type="number"
                value={formData.reorderPoint}
                onChange={(e) => updateField('reorderPoint', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications</Label>
            <Textarea
              id="specifications"
              value={formData.specifications}
              onChange={(e) => updateField('specifications', e.target.value)}
              placeholder="Technical specifications, dimensions, materials, etc."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add {categoryLabel}</Button>
      </div>
    </form>
  );
}
