import express from 'express';
import {
  saveTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, saveTemplate);
router.get('/', authenticate, getTemplates);
router.get('/:id', authenticate, getTemplate);
router.put('/:id', authenticate, updateTemplate);
router.delete('/:id', authenticate, deleteTemplate);

export default router;











