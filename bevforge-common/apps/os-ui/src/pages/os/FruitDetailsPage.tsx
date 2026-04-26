import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface FruitItem {
  id: number;
  name: string;
  category: 'fruit';
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  // Fruit-specific fields
  fruitType?: 'fresh' | 'frozen' | 'puree' | 'concentrate';
  origin?: string;
  sugars?: number; // g/L or g/kg
  brix?: number; // Degrees Brix
  pH?: number;
  titratableAcidity?: number; // g/L as tartaric acid
  malicAcid?: number; // g/L
  citricAcid?: number; // g/L
  tannins?: number; // mg/L
  yan?: number; // Yeast Assimilable Nitrogen, mg/L
  flavorProfile?: string[];
  operationalNotes?: string;
}

// Mock data - would come from API
const mockFruitData: FruitItem = {
  id: 6,
  name: 'Raspberry Puree',
  category: 'fruit',
  quantity: 120,
  unit: 'kg',
  reorderPoint: 50,
  cost: 8.75,
  trend: 'stable',
  fruitType: 'puree',
  origin: 'Oregon, USA',
  sugars: 45,
  brix: 11.5,
  pH: 3.2,
  titratableAcidity: 2.8,
  malicAcid: 1.5,
  citricAcid: 0.8,
  tannins: 120,
  yan: 85,
  flavorProfile: [
    'Bright raspberry',
    'Tart berry',
    'Floral notes',
    'Sweet finish',
  ],
  operationalNotes:
    'Premium raspberry puree. Add during secondary fermentation or conditioning. Typical usage: 0.5-1.5 kg per hectoliter. Store frozen until use.',
};

const mockLocations = [
  { location: 'Cold Storage - Freezer C', quantity: 80, unit: 'kg' },
  { location: 'Cold Storage - Freezer D', quantity: 40, unit: 'kg' },
];

const mockHistory = [
  { date: '2024-12-23', type: 'Receipt', quantity: 150, unit: 'kg', reference: 'PO-2024-201' },
  { date: '2024-12-20', type: 'Consumption', quantity: -20, unit: 'kg', reference: 'Batch #046' },
  { date: '2024-12-17', type: 'Consumption', quantity: -10, unit: 'kg', reference: 'Batch #043' },
];

export default function FruitDetailsPage() {
  // const { id } = useParams(); // TODO: Use this to fetch actual item data from API
  const navigate = useNavigate();
  const item = mockFruitData; // In production: fetch by id

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
              <Badge variant="outline" className="capitalize">{item.fruitType}</Badge>
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
          <TabsTrigger value="specs">Fruit Specifications</TabsTrigger>
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
                  Premium raspberry puree from Oregon. Provides bright, tart berry character ideal for
                  fruit beers, ciders, and specialty beverages.
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

        {/* Fruit Specifications Tab */}
        <TabsContent value="specs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sugar & Acidity */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Sugar & Acidity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Sugars</span>
                  <span className="text-sm font-medium">{item.sugars} g/kg</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Brix</span>
                  <span className="text-sm font-medium">{item.brix}°Bx</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">pH</span>
                  <span className="text-sm font-medium">{item.pH}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Titratable Acidity</span>
                  <span className="text-sm font-medium">{item.titratableAcidity} g/L</span>
                </div>
              </CardContent>
            </Card>

            {/* Acid Breakdown */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Acid Composition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Malic Acid</span>
                  <span className="text-sm font-medium">{item.malicAcid} g/L</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Citric Acid</span>
                  <span className="text-sm font-medium">{item.citricAcid} g/L</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tannins</span>
                  <span className="text-sm font-medium">{item.tannins} mg/L</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">YAN</span>
                  <span className="text-sm font-medium">{item.yan} mg/L</span>
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
                  {item.flavorProfile?.map((note, idx) => (
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
