import express from 'express';
import { authController } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

export default router;

