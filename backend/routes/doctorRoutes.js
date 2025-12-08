import express from 'express';
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  searchDoctors,
  completeDoctorProfile,
  getDoctorProfile,
  getPendingDoctors,
  getApprovedDoctors,
  approveDoctor,
  rejectDoctor,
  uploadCV,
  uploadProfileImage,
  getDoctorCV,
} from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes (doctors endpoint doesn't require auth, but getDoctorById can check user role)
router.get('/search', searchDoctors);
router.get('/', getDoctors);
// This route should be accessible without auth, but will check role if user is logged in
router.get('/:id', getDoctorById);
router.get('/:id/cv', getDoctorCV);

// Doctor routes
router.post('/complete-profile', authenticate, authorize('doctor'), uploadCV, completeDoctorProfile);
router.get('/profile/me', authenticate, authorize('doctor'), getDoctorProfile);
router.put('/:id', authenticate, authorize('admin', 'doctor'), uploadProfileImage, updateDoctor);

// Admin routes
router.post('/', authenticate, authorize('admin'), createDoctor);
router.get('/admin/pending', authenticate, authorize('admin'), getPendingDoctors);
router.get('/admin/approved', authenticate, authorize('admin'), getApprovedDoctors);
router.put('/admin/:id/approve', authenticate, authorize('admin'), approveDoctor);
router.put('/admin/:id/reject', authenticate, authorize('admin'), rejectDoctor);

export default router;
