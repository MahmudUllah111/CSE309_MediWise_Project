import express from 'express';
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  incrementAdClick,
} from '../controllers/adController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// GET ads - optional authentication for admin filtering
router.get('/', async (req, res, next) => {
  // Try to authenticate but don't fail if not authenticated
  if (req.headers.authorization) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // If auth fails, just continue without user (for public access)
      console.log('Optional auth failed, continuing without user');
    }
  }
  getAds(req, res).catch(next);
});
router.post('/', authenticate, authorize('admin'), createAd);
router.put('/:id', authenticate, authorize('admin'), updateAd);
router.delete('/:id', authenticate, authorize('admin'), deleteAd);
router.post('/:id/click', incrementAdClick);

export default router;