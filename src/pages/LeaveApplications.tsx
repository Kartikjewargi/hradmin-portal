import { useEffect, useState } from 'react';
import { Check, X, Calendar, Clock, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { leavesApi } from '@/services/api';
import { LeaveApplication } from '@/types';

export default function LeaveApplicationsPage() {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await leavesApi.getAll();
      if (response.success && response.data) {
        setLeaves(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load leave applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedLeave || !dialogAction) return;

    setIsSubmitting(true);
    try {
      const response = dialogAction === 'approve'
        ? await leavesApi.approve(selectedLeave.id)
        : await leavesApi.reject(selectedLeave.id, rejectionReason || undefined);

      if (response.success) {
        setLeaves(prev =>
          prev.map(l =>
            l.id === selectedLeave.id
              ? { ...l, status: dialogAction === 'approve' ? 'approved' : 'rejected' }
              : l
          )
        );
        toast({
          title: 'Success',
          description: `Leave application ${dialogAction}d successfully. Employee will be notified.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${dialogAction} leave application`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setDialogAction(null);
      setSelectedLeave(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: LeaveApplication['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-warning/15 text-warning border border-warning/30">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-success/15 text-success border border-success/30">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/15 text-destructive border border-destructive/30">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (type: LeaveApplication['leaveType']) => {
    const colors: Record<LeaveApplication['leaveType'], string> = {
      annual: 'bg-info/15 text-info border-info/30',
      sick: 'bg-destructive/15 text-destructive border-destructive/30',
      personal: 'bg-primary/15 text-primary border-primary/30',
      maternity: 'bg-success/15 text-success border-success/30',
      paternity: 'bg-accent/15 text-accent border-accent/30',
    };
    return (
      <Badge variant="outline" className={colors[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const processedLeaves = leaves.filter(l => l.status !== 'pending');

  const LeaveTable = ({ data, showActions = false }: { data: LeaveApplication[]; showActions?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="font-semibold">Employee</TableHead>
            <TableHead className="font-semibold">Leave Type</TableHead>
            <TableHead className="font-semibold">Duration</TableHead>
            <TableHead className="font-semibold">Reason</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            {showActions && <TableHead className="text-right font-semibold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium text-muted-foreground">No leave applications found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((leave) => (
              <TableRow key={leave.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {leave.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{leave.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{leave.department}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getLeaveTypeBadge(leave.leaveType)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{leave.startDate}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{leave.endDate}</span>
                    </div>
                    <p className="text-xs font-medium text-primary">
                      {calculateDays(leave.startDate, leave.endDate)} day(s)
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="max-w-xs truncate text-sm">{leave.reason}</p>
                </TableCell>
                <TableCell>{getStatusBadge(leave.status)}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground gap-1"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setDialogAction('approve');
                        }}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setDialogAction('reject');
                        }}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Leave Applications</h1>
        <p className="mt-1 text-muted-foreground">Review and manage employee leave requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingLeaves.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <Check className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaves.filter(l => l.status === 'approved').length}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{leaves.filter(l => l.status === 'rejected').length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending ({pendingLeaves.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <FileText className="h-4 w-4" />
            Processed ({processedLeaves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="border-b bg-warning/5">
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LeaveTable data={pendingLeaves} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold">Processed Applications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LeaveTable data={processedLeaves} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={dialogAction !== null} onOpenChange={() => {
        setDialogAction(null);
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'approve' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-4 w-4 text-destructive" />
                </div>
              )}
              {dialogAction === 'approve' ? 'Approve' : 'Reject'} Leave Application
            </DialogTitle>
            <DialogDescription>
              {dialogAction === 'approve' 
                ? `Are you sure you want to approve the leave application from ${selectedLeave?.employeeName}?`
                : `Please provide a reason for rejecting ${selectedLeave?.employeeName}'s leave application.`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employee:</span>
                    <span className="font-medium">{selectedLeave.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{selectedLeave.leaveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {selectedLeave.startDate} to {selectedLeave.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days:</span>
                    <span className="font-medium">{calculateDays(selectedLeave.startDate, selectedLeave.endDate)} day(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason:</span>
                    <span className="font-medium">{selectedLeave.reason}</span>
                  </div>
                </div>
              </div>

              {dialogAction === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDialogAction(null);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === 'approve' ? 'default' : 'destructive'}
              className={dialogAction === 'approve' ? 'bg-success hover:bg-success/90' : ''}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : dialogAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
