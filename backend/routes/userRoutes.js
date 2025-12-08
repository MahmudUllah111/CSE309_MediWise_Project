import express from 'express';
import { getUserById, updatePatientProfile, getMyProfile, uploadProfileImage, searchPatientByEmail } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get patient's own profile
router.get('/me/profile', authenticate, getMyProfile);

// Update patient's own profile (with image upload support)
router.put('/me/profile', authenticate, uploadProfileImage, updatePatientProfile);

// Search for patient by email (for doctors)
router.get('/search/patient', authenticate, searchPatientByEmail);

// Get user by ID (for doctors/admins)
router.get('/:id', authenticate, getUserById);

export default router;
