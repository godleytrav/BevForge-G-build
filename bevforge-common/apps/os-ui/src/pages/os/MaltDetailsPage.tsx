import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface MaltItem {
  id: number;
  name: string;
  category: 'malt';
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  // Malt-specific fields
  maltType?: 'base' | 'specialty' | 'adjunct';
  origin?: string;
  ppg?: number; // Points per pound per gallon
  extractYield?: number; // Percentage
  fermentability?: number; // Percentage
  color?: number; // Lovibond
  maxUsage?: number; // Percentage of grist
  bodyContribution?: 'light' | 'medium' | 'full';
  flavorNotes?: string[];
  operationalNotes?: string;
}

// Mock data - would come from API
const mockMaltData: MaltItem = {
  id: 3,
  name: 'Pilsner Malt',
  category: 'malt',
  quantity: 450,
  unit: 'kg',
  reorderPoint: 200,
  cost: 1.25,
  trend: 'down',
  maltType: 'base',
  origin: 'Germany',
  ppg: 37,
  extractYield: 81,
  fermentability: 82,
  color: 1.8,
  maxUsage: 100,
  bodyContribution: 'light',
  flavorNotes: [
    'Clean malty sweetness',
    'Light bread crust',
    'Subtle honey notes',
    'Crisp finish',
  ],
  operationalNotes:
    'Premium German Pilsner malt. Ideal base malt for lagers and light ales. Requires proper mash pH control (5.2-5.6) for optimal enzyme activity.',
};

const mockLocations = [
  { location: 'Grain Storage - Silo 1', quantity: 300, unit: 'kg' },
  { location: 'Warehouse A - Pallet 12', quantity: 150, unit: 'kg' },
];

const mockHistory = [
  { date: '2024-12-22', type: 'Receipt', quantity: 500, unit: 'kg', reference: 'PO-2024-189' },
  { date: '2024-12-19', type: 'Consumption', quantity: -50, unit: 'kg', reference: 'Batch #045' },
  { date: '2024-12-16', type: 'Consumption', quantity: -75, unit: 'kg', reference: 'Batch #044' },
];

export default function MaltDetailsPage() {
  // const { id } = useParams(); // TODO: Use this to fetch actual item data from API
  const navigate = useNavigate();
  const item = mockMaltData; // In production: fetch by id

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{item.category.toUpperCase()}</Badge>
              <Badge variant="outline" className="capitalize">{item.maltType}</Badge>
              <Badge variant="outline">{item.origin}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="shadow-glow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{item.quantity}</span>
              <span className="text-sm text-muted-foreground">{item.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reorder at {item.reorderPoint} {item.unit}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">${item.cost.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">per {item.unit}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-glow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usage Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold capitalize">{item.trend}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="shadow-glow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{mockLocations.length}</span>
              <span className="text-sm text-muted-foreground">locations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="specs">Malt Specifications</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card className="shadow-glow-md">
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">
                  Premium German Pilsner malt with excellent enzymatic power. Provides clean malty
                  character and light color, ideal for lagers and light-colored ales.
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1 capitalize">{item.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unit of Measure</label>
                  <p className="mt-1">{item.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Malt Specifications Tab */}
        <TabsContent value="specs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Extract & Fermentability */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Extract & Fermentability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">PPG (Points/Pound/Gallon)</span>
                  <span className="text-sm font-medium">{item.ppg}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Extract Yield</span>
                  <span className="text-sm font-medium">{item.extractYield}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Fermentability</span>
                  <span className="text-sm font-medium">{item.fermentability}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Max Usage</span>
                  <span className="text-sm font-medium">{item.maxUsage}% of grist</span>
                </div>
              </CardContent>
            </Card>

            {/* Color & Body */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Color & Body Contribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Color (Lovibond)</span>
                  <span className="text-sm font-medium">{item.color}°L</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Body Contribution</span>
                  <span className="text-sm font-medium capitalize">{item.bodyContribution}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Malt Type</span>
                  <span className="text-sm font-medium capitalize">{item.maltType}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Origin</span>
                  <span className="text-sm font-medium">{item.origin}</span>
                </div>
              </CardContent>
            </Card>

            {/* Flavor Profile */}
            <Card className="shadow-glow-md lg:col-span-2">
              <CardHeader>
                <CardTitle>Flavor Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {item.flavorNotes?.map((note, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Operational Notes */}
            <Card className="shadow-glow-md lg:col-span-2">
              <CardHeader>
                <CardTitle>Operational Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.operationalNotes}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Inventory Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Reorder Point</span>
                  <span className="text-sm font-medium">
                    {item.reorderPoint} {item.unit}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Lot Tracking</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Current Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockLocations.map((loc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm font-medium">{loc.location}</span>
                      <span className="text-sm text-muted-foreground">
                        {loc.quantity} {loc.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card className="shadow-glow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Movements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{entry.type}</p>
                        <p className="text-xs text-muted-foreground">{entry.reference}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-medium ${
                          entry.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {entry.quantity > 0 ? '+' : ''}
                        {entry.quantity} {entry.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
