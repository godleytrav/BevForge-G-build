import { useState } from 'react';
import { Plus, Package, MapPin, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CreatePalletDialogProps {
  onCreatePallet: (pallet: {
    name: string;
    location: string;
    destination?: string;
    scheduledDelivery?: string;
    notes?: string;
  }) => void;
  trigger?: React.ReactNode;
}

export function CreatePalletDialog({ onCreatePallet, trigger }: CreatePalletDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    destination: '',
    scheduledDelivery: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onCreatePallet({
      name: formData.name,
      location: formData.location,
      destination: formData.destination || undefined,
      scheduledDelivery: formData.scheduledDelivery || undefined,
      notes: formData.notes || undefined,
    });
    
    // Reset form
    setFormData({
      name: '',
      location: '',
      destination: '',
      scheduledDelivery: '',
      notes: '',
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Pallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Create New Pallet
            </DialogTitle>
            <DialogDescription>
              Create a new pallet for staging containers. Add containers to the pallet after
              creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Pallet Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Pallet Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., PALLET-001"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="h-4 w-4 inline mr-1" />
                Current Location <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
                required
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                  <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                  <SelectItem value="staging-area">Staging Area</SelectItem>
                  <SelectItem value="loading-dock">Loading Dock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destination (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="destination">Destination (Optional)</Label>
              <Input
                id="destination"
                placeholder="e.g., Customer ABC"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>

            {/* Scheduled Delivery (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDelivery">
                <Calendar className="h-4 w-4 inline mr-1" />
                Scheduled Delivery (Optional)
              </Label>
              <Input
                id="scheduledDelivery"
                type="datetime-local"
                value={formData.scheduledDelivery}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDelivery: e.target.value })
                }
              />
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.location}>
              Create Pallet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
