import express from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAvailableTimeSlots,
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/available-slots', getAvailableTimeSlots);
router.post('/', authenticate, createAppointment);
router.get('/', authenticate, getAppointments);
router.put('/:id/status', authenticate, updateAppointmentStatus);

export default router;



