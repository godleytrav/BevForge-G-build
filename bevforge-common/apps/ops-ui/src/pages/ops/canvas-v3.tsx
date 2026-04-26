import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Loader2, 
  Navigation,
  QrCode,
  Printer,
  Info
} from 'lucide-react';

// Types
interface Container {
  id: string;
  type: string;
  size: string;
  status: string;
}

interface Pallet {
  id: string;
  name: string;
  stage: 'approved' | 'loading' | 'in-route';
  containers: Container[];
  truckId?: string;
}

interface Truck {
  id: string;
  name: string;
  driver: string;
  capacity: number;
}

export default function CanvasV3() {
  // State
  const [activeStage, setActiveStage] = useState<'approved' | 'loading' | 'in-route'>('approved');
  const [selectedTruck, setSelectedTruck] = useState<string>('truck-1');
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);

  // Mock data - we'll replace with API calls later
  const trucks: Truck[] = [
    { id: 'truck-1', name: 'Truck 001', driver: 'John Smith', capacity: 100 },
    { id: 'truck-2', name: 'Truck 002', driver: 'Jane Doe', capacity: 100 },
  ];

  const pallets: Pallet[] = [
    {
      id: 'pallet-1',
      name: 'Pallet A',
      stage: 'approved',
      containers: [
        { id: 'c1', type: 'Keg', size: '1/2 BBL', status: 'Full' },
        { id: 'c2', type: 'Keg', size: '1/6 BBL', status: 'Full' },
      ],
    },
    {
      id: 'pallet-2',
      name: 'Pallet B',
      stage: 'loading',
      truckId: 'truck-1',
      containers: [
        { id: 'c3', type: 'Keg', size: '1/2 BBL', status: 'Full' },
      ],
    },
    {
      id: 'pallet-3',
      name: 'Pallet C',
      stage: 'in-route',
      truckId: 'truck-1',
      containers: [
        { id: 'c4', type: 'Keg', size: '1/4 BBL', status: 'Full' },
        { id: 'c5', type: 'Keg', size: '1/6 BBL', status: 'Full' },
      ],
    },
  ];

  // Filter pallets by stage and truck
  const filteredPallets = pallets.filter(p => {
    if (p.stage !== activeStage) return false;
    if (activeStage !== 'approved' && p.truckId !== selectedTruck) return false;
    return true;
  });

  const currentTruck = trucks.find(t => t.id === selectedTruck);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Canvas V3</h1>
            <p className="text-sm text-muted-foreground">Warehouse Operations - Best of Both Worlds</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - 50/50 Split */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Half - Staging Area */}
        <div className="flex-1 border-b overflow-auto">
          <div className="p-6">
            
            {/* Stage Navigation */}
            <div className="flex gap-4 mb-6">
              <Button
                variant={activeStage === 'approved' ? 'default' : 'outline'}
                onClick={() => setActiveStage('approved')}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approved
                <Badge variant="secondary" className="ml-2">
                  {pallets.filter(p => p.stage === 'approved').length}
                </Badge>
              </Button>
              <Button
                variant={activeStage === 'loading' ? 'default' : 'outline'}
                onClick={() => setActiveStage('loading')}
                className="flex-1"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Loading
                <Badge variant="secondary" className="ml-2">
                  {pallets.filter(p => p.stage === 'loading').length}
                </Badge>
              </Button>
              <Button
                variant={activeStage === 'in-route' ? 'default' : 'outline'}
                onClick={() => setActiveStage('in-route')}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                In-Route
                <Badge variant="secondary" className="ml-2">
                  {pallets.filter(p => p.stage === 'in-route').length}
                </Badge>
              </Button>
            </div>

            {/* Pallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPallets.map(pallet => (
                <Card 
                  key={pallet.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedPallet(pallet)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {pallet.name}
                      </span>
                      <Badge>{pallet.containers.length} items</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pallet.containers.map(container => (
                        <div 
                          key={container.id}
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <span>{container.type} - {container.size}</span>
                          <Badge variant="outline">{container.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPallets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pallets in this stage</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Half - Info Bar with Truck Tabs */}
        <div className="h-1/2 bg-muted/30 overflow-auto">
          <Tabs value={selectedTruck} onValueChange={setSelectedTruck} className="h-full flex flex-col">
            <div className="border-b bg-card px-6 pt-4">
              <TabsList className="w-full justify-start">
                {trucks.map(truck => (
                  <TabsTrigger key={truck.id} value={truck.id} className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {truck.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {trucks.map(truck => (
              <TabsContent key={truck.id} value={truck.id} className="flex-1 p-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Truck Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Truck Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Driver:</span>
                        <span className="font-medium">{truck.driver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="font-medium">{truck.capacity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loading:</span>
                        <span className="font-medium">
                          {pallets.filter(p => p.truckId === truck.id && p.stage === 'loading').length} pallets
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">In-Route:</span>
                        <span className="font-medium">
                          {pallets.filter(p => p.truckId === truck.id && p.stage === 'in-route').length} pallets
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Pallet Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {selectedPallet ? `${selectedPallet.name} Details` : 'Select a Pallet'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedPallet ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Stage:</span>
                            <Badge>{selectedPallet.stage}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Containers:</span>
                            <span className="font-medium">{selectedPallet.containers.length}</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Contents:</p>
                            {selectedPallet.containers.map(container => (
                              <div 
                                key={container.id}
                                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                              >
                                <span>{container.type} - {container.size}</span>
                                <Badge variant="outline">{container.status}</Badge>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button size="sm" variant="outline" className="flex-1">
                              <QrCode className="h-4 w-4 mr-2" />
                              View QR
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Printer className="h-4 w-4 mr-2" />
                              Print Label
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Click a pallet to view details</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

      </div>
    </div>
  );
}
