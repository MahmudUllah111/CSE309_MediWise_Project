import express from 'express';
import { getDashboardStats, getAllUsers, getUserById, updateUser, deleteUser, deleteUsers, getAllAds, getTopDoctors } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticate, authorize('admin'), getDashboardStats);
router.get('/users', authenticate, authorize('admin'), getAllUsers);
router.get('/users/:id', authenticate, authorize('admin'), getUserById);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.delete('/users', authenticate, authorize('admin'), deleteUsers);
router.get('/ads', authenticate, authorize('admin'), getAllAds);
router.get('/top-doctors', authenticate, authorize('admin'), getTopDoctors);

export default router;
