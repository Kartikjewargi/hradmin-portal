// Mock API Service Layer
// This layer simulates backend API responses and can be easily replaced with real API calls

import {
  Employee,
  AttendanceRecord,
  LeaveApplication,
  Payslip,
  Notification,
  HRAdmin,
  ApiResponse,
} from '@/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fixed HR Admin credentials (would be in backend in production)
const HR_ADMIN_CREDENTIALS = {
  email: 'admin@company.com',
  password: 'admin123',
};

const HR_ADMIN_USER: HRAdmin = {
  id: '1',
  email: 'admin@company.com',
  name: 'HR Administrator',
  role: 'admin',
};

// ============ CLIENT APP NOTIFICATION API ============
// This is a placeholder for notifying the client mobile app
// In production, this would call an external push notification service or API

interface ClientNotificationPayload {
  type: 'leave_status' | 'payslip_status';
  employeeId: string;
  status: 'approved' | 'rejected';
  reason?: string;
  referenceId: string;
  timestamp: string;
}

export const clientAppApi = {
  /**
   * Notify the client mobile app about status changes
   * This is a placeholder that will be replaced with actual push notification service
   */
  async notifyClientApp(payload: ClientNotificationPayload): Promise<ApiResponse<null>> {
    await delay(200);
    
    // Log the notification for debugging purposes
    console.log('[CLIENT APP NOTIFICATION]', {
      ...payload,
      sentAt: new Date().toISOString(),
    });
    
    // In production, this would:
    // 1. Call a push notification service (Firebase, OneSignal, etc.)
    // 2. Or call an external API endpoint that the mobile app polls
    // 3. Or publish to a message queue that the mobile app subscribes to
    
    return { 
      success: true, 
      message: `Notification sent to client app for ${payload.type}` 
    };
  },
};

// ============ AUTH API ============

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<HRAdmin>> {
    await delay(800);
    
    if (email === HR_ADMIN_CREDENTIALS.email && password === HR_ADMIN_CREDENTIALS.password) {
      return { success: true, data: HR_ADMIN_USER };
    }
    
    return { success: false, error: 'Invalid email or password' };
  },

  async logout(): Promise<ApiResponse<null>> {
    await delay(300);
    return { success: true };
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    await delay(800);
    
    if (email === HR_ADMIN_CREDENTIALS.email) {
      return { success: true, message: 'Password reset link sent to your email' };
    }
    
    return { success: false, error: 'Email not found in our system' };
  },
};

// ============ EMPLOYEES API ============

const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 234 567 8901',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active',
    joinDate: '2022-03-15',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 234 567 8902',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'active',
    joinDate: '2021-08-20',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@company.com',
    phone: '+1 234 567 8903',
    department: 'Finance',
    position: 'Financial Analyst',
    status: 'active',
    joinDate: '2023-01-10',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@company.com',
    phone: '+1 234 567 8904',
    department: 'Human Resources',
    position: 'HR Specialist',
    status: 'active',
    joinDate: '2022-06-01',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@company.com',
    phone: '+1 234 567 8905',
    department: 'Engineering',
    position: 'Junior Developer',
    status: 'inactive',
    joinDate: '2023-04-15',
  },
  {
    id: '6',
    employeeId: 'EMP006',
    firstName: 'Jessica',
    lastName: 'Martinez',
    email: 'jessica.martinez@company.com',
    phone: '+1 234 567 8906',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'active',
    joinDate: '2023-02-01',
  },
  {
    id: '7',
    employeeId: 'EMP007',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@company.com',
    phone: '+1 234 567 8907',
    department: 'Operations',
    position: 'Operations Manager',
    status: 'active',
    joinDate: '2021-11-15',
  },
  {
    id: '8',
    employeeId: 'EMP008',
    firstName: 'Amanda',
    lastName: 'Anderson',
    email: 'amanda.anderson@company.com',
    phone: '+1 234 567 8908',
    department: 'Finance',
    position: 'Accountant',
    status: 'inactive',
    joinDate: '2022-09-01',
  },
];

export const employeesApi = {
  async getAll(): Promise<ApiResponse<Employee[]>> {
    await delay(500);
    return { success: true, data: mockEmployees };
  },

  async create(employee: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    await delay(600);
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
    };
    return { success: true, data: newEmployee };
  },

  async deactivate(id: string): Promise<ApiResponse<Employee>> {
    await delay(500);
    const employee = mockEmployees.find(e => e.id === id);
    if (employee) {
      return { success: true, data: { ...employee, status: 'inactive' } };
    }
    return { success: false, error: 'Employee not found' };
  },

  getDepartments(): string[] {
    return ['Engineering', 'Marketing', 'Finance', 'Human Resources', 'Operations', 'Sales'];
  },
};

// ============ ATTENDANCE API ============

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    department: 'Engineering',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:15',
    checkOut: '17:45',
    status: 'late',
    department: 'Marketing',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:55',
    checkOut: '18:10',
    status: 'present',
    department: 'Finance',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    date: new Date().toISOString().split('T')[0],
    status: 'absent',
    department: 'Human Resources',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    employeeName: 'David Wilson',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '13:00',
    status: 'half-day',
    department: 'Engineering',
  },
  {
    id: '6',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:45',
    checkOut: '17:30',
    status: 'present',
    department: 'Sales',
  },
  {
    id: '7',
    employeeId: 'EMP007',
    employeeName: 'Robert Taylor',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:30',
    checkOut: '18:30',
    status: 'late',
    department: 'Operations',
  },
];

export const attendanceApi = {
  async getToday(): Promise<ApiResponse<AttendanceRecord[]>> {
    await delay(500);
    return { success: true, data: mockAttendance };
  },
};

// ============ LEAVE APPLICATIONS API ============

const mockLeaves: LeaveApplication[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    department: 'Engineering',
    leaveType: 'annual',
    startDate: '2024-02-01',
    endDate: '2024-02-05',
    reason: 'Family vacation',
    status: 'pending',
    appliedAt: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    department: 'Marketing',
    leaveType: 'sick',
    startDate: '2024-01-25',
    endDate: '2024-01-26',
    reason: 'Not feeling well',
    status: 'approved',
    appliedAt: '2024-01-24T08:00:00Z',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    department: 'Finance',
    leaveType: 'personal',
    startDate: '2024-02-10',
    endDate: '2024-02-10',
    reason: 'Personal appointment',
    status: 'pending',
    appliedAt: '2024-01-22T14:15:00Z',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    department: 'Human Resources',
    leaveType: 'annual',
    startDate: '2024-03-01',
    endDate: '2024-03-07',
    reason: 'Planned vacation',
    status: 'rejected',
    appliedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '5',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    department: 'Sales',
    leaveType: 'sick',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    reason: 'Medical appointment',
    status: 'pending',
    appliedAt: '2024-01-25T11:00:00Z',
  },
];

export const leavesApi = {
  async getAll(): Promise<ApiResponse<LeaveApplication[]>> {
    await delay(500);
    return { success: true, data: mockLeaves };
  },

  async approve(id: string, reason?: string): Promise<ApiResponse<LeaveApplication>> {
    await delay(600);
    const leave = mockLeaves.find(l => l.id === id);
    if (leave) {
      // Notify client mobile app about the approval
      await clientAppApi.notifyClientApp({
        type: 'leave_status',
        employeeId: leave.employeeId,
        status: 'approved',
        reason: reason,
        referenceId: id,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, data: { ...leave, status: 'approved' } };
    }
    return { success: false, error: 'Leave application not found' };
  },

  async reject(id: string, reason?: string): Promise<ApiResponse<LeaveApplication>> {
    await delay(600);
    const leave = mockLeaves.find(l => l.id === id);
    if (leave) {
      // Notify client mobile app about the rejection
      await clientAppApi.notifyClientApp({
        type: 'leave_status',
        employeeId: leave.employeeId,
        status: 'rejected',
        reason: reason || 'Request rejected by HR',
        referenceId: id,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, data: { ...leave, status: 'rejected' } };
    }
    return { success: false, error: 'Leave application not found' };
  },
};

// ============ PAYSLIPS API ============

const mockPayslips: Payslip[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    department: 'Engineering',
    month: 'January',
    year: 2024,
    basicSalary: 8500,
    allowances: 1500,
    deductions: 850,
    netSalary: 9150,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    department: 'Marketing',
    month: 'January',
    year: 2024,
    basicSalary: 7500,
    allowances: 1200,
    deductions: 720,
    netSalary: 7980,
    status: 'approved',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Michael Brown',
    department: 'Finance',
    month: 'January',
    year: 2024,
    basicSalary: 7000,
    allowances: 1000,
    deductions: 680,
    netSalary: 7320,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    employeeName: 'Emily Davis',
    department: 'Human Resources',
    month: 'January',
    year: 2024,
    basicSalary: 6500,
    allowances: 900,
    deductions: 620,
    netSalary: 6780,
    status: 'approved',
    generatedAt: '2024-01-28T10:00:00Z',
  },
  {
    id: '5',
    employeeId: 'EMP006',
    employeeName: 'Jessica Martinez',
    department: 'Sales',
    month: 'January',
    year: 2024,
    basicSalary: 6000,
    allowances: 1100,
    deductions: 590,
    netSalary: 6510,
    status: 'pending',
    generatedAt: '2024-01-28T10:00:00Z',
  },
];

export const payslipsApi = {
  async getAll(): Promise<ApiResponse<Payslip[]>> {
    await delay(500);
    return { success: true, data: mockPayslips };
  },

  async approve(id: string, reason?: string): Promise<ApiResponse<Payslip>> {
    await delay(600);
    const payslip = mockPayslips.find(p => p.id === id);
    if (payslip) {
      // Notify client mobile app about the approval
      await clientAppApi.notifyClientApp({
        type: 'payslip_status',
        employeeId: payslip.employeeId,
        status: 'approved',
        reason: reason,
        referenceId: id,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, data: { ...payslip, status: 'approved' } };
    }
    return { success: false, error: 'Payslip not found' };
  },

  async reject(id: string, reason?: string): Promise<ApiResponse<Payslip>> {
    await delay(600);
    const payslip = mockPayslips.find(p => p.id === id);
    if (payslip) {
      // Notify client mobile app about the rejection
      await clientAppApi.notifyClientApp({
        type: 'payslip_status',
        employeeId: payslip.employeeId,
        status: 'rejected',
        reason: reason || 'Payslip rejected by HR',
        referenceId: id,
        timestamp: new Date().toISOString(),
      });
      
      return { success: true, data: { ...payslip, status: 'rejected' } };
    }
    return { success: false, error: 'Payslip not found' };
  },

  async downloadPdf(id: string): Promise<ApiResponse<Blob>> {
    await delay(800);
    // In production, this would return actual PDF blob
    return { success: true, message: 'PDF download initiated' };
  },
};

// ============ NOTIFICATIONS API ============

// Track read notification IDs in memory (persists during session)
let readNotificationIds: Set<string> = new Set();

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'leave',
    title: 'New Leave Application',
    message: 'John Smith has applied for annual leave (Feb 1-5)',
    redirectPath: '/leave-applications',
    isRead: false,
    createdAt: '2024-01-28T10:30:00Z',
  },
  {
    id: '2',
    type: 'attendance',
    title: 'Missed Attendance',
    message: 'Emily Davis was marked absent today',
    redirectPath: '/attendance',
    isRead: false,
    createdAt: '2024-01-28T09:00:00Z',
  },
  {
    id: '3',
    type: 'payslip',
    title: 'Payslips Generated',
    message: 'January 2024 payslips are ready for approval',
    redirectPath: '/payslips',
    isRead: false,
    createdAt: '2024-01-28T08:00:00Z',
  },
  {
    id: '4',
    type: 'leave',
    title: 'Leave Application Updated',
    message: 'Michael Brown has applied for personal leave',
    redirectPath: '/leave-applications',
    isRead: false,
    createdAt: '2024-01-27T14:15:00Z',
  },
  {
    id: '5',
    type: 'employee',
    title: 'New Employee Onboarded',
    message: 'David Wilson has joined the Engineering team',
    redirectPath: '/employees',
    isRead: false,
    createdAt: '2024-01-26T11:00:00Z',
  },
];

export const notificationsApi = {
  async getAll(): Promise<ApiResponse<Notification[]>> {
    await delay(400);
    // Filter out read notifications and mark status based on readNotificationIds
    const unreadNotifications = mockNotifications
      .filter(n => !readNotificationIds.has(n.id))
      .map(n => ({ ...n, isRead: false }));
    return { success: true, data: unreadNotifications };
  },

  async getUnreadCount(): Promise<ApiResponse<number>> {
    await delay(200);
    const count = mockNotifications.filter(n => !readNotificationIds.has(n.id)).length;
    return { success: true, data: count };
  },

  async markAsRead(ids: string[]): Promise<ApiResponse<null>> {
    await delay(300);
    // Add to read set - these will no longer appear
    ids.forEach(id => readNotificationIds.add(id));
    return { success: true };
  },

  async markAllAsRead(): Promise<ApiResponse<null>> {
    await delay(300);
    // Mark all as read
    mockNotifications.forEach(n => readNotificationIds.add(n.id));
    return { success: true };
  },
};
