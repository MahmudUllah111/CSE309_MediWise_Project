import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getDepartments);
router.post('/', authenticate, authorize('admin'), createDepartment);

export default router;

