import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as controller from '../controllers/employees.controller';

const router = Router();

router.get('/', authMiddleware, controller.listEmployees);
router.post('/', authMiddleware, controller.createEmployee);
router.patch('/:id/deactivate', authMiddleware, controller.deactivateEmployee);

export default router;
