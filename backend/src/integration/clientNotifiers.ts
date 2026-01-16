import { mobileAppClient } from '../lib/httpClient';

// Notify mobile app about leave status change
export async function notifyClientAppLeaveStatus(params: { leaveId: string; status: 'approved' | 'rejected' }) {
  try {
    await mobileAppClient.post('/api/hooks/leaves/status', params);
    return { delivered: true };
  } catch (err) {
    console.warn('Failed to notify mobile app about leave status:', err);
    return { delivered: false };
  }
}

// Notify mobile app about payslip status change
export async function notifyClientAppPayslipStatus(params: { payslipId: string; status: 'approved' | 'rejected' }) {
  try {
    await mobileAppClient.post('/api/hooks/payslips/status', params);
    return { delivered: true };
  } catch (err) {
    console.warn('Failed to notify mobile app about payslip status:', err);
    return { delivered: false };
  }
}

// Notify mobile app about attendance issues
export async function notifyClientAppAttendanceIssue(params: { notificationId: string }) {
  try {
    await mobileAppClient.post('/api/hooks/attendance/issue', params);
    return { delivered: true };
  } catch (err) {
    console.warn('Failed to notify mobile app about attendance issue:', err);
    return { delivered: false };
  }
}
