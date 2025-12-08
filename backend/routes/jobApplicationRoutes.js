import express from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import {
  createApplication,
  getMyApplications,
  getAllApplications,
  getJobApplications,
  updateApplicationStatus,
  uploadResume,
} from '../controllers/jobApplicationController.js';

const router = express.Router();

// Public route - anyone can apply (optional auth to track logged-in users)
router.post('/', optionalAuthenticate, (req, res, next) => {
  uploadResume(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, (req, res, next) => {
  // Log request for debugging
  console.log('Job application request:', {
    hasFile: !!req.file,
    body: { ...req.body, skills: req.body.skills ? 'parsed' : 'none' },
    user: req.user ? req.user.id : 'anonymous',
  });
  next();
}, createApplication);

// User routes - get my applications
router.get('/my', authenticate, getMyApplications);

// Admin routes
router.get('/all', authenticate, authorize('admin'), getAllApplications);
router.get('/job/:jobId', authenticate, authorize('admin'), getJobApplications);
router.put('/:id/status', authenticate, authorize('admin'), updateApplicationStatus);

export default router;

