import { supabase } from '../lib/supabase';
import { payslipsClient } from '../lib/httpClient';

// Fetch from payslips generator service
async function list() {
  try {
    // Get payslips from friend's payslips generator service
    const payslipData = await payslipsClient.get<any[]>('/api/payslips');
    
    // Sync metadata to Supabase
    if (payslipData.length > 0) {
      await supabase.from('payslips').upsert(
        payslipData.map(p => ({
          id: p.id,
          employee_id: p.employee_id,
          month: p.month,
          year: p.year,
          amount: p.amount,
          status: p.status || 'pending',
          file_path: p.file_path,
        }))
      );
    }
    
    return payslipData;
  } catch (err) {
    console.error('Error fetching from payslips API, falling back to Supabase:', err);
    // Fallback: get from Supabase
    const { data, error } = await supabase.from('payslips').select('*');
    if (error) return [];
    return data || [];
  }
}

async function download(id: string) {
  try {
    // Download PDF from payslips generator service
    const buffer = await payslipsClient.download(`/api/payslips/${id}/download`);
    return { success: true as const, buffer };
  } catch (err) {
    console.error('Error downloading payslip:', err);
    return { success: false as const, error: 'Unable to download payslip' };
  }
}

async function updateStatus(id: string, status: 'approved' | 'rejected') {
  try {
    // Update in payslips generator service
    const data = await payslipsClient.post(`/api/payslips/${id}/${status}`, {});
    
    // Sync to Supabase
    await supabase.from('payslips').update({ status, updated_at: new Date() }).eq('id', id);
    
    return { success: true as const, data };
  } catch (err: any) {
    console.error('Error updating payslip status:', err);
    return { success: false as const, error: err.message, status: 400 };
  }
}

export const payslipsAdapter = {
  list,
  download,
  updateStatus,
};
