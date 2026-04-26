import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Edit, Package, AlertTriangle, History } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  category: string;
  qty: number;
  unit: string;
  reorder_point: number | null;
  created_at: string;
}

interface InventoryMovement {
  id: number;
  product_id: number;
  movement_type: 'receive' | 'transfer' | 'waste' | 'cycle_count_adjust';
  qty_delta: number;
  note: string | null;
  created_at: string;
}

const statusColors = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  'low stock': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'out of stock': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create/Edit Product modal
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    qty: 0,
    unit: 'units',
    reorder_point: 10,
  });
  
  // Adjust Quantity modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    movement_type: 'receive' as 'receive' | 'transfer' | 'waste' | 'cycle_count_adjust',
    qty_delta: 0,
    note: '',
  });
  
  // Movement History modal
  const [viewingHistory, setViewingHistory] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [backendNotImplemented, setBackendNotImplemented] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Product[]>('/api/inventory/products');
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (productId: number) => {
    try {
      setLoadingMovements(true);
      const data = await apiGet<InventoryMovement[]>(`/api/inventory/movements?product_id=${productId}`);
      const movementsArray = Array.isArray(data) ? data : [];
      setMovements(movementsArray);
    } catch (err) {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      setSubmitting(true);
      
      if (!productForm.name.trim()) {
        alert('Product name is required');
        return;
      }

      await apiPost('/api/inventory/products', productForm);
      await fetchProducts();
      setIsCreateProductOpen(false);
      resetProductForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      setSubmitting(true);
      
      if (!productForm.name.trim()) {
        alert('Product name is required');
        return;
      }

      await apiPatch(`/api/inventory/products/${editingProduct.id}`, productForm);
      await fetchProducts();
      setEditingProduct(null);
      resetProductForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustQuantity = async () => {
    if (!adjustingProduct) return;

    try {
      setSubmitting(true);
      setBackendNotImplemented(false);

      await apiPost('/api/inventory/movements', {
        product_id: adjustingProduct.id,
        ...adjustmentForm,
      });

      // Optimistically update the product quantity
      setProducts(products.map(p => 
        p.id === adjustingProduct.id 
          ? { ...p, qty: p.qty + adjustmentForm.qty_delta }
          : p
      ));

      setAdjustingProduct(null);
      resetAdjustmentForm();
      await fetchProducts();
    } catch (err) {
      setBackendNotImplemented(true);
      // Still update optimistically even if backend fails
      setProducts(products.map(p => 
        p.id === adjustingProduct.id 
          ? { ...p, qty: p.qty + adjustmentForm.qty_delta }
          : p
      ));
      alert(err instanceof Error ? err.message : 'Failed to log movement');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      qty: product.qty,
      unit: product.unit,
      reorder_point: product.reorder_point || 10,
    });
  };

  const openAdjustQuantity = (product: Product) => {
    setAdjustingProduct(product);
    resetAdjustmentForm();
  };

  const openMovementHistory = (product: Product) => {
    setViewingHistory(product);
    fetchMovements(product.id);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      qty: 0,
      unit: 'units',
      reorder_point: 10,
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      movement_type: 'receive',
      qty_delta: 0,
      note: '',
    });
  };

  const getProductStatus = (product: Product): 'active' | 'low stock' | 'out of stock' => {
    if (product.qty === 0) return 'out of stock';
    if (product.reorder_point && product.qty <= product.reorder_point) return 'low stock';
    return 'active';
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  // Low stock alerts
  const lowStockProducts = products.filter(p => 
    p.reorder_point && p.qty <= p.reorder_point && p.qty > 0
  );
  const outOfStockProducts = products.filter(p => p.qty === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage products and stock levels</p>
        </div>
        <Dialog open={isCreateProductOpen} onOpenChange={setIsCreateProductOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetProductForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Apple Cider - 12oz"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="Finished Goods"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={productForm.unit} onValueChange={(value) => setProductForm({ ...productForm, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="cases">Cases</SelectItem>
                      <SelectItem value="gallons">Gallons</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="lbs">Pounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Initial Quantity</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="0"
                    value={productForm.qty}
                    onChange={(e) => setProductForm({ ...productForm, qty: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={productForm.reorder_point}
                    onChange={(e) => setProductForm({ ...productForm, reorder_point: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateProductOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Product'}
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

      {/* Backend Not Implemented Warning */}
      {backendNotImplemented && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                Inventory movement logged locally but not persisted. Backend endpoint POST /api/inventory/movements not yet implemented.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Out of Stock ({outOfStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {outOfStockProducts.slice(0, 3).map(p => (
                    <div key={p.id}>{p.name}</div>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <div className="text-muted-foreground">+{outOfStockProducts.length - 3} more</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  Low Stock ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  {lowStockProducts.slice(0, 3).map(p => (
                    <div key={p.id}>{p.name} ({p.qty} {p.unit})</div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <div className="text-muted-foreground">+{lowStockProducts.length - 3} more</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {products.length === 0 ? 'No products yet. Add your first product to get started.' : 'No products match your search.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => {
            const status = getProductStatus(product);
            return (
              <Card key={product.id} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[status]}>{status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => openMovementHistory(product)}>
                        <History className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {product.qty} {product.unit}
                      </div>
                      {product.reorder_point && (
                        <div className="text-sm text-muted-foreground">
                          Reorder at {product.reorder_point} {product.unit}
                        </div>
                      )}
                    </div>
                    <Button onClick={() => openAdjustQuantity(product)}>
                      Adjust Quantity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Product Modal */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Product Name</Label>
              <Input
                id="edit_name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Apple Cider - 12oz"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_category">Category</Label>
                <Input
                  id="edit_category"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Finished Goods"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_unit">Unit</Label>
                <Select value={productForm.unit} onValueChange={(value) => setProductForm({ ...productForm, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="cases">Cases</SelectItem>
                    <SelectItem value="gallons">Gallons</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="lbs">Pounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_qty">Quantity</Label>
                <Input
                  id="edit_qty"
                  type="number"
                  min="0"
                  value={productForm.qty}
                  onChange={(e) => setProductForm({ ...productForm, qty: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_reorder_point">Reorder Point</Label>
                <Input
                  id="edit_reorder_point"
                  type="number"
                  min="0"
                  value={productForm.reorder_point}
                  onChange={(e) => setProductForm({ ...productForm, reorder_point: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Quantity Modal */}
      <Dialog open={!!adjustingProduct} onOpenChange={(open) => !open && setAdjustingProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Quantity - {adjustingProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Current Quantity</div>
              <div className="text-2xl font-bold">
                {adjustingProduct?.qty} {adjustingProduct?.unit}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_type">Movement Type</Label>
              <Select 
                value={adjustmentForm.movement_type} 
                onValueChange={(value: any) => setAdjustmentForm({ ...adjustmentForm, movement_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receive">Receive (Add Stock)</SelectItem>
                  <SelectItem value="transfer">Transfer (Remove Stock)</SelectItem>
                  <SelectItem value="waste">Waste/Spoilage</SelectItem>
                  <SelectItem value="cycle_count_adjust">Cycle Count Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qty_delta">Quantity Change</Label>
              <Input
                id="qty_delta"
                type="number"
                value={adjustmentForm.qty_delta}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, qty_delta: parseInt(e.target.value) || 0 })}
                placeholder="Enter positive or negative number"
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add stock, negative to remove
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={adjustmentForm.note}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                placeholder="Reason for adjustment..."
                rows={2}
              />
            </div>

            {adjustingProduct && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-sm text-muted-foreground">New Quantity</div>
                <div className="text-2xl font-bold text-primary">
                  {adjustingProduct.qty + adjustmentForm.qty_delta} {adjustingProduct.unit}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustQuantity} disabled={submitting}>
              {submitting ? 'Adjusting...' : 'Adjust Quantity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement History Modal */}
      <Dialog open={!!viewingHistory} onOpenChange={(open) => !open && setViewingHistory(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movement History - {viewingHistory?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingMovements ? (
              <div className="text-center py-8 text-muted-foreground">Loading movements...</div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No movement history available
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {movements.map((movement) => (
                  <Card key={movement.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium capitalize">
                            {movement.movement_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {new Date(movement.created_at).toLocaleString()}
                          </div>
                          {movement.note && (
                            <div className="text-sm mt-2">{movement.note}</div>
                          )}
                        </div>
                        <div className={`text-lg font-bold ${movement.qty_delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.qty_delta >= 0 ? '+' : ''}{movement.qty_delta}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
