import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Package,
  ShoppingCart,
  AlertCircle,
  DollarSign,
  Wrench,
  Beaker,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  beaker: Beaker,
  'shopping-cart': ShoppingCart,
  'alert-circle': AlertCircle,
  package: Package,
  wrench: Wrench,
  'dollar-sign': DollarSign,
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const { filterNotifications, markAsRead, markAllAsRead } = useNotifications();

  const filteredNotifications = filterNotifications(filter);

  const handleNotificationClick = (id: string, type: string) => {
    markAsRead(id);
    
    // Navigate to related page based on notification type
    const routes: Record<string, string> = {
      sales: '/ops/orders',
      production: '/ops/batches',
      compliance: '/ops/compliance',
      inventory: '/ops/inventory',
      system: '/ops/logistics/events',
    };
    
    const route = routes[type];
    if (route) {
      setTimeout(() => {
        window.location.href = route;
      }, 300); // Small delay to show the notification was clicked
    }
  };

  return (
    <AppShell currentSuite="ops" pageTitle="Notifications — OPS">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your brewery operations
            </p>
          </div>
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        </div>

        {/* Filters */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : 'No notifications to display'}
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = iconMap[notification.icon] || Bell;
              return (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                    !notification.read ? 'bg-blue-50/50 border-blue-200' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.type)}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        notification.type === 'production'
                          ? 'bg-blue-100 text-blue-600'
                          : notification.type === 'sales'
                            ? 'bg-green-100 text-green-600'
                            : notification.type === 'compliance'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold leading-none">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
