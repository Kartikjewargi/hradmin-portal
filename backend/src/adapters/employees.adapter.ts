import { supabase } from '../lib/supabase';
import { employeeClient } from '../lib/httpClient';

// Hybrid approach: Fetch from friend's API, sync to Supabase
async function list() {
  try {
    // Try external API first (friend's employee details service)
    const externalData = await employeeClient.get<any[]>('/api/employees');
    
    // Sync to Supabase for local caching
    if (externalData.length > 0) {
      await supabase.from('employees').upsert(externalData.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        position: emp.position,
        status: emp.status || 'active',
      })));
    }
    
    return externalData;
  } catch (err) {
    console.error('Error fetching from employee API, falling back to Supabase:', err);
    // Fallback: get cached data from Supabase
    const { data } = await supabase.from('employees').select('*').eq('status', 'active');
    return data || [];
  }
}

async function create(payload: any) {
  try {
    // Create in external API (friend's service)
    const response = await employeeClient.post('/api/employees', payload);
    
    // Also store in Supabase for backup
    const { data } = await supabase.from('employees').insert([response]).select();
    
    return { success: true as const, data: response };
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return { success: false as const, error: err.message };
  }
}

async function deactivate(id: string) {
  try {
    // Deactivate in external API
    await employeeClient.patch(`/api/employees/${id}/deactivate`, {});
    
    // Update in Supabase
    await supabase.from('employees').update({ status: 'inactive' }).eq('id', id);
    
    return { success: true as const, data: { id } };
  } catch (err: any) {
    console.error('Error deactivating employee:', err);
    return { success: false as const, error: err.message, status: 400 };
  }
}

export const employeesAdapter = {
  list,
  create,
  deactivate,
};
