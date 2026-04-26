import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface HopsItem {
  id: number;
  name: string;
  category: 'hops';
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  // Hops-specific fields
  hopType?: 'bittering' | 'aroma' | 'dual-purpose';
  origin?: string;
  alphaAcid?: number; // Percentage
  betaAcid?: number; // Percentage
  cohumulone?: number; // Percentage
  totalOil?: number; // mL/100g
  myrcene?: number; // Percentage of total oil
  humulene?: number; // Percentage of total oil
  caryophyllene?: number; // Percentage of total oil
  farnesene?: number; // Percentage of total oil
  aromaDescriptors?: string[];
  flavorDescriptors?: string[];
  operationalNotes?: string;
}

// Mock data - would come from API
const mockHopsData: HopsItem = {
  id: 2,
  name: 'Cascade Hops',
  category: 'hops',
  quantity: 85,
  unit: 'kg',
  reorderPoint: 50,
  cost: 18.50,
  trend: 'stable',
  hopType: 'dual-purpose',
  origin: 'USA',
  alphaAcid: 5.5,
  betaAcid: 5.0,
  cohumulone: 33,
  totalOil: 1.5,
  myrcene: 50,
  humulene: 12,
  caryophyllene: 5,
  farnesene: 4,
  aromaDescriptors: [
    'Citrus',
    'Grapefruit',
    'Floral',
    'Spicy',
  ],
  flavorDescriptors: [
    'Citrus zest',
    'Grapefruit pith',
    'Floral notes',
    'Moderate bitterness',
  ],
  operationalNotes:
    'Classic American hop variety. Excellent for dry hopping and late additions. Store at -18°C to preserve alpha acids and oils.',
};

const mockLocations = [
  { location: 'Cold Storage - Freezer A', quantity: 50, unit: 'kg' },
  { location: 'Cold Storage - Freezer B', quantity: 35, unit: 'kg' },
];

const mockHistory = [
  { date: '2024-12-21', type: 'Receipt', quantity: 100, unit: 'kg', reference: 'PO-2024-178' },
  { date: '2024-12-17', type: 'Consumption', quantity: -10, unit: 'kg', reference: 'Batch #045' },
  { date: '2024-12-14', type: 'Consumption', quantity: -5, unit: 'kg', reference: 'Batch #044' },
];

export default function HopsDetailsPage() {
  // const { id } = useParams(); // TODO: Use this to fetch actual item data from API
  const navigate = useNavigate();
  const item = mockHopsData; // In production: fetch by id

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
              <Badge variant="outline" className="capitalize">{item.hopType}</Badge>
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
          <TabsTrigger value="specs">Hops Specifications</TabsTrigger>
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
                  Classic American hop variety with distinctive citrus and floral character. Excellent for
                  both bittering and aroma applications in American-style ales.
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

        {/* Hops Specifications Tab */}
        <TabsContent value="specs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alpha & Beta Acids */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Acid Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Alpha Acid</span>
                  <span className="text-sm font-medium">{item.alphaAcid}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Beta Acid</span>
                  <span className="text-sm font-medium">{item.betaAcid}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Cohumulone</span>
                  <span className="text-sm font-medium">{item.cohumulone}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Hop Type</span>
                  <span className="text-sm font-medium capitalize">{item.hopType}</span>
                </div>
              </CardContent>
            </Card>

            {/* Oil Profile */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Oil Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Oil</span>
                  <span className="text-sm font-medium">{item.totalOil} mL/100g</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Myrcene</span>
                  <span className="text-sm font-medium">{item.myrcene}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Humulene</span>
                  <span className="text-sm font-medium">{item.humulene}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Caryophyllene</span>
                  <span className="text-sm font-medium">{item.caryophyllene}%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Farnesene</span>
                  <span className="text-sm font-medium">{item.farnesene}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Aroma Profile */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Aroma Descriptors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {item.aromaDescriptors?.map((desc, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Flavor Profile */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Flavor Descriptors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {item.flavorDescriptors?.map((desc, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{desc}</span>
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
