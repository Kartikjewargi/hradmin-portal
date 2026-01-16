import { notificationsAdapter } from '../adapters/notifications.adapter';
import { notifyClientAppAttendanceIssue } from '../integration/clientNotifiers';

async function listUnread() {
  return notificationsAdapter.listUnread();
}

async function markRead(id: string) {
  if (!id) return { success: false as const, error: 'id is required' };
  const result = await notificationsAdapter.markRead(id);
  if (result.success && result.data?.type === 'attendance_issue') {
    await notifyClientAppAttendanceIssue({ notificationId: id });
  }
  return result;
}

export const notificationsService = {
  listUnread,
  markRead,
};
