import { X, Package, MapPin, Calendar, AlertCircle, Truck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Container {
  id: string;
  qrCode: string;
  containerType: 'keg' | 'case' | 'pallet';
  size?: string;
  status: 'empty' | 'filled' | 'cleaning' | 'damaged' | 'lost';
  currentLocation: string;
  locationType: 'warehouse' | 'truck' | 'customer' | 'production' | 'cleaning';
  productId?: string;
  productName?: string;
  batchNumber?: string;
  fillDate?: string;
  lastScanned?: string;
  assignedTo?: string;
  notes?: string;
}

interface ContainerDetailPanelProps {
  container: Container | null;
  onClose: () => void;
  onMove?: (containerId: string, newLocation: string) => void;
  onStatusChange?: (containerId: string, newStatus: string) => void;
}

export function ContainerDetailPanel({
  container,
  onClose,
  onMove,
  onStatusChange,
}: ContainerDetailPanelProps) {
  if (!container) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-500';
      case 'empty':
        return 'bg-gray-400';
      case 'cleaning':
        return 'bg-blue-500';
      case 'damaged':
        return 'bg-red-500';
      case 'lost':
        return 'bg-orange-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'truck':
        return <Truck className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Container Details</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* QR Code & Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">QR Code</span>
              <Badge variant="outline" className="font-mono">
                {container.qrCode}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(container.status)}>
                {container.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="text-sm font-medium capitalize">
                {container.containerType}
                {container.size && ` (${container.size})`}
              </span>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {getLocationIcon(container.locationType)}
              Current Location
            </h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">{container.currentLocation}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {container.locationType}
              </p>
            </div>
            {container.lastScanned && (
              <p className="text-xs text-muted-foreground">
                Last scanned: {new Date(container.lastScanned).toLocaleString()}
              </p>
            )}
          </div>

          <Separator />

          {/* Product Info */}
          {container.productName && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Product Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Product</span>
                    <span className="text-sm font-medium">{container.productName}</span>
                  </div>
                  {container.batchNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Batch</span>
                      <Badge variant="outline">{container.batchNumber}</Badge>
                    </div>
                  )}
                  {container.fillDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fill Date</span>
                      <span className="text-sm">
                        {new Date(container.fillDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Assignment */}
          {container.assignedTo && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </h3>
                <p className="text-sm">{container.assignedTo}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {container.notes && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground">{container.notes}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMove?.(container.id, 'new-location')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange?.(container.id, 'cleaning')}
              >
                <Package className="h-4 w-4 mr-2" />
                Clean
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report
              </Button>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recent History</h3>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                <p className="font-medium">Moved to {container.currentLocation}</p>
                <p className="mt-1">
                  {container.lastScanned
                    ? new Date(container.lastScanned).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>
              {container.fillDate && (
                <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                  <p className="font-medium">Filled with {container.productName}</p>
                  <p className="mt-1">{new Date(container.fillDate).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
