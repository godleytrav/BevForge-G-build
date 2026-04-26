import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Edit, Beaker } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

type BatchStatus = 'planned' | 'fermenting' | 'conditioning' | 'packaged';
type BaseType = 'cider_base' | 'juice' | 'perry_base';

interface Batch {
  id: number;
  name: string;
  base_type: BaseType;
  volume_gal: number;
  yeast: string;
  target_abv: number;
  start_date: string;
  status: BatchStatus;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<BatchStatus, string> = {
  planned: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  fermenting: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  conditioning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  packaged: 'bg-green-500/10 text-green-500 border-green-500/20',
};

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  
  // Create/Edit modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    base_type: 'cider_base' as BaseType,
    volume_gal: 0,
    yeast: '',
    target_abv: 0,
    start_date: new Date().toISOString().split('T')[0],
    status: 'planned' as BatchStatus,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Batch[]>('/api/batches');
      const batchesArray = Array.isArray(data) ? data : [];
      setBatches(batchesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    try {
      setSubmitting(true);
      
      if (!formData.name.trim()) {
        alert('Batch name is required');
        return;
      }

      await apiPost('/api/batches', formData);
      await fetchBatches();
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    try {
      setSubmitting(true);
      
      if (!formData.name.trim()) {
        alert('Batch name is required');
        return;
      }

      await apiPatch(`/api/batches/${editingBatch.id}`, formData);
      await fetchBatches();
      setEditingBatch(null);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      await apiDelete(`/api/batches/${batchId}`);
      await fetchBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      base_type: batch.base_type,
      volume_gal: batch.volume_gal,
      yeast: batch.yeast,
      target_abv: batch.target_abv,
      start_date: batch.start_date,
      status: batch.status,
      notes: batch.notes || '',
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      base_type: 'cider_base',
      volume_gal: 0,
      yeast: '',
      target_abv: 0,
      start_date: new Date().toISOString().split('T')[0],
      status: 'planned',
      notes: '',
    });
  };

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const matchesSearch = batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.yeast.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading batches...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batches</h1>
          <p className="text-muted-foreground mt-1">Manage production batches and fermentation</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fall Harvest 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_type">Base Type</Label>
                  <Select value={formData.base_type} onValueChange={(value: BaseType) => setFormData({ ...formData, base_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cider_base">Cider Base</SelectItem>
                      <SelectItem value="juice">Juice</SelectItem>
                      <SelectItem value="perry_base">Perry Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume_gal">Volume (gallons)</Label>
                  <Input
                    id="volume_gal"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.volume_gal}
                    onChange={(e) => setFormData({ ...formData, volume_gal: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yeast">Yeast</Label>
                  <Input
                    id="yeast"
                    value={formData.yeast}
                    onChange={(e) => setFormData({ ...formData, yeast: e.target.value })}
                    placeholder="Safale US-05"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_abv">Target ABV (%)</Label>
                  <Input
                    id="target_abv"
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={formData.target_abv}
                    onChange={(e) => setFormData({ ...formData, target_abv: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: BatchStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="fermenting">Fermenting</SelectItem>
                      <SelectItem value="conditioning">Conditioning</SelectItem>
                      <SelectItem value="packaged">Packaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this batch..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBatch} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by batch name or yeast..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BatchStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="fermenting">Fermenting</SelectItem>
                <SelectItem value="conditioning">Conditioning</SelectItem>
                <SelectItem value="packaged">Packaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredBatches.length} of {batches.length} batches
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {batches.length === 0 ? 'No batches yet. Create your first batch to get started.' : 'No batches match your filters.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{batch.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Batch #{batch.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[batch.status]}>{batch.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(batch)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBatch(batch.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Type:</span>
                    <span className="font-medium capitalize">{batch.base_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume:</span>
                    <span className="font-medium">{batch.volume_gal} gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yeast:</span>
                    <span className="font-medium">{batch.yeast}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target ABV:</span>
                    <span className="font-medium">{batch.target_abv}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-medium">{new Date(batch.start_date).toLocaleDateString()}</span>
                  </div>
                  {batch.notes && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-muted-foreground text-xs">Notes:</p>
                      <p className="text-sm mt-1">{batch.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Batch #{editingBatch?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Batch Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Fall Harvest 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_base_type">Base Type</Label>
                <Select value={formData.base_type} onValueChange={(value: BaseType) => setFormData({ ...formData, base_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cider_base">Cider Base</SelectItem>
                    <SelectItem value="juice">Juice</SelectItem>
                    <SelectItem value="perry_base">Perry Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_volume_gal">Volume (gallons)</Label>
                <Input
                  id="edit_volume_gal"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.volume_gal}
                  onChange={(e) => setFormData({ ...formData, volume_gal: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_yeast">Yeast</Label>
                <Input
                  id="edit_yeast"
                  value={formData.yeast}
                  onChange={(e) => setFormData({ ...formData, yeast: e.target.value })}
                  placeholder="Safale US-05"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_target_abv">Target ABV (%)</Label>
                <Input
                  id="edit_target_abv"
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={formData.target_abv}
                  onChange={(e) => setFormData({ ...formData, target_abv: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value: BatchStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="fermenting">Fermenting</SelectItem>
                    <SelectItem value="conditioning">Conditioning</SelectItem>
                    <SelectItem value="packaged">Packaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_notes">Notes (optional)</Label>
              <Textarea
                id="edit_notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this batch..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBatch(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBatch} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
