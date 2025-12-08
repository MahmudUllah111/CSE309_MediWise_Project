import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getAllPayments,
  paySalary,
  getPaymentStats,
} from '../controllers/paymentController.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getAllPayments);
router.get('/stats', getPaymentStats);
router.post('/salary', paySalary);

export default router;

