import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { authService } from '../services/authService.js';
import { sendOtpSchema, verifyOtpSchema, refreshTokenSchema, logoutSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const sendOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone, purpose } = sendOtpSchema.parse(req.body);
  const result = await authService.sendOtp(phone, purpose);
  return sendSuccess(res, { expiresAt: result.expiresAt, ...(config.nodeEnv === 'development' && { code: result.code }) });
});

export const verifyOtp = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone, code, purpose, name, email, fcmToken } = verifyOtpSchema.parse(req.body);
  
  await authService.verifyOtp(phone, code, purpose);
  
  if (purpose === 'register') {
    const result = await authService.register({ phone, name: name!, email, fcmToken });
    return sendSuccess(res, result, 201);
  }
  
  if (purpose === 'forgot_password') {
    return sendSuccess(res, { verified: true, message: 'OTP verified. You can now reset your password.' });
  }
  
  // For login, we need password or we just verified OTP
  // The actual login will be handled by login endpoint
  return sendSuccess(res, { verified: true, message: 'OTP verified successfully' });
});

export const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone, password, otp, fcmToken } = req.body;
  
  const result = await authService.login({ phone, password, otp, fcmToken });
  return sendSuccess(res, result);
});

export const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = verifyOtpSchema.parse(req.body);
  
  // First verify OTP
  await authService.verifyOtp(data.phone, data.code, 'register');
  
  // Then register
  const result = await authService.register({ phone: data.phone, name: data.name!, email: data.email, fcmToken: data.fcmToken });
  return sendSuccess(res, result, 201);
});

export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const tokens = await authService.refreshAccessToken(refreshToken);
  return sendSuccess(res, tokens);
});

export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { refreshToken } = logoutSchema.parse(req.body);
  
  await authService.logout(userId, refreshToken);
  return sendSuccess(res, { success: true });
});

export const forgotPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone } = sendOtpSchema.parse(req.body);
  await authService.forgotPassword(phone);
  return sendSuccess(res, { message: 'If the phone number is registered, an OTP has been sent' });
});

export const resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { phone, otp, newPassword } = req.body;
  
  if (!phone || !otp || !newPassword) {
    return sendError(res, 'Phone, OTP, and new password are required', 400, 'MISSING_FIELDS');
  }
  
  await authService.resetPassword(phone, otp, newPassword);
  return sendSuccess(res, { message: 'Password reset successful' });
});

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = await authService.getUserById(userId);
  return sendSuccess(res, profile);
});

import { config } from '../config/index.js';