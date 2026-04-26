import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - will be replaced with API call
const mockItem = {
  id: 1,
  itemCode: 'YEAST-001',
  name: 'SafAle US-05',
  description: 'American ale yeast producing well balanced beers with low diacetyl and a very clean, crisp end palate.',
  category: 'yeast',
  subcategory: 'ale_yeast',
  defaultUom: 'g',
  alternateUom: 'oz',
  conversionFactor: 28.35,
  trackLots: true,
  lastCost: 4.99,
  costUom: 'pack',
  reorderPoint: 10,
  reorderQty: 50,
  quantity: 45,
  unit: 'packs',
  trend: 'stable' as const,
  yeastData: {
    manufacturer: 'Fermentis',
    strainCode: 'US-05',
    strainName: 'SafAle US-05',
    yeastFamily: 'ale' as const,
    form: 'dry' as const,
    attenuationMinPct: 78,
    attenuationMaxPct: 82,
    alcoholTolerancePct: 12,
    tempRangeCMin: 15,
    tempRangeCMax: 24,
    flocculation: 'med' as const,
    fermentationSpeed: 'med' as const,
    preferredSugars: ['glucose', 'maltose', 'sucrose'],
    sorbitolNonfermentable: true,
    glycerolProduction: 'low' as const,
    h2sRisk: 'low' as const,
    esterProfile: ['fruity', 'citrus'],
    phenolProfile: [],
    mouthfeelEffect: 'neutral' as const,
    aromaticIntensity: 2,
    nutrientDemand: 'low' as const,
    rehydrationRequired: false,
    killerFactor: false,
  },
};

export default function ItemDetailsPage() {
  // const { id } = useParams(); // TODO: Use this to fetch actual item data from API
  const navigate = useNavigate();

  // TODO: Fetch item from API using id
  const item = mockItem;

  const isLowStock = item.quantity <= item.reorderPoint;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/os')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <Badge variant="outline" className="capitalize">
              {item.category}
            </Badge>
            {isLowStock && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{item.itemCode}</p>
        </div>
        <Button>Edit Item</Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              On Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {item.quantity} {item.unit}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reorder at {item.reorderPoint} {item.unit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Last Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              ${item.lastCost?.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">per {item.costUom}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{item.trend}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Active locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
              <CardDescription>Basic details about this inventory item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{item.description}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1 capitalize">{item.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subcategory</label>
                  <p className="mt-1 capitalize">{item.subcategory?.replace('_', ' ')}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Default UOM</label>
                  <p className="mt-1">{item.defaultUom}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alternate UOM</label>
                  <p className="mt-1">
                    {item.alternateUom} (1 {item.alternateUom} = {item.conversionFactor} {item.defaultUom})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="space-y-4">
          {item.category === 'yeast' && item.yeastData && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Yeast Specifications</CardTitle>
                  <CardDescription>Technical data for fermentation planning</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                      <p className="mt-1">{item.yeastData.manufacturer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Strain Code</label>
                      <p className="mt-1">{item.yeastData.strainCode}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Yeast Family</label>
                      <p className="mt-1 capitalize">{item.yeastData.yeastFamily}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Form</label>
                      <p className="mt-1 capitalize">{item.yeastData.form}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Attenuation</label>
                      <p className="mt-1">
                        {item.yeastData.attenuationMinPct}% - {item.yeastData.attenuationMaxPct}%
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Alcohol Tolerance</label>
                      <p className="mt-1">{item.yeastData.alcoholTolerancePct}%</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Flocculation</label>
                      <p className="mt-1 capitalize">{item.yeastData.flocculation}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Temperature Range</label>
                      <p className="mt-1">
                        {item.yeastData.tempRangeCMin}°C - {item.yeastData.tempRangeCMax}°C
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fermentation Speed</label>
                      <p className="mt-1 capitalize">{item.yeastData.fermentationSpeed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensory Profile</CardTitle>
                  <CardDescription>Flavor and aroma characteristics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ester Profile</label>
                    <div className="flex gap-2 mt-2">
                      {item.yeastData.esterProfile?.map((ester) => (
                        <Badge key={ester} variant="secondary">
                          {ester}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mouthfeel Effect</label>
                      <p className="mt-1 capitalize">{item.yeastData.mouthfeelEffect}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Aromatic Intensity</label>
                      <p className="mt-1">{item.yeastData.aromaticIntensity} / 5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operational Notes</CardTitle>
                  <CardDescription>Handling and usage information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nutrient Demand</label>
                      <p className="mt-1 capitalize">{item.yeastData.nutrientDemand}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rehydration Required</label>
                      <p className="mt-1">{item.yeastData.rehydrationRequired ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">H2S Risk</label>
                      <p className="mt-1 capitalize">{item.yeastData.h2sRisk}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>Reorder points and tracking preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reorder Point</label>
                  <p className="mt-1">
                    {item.reorderPoint} {item.unit}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reorder Quantity</label>
                  <p className="mt-1">
                    {item.reorderQty} {item.unit}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lot Tracking</label>
                <p className="mt-1">{item.trackLots ? 'Enabled' : 'Disabled'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Locations</CardTitle>
              <CardDescription>Where this item is stored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">WH1-A-12-3</p>
                    <p className="text-sm text-muted-foreground">Main Warehouse - Zone A</p>
                  </div>
                  <p className="font-mono font-medium">30 {item.unit}</p>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">WH1-B-05-1</p>
                    <p className="text-sm text-muted-foreground">Main Warehouse - Zone B</p>
                  </div>
                  <p className="font-mono font-medium">10 {item.unit}</p>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">COLD-R2-S3</p>
                    <p className="text-sm text-muted-foreground">Cold Storage - Rack 2</p>
                  </div>
                  <p className="font-mono font-medium">5 {item.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>Last 10 inventory transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Receipt</p>
                    <p className="text-sm text-muted-foreground">PO-2024-001 • WH1-A-12-3</p>
                    <p className="text-xs text-muted-foreground mt-1">Dec 20, 2024 10:30 AM</p>
                  </div>
                  <p className="font-mono font-medium text-green-600">+50 {item.unit}</p>
                </div>
                <div className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Consumption</p>
                    <p className="text-sm text-muted-foreground">Batch #2024-045 • Production</p>
                    <p className="text-xs text-muted-foreground mt-1">Dec 18, 2024 2:15 PM</p>
                  </div>
                  <p className="font-mono font-medium text-destructive">-2 {item.unit}</p>
                </div>
                <div className="flex justify-between items-start p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Transfer</p>
                    <p className="text-sm text-muted-foreground">WH1-A-12-3 → COLD-R2-S3</p>
                    <p className="text-xs text-muted-foreground mt-1">Dec 15, 2024 9:00 AM</p>
                  </div>
                  <p className="font-mono font-medium">5 {item.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
