import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Beaker,
  Box,
  MapPin,
  TruckIcon,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function OSPage() {
  return (
    <AppShell currentSuite="os">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">OS Dashboard</h1>
          <p className="text-muted-foreground">
            Operating System - Source of truth for inventory, batches, and production
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">11</div>
              <p className="text-xs text-muted-foreground">5 finished goods, 6 materials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">3 in production, 2 completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Warehouse, cold storage, etc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movements Today</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Shipments, receipts, adjustments</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common OS operations</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start h-auto py-4">
              <Package className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">View Inventory</div>
                <div className="text-xs text-muted-foreground">Check stock levels</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4">
              <Beaker className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Create Batch</div>
                <div className="text-xs text-muted-foreground">Start production run</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4">
              <TruckIcon className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Record Movement</div>
                <div className="text-xs text-muted-foreground">Log inventory change</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4">
              <Box className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Manage Materials</div>
                <div className="text-xs text-muted-foreground">Raw materials & packaging</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4">
              <MapPin className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">View Locations</div>
                <div className="text-xs text-muted-foreground">Warehouse bins & zones</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto py-4">
              <BarChart3 className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">View Reports</div>
                <div className="text-xs text-muted-foreground">Analytics & insights</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Batches</CardTitle>
              <CardDescription>Latest production runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Beaker className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">BATCH-001</div>
                      <div className="text-sm text-muted-foreground">Hoppy Trail IPA</div>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Complete
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Beaker className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">BATCH-002</div>
                      <div className="text-sm text-muted-foreground">Golden Lager</div>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    In Progress
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Beaker className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">BATCH-003</div>
                      <div className="text-sm text-muted-foreground">Dark Night Stout</div>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Complete
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Items needing attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Dark Night Stout</div>
                      <div className="text-sm text-muted-foreground">300L remaining</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    Low Stock
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">Cascade Hops</div>
                      <div className="text-sm text-muted-foreground">50 kg remaining</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    Low Stock
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-medium">American Ale Yeast</div>
                      <div className="text-sm text-muted-foreground">100 units remaining</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    Low Stock
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              OS Module Active
            </CardTitle>
            <CardDescription>
              This is the source of truth for inventory and production data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Status</span>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database Connection</span>
                <Badge variant="default" className="bg-green-500">Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">OPS Integration</span>
                <Badge variant="secondary">Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
