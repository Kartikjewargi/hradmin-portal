import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/attendance.controller';

const router = Router();

router.get('/today', authMiddleware, controller.getTodayAttendance);

export default router;
