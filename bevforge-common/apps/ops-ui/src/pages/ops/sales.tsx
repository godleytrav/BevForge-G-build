import { useState } from 'react';
import { Truck, Package, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type DeliveryStatus = 'scheduled' | 'in-transit' | 'delivered' | 'delayed';

interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  address: string;
  scheduledDate: string;
  deliveryDate?: string;
  status: DeliveryStatus;
  driver?: string;
  items: { product: string; quantity: number }[];
  notes?: string;
  signature?: string;
}

export default function OpsSales() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: 'DEL-001',
      orderId: 'ORD-1245',
      customer: 'Downtown Taproom',
      address: '123 Main St, Portland, OR 97201',
      scheduledDate: '2025-12-20',
      status: 'scheduled',
      driver: 'Mike Johnson',
      items: [
        { product: 'IPA - Keg (15.5 gal)', quantity: 2 },
        { product: 'Pale Ale - Keg (15.5 gal)', quantity: 1 },
      ],
      notes: 'Deliver to back entrance, call upon arrival',
    },
    {
      id: 'DEL-002',
      orderId: 'ORD-1243',
      customer: 'Westside Pub',
      address: '456 Oak Ave, Portland, OR 97209',
      scheduledDate: '2025-12-19',
      status: 'in-transit',
      driver: 'Sarah Chen',
      items: [
        { product: 'Stout - Keg (5 gal)', quantity: 3 },
      ],
      notes: 'Signature required',
    },
    {
      id: 'DEL-003',
      orderId: 'ORD-1240',
      customer: 'Eastside Brewery',
      address: '789 Pine St, Portland, OR 97214',
      scheduledDate: '2025-12-18',
      deliveryDate: '2025-12-18',
      status: 'delivered',
      driver: 'Mike Johnson',
      items: [
        { product: 'IPA - Case (24x12oz)', quantity: 5 },
        { product: 'Pale Ale - Case (24x12oz)', quantity: 3 },
      ],
      signature: 'John Smith',
    },
    {
      id: 'DEL-004',
      orderId: 'ORD-1238',
      customer: 'Northside Tavern',
      address: '321 Elm St, Portland, OR 97217',
      scheduledDate: '2025-12-18',
      status: 'delayed',
      driver: 'Sarah Chen',
      items: [
        { product: 'Lager - Keg (15.5 gal)', quantity: 2 },
      ],
      notes: 'Traffic delay - customer notified',
    },
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const stats = {
    scheduled: deliveries.filter(d => d.status === 'scheduled').length,
    inTransit: deliveries.filter(d => d.status === 'in-transit').length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    delayed: deliveries.filter(d => d.status === 'delayed').length,
  };

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-transit': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delayed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getStatusIcon = (status: DeliveryStatus) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'in-transit': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const openDetailDialog = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setShowDetailDialog(true);
  };

  const markAsDelivered = (deliveryId: string) => {
    setDeliveries(deliveries.map(d => 
      d.id === deliveryId 
        ? { ...d, status: 'delivered' as DeliveryStatus, deliveryDate: new Date().toISOString().split('T')[0] }
        : d
    ));
    setShowDetailDialog(false);
  };

  const updateStatus = (deliveryId: string, status: DeliveryStatus) => {
    setDeliveries(deliveries.map(d => 
      d.id === deliveryId ? { ...d, status } : d
    ));
  };

  return (
    <AppShell pageTitle="Deliveries">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Deliveries</h1>
            <p className="text-muted-foreground mt-1">Schedule and track product deliveries</p>
          </div>
          <Button onClick={() => setShowScheduleDialog(true)}>
            <Truck className="w-4 h-4 mr-2" />
            Schedule Delivery
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
              <Calendar className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground mt-1">Upcoming deliveries</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
              <Truck className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground mt-1">Out for delivery</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed today</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delayed</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.delayed}</div>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries List with Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All ({deliveries.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
            <TabsTrigger value="in-transit">In Transit ({stats.inTransit})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({stats.delivered})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {deliveries.map(delivery => (
              <Card 
                key={delivery.id}
                className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => openDetailDialog(delivery)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{delivery.customer}</h3>
                        <Badge className={getStatusColor(delivery.status)}>
                          {getStatusIcon(delivery.status)}
                          <span className="ml-1 capitalize">{delivery.status.replace('-', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Order: {delivery.orderId}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Scheduled: {new Date(delivery.scheduledDate).toLocaleDateString()}
                        </p>
                        {delivery.driver && (
                          <p className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Driver: {delivery.driver}
                          </p>
                        )}
                        <p className="text-xs mt-2">{delivery.address}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{delivery.items.length} items</p>
                      {delivery.status === 'in-transit' && (
                        <Button 
                          size="sm" 
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsDelivered(delivery.id);
                          }}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {deliveries.filter(d => d.status === 'scheduled').map(delivery => (
              <Card 
                key={delivery.id}
                className="border-border bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => openDetailDialog(delivery)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{delivery.customer}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Order: {delivery.orderId}</p>
                        <p>Scheduled: {new Date(delivery.scheduledDate).toLocaleDateString()}</p>
                        <p>Driver: {delivery.driver}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(delivery.id, 'in-transit');
                      }}
                    >
                      Start Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="in-transit" className="space-y-4">
            {deliveries.filter(d => d.status === 'in-transit').map(delivery => (
              <Card 
                key={delivery.id}
                className="border-yellow-500/30 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => openDetailDialog(delivery)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{delivery.customer}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Order: {delivery.orderId}</p>
                        <p>Driver: {delivery.driver}</p>
                        <p className="text-xs mt-2">{delivery.address}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsDelivered(delivery.id);
                      }}
                    >
                      Mark Delivered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            {deliveries.filter(d => d.status === 'delivered').map(delivery => (
              <Card 
                key={delivery.id}
                className="border-green-500/30 bg-card/50 backdrop-blur-sm cursor-pointer"
                onClick={() => openDetailDialog(delivery)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{delivery.customer}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Order: {delivery.orderId}</p>
                        <p>Delivered: {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : 'N/A'}</p>
                        {delivery.signature && <p>Signed by: {delivery.signature}</p>}
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Delivery Details - {selectedDelivery?.id}</DialogTitle>
            </DialogHeader>
            {selectedDelivery && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDelivery.customer}</h3>
                    <p className="text-sm text-muted-foreground">Order: {selectedDelivery.orderId}</p>
                  </div>
                  <Badge className={getStatusColor(selectedDelivery.status)}>
                    {getStatusIcon(selectedDelivery.status)}
                    <span className="ml-1 capitalize">{selectedDelivery.status.replace('-', ' ')}</span>
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Scheduled Date</Label>
                    <p className="font-medium">{new Date(selectedDelivery.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  {selectedDelivery.deliveryDate && (
                    <div>
                      <Label className="text-muted-foreground">Delivered Date</Label>
                      <p className="font-medium">{new Date(selectedDelivery.deliveryDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedDelivery.driver && (
                    <div>
                      <Label className="text-muted-foreground">Driver</Label>
                      <p className="font-medium">{selectedDelivery.driver}</p>
                    </div>
                  )}
                  {selectedDelivery.signature && (
                    <div>
                      <Label className="text-muted-foreground">Signature</Label>
                      <p className="font-medium">{selectedDelivery.signature}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Delivery Address</Label>
                  <p className="font-medium">{selectedDelivery.address}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Items</Label>
                  <div className="mt-2 space-y-2">
                    {selectedDelivery.items.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>{item.product}</span>
                        <span className="font-medium">Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDelivery.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm">{selectedDelivery.notes}</p>
                  </div>
                )}

                {selectedDelivery.status === 'in-transit' && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1"
                      onClick={() => markAsDelivered(selectedDelivery.id)}
                    >
                      Mark as Delivered
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateStatus(selectedDelivery.id, 'delayed')}
                    >
                      Report Delay
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Schedule Delivery Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Delivery</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Order ID</Label>
                <Input placeholder="ORD-1234" />
              </div>
              <div>
                <Label>Customer</Label>
                <Input placeholder="Customer name" />
              </div>
              <div>
                <Label>Delivery Address</Label>
                <Textarea placeholder="Full delivery address" />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Driver</Label>
                <Input placeholder="Driver name" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea placeholder="Delivery instructions or notes" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Schedule Delivery</Button>
                <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
