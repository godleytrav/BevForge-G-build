import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddYeastForm from '@/components/forms/AddYeastForm';
import AddMaltForm from '@/components/forms/AddMaltForm';
import AddHopsForm from '@/components/forms/AddHopsForm';
import AddFruitForm from '@/components/forms/AddFruitForm';
import AddGenericItemForm from '@/components/forms/AddGenericItemForm';

export default function AddInventoryItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'equipment';
  const [vendorDetails, setVendorDetails] = useState({
    vendorName: '',
    vendorSku: '',
    vendorProductUrl: '',
    vendorLeadTimeDays: '',
    vendorPackSize: '',
    vendorDefaultOrderQty: '',
    vendorNotes: '',
  });

  const categoryConfig: Record<string, { label: string; isIngredient: boolean }> = {
    yeast: { label: 'Yeast', isIngredient: true },
    malt: { label: 'Malt & Grains', isIngredient: true },
    hops: { label: 'Hops', isIngredient: true },
    fruit: { label: 'Fruit & Adjuncts', isIngredient: true },
    equipment: { label: 'Equipment', isIngredient: false },
    packaging: { label: 'Packaging', isIngredient: false },
    kegs: { label: 'Kegs & Barrels', isIngredient: false },
  };

  const config = categoryConfig[category] || categoryConfig.equipment;

  const updateVendorField = (field: keyof typeof vendorDetails, value: string) => {
    setVendorDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/os/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          name: data.name ?? data.brandName ?? data.strainName ?? config.label,
          sku: data.sku ?? data.code ?? data.itemCode,
          unit: data.unit ?? 'units',
          onHandQty: Number(data.quantity ?? data.onHandQty ?? 0),
          reorderPointQty: Number(data.reorderPoint ?? data.minStock ?? 0),
          costPerUnit: Number(data.costPerUnit ?? data.cost ?? data.lastCost ?? 0),
          vendorName: vendorDetails.vendorName || undefined,
          vendorSku: vendorDetails.vendorSku || undefined,
          vendorProductUrl: vendorDetails.vendorProductUrl || undefined,
          vendorLeadTimeDays:
            vendorDetails.vendorLeadTimeDays.trim() === ''
              ? undefined
              : Number(vendorDetails.vendorLeadTimeDays),
          vendorPackSize:
            vendorDetails.vendorPackSize.trim() === ''
              ? undefined
              : Number(vendorDetails.vendorPackSize),
          vendorDefaultOrderQty:
            vendorDetails.vendorDefaultOrderQty.trim() === ''
              ? undefined
              : Number(vendorDetails.vendorDefaultOrderQty),
          vendorNotes: vendorDetails.vendorNotes || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? 'Failed to save inventory item.');
      }
      navigate('/os/inventory');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save inventory item.';
      alert(message);
    }
  };

  const handleCancel = () => {
    navigate('/os/inventory');
  };

  const renderForm = () => {
    switch (category) {
      case 'yeast':
        return <AddYeastForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'malt':
        return <AddMaltForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'hops':
        return <AddHopsForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'fruit':
        return <AddFruitForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      default:
        return (
          <AddGenericItemForm
            category={category}
            categoryLabel={config.label}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle={`Add ${config.label}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/os/inventory')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Add {config.label}
            </h1>
            <p className="text-muted-foreground">
              {config.isIngredient
                ? 'LAB-tracked ingredient - detailed specifications required'
                : 'Non-ingredient inventory item'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={vendorDetails.vendorName}
                onChange={(event) => updateVendorField('vendorName', event.target.value)}
                placeholder="BSG / Country Malt / Yakima Valley Hops"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorSku">Vendor SKU</Label>
              <Input
                id="vendorSku"
                value={vendorDetails.vendorSku}
                onChange={(event) => updateVendorField('vendorSku', event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendorProductUrl">Vendor Product URL</Label>
              <Input
                id="vendorProductUrl"
                value={vendorDetails.vendorProductUrl}
                onChange={(event) =>
                  updateVendorField('vendorProductUrl', event.target.value)
                }
                placeholder="https://vendor.example.com/product"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorLeadTimeDays">Lead Time (days)</Label>
              <Input
                id="vendorLeadTimeDays"
                type="number"
                min="0"
                value={vendorDetails.vendorLeadTimeDays}
                onChange={(event) =>
                  updateVendorField('vendorLeadTimeDays', event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorPackSize">Vendor Pack Size</Label>
              <Input
                id="vendorPackSize"
                type="number"
                min="0"
                value={vendorDetails.vendorPackSize}
                onChange={(event) => updateVendorField('vendorPackSize', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendorDefaultOrderQty">Default Order Qty</Label>
              <Input
                id="vendorDefaultOrderQty"
                type="number"
                min="0"
                value={vendorDetails.vendorDefaultOrderQty}
                onChange={(event) =>
                  updateVendorField('vendorDefaultOrderQty', event.target.value)
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vendorNotes">Vendor Notes</Label>
              <Textarea
                id="vendorNotes"
                rows={3}
                value={vendorDetails.vendorNotes}
                onChange={(event) => updateVendorField('vendorNotes', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        {renderForm()}
      </div>
    </AppShell>
  );
}
