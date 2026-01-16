/**
 * Employee Payslip Page
 * 
 * This page allows employees to:
 * 1. View their payslip summary
 * 2. Download their payslip PDF
 * 
 * Only accessible after HR approves the payroll
 */

import { useState, useEffect } from 'react';
import { Download, FileText, DollarSign, Calendar, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { employeeApi, PayslipData } from '@/services/payrollApi';

export default function EmployeePayslip() {
  const { toast } = useToast();
  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadPayslip();
  }, []);

  const loadPayslip = async () => {
    setIsLoading(true);
    try {
      const response = await employeeApi.getMyPayslip();
      if (response.success && response.data) {
        setPayslip(response.data);
      } else {
        toast({
          title: 'No Payslip Found',
          description: response.error || 'Your payslip is not yet available',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load payslip',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await employeeApi.downloadMyPayslip();
      toast({
        title: 'Download Started',
        description: 'Your payslip PDF is being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download payslip',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your payslip...</p>
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Payslip Available</h3>
              <p className="text-muted-foreground">
                Your payslip will appear here once HR approves the payroll.
              </p>
              <Button onClick={loadPayslip} variant="outline" className="mt-4">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Payslip</h2>
          <p className="text-muted-foreground">{payslip.month}</p>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading}>
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download PDF'}
        </Button>
      </div>

      {/* Employee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-semibold">{payslip.emp_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{payslip.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-semibold">{payslip.designation || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{payslip.present_days}</p>
              <p className="text-sm text-muted-foreground">Present Days</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{payslip.approved_paid_leaves}</p>
              <p className="text-sm text-muted-foreground">Paid Leaves</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{payslip.lop_days}</p>
              <p className="text-sm text-muted-foreground">LOP Days</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">{payslip.payable_days}</p>
              <p className="text-sm text-muted-foreground">Payable Days</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{payslip.remaining_leaves}</p>
              <p className="text-sm text-muted-foreground">Leave Balance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings & Deductions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Earnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <DollarSign className="w-5 h-5" />
              Earnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Basic + DA</span>
              <span className="font-medium">₹{payslip.basic_da.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>HRA</span>
              <span className="font-medium">₹{payslip.hra.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Other Allowances</span>
              <span className="font-medium">₹{payslip.other_allowances.toLocaleString()}</span>
            </div>
            {payslip.encashment > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Leave Encashment</span>
                <span className="font-medium">₹{payslip.encashment.toLocaleString()}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Gross Salary</span>
              <span className="text-green-600">₹{payslip.gross.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Building className="w-5 h-5" />
              Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Provident Fund (PF)</span>
              <span className="font-medium">₹{payslip.pf.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>ESI</span>
              <span className="font-medium">₹{payslip.esi.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Professional Tax (PT)</span>
              <span className="font-medium">₹{payslip.pt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>TDS</span>
              <span className="font-medium">₹{payslip.tds.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Deductions</span>
              <span className="text-red-600">₹{payslip.total_deductions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Net Pay */}
      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-muted-foreground">Net Pay</p>
              <p className="text-sm text-muted-foreground">For {payslip.month}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">
                ₹{payslip.net_pay.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Credited to your bank account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
