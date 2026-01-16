import { Request, Response } from 'express';
import { leavesService } from '../services/leaves.service';
import { leavesAdapter } from '../adapters/leaves.adapter';
import { notifyClientAppLeaveStatus } from '../integration/clientNotifiers';
import { ok, fail } from '../utils/responder';

// Step 1: Mobile app submits leave application (goes through RAG pipeline)
export async function applyLeave(req: Request, res: Response) {
  try {
    const { employeeId, startDate, endDate, leaveType, reason } = req.body;

    if (!employeeId || !startDate || !endDate || !leaveType) {
      return fail(res, 'Missing required fields: employeeId, startDate, endDate, leaveType', 400);
    }

    // Submit leave request through RAG pipeline
    const leaveRequest = await leavesAdapter.submitFromMobileApp({
      employeeId,
      startDate,
      endDate,
      leaveType,
      reason: reason || '',
    });

    if (!leaveRequest) {
      return fail(res, 'Failed to process leave application', 500);
    }

    return ok(res, {
      message: 'Leave application submitted',
      leaveRequest,
      note: leaveRequest.status === 'pending_approval' 
        ? 'Application passed policy validation, pending HR approval'
        : 'Application failed policy validation. Please check policy violations.',
    }, 201);
  } catch (err) {
    console.error('Error applying leave:', err);
    return fail(res, 'Internal server error', 500);
  }
}

// Get all leave requests (HR admin portal)
export async function listLeaves(req: Request, res: Response) {
  try {
    const { status, employeeId } = req.query;

    const leaves = await leavesAdapter.list({
      status: status as string | undefined,
      employeeId: employeeId as string | undefined,
    });

    return ok(res, { leaves });
  } catch (err) {
    console.error('Error fetching leaves:', err);
    return fail(res, 'Internal server error', 500);
  }
}

// Get pending leave requests for HR review
export async function getPendingLeaves(req: Request, res: Response) {
  try {
    const pendingLeaves = await leavesAdapter.getPendingForApproval();

    return ok(res, {
      count: pendingLeaves.length,
      leaves: pendingLeaves,
      note: 'These are leaves that passed policy validation and are waiting for HR approval',
    });
  } catch (err) {
    console.error('Error fetching pending leaves:', err);
    return fail(res, 'Internal server error', 500);
  }
}

// Step 2: HR admin approves leave request
export async function approveLeave(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await leavesAdapter.approveLeaveRequest(id);

    if (!result.success) {
      return fail(res, 'Failed to approve leave', 500);
    }

    // Notify mobile app about approval
    await notifyClientAppLeaveStatus({
      leaveId: id,
      status: 'approved',
    });

    return ok(res, {
      message: 'Leave approved successfully and employee notified',
      leave: result.data,
    });
  } catch (err) {
    console.error('Error approving leave:', err);
    return fail(res, 'Internal server error', 500);
  }
}

// Step 3: HR admin rejects leave request
export async function rejectLeave(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await leavesAdapter.rejectLeaveRequest(id, reason);

    if (!result.success) {
      return fail(res, 'Failed to reject leave', 500);
    }

    // Notify mobile app about rejection
    await notifyClientAppLeaveStatus({
      leaveId: id,
      status: 'rejected',
    });

    return ok(res, {
      message: 'Leave rejected successfully and employee notified',
      leave: result.data,
    });
  } catch (err) {
    console.error('Error rejecting leave:', err);
    return fail(res, 'Internal server error', 500);
  }
}
