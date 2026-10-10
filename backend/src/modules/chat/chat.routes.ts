import { Router } from 'express';
import { handleChat } from './chat.controller.js';
import { optionalAuth } from '../../middleware/requireAuth.js';

const router = Router();

// Chatbot endpoint: accessible to logged-in users and guest citizens alike
router.post('/', optionalAuth, handleChat);

export default router;
