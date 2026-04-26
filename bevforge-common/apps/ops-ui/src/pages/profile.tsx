import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, MapPin, Calendar, Award, Activity } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

export default function ProfilePage() {
  return (
    <AppShell pageTitle="Profile">
      <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View and manage your profile information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-2xl font-bold">John Doe</h3>
              <p className="text-muted-foreground">Brewmaster</p>
            </div>
            <Badge variant="secondary">Active</Badge>
            <Button className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Your contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">john@brewery.com</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">Portland, OR 97201</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">January 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your recent activity and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <Activity className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">Active Batches</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <Award className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Orders Fulfilled</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <Activity className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">89</p>
                <p className="text-sm text-muted-foreground">Products Managed</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                <Award className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Compliance Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions in BevForge</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Created new batch: IPA #42</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Updated inventory: Cascade Hops</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fulfilled order #1234</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logged compliance event</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}
