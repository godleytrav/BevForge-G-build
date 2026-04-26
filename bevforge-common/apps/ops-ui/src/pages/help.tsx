import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Book, MessageCircle, Mail, FileText, Video } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

export default function HelpPage() {
  return (
    <AppShell pageTitle="Help & Support">
      <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Find answers and get help with BevForge</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <Book className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Documentation</CardTitle>
            <CardDescription>Complete guides and tutorials</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <Video className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Video Tutorials</CardTitle>
            <CardDescription>Watch step-by-step videos</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-accent transition-colors">
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Contact Support</CardTitle>
            <CardDescription>Get help from our team</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Common questions and answers</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I create a new batch?</AccordionTrigger>
              <AccordionContent>
                To create a new batch, navigate to the Batches page from the OPS menu, then click the "Create Batch" button. Fill in the required information including batch name, volume, yeast type, and expected ABV. You can also set the start date and add notes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How do I manage inventory?</AccordionTrigger>
              <AccordionContent>
                Go to the Inventory page under OPS. You can add new products, adjust quantities, and view movement history. The system will alert you when stock levels are low based on your reorder points.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What compliance events should I log?</AccordionTrigger>
              <AccordionContent>
                You should log all production events, transfers between locations, removals from inventory, losses, and destruction events. This helps maintain TTB and ABC compliance. Navigate to the Compliance page to log events.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How do I track orders?</AccordionTrigger>
              <AccordionContent>
                The Orders page shows all your orders with their current status. You can filter by status (pending, processing, fulfilled, cancelled) and search by customer name or order number. Click on any order to view details or edit it.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Can I export my data?</AccordionTrigger>
              <AccordionContent>
                Yes! Most pages have export functionality. Look for the export button on the Orders, Batches, Inventory, and Compliance pages. You can export data in CSV format for use in spreadsheets or other tools.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>How do I set up notifications?</AccordionTrigger>
              <AccordionContent>
                Go to Settings → Notifications to configure your notification preferences. You can enable/disable alerts for low stock, batch status updates, order notifications, and compliance reminders.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>New to BevForge? Start here</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Badge variant="secondary" className="mt-1">1</Badge>
            <div>
              <h4 className="font-semibold mb-1">Set up your brewery information</h4>
              <p className="text-sm text-muted-foreground">
                Go to Settings → Brewery to add your brewery details, TTB permit number, and ABC license.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Badge variant="secondary" className="mt-1">2</Badge>
            <div>
              <h4 className="font-semibold mb-1">Add your products to inventory</h4>
              <p className="text-sm text-muted-foreground">
                Navigate to OPS → Inventory and add all your raw materials, ingredients, and finished products.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Badge variant="secondary" className="mt-1">3</Badge>
            <div>
              <h4 className="font-semibold mb-1">Create your first batch</h4>
              <p className="text-sm text-muted-foreground">
                Go to OPS → Batches and create a new batch. Track it through fermentation, conditioning, and packaging.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Badge variant="secondary" className="mt-1">4</Badge>
            <div>
              <h4 className="font-semibold mb-1">Start taking orders</h4>
              <p className="text-sm text-muted-foreground">
                Use OPS → Orders to manage customer orders and track fulfillment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>Our support team is here to assist you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Support</p>
              <p className="text-sm text-muted-foreground">support@bevforge.com</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Documentation</p>
              <p className="text-sm text-muted-foreground">docs.bevforge.com</p>
            </div>
          </div>
          <Button className="w-full">Contact Support Team</Button>
        </CardContent>
      </Card>
      </div>
    </AppShell>
  );
}
