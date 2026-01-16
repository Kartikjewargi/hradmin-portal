import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/leaves.controller';

const router = Router();

// Mobile app: Submit leave application (goes through RAG pipeline)
router.post('/apply', controller.applyLeave);

// HR Admin: Get all leave requests
router.get('/', authMiddleware, controller.listLeaves);

// HR Admin: Get pending leave requests for review
router.get('/pending', authMiddleware, controller.getPendingLeaves);

// HR Admin: Approve leave request (notifies mobile app)
router.post('/:id/approve', authMiddleware, controller.approveLeave);

// HR Admin: Reject leave request (notifies mobile app)
router.post('/:id/reject', authMiddleware, controller.rejectLeave);

export default router;
