import { useEffect, useState } from 'react';
import { Check, X, Download, FileText, DollarSign, Clock, AlertCircle } from 'lucide-react';
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
import { payslipsApi } from '@/services/api';
import { Payslip } from '@/types';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'view' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPayslips();
  }, []);

  const loadPayslips = async () => {
    try {
      const response = await payslipsApi.getAll();
      if (response.success && response.data) {
        setPayslips(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payslips',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPayslip || !dialogAction || dialogAction === 'view') return;

    setIsSubmitting(true);
    try {
      const response = dialogAction === 'approve'
        ? await payslipsApi.approve(selectedPayslip.id)
        : await payslipsApi.reject(selectedPayslip.id, rejectionReason || undefined);

      if (response.success) {
        setPayslips(prev =>
          prev.map(p =>
            p.id === selectedPayslip.id
              ? { ...p, status: dialogAction === 'approve' ? 'approved' : 'rejected' }
              : p
          )
        );
        toast({
          title: 'Success',
          description: `Payslip ${dialogAction}d successfully. Employee will be notified.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${dialogAction} payslip`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setDialogAction(null);
      setSelectedPayslip(null);
      setRejectionReason('');
    }
  };

  const handleDownload = async (payslip: Payslip) => {
    try {
      await payslipsApi.downloadPdf(payslip.id);
      toast({
        title: 'Download Started',
        description: `Downloading payslip for ${payslip.employeeName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download payslip',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Payslip['status']) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingPayslips = payslips.filter(p => p.status === 'pending');
  const processedPayslips = payslips.filter(p => p.status !== 'pending');

  // Calculate totals
  const totalPending = pendingPayslips.reduce((sum, p) => sum + p.netSalary, 0);

  const PayslipTable = ({ data, showActions = false }: { data: Payslip[]; showActions?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="font-semibold">Employee</TableHead>
            <TableHead className="font-semibold">Period</TableHead>
            <TableHead className="font-semibold text-right">Basic Salary</TableHead>
            <TableHead className="font-semibold text-right">Allowances</TableHead>
            <TableHead className="font-semibold text-right">Deductions</TableHead>
            <TableHead className="font-semibold text-right">Net Salary</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium text-muted-foreground">No payslips found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((payslip) => (
              <TableRow key={payslip.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {payslip.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{payslip.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{payslip.department}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{payslip.month} {payslip.year}</span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payslip.basicSalary)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-success font-medium">+{formatCurrency(payslip.allowances)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-destructive font-medium">-{formatCurrency(payslip.deductions)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-lg font-bold">{formatCurrency(payslip.netSalary)}</span>
                </TableCell>
                <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => {
                        setSelectedPayslip(payslip);
                        setDialogAction('view');
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleDownload(payslip)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {showActions && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 text-success-foreground gap-1"
                          onClick={() => {
                            setSelectedPayslip(payslip);
                            setDialogAction('approve');
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => {
                            setSelectedPayslip(payslip);
                            setDialogAction('reject');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
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
        <h1 className="font-display text-3xl font-bold text-foreground">Payslips</h1>
        <p className="mt-1 text-muted-foreground">Review and approve employee payslips</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingPayslips.length}</p>
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
              <p className="text-2xl font-bold">{payslips.filter(p => p.status === 'approved').length}</p>
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
              <p className="text-2xl font-bold">{payslips.filter(p => p.status === 'rejected').length}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
              <DollarSign className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending ({pendingPayslips.length})
          </TabsTrigger>
          <TabsTrigger value="processed" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Processed ({processedPayslips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="border-b bg-warning/5">
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PayslipTable data={pendingPayslips} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed" className="mt-6">
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-semibold">Processed Payslips</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PayslipTable data={processedPayslips} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View/Action Dialog */}
      <Dialog open={dialogAction !== null} onOpenChange={() => {
        setDialogAction(null);
        setRejectionReason('');
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'view' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
              ) : dialogAction === 'approve' ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-4 w-4 text-destructive" />
                </div>
              )}
              {dialogAction === 'view' 
                ? 'Payslip Details' 
                : `${dialogAction === 'approve' ? 'Approve' : 'Reject'} Payslip`}
            </DialogTitle>
            {dialogAction !== 'view' && (
              <DialogDescription>
                {dialogAction === 'approve'
                  ? `Are you sure you want to approve the payslip for ${selectedPayslip?.employeeName}?`
                  : `Please provide a reason for rejecting ${selectedPayslip?.employeeName}'s payslip.`
                }
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-lg">
                    {selectedPayslip.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPayslip.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayslip.department}</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Period</span>
                    <span className="font-medium">{selectedPayslip.month} {selectedPayslip.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium">{formatCurrency(selectedPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowances</span>
                    <span className="font-medium text-success">+{formatCurrency(selectedPayslip.allowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-medium text-destructive">-{formatCurrency(selectedPayslip.deductions)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Net Salary</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(selectedPayslip.netSalary)}</span>
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
            {dialogAction === 'view' ? (
              <Button variant="outline" onClick={() => setDialogAction(null)}>
                Close
              </Button>
            ) : (
              <>
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
