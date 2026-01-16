import { Request, Response } from 'express';
import { notificationsService } from '../services/notifications.service';
import { ok, fail } from '../utils/responder';

export async function listUnread(_req: Request, res: Response) {
  const data = await notificationsService.listUnread();
  return ok(res, data);
}

export async function markRead(req: Request, res: Response) {
  const { id } = req.params;
  const result = await notificationsService.markRead(id);
  if (!result.success) return fail(res, result.error, result.status ?? 400);
  return ok(res, { message: 'Notification marked as read' });
}
