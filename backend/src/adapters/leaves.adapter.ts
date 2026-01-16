import { supabase } from '../lib/supabase';
import { ragPipelineClient } from '../lib/httpClient';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: 'annual' | 'sick' | 'personal' | 'maternity' | 'other';
  reason: string;
  policyValidation: {
    isValid: boolean;
    violations: string[];
    appliedPolicies: string[];
  };
  status: 'pending_policy_check' | 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// Step 1: Submit leave request from mobile app - goes through RAG pipeline
async function submitFromMobileApp(params: {
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
}): Promise<LeaveRequest | null> {
  try {
    // Call RAG pipeline to validate against company policies
    console.log('Calling RAG pipeline for leave validation...');
    const policyCheckResult = await ragPipelineClient.post('/validate', {
      employeeId: params.employeeId,
      startDate: params.startDate,
      endDate: params.endDate,
      leaveType: params.leaveType,
      reason: params.reason,
    });

    // Create leave request in Supabase with policy validation results
    const { data, error } = await supabase
      .from('leaves')
      .insert([
        {
          employee_id: params.employeeId,
          start_date: params.startDate,
          end_date: params.endDate,
          leave_type: params.leaveType,
          reason: params.reason,
          policy_validation: policyCheckResult,
          status: policyCheckResult.isValid ? 'pending_approval' : 'rejected',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('Leave request created with policy validation:', data.status);
    return formatLeaveRequest(data);
  } catch (err) {
    console.error('Error submitting leave request through RAG pipeline:', err);
    // Fallback: Store without policy check (pending manual review)
    try {
      const { data, error } = await supabase
        .from('leaves')
        .insert([
          {
            employee_id: params.employeeId,
            start_date: params.startDate,
            end_date: params.endDate,
            leave_type: params.leaveType,
            reason: params.reason,
            policy_validation: { isValid: false, violations: ['Policy check failed'], appliedPolicies: [] },
            status: 'pending_policy_check',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return formatLeaveRequest(data);
    } catch (fallbackErr) {
      console.error('Fallback error:', fallbackErr);
      return null;
    }
  }
}

// Step 2: Get all leave requests (with filtering for HR admin portal)
async function list(filters?: { status?: string; employeeId?: string }) {
  try {
    let query = supabase.from('leaves').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaves:', error);
      return [];
    }
    return (data || []).map(formatLeaveRequest);
  } catch (err) {
    console.error('Error in list:', err);
    return [];
  }
}

// Step 3: Get pending leave requests for HR admin review
async function getPendingForApproval() {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('status', 'pending_approval');

    if (error) throw error;
    return (data || []).map(formatLeaveRequest);
  } catch (err) {
    console.error('Error fetching pending leave requests:', err);
    return [];
  }
}

// Step 4: Approve leave request (HR admin action)
async function approveLeaveRequest(leaveId: string) {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    console.log('Leave request approved:', leaveId);
    return { success: true as const, data: formatLeaveRequest(data) };
  } catch (err) {
    console.error('Error approving leave request:', err);
    return { success: false as const, error: err };
  }
}

// Step 5: Reject leave request (HR admin action)
async function rejectLeaveRequest(leaveId: string, rejectionReason?: string) {
  try {
    const { data, error } = await supabase
      .from('leaves')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .select()
      .single();

    if (error) throw error;
    console.log('Leave request rejected:', leaveId);
    return { success: true as const, data: formatLeaveRequest(data) };
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    return { success: false as const, error: err };
  }
}

async function updateStatus(id: string, status: 'approved' | 'rejected') {
  const { data, error } = await supabase
    .from('leaves')
    .update({ status, updated_at: new Date() })
    .eq('id', id)
    .select();
  if (error) {
    console.error('Error updating leave status:', error);
    return { success: false as const, error: error.message, status: 400 };
  }
  return { success: true as const, data: data?.[0] };
}

// Helper function to format database response
function formatLeaveRequest(data: any): LeaveRequest {
  return {
    id: data.id,
    employeeId: data.employee_id,
    startDate: data.start_date,
    endDate: data.end_date,
    leaveType: data.leave_type,
    reason: data.reason,
    policyValidation: data.policy_validation || { isValid: false, violations: [], appliedPolicies: [] },
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const leavesAdapter = {
  submitFromMobileApp,
  list,
  getPendingForApproval,
  approveLeaveRequest,
  rejectLeaveRequest,
  updateStatus,
};
