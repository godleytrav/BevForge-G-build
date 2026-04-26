import { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Production efficiency, waste tracking, compliance, and financial analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,580</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Volume</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450 bbl</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.5%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Reports */}
      <Tabs defaultValue="production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="waste">Waste & Efficiency</TabsTrigger>
        </TabsList>

        {/* Production Reports */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production by Product</CardTitle>
                <CardDescription>Volume produced by product type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Hoppy Trail IPA</p>
                      <p className="text-xs text-muted-foreground">850 bbl</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">34.7%</p>
                      <div className="h-2 w-24 bg-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Golden Sunset Lager</p>
                      <p className="text-xs text-muted-foreground">720 bbl</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">29.4%</p>
                      <div className="h-2 w-20 bg-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Midnight Stout</p>
                      <p className="text-xs text-muted-foreground">480 bbl</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">19.6%</p>
                      <div className="h-2 w-16 bg-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Citrus Burst Seltzer</p>
                      <p className="text-xs text-muted-foreground">400 bbl</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">16.3%</p>
                      <div className="h-2 w-14 bg-primary rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Batch Completion Rate</CardTitle>
                <CardDescription>On-time vs delayed batches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On Time</span>
                    <span className="text-sm text-green-600 font-medium">42 batches (87.5%)</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: '87.5%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delayed</span>
                    <span className="text-sm text-yellow-600 font-medium">6 batches (12.5%)</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: '12.5%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production Efficiency Trend</CardTitle>
                <CardDescription>Weekly efficiency percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Week 1</span>
                    <span className="font-medium">92.1%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Week 2</span>
                    <span className="font-medium">93.5%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Week 3</span>
                    <span className="font-medium">94.8%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Week 4</span>
                    <span className="font-medium text-green-600">95.2%</span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Trending upward - efficiency improving consistently
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
                <CardDescription>Fermentation tank usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tank 1-5</span>
                      <span className="text-sm text-muted-foreground">95% utilized</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '95%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tank 6-10</span>
                      <span className="text-sm text-muted-foreground">88% utilized</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '88%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Brite Tanks</span>
                      <span className="text-sm text-muted-foreground">72% utilized</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '72%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Channel</CardTitle>
                <CardDescription>Sales breakdown by distribution channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Wholesale</p>
                      <p className="text-xs text-muted-foreground">$68,400</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">54.9%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Direct to Consumer</p>
                      <p className="text-xs text-muted-foreground">$38,200</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">30.7%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Taproom</p>
                      <p className="text-xs text-muted-foreground">$17,980</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">14.4%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Production costs breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Raw Materials</span>
                    <span className="text-sm font-medium">$42,300 (45%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Labor</span>
                    <span className="text-sm font-medium">$28,500 (30%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Utilities</span>
                    <span className="text-sm font-medium">$14,200 (15%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Packaging</span>
                    <span className="text-sm font-medium">$9,500 (10%)</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Total Costs</span>
                    <span className="text-sm">$94,500</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Margins</CardTitle>
                <CardDescription>Gross margin by product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hoppy Trail IPA</span>
                    <span className="text-sm font-medium text-green-600">42.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Golden Sunset Lager</span>
                    <span className="text-sm font-medium text-green-600">38.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Midnight Stout</span>
                    <span className="text-sm font-medium text-green-600">45.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Citrus Burst Seltzer</span>
                    <span className="text-sm font-medium text-green-600">51.2%</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Average Margin</span>
                    <span className="text-sm text-green-600">44.4%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable</CardTitle>
                <CardDescription>Outstanding invoices aging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current (0-30 days)</span>
                    <span className="text-sm font-medium">$18,500</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">31-60 days</span>
                    <span className="text-sm font-medium text-yellow-600">$8,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">61-90 days</span>
                    <span className="text-sm font-medium text-orange-600">$3,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">90+ days</span>
                    <span className="text-sm font-medium text-red-600">$2,100</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Total Outstanding</span>
                    <span className="text-sm">$32,200</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Reports */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>TTB Reporting Status</CardTitle>
                <CardDescription>Federal excise tax and production reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Monthly Excise Tax (Dec)</span>
                    <span className="text-sm font-medium text-green-600">Filed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Production Report (Dec)</span>
                    <span className="text-sm font-medium text-green-600">Filed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transfer Report (Dec)</span>
                    <span className="text-sm font-medium text-yellow-600">Due 12/31</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Annual Report (2024)</span>
                    <span className="text-sm font-medium text-blue-600">Due 1/15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Compliance</CardTitle>
                <CardDescription>State-level reporting and licensing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">State Excise Tax</span>
                    <span className="text-sm font-medium text-green-600">Current</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Brewery License</span>
                    <span className="text-sm font-medium text-green-600">Valid until 6/2025</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sales Tax Filing</span>
                    <span className="text-sm font-medium text-green-600">Current</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Health Permits</span>
                    <span className="text-sm font-medium text-green-600">Valid until 3/2025</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Label Approvals</CardTitle>
                <CardDescription>COLA status summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active COLAs</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending Approval</span>
                    <span className="text-sm font-medium text-blue-600">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Expiring Soon (90 days)</span>
                    <span className="text-sm font-medium text-yellow-600">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revision Required</span>
                    <span className="text-sm font-medium text-orange-600">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Recent compliance events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium">TTB Monthly Report Filed</p>
                      <p className="text-xs text-muted-foreground">Dec 15, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium">State Excise Tax Paid</p>
                      <p className="text-xs text-muted-foreground">Dec 10, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    <div className="flex-1">
                      <p className="font-medium">COLA Submitted for Review</p>
                      <p className="text-xs text-muted-foreground">Dec 5, 2024</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Waste & Efficiency Reports */}
        <TabsContent value="waste" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Waste by Category</CardTitle>
                <CardDescription>Material waste breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Trub & Yeast</p>
                      <p className="text-xs text-muted-foreground">42 bbl (1.7%)</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">Normal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Packaging Loss</p>
                      <p className="text-xs text-muted-foreground">18 bbl (0.7%)</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">Normal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Line Cleaning</p>
                      <p className="text-xs text-muted-foreground">8 bbl (0.3%)</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">Normal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Quality Holds</p>
                      <p className="text-xs text-muted-foreground">2 bbl (0.1%)</p>
                    </div>
                    <span className="text-sm font-medium text-green-600">Low</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Total Waste</span>
                    <span className="text-sm">70 bbl (2.8%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Brewhouse Efficiency</span>
                    <span className="text-sm font-medium text-green-600">82.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fermentation Yield</span>
                    <span className="text-sm font-medium text-green-600">96.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Packaging Efficiency</span>
                    <span className="text-sm font-medium text-green-600">98.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Equipment Effectiveness</span>
                    <span className="text-sm font-medium text-green-600">89.4%</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Combined Efficiency</span>
                    <span className="text-sm text-green-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Water and energy consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Water Usage</span>
                      <span className="text-sm font-medium">4.2 gal/gal beer</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Industry avg: 5.5 gal/gal</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Energy Consumption</span>
                      <span className="text-sm font-medium">0.28 kWh/gal</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Industry avg: 0.35 kWh/gal</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CO2 Recovery</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Above industry standard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Waste Reduction Goals</CardTitle>
                <CardDescription>Progress toward targets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Reduce Waste to 2.5%</span>
                      <span className="text-sm font-medium">2.8% current</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500" style={{ width: '88%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">88% of goal achieved</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Increase Efficiency to 95%</span>
                      <span className="text-sm font-medium">94.2% current</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '99%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">99% of goal achieved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
