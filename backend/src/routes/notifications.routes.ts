import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/notifications.controller';

const router = Router();

router.get('/', authMiddleware, controller.listUnread);
router.post('/:id/mark-read', authMiddleware, controller.markRead);

export default router;
