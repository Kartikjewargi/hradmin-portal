/**
 * PayrollManagement Page
 * 
 * This page allows HR to:
 * 1. Upload Excel file (salary + attendance)
 * 2. Set policy (PF, PT, leave encashment)
 * 3. Generate payroll
 * 4. Approve payroll
 * 
 * All operations call the Python backend which uses payroll.py
 */

import { useState, useEffect } from 'react';
import { 
  Upload, 
  Settings, 
  PlayCircle, 
  CheckCircle, 
  FileSpreadsheet,
  AlertCircle,
  Users,
  DollarSign,
  Download,
  Eye,
  X as XIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useToast } from '@/hooks/use-toast';
import { 
  payrollApi, 
  PolicySettings, 
  PayrollEmployee, 
  PayslipData,
  BatchStatus 
} from '@/services/payrollApi';
import { getPayslipPdfUrl } from '@/services/apiConfig';

type WorkflowStep = 'upload' | 'policy' | 'generate' | 'approve' | 'complete';

export default function PayrollManagement() {
  const { toast } = useToast();
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  
  // Batch state
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [batchId, setBatchId] = useState<number | null>(null);
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMonth, setUploadMonth] = useState('');
  
  // Policy state
  const [policy, setPolicy] = useState<PolicySettings>({
    pf_rate: 0.12,
    pf_cap: 1800,
    esi_employee_rate: 0.0075,
    esi_threshold: 21000,
    pt_amount: 200,
    leave_encashment: false,
    encash_max_days: 10,
    policy_text: '',
  });
  
  // Employee and payslip data
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [showEmployeesDialog, setShowEmployeesDialog] = useState(false);
  const [showPayslipsDialog, setShowPayslipsDialog] = useState(false);
  
  // PDF Preview state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipData | null>(null);

  // Load batch status on mount
  useEffect(() => {
    loadBatchStatus();
  }, []);

  const loadBatchStatus = async () => {
    const response = await payrollApi.getBatchStatus();
    if (response.success && response.data) {
      setBatchStatus(response.data);
      setBatchId(response.data.id);
      
      // Set current step based on status
      switch (response.data.status) {
        case 'draft':
          setCurrentStep('policy');
          break;
        case 'generated':
          setCurrentStep('approve');
          break;
        case 'approved':
          setCurrentStep('complete');
          break;
        default:
          setCurrentStep('upload');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a file', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await payrollApi.uploadExcel(selectedFile, uploadMonth || undefined);
      
      if (response.success && response.data) {
        toast({
          title: 'Upload Successful',
          description: response.data.message,
        });
        setBatchId(response.data.batch_id);
        setCurrentStep('policy');
        await loadBatchStatus();
      } else {
        toast({ title: 'Upload Failed', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPolicy = async () => {
    setIsLoading(true);
    try {
      const response = await payrollApi.setPolicy(policy);
      
      if (response.success) {
        toast({
          title: 'Policy Applied',
          description: 'Payroll policy has been updated',
        });
        setCurrentStep('generate');
      } else {
        toast({ title: 'Error', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set policy', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await payrollApi.generateAll(batchId || undefined);
      
      if (response.success && response.data) {
        toast({
          title: 'Payroll Generated',
          description: `Generated ${response.data.payslips_generated} payslips. Total: ₹${response.data.total_amount.toLocaleString()}`,
        });
        setCurrentStep('approve');
        await loadBatchStatus();
      } else {
        toast({ title: 'Error', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate payroll', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await payrollApi.approvePayroll(batchId || undefined);
      
      if (response.success && response.data) {
        toast({
          title: 'Payroll Approved',
          description: response.data.message,
        });
        setCurrentStep('complete');
        await loadBatchStatus();
      } else {
        toast({ title: 'Error', description: response.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve payroll', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    const response = await payrollApi.getEmployees(batchId || undefined);
    if (response.success && response.data) {
      setEmployees(response.data.employees);
      setShowEmployeesDialog(true);
    }
  };

  const loadPayslips = async () => {
    const response = await payrollApi.getPayslips(batchId || undefined);
    if (response.success && response.data) {
      setPayslips(response.data.payslips);
      setShowPayslipsDialog(true);
    }
  };

  const handleDownloadPayslip = async (empId: string) => {
    try {
      await payrollApi.downloadPayslip(empId);
      toast({ title: 'Download Started', description: `Downloading payslip for ${empId}` });
    } catch {
      toast({ title: 'Error', description: 'Download failed', variant: 'destructive' });
    }
  };

  const handlePreviewPayslip = async (slip: PayslipData) => {
    try {
      setSelectedPayslip(slip);
      // Get PDF URL from backend
      const pdfUrl = getPayslipPdfUrl(slip.emp_id, slip.month);
      setPdfPreviewUrl(pdfUrl);
      setShowPdfPreview(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to load PDF preview', variant: 'destructive' });
    }
  };

  const closePdfPreview = () => {
    setShowPdfPreview(false);
    setPdfPreviewUrl(null);
    setSelectedPayslip(null);
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'upload': return 0;
      case 'policy': return 25;
      case 'generate': return 50;
      case 'approve': return 75;
      case 'complete': return 100;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'generated':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Generated</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground">
            Upload salary data, set policies, and generate payslips
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEmployees} disabled={!batchId}>
            <Users className="w-4 h-4 mr-2" />
            View Employees
          </Button>
          <Button variant="outline" onClick={loadPayslips} disabled={!batchId}>
            <DollarSign className="w-4 h-4 mr-2" />
            View Payslips
          </Button>
        </div>
      </div>

      {/* Batch Status Card */}
      {batchStatus && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Batch: {batchStatus.month}</CardTitle>
              {getStatusBadge(batchStatus.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-muted-foreground">Employees:</span>{' '}
                <strong>{batchStatus.total_employees}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>{' '}
                <strong>₹{batchStatus.total_amount.toLocaleString()}</strong>
              </div>
              {batchStatus.approved_at && (
                <div>
                  <span className="text-muted-foreground">Approved:</span>{' '}
                  <strong>{new Date(batchStatus.approved_at).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Workflow Progress</span>
          <span>{getStepProgress()}%</span>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={currentStep === 'upload' ? 'text-primary font-medium' : ''}>Upload</span>
          <span className={currentStep === 'policy' ? 'text-primary font-medium' : ''}>Policy</span>
          <span className={currentStep === 'generate' ? 'text-primary font-medium' : ''}>Generate</span>
          <span className={currentStep === 'approve' ? 'text-primary font-medium' : ''}>Approve</span>
          <span className={currentStep === 'complete' ? 'text-primary font-medium' : ''}>Complete</span>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Upload Excel */}
        <Card className={currentStep === 'upload' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              1. Upload Excel
            </CardTitle>
            <CardDescription>
              Upload salary and attendance data from Excel file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="month">Payroll Month (Optional)</Label>
              <Input
                id="month"
                placeholder="e.g., January 2026"
                value={uploadMonth}
                onChange={(e) => setUploadMonth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="file">Excel File</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  <FileSpreadsheet className="w-4 h-4 inline mr-1" />
                  {selectedFile.name}
                </p>
              )}
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isLoading}
              className="w-full"
            >
              {isLoading ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Set Policy */}
        <Card className={currentStep === 'policy' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              2. Set Policy
            </CardTitle>
            <CardDescription>
              Configure PF, PT, ESI, and leave encashment settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PF Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={policy.pf_rate}
                  onChange={(e) => setPolicy({ ...policy, pf_rate: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>PF Cap (₹)</Label>
                <Input
                  type="number"
                  value={policy.pf_cap}
                  onChange={(e) => setPolicy({ ...policy, pf_cap: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>PT Amount (₹)</Label>
                <Input
                  type="number"
                  value={policy.pt_amount}
                  onChange={(e) => setPolicy({ ...policy, pt_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>ESI Threshold (₹)</Label>
                <Input
                  type="number"
                  value={policy.esi_threshold}
                  onChange={(e) => setPolicy({ ...policy, esi_threshold: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={policy.leave_encashment}
                onCheckedChange={(checked) => setPolicy({ ...policy, leave_encashment: checked })}
              />
              <Label>Enable Leave Encashment</Label>
            </div>
            {policy.leave_encashment && (
              <div>
                <Label>Max Encash Days</Label>
                <Input
                  type="number"
                  value={policy.encash_max_days}
                  onChange={(e) => setPolicy({ ...policy, encash_max_days: parseInt(e.target.value) })}
                />
              </div>
            )}
            <div>
              <Label>Policy Text (Optional)</Label>
              <Textarea
                placeholder="e.g., Encash unused leaves up to 10 days. PT 250."
                value={policy.policy_text}
                onChange={(e) => setPolicy({ ...policy, policy_text: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleSetPolicy} 
              disabled={currentStep === 'upload' || isLoading}
              className="w-full"
            >
              {isLoading ? 'Applying...' : 'Apply Policy'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 3: Generate Payroll */}
        <Card className={currentStep === 'generate' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5" />
              3. Generate Payroll
            </CardTitle>
            <CardDescription>
              Calculate salaries and generate PDF payslips for all employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>This will generate payslips using the payroll engine</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All calculations are done by the integrated payroll.py engine
              </p>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={currentStep !== 'generate' || isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating...' : 'Generate All Payslips'}
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Approve Payroll */}
        <Card className={currentStep === 'approve' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              4. Approve Payroll
            </CardTitle>
            <CardDescription>
              Review and approve payroll to enable employee access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Approving will enable employee login</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Employees will be able to view and download their payslips
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={loadPayslips}
                disabled={currentStep !== 'approve'}
                className="flex-1"
              >
                Review Payslips
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={currentStep !== 'approve' || isLoading}
                className="flex-1"
              >
                {isLoading ? 'Approving...' : 'Approve & Enable Access'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Message */}
      {currentStep === 'complete' && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">
                  Payroll Approved Successfully!
                </h3>
                <p className="text-green-600">
                  All employees can now login and access their payslips.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="ml-auto"
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep('upload');
                }}
              >
                Start New Payroll Cycle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Dialog */}
      <Dialog open={showEmployeesDialog} onOpenChange={setShowEmployeesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Employees ({employees.length})</DialogTitle>
            <DialogDescription>
              List of employees from the uploaded Excel file
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Gross Salary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.emp_id}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="text-right">₹{emp.gross_salary.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslips Dialog */}
      <Dialog open={showPayslipsDialog} onOpenChange={setShowPayslipsDialog}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Generated Payslips ({payslips.length})</DialogTitle>
            <DialogDescription>
              Review payslips before approval - Click the eye icon to preview PDF
            </DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((slip) => (
                <TableRow key={slip.id}>
                  <TableCell className="font-medium">{slip.emp_id}</TableCell>
                  <TableCell>{slip.name}</TableCell>
                  <TableCell className="text-right">₹{slip.gross.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₹{slip.total_deductions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">₹{slip.net_pay.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePreviewPayslip(slip)}
                        title="Preview PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadPayslip(slip.emp_id)}
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayslipsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                Payslip Preview - {selectedPayslip?.name} ({selectedPayslip?.emp_id})
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedPayslip?.month} | Net Pay: ₹{selectedPayslip?.net_pay.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-gray-100">
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="Payslip PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => selectedPayslip && handleDownloadPayslip(selectedPayslip.emp_id)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <Button variant="outline" onClick={closePdfPreview}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
