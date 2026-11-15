import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { 
  sendOtp, verifyOtp, login, register, refreshToken, logout, 
  forgotPassword, resetPassword, getProfile 
} from '../controllers/authController.js';
import { 
  sendOtpSchema, verifyOtpSchema, refreshTokenSchema, logoutSchema 
} from '../validators/index.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Public routes
router.post('/send-otp', validate(sendOtpSchema), sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validate(sendOtpSchema), forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authMiddleware, validate(logoutSchema), logout);
router.get('/profile', authMiddleware, getProfile);

export default router;