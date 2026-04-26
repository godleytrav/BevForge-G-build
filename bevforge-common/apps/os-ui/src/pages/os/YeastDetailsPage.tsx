import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface YeastItem {
  id: number;
  name: string;
  category: 'yeast';
  quantity: number;
  unit: string;
  reorderPoint: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  // Yeast-specific fields
  manufacturer?: string;
  strain?: string;
  attenuation?: { min: number; max: number };
  alcoholTolerance?: number;
  temperatureRange?: { min: number; max: number };
  flocculation?: 'low' | 'medium' | 'high' | 'very high';
  fermentationSpeed?: 'slow' | 'medium' | 'fast';
  esterProfile?: 'low' | 'medium' | 'high';
  phenolProfile?: 'low' | 'medium' | 'high';
  sensoryCharacteristics?: string[];
  operationalNotes?: string;
}

// Mock data - would come from API
const mockYeastData: YeastItem = {
  id: 1,
  name: 'SafAle US-05',
  category: 'yeast',
  quantity: 45,
  unit: 'packs',
  reorderPoint: 10,
  cost: 4.99,
  trend: 'stable',
  manufacturer: 'Fermentis',
  strain: 'American Ale',
  attenuation: { min: 78, max: 82 },
  alcoholTolerance: 12,
  temperatureRange: { min: 15, max: 24 },
  flocculation: 'medium',
  fermentationSpeed: 'fast',
  esterProfile: 'low',
  phenolProfile: 'low',
  sensoryCharacteristics: [
    'Clean fermentation profile',
    'Neutral flavor',
    'Highlights malt and hop character',
    'Well-balanced',
  ],
  operationalNotes:
    'Ideal for American-style ales. Direct pitch at 11.5g/hL for standard gravity worts. No rehydration required.',
};

const mockLocations = [
  { location: 'Cold Storage A', quantity: 30, unit: 'packs' },
  { location: 'Warehouse B - Shelf 3', quantity: 15, unit: 'packs' },
];

const mockHistory = [
  { date: '2024-12-20', type: 'Receipt', quantity: 50, unit: 'packs', reference: 'PO-2024-156' },
  { date: '2024-12-18', type: 'Consumption', quantity: -5, unit: 'packs', reference: 'Batch #045' },
  { date: '2024-12-15', type: 'Consumption', quantity: -10, unit: 'packs', reference: 'Batch #044' },
];

export default function YeastDetailsPage() {
  // const { id } = useParams(); // TODO: Use this to fetch actual item data from API
  const navigate = useNavigate();
  const item = mockYeastData; // In production: fetch by id

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
              <Badge variant="outline">{item.manufacturer}</Badge>
              <Badge variant="outline">{item.strain}</Badge>
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
          <TabsTrigger value="specs">Yeast Specifications</TabsTrigger>
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
                  Professional dry yeast for American-style ales. Produces clean, neutral fermentation
                  profile that allows malt and hop character to shine through.
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

        {/* Yeast Specifications Tab */}
        <TabsContent value="specs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Fermentation Characteristics */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Fermentation Characteristics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Attenuation</span>
                  <span className="text-sm font-medium">
                    {item.attenuation?.min}% - {item.attenuation?.max}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Alcohol Tolerance</span>
                  <span className="text-sm font-medium">{item.alcoholTolerance}% ABV</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Temperature Range</span>
                  <span className="text-sm font-medium">
                    {item.temperatureRange?.min}°C - {item.temperatureRange?.max}°C
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Flocculation</span>
                  <span className="text-sm font-medium capitalize">{item.flocculation}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Fermentation Speed</span>
                  <span className="text-sm font-medium capitalize">{item.fermentationSpeed}</span>
                </div>
              </CardContent>
            </Card>

            {/* Sensory Profile */}
            <Card className="shadow-glow-md">
              <CardHeader>
                <CardTitle>Sensory Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Ester Production</span>
                  <span className="text-sm font-medium capitalize">{item.esterProfile}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Phenol Production</span>
                  <span className="text-sm font-medium capitalize">{item.phenolProfile}</span>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Characteristics</label>
                  <ul className="mt-2 space-y-1">
                    {item.sensoryCharacteristics?.map((char, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{char}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
