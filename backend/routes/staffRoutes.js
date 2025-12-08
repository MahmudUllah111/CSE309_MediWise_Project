import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/staffController.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAllStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;

