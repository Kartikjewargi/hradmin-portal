/**
 * Payroll API Service
 * 
 * This service connects to the Python FastAPI backend for payroll operations.
 * It integrates with the payroll.py engine through the backend APIs.
 */

import { httpClient, setToken, removeToken } from './apiConfig';
import { ApiResponse } from '@/types';

// ============ Types for Payroll API ============

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  name: string;
  emp_id?: string;
}

export interface PolicySettings {
  policy_text?: string;
  pf_rate?: number;
  pf_cap?: number;
  esi_employee_rate?: number;
  esi_threshold?: number;
  pt_amount?: number;
  leave_encashment?: boolean;
  encash_max_days?: number;
}

export interface PolicyResponse {
  id: number;
  pf_rate: number;
  pf_cap: number;
  esi_employee_rate: number;
  esi_threshold: number;
  pt_amount: number;
  leave_encashment: boolean;
  encash_max_days: number;
  policy_text?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  employees_count: number;
  batch_id: number;
}

export interface GeneratePayrollResponse {
  success: boolean;
  message: string;
  payslips_generated: number;
  total_amount: number;
}

export interface ApprovePayrollResponse {
  success: boolean;
  message: string;
  employees_enabled: number;
}

export interface PayrollEmployee {
  id: number;
  emp_id: string;
  name: string;
  designation?: string;
  department?: string;
  email?: string;
  basic_da: number;
  hra: number;
  other_allowances: number;
  gross_salary: number;
}

export interface PayslipData {
  id: number;
  emp_id: string;
  name: string;
  designation?: string;
  month: string;
  present_days: number;
  approved_paid_leaves: number;
  lop_days: number;
  payable_days: number;
  remaining_leaves: number;
  basic_da: number;
  hra: number;
  other_allowances: number;
  gross: number;
  encashment: number;
  pf: number;
  esi: number;
  pt: number;
  tds: number;
  total_deductions: number;
  net_pay: number;
  pdf_path?: string;
}

export interface BatchStatus {
  id: number;
  month: string;
  status: string;
  total_employees: number;
  total_amount: number;
  approved_at?: string;
  created_at: string;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  emp_id?: string;
  can_login: boolean;
}

// ============ Payroll API Functions ============

/**
 * Authentication API
 */
export const payrollAuthApi = {
  /**
   * Login to the system
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await httpClient.post<LoginResponse>(
        '/api/auth/login',
        credentials,
        false
      );
      
      // Store the token
      setToken(response.access_token);
      
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  },

  /**
   * Logout from the system
   */
  async logout(): Promise<ApiResponse<null>> {
    try {
      await httpClient.post('/api/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    removeToken();
    return { success: true };
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await httpClient.get<UserInfo>('/api/auth/me');
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user info' 
      };
    }
  },
};

/**
 * HR Payroll Operations API
 */
export const payrollApi = {
  /**
   * Upload Excel file with salary and attendance data
   * 
   * >>> This calls payroll.py via the backend <<<
   */
  async uploadExcel(file: File, month?: string): Promise<ApiResponse<UploadResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (month) {
        formData.append('month', month);
      }

      const response = await httpClient.postForm<UploadResponse>(
        '/api/upload-excel',
        formData
      );
      
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  },

  /**
   * Set payroll policy
   * 
   * >>> This calls payroll.py policy settings via the backend <<<
   */
  async setPolicy(policy: PolicySettings): Promise<ApiResponse<PolicyResponse>> {
    try {
      const response = await httpClient.post<PolicyResponse>(
        '/api/set-policy',
        policy
      );
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to set policy' 
      };
    }
  },

  /**
   * Get current policy
   */
  async getPolicy(): Promise<ApiResponse<PolicyResponse>> {
    try {
      const response = await httpClient.get<PolicyResponse>('/api/policy');
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get policy' 
      };
    }
  },

  /**
   * Generate all payslips
   * 
   * >>> This calls payroll.py generate_all_payslips() via the backend <<<
   */
  async generateAll(batchId?: number): Promise<ApiResponse<GeneratePayrollResponse>> {
    try {
      const url = batchId ? `/api/generate-all?batch_id=${batchId}` : '/api/generate-all';
      const response = await httpClient.post<GeneratePayrollResponse>(url);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate payroll' 
      };
    }
  },

  /**
   * Approve payroll (enables employee login)
   */
  async approvePayroll(batchId?: number): Promise<ApiResponse<ApprovePayrollResponse>> {
    try {
      const url = batchId ? `/api/approve-payroll?batch_id=${batchId}` : '/api/approve-payroll';
      const response = await httpClient.post<ApprovePayrollResponse>(url);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to approve payroll' 
      };
    }
  },

  /**
   * Get list of employees
   */
  async getEmployees(batchId?: number): Promise<ApiResponse<{ employees: PayrollEmployee[]; total: number }>> {
    try {
      const url = batchId ? `/api/employees?batch_id=${batchId}` : '/api/employees';
      const response = await httpClient.get<{ employees: PayrollEmployee[]; total: number }>(url);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get employees' 
      };
    }
  },

  /**
   * Get all payslips (HR only)
   */
  async getPayslips(batchId?: number): Promise<ApiResponse<{ payslips: PayslipData[]; total: number; batch_status: string }>> {
    try {
      const url = batchId ? `/api/payslips?batch_id=${batchId}` : '/api/payslips';
      const response = await httpClient.get<{ payslips: PayslipData[]; total: number; batch_status: string }>(url);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get payslips' 
      };
    }
  },

  /**
   * Get payslip for specific employee (HR only)
   */
  async getPayslipByEmpId(empId: string): Promise<ApiResponse<PayslipData>> {
    try {
      const response = await httpClient.get<PayslipData>(`/api/payslip/${empId}`);
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get payslip' 
      };
    }
  },

  /**
   * Download payslip PDF (HR - any employee)
   */
  async downloadPayslip(empId: string): Promise<void> {
    const blob = await httpClient.downloadBlob(`/api/payslip/${empId}/download`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${empId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Get current batch status
   */
  async getBatchStatus(): Promise<ApiResponse<BatchStatus>> {
    try {
      const response = await httpClient.get<BatchStatus>('/api/batch');
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get batch status' 
      };
    }
  },
};

/**
 * Employee Portal API
 */
export const employeeApi = {
  /**
   * Get own payslip
   */
  async getMyPayslip(): Promise<ApiResponse<PayslipData>> {
    try {
      const response = await httpClient.get<PayslipData>('/api/employee/payslip');
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get payslip' 
      };
    }
  },

  /**
   * Download own payslip PDF
   */
  async downloadMyPayslip(): Promise<void> {
    const blob = await httpClient.downloadBlob('/api/employee/payslip/download');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_payslip.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Get own profile
   */
  async getMyProfile(): Promise<ApiResponse<UserInfo>> {
    try {
      const response = await httpClient.get<UserInfo>('/api/employee/profile');
      return { success: true, data: response };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get profile' 
      };
    }
  },
};
