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

interface FruitFormData {
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
  
  // Fruit-Specific Data
  sugars: number; // g/L
  brix: number; // Degrees Brix
  pH: number;
  titratableAcidity: number; // g/L as tartaric acid
  malicAcid: number; // g/L
  citricAcid: number; // g/L
  tannins: number; // mg/L
  yan: number; // Yeast Assimilable Nitrogen, mg/L
  flavorProfile: string;
  processingNotes: string;
  origin: string;
}

interface AddFruitFormProps {
  onSubmit: (data: FruitFormData) => void;
  onCancel: () => void;
}

export default function AddFruitForm({ onSubmit, onCancel }: AddFruitFormProps) {
  const [formData, setFormData] = useState<FruitFormData>({
    name: '',
    itemCode: '',
    subcategory: 'fresh',
    trackLots: true,
    defaultUom: 'pound',
    alternateUom: 'kilogram',
    conversionFactor: 0.453592,
    lastCost: 0,
    reorderPoint: 25,
    sugars: 150,
    brix: 15,
    pH: 3.5,
    titratableAcidity: 6,
    malicAcid: 3,
    citricAcid: 1,
    tannins: 200,
    yan: 100,
    flavorProfile: '',
    processingNotes: '',
    origin: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = (field: keyof FruitFormData, value: any) => {
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
              <Label htmlFor="name">Fruit/Adjunct Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Raspberry Puree"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code *</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => updateField('itemCode', e.target.value)}
                placeholder="FRT-001"
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
                  <SelectItem value="fresh">Fresh Fruit</SelectItem>
                  <SelectItem value="puree">Puree</SelectItem>
                  <SelectItem value="juice">Juice/Concentrate</SelectItem>
                  <SelectItem value="dried">Dried Fruit</SelectItem>
                  <SelectItem value="spice">Spice</SelectItem>
                  <SelectItem value="other">Other Adjunct</SelectItem>
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
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="gallon">Gallon</SelectItem>
                  <SelectItem value="ounce">Ounce</SelectItem>
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

      {/* Fruit Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Fruit Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sugars">Sugars (g/L)</Label>
              <Input
                id="sugars"
                type="number"
                step="0.1"
                value={formData.sugars}
                onChange={(e) => updateField('sugars', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brix">Brix (°Bx)</Label>
              <Input
                id="brix"
                type="number"
                step="0.1"
                value={formData.brix}
                onChange={(e) => updateField('brix', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pH">pH</Label>
              <Input
                id="pH"
                type="number"
                step="0.01"
                value={formData.pH}
                onChange={(e) => updateField('pH', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titratableAcidity">Titratable Acidity (g/L)</Label>
              <Input
                id="titratableAcidity"
                type="number"
                step="0.1"
                value={formData.titratableAcidity}
                onChange={(e) => updateField('titratableAcidity', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="malicAcid">Malic Acid (g/L)</Label>
              <Input
                id="malicAcid"
                type="number"
                step="0.1"
                value={formData.malicAcid}
                onChange={(e) => updateField('malicAcid', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citricAcid">Citric Acid (g/L)</Label>
              <Input
                id="citricAcid"
                type="number"
                step="0.1"
                value={formData.citricAcid}
                onChange={(e) => updateField('citricAcid', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tannins">Tannins (mg/L)</Label>
              <Input
                id="tannins"
                type="number"
                step="1"
                value={formData.tannins}
                onChange={(e) => updateField('tannins', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yan">YAN (mg/L)</Label>
              <Input
                id="yan"
                type="number"
                step="1"
                value={formData.yan}
                onChange={(e) => updateField('yan', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              value={formData.origin}
              onChange={(e) => updateField('origin', e.target.value)}
              placeholder="Oregon, Washington, California, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flavorProfile">Flavor Profile</Label>
            <Textarea
              id="flavorProfile"
              value={formData.flavorProfile}
              onChange={(e) => updateField('flavorProfile', e.target.value)}
              placeholder="Sweet, tart, jammy, tropical, stone fruit..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="processingNotes">Processing Notes</Label>
            <Textarea
              id="processingNotes"
              value={formData.processingNotes}
              onChange={(e) => updateField('processingNotes', e.target.value)}
              placeholder="Thaw before use, add during secondary fermentation..."
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
        <Button type="submit">Add Fruit/Adjunct</Button>
      </div>
    </form>
  );
}
