import { supabase } from '../lib/supabase';
import { geoClient } from '../lib/httpClient';

// Fetch from geofencing service, sync to Supabase
async function getToday() {
  try {
    // Get today's attendance from geofencing service (friend's API)
    const geoData = await geoClient.get<any>('/api/attendance/today');
    
    // Normalize geofencing data
    const normalized = {
      present: geoData.present || [],
      absent: geoData.absent || [],
      late: geoData.late || [],
      not_punched: geoData.not_punched || [],
    };
    
    // Sync to Supabase for record-keeping
    const today = new Date().toISOString().split('T')[0];
    const allRecords = [...normalized.present, ...normalized.absent, ...normalized.late, ...normalized.not_punched];
    
    if (allRecords.length > 0) {
      await supabase.from('attendance').upsert(
        allRecords.map(record => ({
          id: record.id,
          employee_id: record.employee_id,
          date: today,
          status: record.status,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
        }))
      );
    }
    
    return normalized;
  } catch (err) {
    console.error('Error fetching from geofencing API, falling back to Supabase:', err);
    // Fallback: get today's attendance from Supabase
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('attendance').select('*').eq('date', today);
    if (error) return { present: [], absent: [], late: [], not_punched: [] };
    
    const attendance = data || [];
    return {
      present: attendance.filter((a) => a.status === 'present'),
      absent: attendance.filter((a) => a.status === 'absent'),
      late: attendance.filter((a) => a.status === 'late'),
      not_punched: attendance.filter((a) => a.status === 'not_punched'),
    };
  }
}

export const attendanceAdapter = {
  getToday,
};
