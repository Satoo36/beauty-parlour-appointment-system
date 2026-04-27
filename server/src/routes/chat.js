// server/src/routes/chat.js
import express from 'express';
import { handleChat, startChat } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat/start  — called once when chat widget opens
router.post('/start', startChat);

// POST /api/chat        — called for every message or button click
router.post('/', handleChat);

export default router;
