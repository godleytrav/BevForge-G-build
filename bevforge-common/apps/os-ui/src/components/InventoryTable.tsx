import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isFinishedGoodsItem } from '@/lib/inventory-reporting';

interface InventoryItem {
  id: string;
  sku?: string;
  name: string;
  category: string;
  onHandQty: number;
  allocatedQty: number;
  onOrderQty: number;
  unit: string;
  reorderPointQty: number;
  trend: 'up' | 'down' | 'stable';
  costPerUnit?: number;
  productCode?: string;
  packagedLotCount?: number;
  packagedReleaseState?: 'held' | 'ready' | 'released' | 'shipped' | 'mixed';
}

type SortField = 'name' | 'category' | 'onHandQty' | 'costPerUnit' | 'allocatedQty' | 'onOrderQty';
type SortDirection = 'asc' | 'desc' | null;

interface InventoryTableProps {
  items: InventoryItem[];
  onEditItem?: (item: InventoryItem) => void;
  onOpenItem?: (item: InventoryItem) => void;
}

const categoryBadgeClasses: Record<string, string> = {
  hops: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
  yeast: 'border-amber-300/30 bg-amber-400/15 text-amber-50',
  malt: 'border-amber-700/30 bg-amber-700/20 text-amber-100',
  fruit: 'border-orange-400/30 bg-orange-500/15 text-orange-100',
  packaging: 'border-slate-300/25 bg-slate-200/10 text-slate-100',
  equipment: 'border-zinc-400/25 bg-zinc-300/10 text-zinc-100',
  kegs: 'border-sky-400/25 bg-sky-500/15 text-sky-100',
};

export default function InventoryTable({ items, onEditItem, onOpenItem }: InventoryTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-1 h-4 w-4" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="ml-1 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    const aValue = a[sortField] ?? 0;
    const bValue = b[sortField] ?? 0;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc'
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  const finishedGoodsStatus = (
    item: InventoryItem
  ): { label: string; className: string } => {
    switch (item.packagedReleaseState) {
      case 'released':
        return {
          label: 'Released to OPS',
          className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
        };
      case 'shipped':
        return {
          label: 'Removed / Shipped',
          className: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
        };
      case 'mixed':
        return {
          label: 'Mixed Lot States',
          className: 'border-violet-400/30 bg-violet-500/15 text-violet-100',
        };
      case 'held':
      case 'ready':
      default:
        return {
          label: 'In Bond',
          className: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
        };
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('name')}
              >
                Item Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('category')}
              >
                Category
                {getSortIcon('category')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('onHandQty')}
              >
                On Hand
                {getSortIcon('onHandQty')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('allocatedQty')}
              >
                Allocated
                {getSortIcon('allocatedQty')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('onOrderQty')}
              >
                On Order
                {getSortIcon('onOrderQty')}
              </Button>
            </TableHead>
            <TableHead>Available</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 font-medium"
                onClick={() => handleSort('costPerUnit')}
              >
                Cost
                {getSortIcon('costPerUnit')}
              </Button>
            </TableHead>
            <TableHead>Trend</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => {
            const availableQty = Math.max(0, item.onHandQty - item.allocatedQty);
            const onOrderQty = Number(item.onOrderQty ?? 0);
            const isLowStock = availableQty <= item.reorderPointQty;
            const finishedGood = isFinishedGoodsItem(item);
            const releaseBadge = finishedGoodsStatus(item);
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => onOpenItem?.(item)}
                onDoubleClick={() => onEditItem?.(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenItem?.(item);
                  }
                }}
                tabIndex={0}
              >
                <TableCell className="align-top">
                  <div className="font-medium">{item.name}</div>
                  {finishedGood && (item.productCode || item.packagedLotCount) ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.productCode ? `${item.productCode}` : 'Finished product'}
                      {item.packagedLotCount ? ` • ${item.packagedLotCount} lot${item.packagedLotCount === 1 ? '' : 's'}` : ''}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={`capitalize ${categoryBadgeClasses[item.category] ?? 'border-white/15 bg-white/5 text-slate-100'}`}
                    >
                      {item.category}
                    </Badge>
                    {finishedGood ? (
                      <Badge variant="outline" className="border-white/15 bg-white/5 text-slate-100">
                        finished good
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-mono">
                  {item.onHandQty} {item.unit}
                </TableCell>
                <TableCell className="font-mono">
                  {item.allocatedQty} {item.unit}
                </TableCell>
                <TableCell className="font-mono">
                  {onOrderQty} {item.unit}
                </TableCell>
                <TableCell className="font-mono">
                  {availableQty} {item.unit}
                </TableCell>
                <TableCell className="font-mono">
                  {item.costPerUnit !== undefined ? `$${item.costPerUnit.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell>
                  {finishedGood ? (
                    <span className="text-sm text-muted-foreground">lot-driven</span>
                  ) : item.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : item.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {finishedGood ? (
                    <Badge variant="outline" className={releaseBadge.className}>
                      {releaseBadge.label}
                    </Badge>
                  ) : isLowStock ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
