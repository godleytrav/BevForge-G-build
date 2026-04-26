import { X, Package, MapPin, Calendar, AlertCircle, Layers, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Container {
  id: string;
  qrCode: string;
  containerType: string;
  size?: string;
  status: string;
  productName?: string;
}

interface Pallet {
  id: string;
  qrCode: string;
  status: 'staged' | 'loading' | 'in-transit' | 'delivered';
  currentLocation: string;
  locationType: 'warehouse' | 'truck' | 'customer';
  containers: Container[];
  destination?: string;
  scheduledDelivery?: string;
  createdAt?: string;
  notes?: string;
}

interface PalletDetailPanelProps {
  pallet: Pallet | null;
  onClose: () => void;
  onAddContainer?: (palletId: string) => void;
  onRemoveContainer?: (palletId: string, containerId: string) => void;
  onMove?: (palletId: string, newLocation: string) => void;
}

export function PalletDetailPanel({
  pallet,
  onClose,
  onAddContainer,
  onRemoveContainer,
  onMove,
}: PalletDetailPanelProps) {
  if (!pallet) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'staged':
        return 'bg-blue-500';
      case 'loading':
        return 'bg-yellow-500';
      case 'in-transit':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getContainerStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'bg-green-500';
      case 'empty':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Pallet Details</h2>
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
                {pallet.qrCode}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(pallet.status)}>
                {pallet.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Containers</span>
              <span className="text-sm font-medium">{pallet.containers.length}</span>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Location
            </h3>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">{pallet.currentLocation}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {pallet.locationType}
              </p>
            </div>
          </div>

          {/* Destination */}
          {pallet.destination && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Destination</h3>
                <p className="text-sm">{pallet.destination}</p>
                {pallet.scheduledDelivery && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled: {new Date(pallet.scheduledDelivery).toLocaleString()}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Containers on Pallet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Containers ({pallet.containers.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddContainer?.(pallet.id)}
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {pallet.containers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No containers on this pallet
                </div>
              ) : (
                pallet.containers.map((container) => (
                  <div
                    key={container.id}
                    className="bg-muted rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs font-mono">{container.qrCode}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getContainerStatusColor(container.status)}`}
                        >
                          {container.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {container.containerType}
                          {container.size && ` ${container.size}`}
                        </span>
                      </div>
                      {container.productName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {container.productName}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveContainer?.(pallet.id, container.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          {pallet.notes && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground">{pallet.notes}</p>
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
                onClick={() => onMove?.(pallet.id, 'new-location')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Move
              </Button>
              <Button variant="outline" size="sm">
                <QrCode className="h-4 w-4 mr-2" />
                Print Label
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Manifest
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Timeline</h3>
            <div className="space-y-2">
              {pallet.createdAt && (
                <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                  <p className="font-medium">Pallet Created</p>
                  <p className="mt-1">{new Date(pallet.createdAt).toLocaleString()}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                <p className="font-medium">Current Status: {pallet.status}</p>
                <p className="mt-1">Location: {pallet.currentLocation}</p>
              </div>
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
