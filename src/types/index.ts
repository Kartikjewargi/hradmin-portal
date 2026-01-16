// HR Admin Portal Types

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  department: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'rejected';
  pdfUrl?: string;
  generatedAt: string;
}

export interface Notification {
  id: string;
  type: 'leave' | 'attendance' | 'payslip' | 'employee' | 'system';
  title: string;
  message: string;
  redirectPath: string;
  isRead: boolean;
  createdAt: string;
}

export interface HRAdmin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}

export interface AuthState {
  user: HRAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
