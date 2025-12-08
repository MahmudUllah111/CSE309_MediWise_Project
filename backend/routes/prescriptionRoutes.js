import express from 'express';
import {
  createPrescription,
  getPrescriptions,
  getAISuggestions,
} from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createPrescription);
router.get('/', authenticate, getPrescriptions);
router.post('/ai-suggestions', authenticate, getAISuggestions);

export default router;



