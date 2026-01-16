import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/payslips.controller';

const router = Router();

router.get('/', authMiddleware, controller.listPayslips);
router.get('/:id/download', authMiddleware, controller.downloadPayslip);
router.post('/:id/approve', authMiddleware, controller.approvePayslip);
router.post('/:id/reject', authMiddleware, controller.rejectPayslip);

export default router;
