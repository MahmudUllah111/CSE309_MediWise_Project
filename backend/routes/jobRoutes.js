import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';

const router = express.Router();

// Public routes (for website job listings)
router.get('/', getJobs);
router.get('/:id', getJobById);

// Admin only routes
router.post('/', authenticate, authorize(['admin']), createJob);
router.put('/:id', authenticate, authorize(['admin']), updateJob);
router.delete('/:id', authenticate, authorize(['admin']), deleteJob);

export default router;












