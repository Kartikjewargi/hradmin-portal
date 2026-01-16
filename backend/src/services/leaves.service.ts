import { leavesAdapter } from '../adapters/leaves.adapter';
import { notifyClientAppLeaveStatus } from '../integration/clientNotifiers';

async function list() {
  return leavesAdapter.list();
}

async function updateStatus(id: string, status: 'approved' | 'rejected') {
  if (!id) return { success: false as const, error: 'id is required' };
  const result = await leavesAdapter.updateStatus(id, status);
  if (result.success) {
    await notifyClientAppLeaveStatus({ leaveId: id, status });
  }
  return result;
}

export const leavesService = {
  list,
  updateStatus,
};
