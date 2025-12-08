import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getPendingBlogs,
  approveBlog,
  rejectBlog,
  getMyBlogs,
  uploadBlogImage,
} from '../controllers/blogController.js';

const router = express.Router();

// Public routes
router.get('/', getBlogs);
// Doctor routes - must be before /:id to avoid route conflict
router.get('/my/blogs', authenticate, authorize('doctor'), getMyBlogs);
router.get('/:id', getBlogById);

// Doctor routes - need to handle multer middleware properly
router.post('/', authenticate, authorize('doctor'), (req, res, next) => {
  uploadBlogImage(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || 'File upload error' 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    await createBlog(req, res);
  } catch (error) {
    console.error('Unexpected error in blog creation route:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Failed to create blog',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
});

router.put('/:id', authenticate, authorize('doctor', 'admin'), (req, res, next) => {
  uploadBlogImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, updateBlog);

router.delete('/:id', authenticate, authorize('doctor', 'admin'), deleteBlog);

// Admin routes
router.get('/admin/pending', authenticate, authorize('admin'), getPendingBlogs);
router.put('/admin/:id/approve', authenticate, authorize('admin'), approveBlog);
router.put('/admin/:id/reject', authenticate, authorize('admin'), rejectBlog);

export default router;

