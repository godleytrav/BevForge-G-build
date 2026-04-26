import { X, Package, Truck, MapPin, Calendar, QrCode, Printer, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Container, Truck as TruckType, Location } from '@/lib/container-tracking';

interface ContainerDetailModalProps {
  container?: Container;
  truck?: TruckType;
  location?: Location;
  allContainers?: Container[];
  onClose: () => void;
  onPrint?: () => void;
}

export function ContainerDetailModal({
  container,
  truck,
  location,
  allContainers = [],
  onClose,
  onPrint,
}: ContainerDetailModalProps) {
  if (!container && !truck && !location) return null;

  // Render container details
  if (container) {
    const childContainers = container.childIds
      ? allContainers.filter(c => container.childIds?.includes(c.id))
      : [];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">{container.id}</h2>
                <p className="text-sm opacity-90">{container.productName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  container.status === 'delivered'
                    ? 'default'
                    : container.status === 'in-transit'
                      ? 'secondary'
                      : 'outline'
                }
                className="text-sm"
              >
                {container.status.toUpperCase()}
              </Badge>
              {container.location && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {container.location}
                </span>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Container Type</p>
                <p className="font-semibold capitalize">{container.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batch Number</p>
                <p className="font-semibold">{container.batchNumber}</p>
              </div>
              {container.volume && (
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-semibold">{container.volume}</p>
                </div>
              )}
              {container.quantity && (
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-semibold">{container.quantity} items</p>
                </div>
              )}
              {container.weight && (
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="font-semibold">{container.weight} lbs</p>
                </div>
              )}
              {container.orderId && (
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold">{container.orderId}</p>
                </div>
              )}
              {container.truckId && (
                <div>
                  <p className="text-sm text-muted-foreground">Truck</p>
                  <p className="font-semibold">{container.truckId}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold">QR Code</p>
                  <p className="text-sm text-muted-foreground">{container.qrCode}</p>
                </div>
              </div>
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
            </div>

            {/* Child Containers */}
            {childContainers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Contents ({childContainers.length} items)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {childContainers.map(child => (
                      <div
                        key={child.id}
                        className="bg-muted p-3 rounded flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{child.id}</p>
                          <p className="text-sm text-muted-foreground">{child.productName}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {child.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* History Timeline */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="h-5 w-5" />
                History
              </h3>
              <div className="space-y-3">
                {container.history.map((entry, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < container.history.length - 1 && (
                        <div className="w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium">{entry.action}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {entry.location}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {entry.timestamp.toLocaleString()}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render truck details
  if (truck) {
    const truckContainers = allContainers.filter(c => truck.containers.includes(c.id));
    const capacityPercent = Math.round((truck.currentLoad / truck.capacity) * 100);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">{truck.name}</h2>
                <p className="text-sm opacity-90">Route: {truck.route}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge
                variant={truck.status === 'on-road' ? 'default' : 'outline'}
                className="text-sm"
              >
                {truck.status.toUpperCase().replace('-', ' ')}
              </Badge>
              {truck.departureTime && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Departed: {truck.departureTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Capacity */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Capacity</span>
                <span className="text-sm font-semibold">{capacityPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${capacityPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {truck.currentLoad} / {truck.capacity} lbs
              </p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Truck ID</p>
                <p className="font-semibold">{truck.id}</p>
              </div>
              {truck.driver && (
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-semibold">{truck.driver}</p>
                </div>
              )}
            </div>

            {/* Loaded Containers */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Loaded Containers ({truckContainers.length})
              </h3>
              {truckContainers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No containers loaded yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {truckContainers.map(container => (
                    <div
                      key={container.id}
                      className="bg-muted p-3 rounded flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{container.id}</p>
                        <p className="text-sm text-muted-foreground">{container.productName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {container.type}
                        </Badge>
                        {container.weight && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {container.weight} lbs
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Truck QR Code</p>
                  <p className="text-sm text-muted-foreground">{truck.qrCode}</p>
                </div>
              </div>
              {onPrint && (
                <Button variant="outline" size="sm" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Manifest
                </Button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render location details
  if (location) {
    const locationContainers = allContainers.filter(c => location.containers.includes(c.id));
    const returnContainers = allContainers.filter(c => location.pendingReturns.includes(c.id));

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-purple-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6" />
              <div>
                <h2 className="text-2xl font-bold">{location.name}</h2>
                <p className="text-sm opacity-90">{location.address}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Type Badge */}
            <Badge variant="outline" className="text-sm capitalize">
              {location.type}
            </Badge>

            {/* On-Site Inventory */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                On-Site Inventory ({locationContainers.length})
              </h3>
              {locationContainers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No containers on-site</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {locationContainers.map(container => (
                    <div
                      key={container.id}
                      className="bg-muted p-3 rounded flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{container.id}</p>
                        <p className="text-sm text-muted-foreground">{container.productName}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {container.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Returns */}
            {returnContainers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pending Returns ({returnContainers.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {returnContainers.map(container => (
                      <div
                        key={container.id}
                        className="bg-yellow-50 border border-yellow-200 p-3 rounded flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{container.id}</p>
                          <p className="text-sm text-muted-foreground">Empty - Ready for pickup</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {container.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Delivery History */}
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Deliveries
              </h3>
              {location.deliveryHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No delivery history</p>
              ) : (
                <div className="space-y-3">
                  {location.deliveryHistory.slice(0, 5).map((delivery, index) => (
                    <div key={index} className="bg-muted p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium">{delivery.truckId}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.date.toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {delivery.containerIds.length} containers delivered
                      </p>
                      {delivery.signedBy && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Signed by: {delivery.signedBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
