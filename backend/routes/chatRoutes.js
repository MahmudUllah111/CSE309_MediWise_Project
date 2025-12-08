import express from 'express';
import {
  getChatUsers,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', authenticate, getChatUsers);
router.get('/conversations', authenticate, getConversations);
router.get('/messages/:userId', authenticate, getMessages);
router.post('/send', authenticate, sendMessage);
router.get('/unread-count', authenticate, getUnreadCount);

export default router;
