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

interface HopsFormData {
  // Basic Info
  name: string;
  itemCode: string;
  subcategory: string;
  trackLots: boolean;
  defaultUom: string;
  alternateUom: string;
  conversionFactor: number;
  lastCost: number;
  reorderPoint: number;
  
  // Hops-Specific Data
  alphaAcid: number; // Percentage
  betaAcid: number; // Percentage
  cohumulone: number; // Percentage
  totalOil: number; // mL/100g
  myrcene: number; // Percentage of total oil
  humulene: number; // Percentage of total oil
  caryophyllene: number; // Percentage of total oil
  farnesene: number; // Percentage of total oil
  aromaDescriptors: string;
  flavorDescriptors: string;
  origin: string;
  harvestYear: string;
}

interface AddHopsFormProps {
  onSubmit: (data: HopsFormData) => void;
  onCancel: () => void;
}

export default function AddHopsForm({ onSubmit, onCancel }: AddHopsFormProps) {
  const [formData, setFormData] = useState<HopsFormData>({
    name: '',
    itemCode: '',
    subcategory: 'bittering',
    trackLots: true,
    defaultUom: 'ounce',
    alternateUom: 'gram',
    conversionFactor: 28.3495,
    lastCost: 0,
    reorderPoint: 20,
    alphaAcid: 10,
    betaAcid: 4,
    cohumulone: 30,
    totalOil: 1.5,
    myrcene: 40,
    humulene: 20,
    caryophyllene: 10,
    farnesene: 5,
    aromaDescriptors: '',
    flavorDescriptors: '',
    origin: '',
    harvestYear: new Date().getFullYear().toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof HopsFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
              <Label htmlFor="name">Hops Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Cascade"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code *</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="HOP-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => updateField('subcategory', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bittering">Bittering</SelectItem>
                  <SelectItem value="aroma">Aroma</SelectItem>
                  <SelectItem value="dual-purpose">Dual Purpose</SelectItem>
                  <SelectItem value="noble">Noble</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="ounce">Ounce</SelectItem>
                  <SelectItem value="gram">Gram</SelectItem>
                  <SelectItem value="pound">Pound</SelectItem>
                  <SelectItem value="kilogram">Kilogram</SelectItem>
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
        </CardContent>
      </Card>

      {/* Hops Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Hops Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alphaAcid">Alpha Acid (%)</Label>
              <Input
                id="alphaAcid"
                type="number"
                step="0.1"
                value={formData.alphaAcid}
                onChange={(e) => updateField('alphaAcid', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="betaAcid">Beta Acid (%)</Label>
              <Input
                id="betaAcid"
                type="number"
                step="0.1"
                value={formData.betaAcid}
                onChange={(e) => updateField('betaAcid', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cohumulone">Cohumulone (%)</Label>
              <Input
                id="cohumulone"
                type="number"
                step="0.1"
                value={formData.cohumulone}
                onChange={(e) => updateField('cohumulone', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalOil">Total Oil (mL/100g)</Label>
            <Input
              id="totalOil"
              type="number"
              step="0.1"
              value={formData.totalOil}
              onChange={(e) => updateField('totalOil', parseFloat(e.target.value))}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Oil Composition (% of Total Oil)</Label>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="myrcene" className="text-sm">Myrcene</Label>
                <Input
                  id="myrcene"
                  type="number"
                  step="0.1"
                  value={formData.myrcene}
                  onChange={(e) => updateField('myrcene', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humulene" className="text-sm">Humulene</Label>
                <Input
                  id="humulene"
                  type="number"
                  step="0.1"
                  value={formData.humulene}
                  onChange={(e) => updateField('humulene', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caryophyllene" className="text-sm">Caryophyllene</Label>
                <Input
                  id="caryophyllene"
                  type="number"
                  step="0.1"
                  value={formData.caryophyllene}
                  onChange={(e) => updateField('caryophyllene', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farnesene" className="text-sm">Farnesene</Label>
                <Input
                  id="farnesene"
                  type="number"
                  step="0.1"
                  value={formData.farnesene}
                  onChange={(e) => updateField('farnesene', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => updateField('origin', e.target.value)}
                placeholder="USA, Germany, New Zealand, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="harvestYear">Harvest Year</Label>
              <Input
                id="harvestYear"
                value={formData.harvestYear}
                onChange={(e) => updateField('harvestYear', e.target.value)}
                placeholder="2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aromaDescriptors">Aroma Descriptors</Label>
            <Textarea
              id="aromaDescriptors"
              value={formData.aromaDescriptors}
              onChange={(e) => updateField('aromaDescriptors', e.target.value)}
              placeholder="Citrus, floral, piney, earthy, spicy..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flavorDescriptors">Flavor Descriptors</Label>
            <Textarea
              id="flavorDescriptors"
              value={formData.flavorDescriptors}
              onChange={(e) => updateField('flavorDescriptors', e.target.value)}
              placeholder="Grapefruit, orange, pine, resin, herbal..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Hops</Button>
      </div>
    </form>
  );
}
