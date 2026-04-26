import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Building2, 
  Warehouse, 
  Phone, 
  Mail, 
  MapPin, 
  Search,
  ShoppingCart,
  Truck,
  FileText,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  CheckCircle2,
  UserPlus,
  Pencil,
  Trash2
} from 'lucide-react';

type EntityType = 'customer' | 'vendor' | 'facility';
type EntityStatus = 'active' | 'pending' | 'operational';

interface Entity {
  id: string;
  name: string;
  type: EntityType;
  status: EntityStatus;
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  stats?: {
    totalOrders?: number;
    totalRevenue?: string;
    totalPurchases?: number;
    totalSpend?: string;
    capacity?: string;
    utilization?: number;
    lastActivity?: string;
  };
  details?: {
    creditLimit?: string;
    currentBalance?: string;
    paymentTerms?: string;
    manager?: string;
  };
}

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntityType, setNewEntityType] = useState<'customer' | 'vendor' | 'facility'>('customer');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');

  // Mock data
  const entities: Entity[] = [
    // Customers
    {
      id: 'C001',
      name: 'Downtown Taproom',
      type: 'customer',
      status: 'active',
      contact: {
        phone: '(555) 123-4567',
        email: 'orders@downtowntaproom.com',
        address: '123 Main St, Portland, OR 97201'
      },
      stats: {
        totalOrders: 47,
        totalRevenue: '$23,450',
        lastActivity: '2 days ago'
      },
      details: {
        creditLimit: '$10,000',
        currentBalance: '$2,340'
      }
    },
    {
      id: 'C002',
      name: 'Riverside Bar & Grill',
      type: 'customer',
      status: 'active',
      contact: {
        phone: '(555) 234-5678',
        email: 'purchasing@riversidebar.com',
        address: '456 River Rd, Portland, OR 97202'
      },
      stats: {
        totalOrders: 32,
        totalRevenue: '$18,920',
        lastActivity: '5 days ago'
      },
      details: {
        creditLimit: '$8,000',
        currentBalance: '$1,200'
      }
    },
    {
      id: 'C003',
      name: 'City Brewery Co.',
      type: 'customer',
      status: 'active',
      contact: {
        phone: '(555) 345-6789',
        email: 'orders@citybrewery.com',
        address: '789 Industrial Way, Portland, OR 97203'
      },
      stats: {
        totalOrders: 28,
        totalRevenue: '$15,680',
        lastActivity: '1 week ago'
      },
      details: {
        creditLimit: '$12,000',
        currentBalance: '$3,450'
      }
    },
    {
      id: 'C004',
      name: 'Main Street Market',
      type: 'customer',
      status: 'pending',
      contact: {
        phone: '(555) 456-7890',
        email: 'info@mainstreetmarket.com',
        address: '321 Main St, Portland, OR 97204'
      },
      stats: {
        totalOrders: 5,
        totalRevenue: '$2,340',
        lastActivity: '3 days ago'
      },
      details: {
        creditLimit: '$5,000',
        currentBalance: '$450'
      }
    },
    // Vendors
    {
      id: 'V001',
      name: 'Pacific Hops Supply',
      type: 'vendor',
      status: 'active',
      contact: {
        phone: '(555) 567-8901',
        email: 'sales@pacifichops.com',
        address: '555 Industrial Pkwy, Seattle, WA 98101'
      },
      stats: {
        totalPurchases: 156,
        totalSpend: '$45,230',
        lastActivity: '1 day ago'
      },
      details: {
        paymentTerms: 'Net 30'
      }
    },
    {
      id: 'V002',
      name: 'Northwest Malt Co.',
      type: 'vendor',
      status: 'active',
      contact: {
        phone: '(555) 678-9012',
        email: 'orders@nwmalt.com',
        address: '777 Grain Ave, Spokane, WA 99201'
      },
      stats: {
        totalPurchases: 89,
        totalSpend: '$32,100',
        lastActivity: '4 days ago'
      },
      details: {
        paymentTerms: 'Net 15'
      }
    },
    {
      id: 'V003',
      name: 'Cascade Equipment Supply',
      type: 'vendor',
      status: 'active',
      contact: {
        phone: '(555) 789-0123',
        email: 'info@cascadeequip.com',
        address: '999 Equipment Dr, Portland, OR 97205'
      },
      stats: {
        totalPurchases: 23,
        totalSpend: '$18,750',
        lastActivity: '1 week ago'
      },
      details: {
        paymentTerms: 'Net 30'
      }
    },
    // Facilities
    {
      id: 'F001',
      name: 'Main Brewery',
      type: 'facility',
      status: 'operational',
      contact: {
        phone: '(555) 890-1234',
        email: 'ops@bevforge.com',
        address: '100 Brewery Ln, Portland, OR 97206'
      },
      stats: {
        capacity: '5,000 BBL/year',
        utilization: 78
      },
      details: {
        manager: 'John Smith'
      }
    },
    {
      id: 'F002',
      name: 'Cold Storage Facility',
      type: 'facility',
      status: 'operational',
      contact: {
        phone: '(555) 901-2345',
        email: 'storage@bevforge.com',
        address: '200 Storage Way, Portland, OR 97207'
      },
      stats: {
        capacity: '10,000 sq ft',
        utilization: 65
      },
      details: {
        manager: 'Sarah Johnson'
      }
    },
    {
      id: 'F003',
      name: 'Retail Taproom',
      type: 'facility',
      status: 'operational',
      contact: {
        phone: '(555) 012-3456',
        email: 'taproom@bevforge.com',
        address: '300 Taproom St, Portland, OR 97208'
      },
      stats: {
        capacity: '150 seats',
        utilization: 82
      },
      details: {
        manager: 'Mike Davis'
      }
    }
  ];

  // Filter entities
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = 
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.contact.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const customers = filteredEntities.filter(e => e.type === 'customer');
  const vendors = filteredEntities.filter(e => e.type === 'vendor');
  const facilities = filteredEntities.filter(e => e.type === 'facility');

  const handleEntityClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setDialogOpen(true);
  };

  const getStatusColor = (status: EntityStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'operational':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const EntityCard = ({ entity }: { entity: Entity }) => (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 bg-card/50 backdrop-blur"
      onClick={() => handleEntityClick(entity)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {entity.type === 'customer' && <Users className="h-5 w-5 text-primary" />}
              {entity.type === 'vendor' && <Building2 className="h-5 w-5 text-primary" />}
              {entity.type === 'facility' && <Warehouse className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <CardTitle className="text-lg">{entity.name}</CardTitle>
              <CardDescription className="text-sm">{entity.id}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEntity(entity);
                setIsEditMode(true);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className={getStatusColor(entity.status)}>
              {entity.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{entity.contact.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{entity.contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{entity.contact.address}</span>
          </div>
        </div>

        {entity.stats && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
            {entity.type === 'customer' && (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">Total Orders</div>
                  <div className="text-lg font-semibold">{entity.stats.totalOrders}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Revenue</div>
                  <div className="text-lg font-semibold text-green-500">{entity.stats.totalRevenue}</div>
                </div>
              </>
            )}
            {entity.type === 'vendor' && (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">Purchases</div>
                  <div className="text-lg font-semibold">{entity.stats.totalPurchases}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Spend</div>
                  <div className="text-lg font-semibold text-blue-500">{entity.stats.totalSpend}</div>
                </div>
              </>
            )}
            {entity.type === 'facility' && (
              <>
                <div>
                  <div className="text-xs text-muted-foreground">Capacity</div>
                  <div className="text-sm font-semibold">{entity.stats.capacity}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold">{entity.stats.utilization}%</div>
                    <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${entity.stats.utilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/ops/orders?customer=${encodeURIComponent(entity.name)}`;
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Create Order
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = '/ops/sales';
            }}
          >
            <Truck className="h-4 w-4 mr-1" />
            Schedule Delivery
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppShell pageTitle="Directory — OPS" currentSuite="ops">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Directory — OPS</h1>
          <p className="text-muted-foreground mt-1">
            Manage customers, vendors, and facilities
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card/50 backdrop-blur">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="customers" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-card/50 backdrop-blur">
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Building2 className="h-4 w-4" />
              Vendors ({vendors.length})
            </TabsTrigger>
            <TabsTrigger value="facilities" className="gap-2">
              <Warehouse className="h-4 w-4" />
              Facilities ({facilities.length})
            </TabsTrigger>
          </TabsList>
          <Button
            onClick={() => {
              setNewEntityType(activeTab as 'customer' | 'vendor' | 'facility');
              setIsAddDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customers.map(entity => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
            {customers.length === 0 && (
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No customers found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vendors.map(entity => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
            {vendors.length === 0 && (
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No vendors found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {facilities.map(entity => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
            {facilities.length === 0 && (
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No facilities found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Entity Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setIsEditMode(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEntity && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    {selectedEntity.type === 'customer' && <Users className="h-6 w-6 text-primary" />}
                    {selectedEntity.type === 'vendor' && <Building2 className="h-6 w-6 text-primary" />}
                    {selectedEntity.type === 'facility' && <Warehouse className="h-6 w-6 text-primary" />}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{selectedEntity.name}</DialogTitle>
                    <DialogDescription>{selectedEntity.id}</DialogDescription>
                  </div>
                </div>
                <Badge variant="outline" className={`w-fit ${getStatusColor(selectedEntity.status)}`}>
                  {selectedEntity.status}
                </Badge>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEntity.contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEntity.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEntity.contact.address}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/ops/orders?customer=${encodeURIComponent(selectedEntity.name)}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Create Order
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/ops/sales'}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Schedule Delivery
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View Documents
                    </Button>
                  </div>
                </div>

                {/* Delete Action */}
                {isEditMode && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${selectedEntity.name}?`)) {
                          // Handle delete logic here
                          console.log('Deleting:', selectedEntity.id);
                          setDialogOpen(false);
                          setIsEditMode(false);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Contact
                    </Button>
                  </div>
                )}

                {/* Statistics */}
                {selectedEntity.stats && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedEntity.type === 'customer' && (
                        <>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Package className="h-4 w-4" />
                                <span className="text-sm">Total Orders</span>
                              </div>
                              <div className="text-2xl font-bold">{selectedEntity.stats.totalOrders}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm">Total Revenue</span>
                              </div>
                              <div className="text-2xl font-bold text-green-500">{selectedEntity.stats.totalRevenue}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">Credit Limit</span>
                              </div>
                              <div className="text-2xl font-bold">{selectedEntity.details?.creditLimit}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Last Activity</span>
                              </div>
                              <div className="text-lg font-semibold">{selectedEntity.stats.lastActivity}</div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      {selectedEntity.type === 'vendor' && (
                        <>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Package className="h-4 w-4" />
                                <span className="text-sm">Total Purchases</span>
                              </div>
                              <div className="text-2xl font-bold">{selectedEntity.stats.totalPurchases}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm">Total Spend</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-500">{selectedEntity.stats.totalSpend}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">Payment Terms</span>
                              </div>
                              <div className="text-lg font-semibold">{selectedEntity.details?.paymentTerms}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Last Activity</span>
                              </div>
                              <div className="text-lg font-semibold">{selectedEntity.stats.lastActivity}</div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                      {selectedEntity.type === 'facility' && (
                        <>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Warehouse className="h-4 w-4" />
                                <span className="text-sm">Capacity</span>
                              </div>
                              <div className="text-xl font-bold">{selectedEntity.stats.capacity}</div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">Utilization</span>
                              </div>
                              <div className="text-2xl font-bold">{selectedEntity.stats.utilization}%</div>
                              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${selectedEntity.stats.utilization}%` }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-card/50 col-span-2">
                            <CardContent className="pt-6">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">Facility Manager</span>
                              </div>
                              <div className="text-xl font-semibold">{selectedEntity.details?.manager}</div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Order #1245 completed</div>
                        <div className="text-sm text-muted-foreground">2 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                        <Truck className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Delivery scheduled</div>
                        <div className="text-sm text-muted-foreground">5 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-card/50">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
                        <DollarSign className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Payment received</div>
                        <div className="text-sm text-muted-foreground">1 week ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {newEntityType === 'customer' ? 'Customer' : newEntityType === 'vendor' ? 'Vendor' : 'Facility'}</DialogTitle>
            <DialogDescription>
              Create a new {newEntityType} contact in the directory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input placeholder="Enter name" className="bg-card/50 backdrop-blur" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input placeholder="Enter phone number" className="bg-card/50 backdrop-blur" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="Enter email" className="bg-card/50 backdrop-blur" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input placeholder="Enter address" className="bg-card/50 backdrop-blur" />
            </div>
            {newEntityType === 'customer' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Credit Limit</label>
                  <Input type="number" placeholder="Enter credit limit" className="bg-card/50 backdrop-blur" />
                </div>
              </>
            )}
            {newEntityType === 'vendor' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Terms</label>
                  <Input placeholder="e.g., Net 30" className="bg-card/50 backdrop-blur" />
                </div>
              </>
            )}
            {newEntityType === 'facility' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <Input type="number" placeholder="Enter capacity" className="bg-card/50 backdrop-blur" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manager</label>
                  <Input placeholder="Enter manager name" className="bg-card/50 backdrop-blur" />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Handle create logic here
                console.log('Creating new', newEntityType);
                setIsAddDialogOpen(false);
              }}
            >
              Create Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
