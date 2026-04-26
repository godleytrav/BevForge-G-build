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

interface MaltFormData {
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
  
  // Malt-Specific Data
  ppg: number; // Points per pound per gallon
  extractYield: number; // Percentage
  fermentability: number; // Percentage
  colorLovibond: number;
  maxUsage: number; // Percentage
  bodyContribution: string;
  flavorNotes: string;
  maltster: string;
  origin: string;
}

interface AddMaltFormProps {
  onSubmit: (data: MaltFormData) => void;
  onCancel: () => void;
}

export default function AddMaltForm({ onSubmit, onCancel }: AddMaltFormProps) {
  const [formData, setFormData] = useState<MaltFormData>({
    name: '',
    itemCode: '',
    subcategory: 'base',
    trackLots: true,
    defaultUom: 'pound',
    alternateUom: 'kilogram',
    conversionFactor: 0.453592,
    lastCost: 0,
    reorderPoint: 50,
    ppg: 37,
    extractYield: 80,
    fermentability: 80,
    colorLovibond: 2,
    maxUsage: 100,
    bodyContribution: 'medium',
    flavorNotes: '',
    maltster: '',
    origin: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof MaltFormData, value: any) => {
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
              <Label htmlFor="name">Malt Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Pilsner Malt"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code *</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="MLT-001"
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
                  <SelectItem value="base">Base Malt</SelectItem>
                  <SelectItem value="crystal">Crystal/Caramel</SelectItem>
                  <SelectItem value="roasted">Roasted</SelectItem>
                  <SelectItem value="specialty">Specialty</SelectItem>
                  <SelectItem value="adjunct">Adjunct Grain</SelectItem>
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
                  <SelectItem value="pound">Pound</SelectItem>
                  <SelectItem value="kilogram">Kilogram</SelectItem>
                  <SelectItem value="ounce">Ounce</SelectItem>
                  <SelectItem value="gram">Gram</SelectItem>
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

      {/* Malt Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Malt Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ppg">PPG (Points/Pound/Gallon)</Label>
              <Input
                id="ppg"
                type="number"
                step="0.1"
                value={formData.ppg}
                onChange={(e) => updateField('ppg', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extractYield">Extract Yield (%)</Label>
              <Input
                id="extractYield"
                type="number"
                step="0.1"
                value={formData.extractYield}
                onChange={(e) => updateField('extractYield', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fermentability">Fermentability (%)</Label>
              <Input
                id="fermentability"
                type="number"
                step="0.1"
                value={formData.fermentability}
                onChange={(e) => updateField('fermentability', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colorLovibond">Color (°Lovibond)</Label>
              <Input
                id="colorLovibond"
                type="number"
                step="0.1"
                value={formData.colorLovibond}
                onChange={(e) => updateField('colorLovibond', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsage">Max Usage (%)</Label>
              <Input
                id="maxUsage"
                type="number"
                value={formData.maxUsage}
                onChange={(e) => updateField('maxUsage', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyContribution">Body Contribution</Label>
              <Select
                value={formData.bodyContribution}
                onValueChange={(value) => updateField('bodyContribution', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maltster">Maltster</Label>
              <Input
                id="maltster"
                value={formData.maltster}
                onChange={(e) => updateField('maltster', e.target.value)}
                placeholder="Weyermann, Briess, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => updateField('origin', e.target.value)}
                placeholder="Germany, USA, UK, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flavorNotes">Flavor Notes</Label>
            <Textarea
              id="flavorNotes"
              value={formData.flavorNotes}
              onChange={(e) => updateField('flavorNotes', e.target.value)}
              placeholder="Bready, biscuit, sweet, toasted, caramel, chocolate, coffee..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Malt</Button>
      </div>
    </form>
  );
}
