import { useState } from 'react';
import { ClipboardCheck, Plus, Search, Filter, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface QualityCheck {
  id: string;
  batchId: string;
  batchName: string;
  checkpointType: 'pre-fermentation' | 'mid-fermentation' | 'post-fermentation' | 'packaging' | 'final';
  checkDate: string;
  inspector: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  measurements: Measurement[];
  notes?: string;
  issues?: string[];
}

interface Measurement {
  id: string;
  parameter: string;
  target: string;
  actual: string;
  unit: string;
  withinSpec: boolean;
}

export default function QualityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddCheckDialogOpen, setIsAddCheckDialogOpen] = useState(false);

  // Mock data
  const qualityChecks: QualityCheck[] = [
    {
      id: '1',
      batchId: 'B-2024-045',
      batchName: 'Hoppy Trail IPA',
      checkpointType: 'pre-fermentation',
      checkDate: '2024-12-01',
      inspector: 'Sarah Chen',
      status: 'passed',
      measurements: [
        { id: 'm1', parameter: 'Original Gravity', target: '1.065', actual: '1.064', unit: 'SG', withinSpec: true },
        { id: 'm2', parameter: 'pH', target: '5.2-5.4', actual: '5.3', unit: '', withinSpec: true },
        { id: 'm3', parameter: 'Temperature', target: '68', actual: '68', unit: '°F', withinSpec: true },
      ],
      notes: 'All parameters within specification. Ready for fermentation.',
    },
    {
      id: '2',
      batchId: 'B-2024-046',
      batchName: 'Golden Sunset Lager',
      checkpointType: 'mid-fermentation',
      checkDate: '2024-12-05',
      inspector: 'Mike Rodriguez',
      status: 'warning',
      measurements: [
        { id: 'm4', parameter: 'Specific Gravity', target: '1.020', actual: '1.024', unit: 'SG', withinSpec: false },
        { id: 'm5', parameter: 'Temperature', target: '50', actual: '52', unit: '°F', withinSpec: false },
        { id: 'm6', parameter: 'pH', target: '4.2-4.4', actual: '4.3', unit: '', withinSpec: true },
      ],
      notes: 'Fermentation slightly slower than expected. Temperature adjusted.',
      issues: ['Temperature deviation', 'Slower fermentation rate'],
    },
    {
      id: '3',
      batchId: 'B-2024-047',
      batchName: 'Midnight Stout',
      checkpointType: 'post-fermentation',
      checkDate: '2024-12-10',
      inspector: 'Sarah Chen',
      status: 'passed',
      measurements: [
        { id: 'm7', parameter: 'Final Gravity', target: '1.018', actual: '1.017', unit: 'SG', withinSpec: true },
        { id: 'm8', parameter: 'ABV', target: '8.2', actual: '8.3', unit: '%', withinSpec: true },
        { id: 'm9', parameter: 'pH', target: '4.0-4.2', actual: '4.1', unit: '', withinSpec: true },
      ],
      notes: 'Fermentation complete. Ready for conditioning.',
    },
    {
      id: '4',
      batchId: 'B-2024-048',
      batchName: 'Citrus Burst Seltzer',
      checkpointType: 'packaging',
      checkDate: '2024-12-12',
      inspector: 'Mike Rodriguez',
      status: 'failed',
      measurements: [
        { id: 'm10', parameter: 'CO2 Volume', target: '3.8-4.0', actual: '3.5', unit: 'vol', withinSpec: false },
        { id: 'm11', parameter: 'Fill Level', target: '355', actual: '352', unit: 'ml', withinSpec: false },
        { id: 'm12', parameter: 'Seal Integrity', target: 'Pass', actual: 'Fail', unit: '', withinSpec: false },
      ],
      notes: 'Multiple packaging issues detected. Batch held for review.',
      issues: ['Low carbonation', 'Underfill detected', 'Seal integrity failures'],
    },
    {
      id: '5',
      batchId: 'B-2024-049',
      batchName: 'Hoppy Trail IPA',
      checkpointType: 'final',
      checkDate: '2024-12-15',
      inspector: 'Sarah Chen',
      status: 'passed',
      measurements: [
        { id: 'm13', parameter: 'ABV', target: '6.5', actual: '6.4', unit: '%', withinSpec: true },
        { id: 'm14', parameter: 'IBU', target: '65', actual: '63', unit: '', withinSpec: true },
        { id: 'm15', parameter: 'Color', target: '8-10', actual: '9', unit: 'SRM', withinSpec: true },
        { id: 'm16', parameter: 'Clarity', target: 'Clear', actual: 'Clear', unit: '', withinSpec: true },
      ],
      notes: 'Final quality check passed. Approved for distribution.',
    },
  ];

  const filteredChecks = qualityChecks.filter((check) => {
    const matchesSearch =
      check.batchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      check.batchId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || check.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <ClipboardCheck className="h-4 w-4" />;
    }
  };

  const passedCount = qualityChecks.filter((c) => c.status === 'passed').length;
  const warningCount = qualityChecks.filter((c) => c.status === 'warning').length;
  const failedCount = qualityChecks.filter((c) => c.status === 'failed').length;
  const passRate = ((passedCount / qualityChecks.length) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Control</h1>
          <p className="text-muted-foreground">Track QC checkpoints and testing results</p>
        </div>
        <Dialog open={isAddCheckDialogOpen} onOpenChange={setIsAddCheckDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add QC Check
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Quality Check</DialogTitle>
              <DialogDescription>Record quality control measurements and results</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select>
                    <SelectTrigger id="batch">
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b1">B-2024-045 - Hoppy Trail IPA</SelectItem>
                      <SelectItem value="b2">B-2024-046 - Golden Sunset Lager</SelectItem>
                      <SelectItem value="b3">B-2024-047 - Midnight Stout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkpoint">Checkpoint Type</Label>
                  <Select>
                    <SelectTrigger id="checkpoint">
                      <SelectValue placeholder="Select checkpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre-fermentation">Pre-Fermentation</SelectItem>
                      <SelectItem value="mid-fermentation">Mid-Fermentation</SelectItem>
                      <SelectItem value="post-fermentation">Post-Fermentation</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="final">Final Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inspector">Inspector</Label>
                  <Input id="inspector" placeholder="Inspector name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkDate">Check Date</Label>
                  <Input id="checkDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Measurements</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Parameter</div>
                    <div className="col-span-2">Target</div>
                    <div className="col-span-2">Actual</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">In Spec?</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <Input className="col-span-3" placeholder="Original Gravity" />
                    <Input className="col-span-2" placeholder="1.065" />
                    <Input className="col-span-2" placeholder="1.064" />
                    <Input className="col-span-2" placeholder="SG" />
                    <Select>
                      <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="col-span-1">
                      ×
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Measurement
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Add observations, notes, or recommendations..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issues">Issues (if any)</Label>
                <Textarea id="issues" placeholder="List any issues or concerns..." rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddCheckDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddCheckDialogOpen(false)}>Save QC Check</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passRate}%</div>
            <p className="text-xs text-muted-foreground">Quality checks passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedCount}</div>
            <p className="text-xs text-muted-foreground">All specs met</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">Minor deviations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            <p className="text-xs text-muted-foreground">Out of spec</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checks</CardTitle>
          <CardDescription>Recent QC checkpoints and test results</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Measurements</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChecks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="font-medium">{check.batchId}</TableCell>
                  <TableCell>{check.batchName}</TableCell>
                  <TableCell className="capitalize">{check.checkpointType.replace('-', ' ')}</TableCell>
                  <TableCell>{new Date(check.checkDate).toLocaleDateString()}</TableCell>
                  <TableCell>{check.inspector}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(check.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(check.status)}
                      {check.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {check.measurements.filter((m) => m.withinSpec).length}/{check.measurements.length} in spec
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Issues Section */}
      {filteredChecks.some((c) => c.issues && c.issues.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Issues</CardTitle>
            <CardDescription>Batches requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredChecks
              .filter((c) => c.issues && c.issues.length > 0)
              .map((check) => (
                <div key={check.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {check.batchId} - {check.batchName}
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {check.checkpointType.replace('-', ' ')} • {new Date(check.checkDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(check.status)}>{check.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Issues:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {check.issues?.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  {check.notes && (
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground">{check.notes}</p>
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
