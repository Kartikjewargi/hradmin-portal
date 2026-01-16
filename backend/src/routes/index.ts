import { Router } from 'express';
import authRoutes from './auth.routes';
import employeesRoutes from './employees.routes';
import attendanceRoutes from './attendance.routes';
import leavesRoutes from './leaves.routes';
import payslipsRoutes from './payslips.routes';
import notificationsRoutes from './notifications.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leavesRoutes);
router.use('/payslips', payslipsRoutes);
router.use('/notifications', notificationsRoutes);

export default router;
