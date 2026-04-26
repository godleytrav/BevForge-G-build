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

interface YeastFormData {
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
  
  // Yeast-Specific Data
  attenuationMin: number;
  attenuationMax: number;
  alcoholTolerance: number;
  tempRangeMin: number;
  tempRangeMax: number;
  flocculation: string;
  fermentationSpeed: string;
  esterProduction: string;
  phenolProduction: string;
  sensoryCharacteristics: string;
  operationalNotes: string;
}

interface AddYeastFormProps {
  onSubmit: (data: YeastFormData) => void;
  onCancel: () => void;
}

export default function AddYeastForm({ onSubmit, onCancel }: AddYeastFormProps) {
  const [formData, setFormData] = useState<YeastFormData>({
    name: '',
    itemCode: '',
    subcategory: 'ale',
    trackLots: true,
    defaultUom: 'pack',
    alternateUom: 'gram',
    conversionFactor: 11.5,
    lastCost: 0,
    reorderPoint: 10,
    attenuationMin: 70,
    attenuationMax: 85,
    alcoholTolerance: 12,
    tempRangeMin: 15,
    tempRangeMax: 24,
    flocculation: 'medium',
    fermentationSpeed: 'medium',
    esterProduction: 'low',
    phenolProduction: 'none',
    sensoryCharacteristics: '',
    operationalNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof YeastFormData, value: any) => {
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
              <Label htmlFor="name">Yeast Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="SafAle US-05"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code *</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="YST-001"
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
                  <SelectItem value="ale">Ale Yeast</SelectItem>
                  <SelectItem value="lager">Lager Yeast</SelectItem>
                  <SelectItem value="wine">Wine Yeast</SelectItem>
                  <SelectItem value="champagne">Champagne Yeast</SelectItem>
                  <SelectItem value="wild">Wild/Brett</SelectItem>
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
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="gram">Gram</SelectItem>
                  <SelectItem value="kilogram">Kilogram</SelectItem>
                  <SelectItem value="liter">Liter</SelectItem>
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

      {/* Yeast Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Yeast Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Attenuation Range (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.attenuationMin}
                  onChange={(e) => updateField('attenuationMin', parseFloat(e.target.value))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.attenuationMax}
                  onChange={(e) => updateField('attenuationMax', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alcoholTolerance">Alcohol Tolerance (%)</Label>
              <Input
                id="alcoholTolerance"
                type="number"
                step="0.1"
                value={formData.alcoholTolerance}
                onChange={(e) => updateField('alcoholTolerance', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temperature Range (°C)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={formData.tempRangeMin}
                  onChange={(e) => updateField('tempRangeMin', parseFloat(e.target.value))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={formData.tempRangeMax}
                  onChange={(e) => updateField('tempRangeMax', parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flocculation">Flocculation</Label>
              <Select
                value={formData.flocculation}
                onValueChange={(value) => updateField('flocculation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very-high">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fermentationSpeed">Fermentation Speed</Label>
              <Select
                value={formData.fermentationSpeed}
                onValueChange={(value) => updateField('fermentationSpeed', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="esterProduction">Ester Production</Label>
              <Select
                value={formData.esterProduction}
                onValueChange={(value) => updateField('esterProduction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phenolProduction">Phenol Production</Label>
              <Select
                value={formData.phenolProduction}
                onValueChange={(value) => updateField('phenolProduction', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sensoryCharacteristics">Sensory Characteristics</Label>
            <Textarea
              id="sensoryCharacteristics"
              value={formData.sensoryCharacteristics}
              onChange={(e) => updateField('sensoryCharacteristics', e.target.value)}
              placeholder="Clean, neutral profile with subtle fruity esters..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="operationalNotes">Operational Notes</Label>
            <Textarea
              id="operationalNotes"
              value={formData.operationalNotes}
              onChange={(e) => updateField('operationalNotes', e.target.value)}
              placeholder="Rehydrate in warm water before pitching..."
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
        <Button type="submit">Add Yeast</Button>
      </div>
    </form>
  );
}
