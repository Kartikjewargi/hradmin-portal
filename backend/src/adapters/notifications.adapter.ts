import { supabase } from '../lib/supabase';

async function listUnread() {
  const { data, error } = await supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return (data || []).map((notif) => ({
    ...notif,
    redirect_path: notif.type === 'leave' ? '/leave-applications' : notif.type === 'payslip' ? '/payslips' : notif.type === 'attendance' ? '/attendance' : '/dashboard',
  }));
}

async function markRead(id: string) {
  const { data, error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date() }).eq('id', id).select();
  if (error) {
    console.error('Error marking notification as read:', error);
    return { success: false as const, error: error.message, status: 400 };
  }
  return { success: true as const, data: data?.[0] };
}

export const notificationsAdapter = {
  listUnread,
  markRead,
};
