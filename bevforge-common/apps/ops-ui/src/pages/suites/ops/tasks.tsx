import { AppShell } from '@/components/AppShell';
import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  Search,
  ChevronRight,
  XCircle,
  CheckCircle,
  FileText,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskType = 'approval' | 'review' | 'action' | 'compliance';

interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  createdAt: string;
  relatedEntity?: {
    type: 'order' | 'delivery' | 'batch' | 'compliance';
    id: string;
    name: string;
  };
  requiresApproval: boolean;
  comments?: Array<{
    user: string;
    text: string;
    timestamp: string;
  }>;
}

// Sample data
const sampleTasks: Task[] = [
  {
    id: 'T001',
    title: 'Approve Order #1245',
    description: 'Large order from Downtown Taproom requires manager approval due to credit limit.',
    type: 'approval',
    status: 'pending',
    priority: 'high',
    assignedTo: 'You',
    assignedBy: 'Sarah Chen',
    dueDate: '2024-01-20',
    createdAt: '2024-01-18',
    relatedEntity: {
      type: 'order',
      id: 'ORD-1245',
      name: 'Downtown Taproom Order'
    },
    requiresApproval: true,
    comments: [
      {
        user: 'Sarah Chen',
        text: 'Customer has good payment history but this exceeds their credit limit by $2,500',
        timestamp: '2024-01-18 10:30 AM'
      }
    ]
  },
  {
    id: 'T002',
    title: 'Review Batch #234 Quality Report',
    description: 'Quality control flagged potential issues with Pear Cider batch. Review required before release.',
    type: 'review',
    status: 'pending',
    priority: 'urgent',
    assignedTo: 'You',
    assignedBy: 'Mike Johnson',
    dueDate: '2024-01-19',
    createdAt: '2024-01-18',
    relatedEntity: {
      type: 'batch',
      id: 'B234',
      name: 'Pear Cider Batch #234'
    },
    requiresApproval: true,
    comments: [
      {
        user: 'Mike Johnson',
        text: 'pH levels slightly off target. Need decision on whether to adjust or release as-is.',
        timestamp: '2024-01-18 2:15 PM'
      }
    ]
  },
  {
    id: 'T003',
    title: 'Schedule Delivery for Order #1238',
    description: 'Customer requested delivery for next week. Coordinate with logistics.',
    type: 'action',
    status: 'in-progress',
    priority: 'medium',
    assignedTo: 'You',
    assignedBy: 'System',
    dueDate: '2024-01-22',
    createdAt: '2024-01-17',
    relatedEntity: {
      type: 'delivery',
      id: 'DEL-445',
      name: 'Riverside Brewery Delivery'
    },
    requiresApproval: false
  },
  {
    id: 'T004',
    title: 'Submit TTB Monthly Report',
    description: 'Monthly compliance report due by end of week.',
    type: 'compliance',
    status: 'pending',
    priority: 'high',
    assignedTo: 'You',
    assignedBy: 'System',
    dueDate: '2024-01-25',
    createdAt: '2024-01-15',
    relatedEntity: {
      type: 'compliance',
      id: 'TTB-JAN-2024',
      name: 'January 2024 TTB Report'
    },
    requiresApproval: false
  },
  {
    id: 'T005',
    title: 'Approve Vendor Payment',
    description: 'Payment to Cascade Hops Co. for $15,000 requires approval.',
    type: 'approval',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'You',
    assignedBy: 'Finance Team',
    dueDate: '2024-01-23',
    createdAt: '2024-01-18',
    requiresApproval: true
  },
  {
    id: 'T006',
    title: 'Review Inventory Discrepancy',
    description: 'Inventory count shows 15 kegs missing from warehouse. Investigation needed.',
    type: 'review',
    status: 'completed',
    priority: 'high',
    assignedTo: 'You',
    assignedBy: 'Warehouse Manager',
    dueDate: '2024-01-18',
    createdAt: '2024-01-16',
    requiresApproval: false,
    comments: [
      {
        user: 'You',
        text: 'Found kegs in secondary storage. Updated inventory system.',
        timestamp: '2024-01-18 11:00 AM'
      }
    ]
  }
];

export default function TasksPage() {
  const [tasks] = useState<Task[]>(sampleTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [comment, setComment] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by status
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');
  const approvalTasks = filteredTasks.filter(t => t.requiresApproval && t.status === 'pending');

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleApprove = () => {
    console.log('Approved task:', selectedTask?.id);
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  const handleReject = () => {
    console.log('Rejected task:', selectedTask?.id);
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  const handleComplete = () => {
    console.log('Completed task:', selectedTask?.id);
    setIsDetailOpen(false);
    setSelectedTask(null);
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      console.log('Added comment:', comment);
      setComment('');
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in-progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'review': return <FileText className="h-4 w-4" />;
      case 'action': return <Truck className="h-4 w-4" />;
      case 'compliance': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-all bg-card/50 backdrop-blur"
      onClick={() => handleTaskClick(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(task.type)}
              <h3 className="font-semibold">{task.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {task.assignedBy}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>

            {task.relatedEntity && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs">
                  {task.relatedEntity.type}: {task.relatedEntity.id}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <div className="flex items-center gap-1 text-muted-foreground">
              {getStatusIcon(task.status)}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppShell currentSuite="ops">
      <div className="min-h-screen bg-gradient-to-br from-[hsl(200,15%,18%)] via-[hsl(200,15%,12%)] to-[hsl(200,15%,8%)]">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold">Tasks & Approvals</h1>
              <p className="text-muted-foreground">Manage your tasks, approvals, and workflow items</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingTasks.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{approvalTasks.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 backdrop-blur"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | 'all')}>
                <SelectTrigger className="w-full md:w-[180px] bg-card/50 backdrop-blur">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}>
                <SelectTrigger className="w-full md:w-[180px] bg-card/50 backdrop-blur">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="bg-card/50 backdrop-blur">
              <TabsTrigger value="all">
                All Tasks ({filteredTasks.length})
              </TabsTrigger>
              <TabsTrigger value="approvals">
                Approvals ({approvalTasks.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in-progress">
                In Progress ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredTasks.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">No tasks found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              {approvalTasks.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </CardContent>
                </Card>
              ) : (
                approvalTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </TabsContent>

            <TabsContent value="in-progress" className="space-y-4">
              {inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur">
          {selectedTask && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                    <DialogDescription className="mt-2">
                      Task ID: {selectedTask.id}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={getPriorityColor(selectedTask.priority)}>
                      {selectedTask.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedTask.status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Assigned By</h4>
                    <p className="text-sm text-muted-foreground">{selectedTask.assignedBy}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Due Date</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTask.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Created</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Type</h4>
                    <p className="text-sm text-muted-foreground capitalize">{selectedTask.type}</p>
                  </div>
                </div>

                {/* Related Entity */}
                {selectedTask.relatedEntity && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Item</h4>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedTask.relatedEntity.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedTask.relatedEntity.type.toUpperCase()}: {selectedTask.relatedEntity.id}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const routes: Record<string, string> = {
                                order: '/ops/orders',
                                delivery: '/ops/logistics/routes',
                                batch: '/ops/batches',
                                compliance: '/ops/compliance',
                                inventory: '/ops/inventory'
                              };
                              const route = selectedTask.relatedEntity ? routes[selectedTask.relatedEntity.type] : undefined;
                              if (route) window.location.href = route;
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Comments */}
                {selectedTask.comments && selectedTask.comments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Comments</h4>
                    <div className="space-y-3">
                      {selectedTask.comments.map((comment, idx) => (
                        <Card key={idx} className="bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-1">
                              <p className="font-medium text-sm">{comment.user}</p>
                              <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.text}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Comment */}
                <div>
                  <Label htmlFor="comment">Add Comment</Label>
                  <div className="flex gap-2 mt-2">
                    <Textarea
                      id="comment"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-card/50 backdrop-blur"
                    />
                  </div>
                  <Button 
                    onClick={handleAddComment} 
                    size="sm" 
                    className="mt-2"
                    disabled={!comment.trim()}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedTask.requiresApproval && selectedTask.status === 'pending' ? (
                  <>
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleReject}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button onClick={handleApprove}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                ) : selectedTask.status === 'pending' || selectedTask.status === 'in-progress' ? (
                  <>
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleComplete}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
