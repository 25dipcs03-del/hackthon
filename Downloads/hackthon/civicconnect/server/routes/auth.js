import express from 'express';
import { register, login, logout, getProfile, updateProfile, getCitizenNotifications } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.get('/notifications', requireAuth, getCitizenNotifications);

export default router;
