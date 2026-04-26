import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, Building2, Factory, Droplets } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'truck' | 'customer' | 'production' | 'cleaning';
  capacity: number;
  currentLoad: number;
  address?: string;
  driver?: string;
}

export default function CanvasPage() {
  const [locations] = useState<Location[]>([
    {
      id: '1',
      name: 'Main Warehouse',
      type: 'warehouse',
      capacity: 1000,
      currentLoad: 450,
      address: '123 Brewery St',
    },
    {
      id: '2',
      name: 'Truck #1',
      type: 'truck',
      capacity: 200,
      currentLoad: 0,
      driver: 'John Doe',
    },
    {
      id: '3',
      name: 'Customer - Bar XYZ',
      type: 'customer',
      capacity: 100,
      currentLoad: 50,
      address: '456 Main St',
    },
    {
      id: '4',
      name: 'Production Line A',
      type: 'production',
      capacity: 500,
      currentLoad: 200,
    },
    {
      id: '5',
      name: 'Cleaning Station',
      type: 'cleaning',
      capacity: 300,
      currentLoad: 75,
    },
  ]);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
        return <Building2 className="h-5 w-5" />;
      case 'truck':
        return <Truck className="h-5 w-5" />;
      case 'customer':
        return <Package className="h-5 w-5" />;
      case 'production':
        return <Factory className="h-5 w-5" />;
      case 'cleaning':
        return <Droplets className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getLoadPercentage = (location: Location) => {
    return Math.round((location.currentLoad / location.capacity) * 100);
  };

  return (
    <AppShell pageTitle="Canvas - Logistics View" currentSuite="ops">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Canvas Logistics</h1>
            <p className="text-muted-foreground">
              Manage containers, pallets, and deliveries
            </p>
          </div>
          <div className="flex gap-2">
            <Button>Add Location</Button>
            <Button variant="outline">Create Pallet</Button>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getLocationIcon(location.type)}
                  {location.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">
                      {location.currentLoad} / {location.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${getLoadPercentage(location)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getLoadPercentage(location)}% full
                  </p>
                </div>

                {location.address && (
                  <p className="text-sm text-muted-foreground">
                    📍 {location.address}
                  </p>
                )}

                {location.driver && (
                  <p className="text-sm text-muted-foreground">
                    👤 Driver: {location.driver}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  {location.type === 'truck' && (
                    <Button size="sm" className="flex-1">
                      Load Truck
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a simplified version of the Canvas
              logistics system. The full version with drag-and-drop, real-time
              alerts, and database integration will be available once the backend
              APIs are connected.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
