import { payslipsAdapter } from '../adapters/payslips.adapter';
import { notifyClientAppPayslipStatus } from '../integration/clientNotifiers';

async function list() {
  return payslipsAdapter.list();
}

async function download(id: string) {
  if (!id) return { success: false as const, error: 'id is required' };
  return payslipsAdapter.download(id);
}

async function updateStatus(id: string, status: 'approved' | 'rejected') {
  if (!id) return { success: false as const, error: 'id is required' };
  const result = await payslipsAdapter.updateStatus(id, status);
  if (result.success) {
    await notifyClientAppPayslipStatus({ payslipId: id, status });
  }
  return result;
}

export const payslipsService = {
  list,
  download,
  updateStatus,
};
