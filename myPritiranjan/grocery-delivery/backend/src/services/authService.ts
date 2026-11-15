import { query, getClient } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { notificationService } from './notificationService.js';

interface RegisterData {
  phone: string;
  name: string;
  email?: string;
  password?: string;
  fcmToken?: string;
}

interface LoginData {
  phone: string;
  password?: string;
  otp?: string;
  fcmToken?: string;
}

export class AuthService {
  async sendOtp(phone: string, purpose: 'login' | 'register' | 'forgot_password' = 'login') {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Invalidate previous OTPs for this phone/purpose
    await query(
      `UPDATE otp_codes SET used_at = NOW() WHERE phone = $1 AND purpose = $2 AND used_at IS NULL`,
      [phone, purpose]
    );
    
    // Store new OTP
    await query(
      `INSERT INTO otp_codes (phone, code, purpose, expires_at) VALUES ($1, $2, $3, $4)`,
      [phone, code, purpose, expiresAt]
    );
    
    // In production, send via SMS gateway
    console.log(`OTP for ${phone} (${purpose}): ${code}`);
    
    // For development, return OTP
    if (config.nodeEnv === 'development') {
      return { code, expiresAt };
    }
    
    return { expiresAt };
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register' | 'forgot_password' = 'login') {
    const result = await query(
      `SELECT * FROM otp_codes 
       WHERE phone = $1 AND code = $2 AND purpose = $3 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code, purpose]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('Invalid or expired OTP', 400, 'INVALID_OTP');
    }
    
    const otp = result.rows[0];
    
    // Mark OTP as used
    await query('UPDATE otp_codes SET used_at = NOW() WHERE id = $1', [otp.id]);
    
    return true;
  }

  async register(data: RegisterData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Check if phone already exists
      const existingPhone = await client.query('SELECT id FROM users WHERE phone = $1', [data.phone]);
      if (existingPhone.rows.length > 0) {
        throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
      }
      
      // Check if email already exists
      if (data.email) {
        const existingEmail = await client.query('SELECT id FROM users WHERE email = $1', [data.email]);
        if (existingEmail.rows.length > 0) {
          throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
        }
      }
      
      let passwordHash: string | null = null;
      if (data.password) {
        passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);
      }
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (phone, password_hash, full_name, email, role, phone_verified)
         VALUES ($1, $2, $3, $4, 'customer', true)
         RETURNING id, phone, email, full_name, role`,
        [data.phone, passwordHash, data.name, data.email || null]
      );
      
      const user = userResult.rows[0];
      
      // Create customer profile
      await client.query(
        `INSERT INTO customer_profiles (user_id, fcm_token) VALUES ($1, $2)`,
        [user.id, data.fcmToken || null]
      );
      
      await client.query('COMMIT');
      
      // Generate tokens
      const tokens = generateTokens({ id: user.id, phone: user.phone, role: user.role });
      
      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      
      return {
        user: { id: user.id, phone: user.phone, email: user.email, fullName: user.full_name, role: user.role },
        ...tokens,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async login(data: LoginData) {
    // Find user by phone
    const userResult = await query(
      `SELECT u.*, cp.fcm_token as profile_fcm_token
       FROM users u
       LEFT JOIN customer_profiles cp ON u.id = cp.user_id
       WHERE u.phone = $1`,
      [data.phone]
    );
    
    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      throw new AppError('Account deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    // Verify password or OTP
    if (data.password) {
      if (!user.password_hash) {
        throw new AppError('Password not set for this account', 400, 'NO_PASSWORD');
      }
      
      const isValid = await bcrypt.compare(data.password, user.password_hash);
      if (!isValid) {
        throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');
      }
    } else if (data.otp) {
      await this.verifyOtp(data.phone, data.otp, 'login');
    } else {
      throw new AppError('Password or OTP required', 400, 'MISSING_CREDENTIALS');
    }
    
    // Update FCM token if provided
    if (data.fcmToken) {
      await query(
        `INSERT INTO customer_profiles (user_id, fcm_token) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET fcm_token = $2, updated_at = NOW()`,
      [user.id, data.fcmToken]
      );
    }
    
    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    
    // Generate tokens
    const tokens = generateTokens({ id: user.id, phone: user.phone, role: user.role });
    
    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    
    return {
      user: { 
        id: user.id, 
        phone: user.phone, 
        email: user.email, 
        fullName: user.full_name, 
        role: user.role 
      },
      ...tokens,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }
    
    // Check if refresh token exists and not revoked
    const tokenResult = await query(
      `SELECT * FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
      [decoded.id, refreshToken]
    );
    
    if (tokenResult.rows.length === 0) {
      throw new AppError('Refresh token revoked or expired', 401, 'REFRESH_TOKEN_REVOKED');
    }
    
    // Get user
    const userResult = await query(
      'SELECT id, phone, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }
    
    const user = userResult.rows[0];
    
    // Generate new tokens
    const tokens = generateTokens({ id: user.id, phone: user.phone, role: user.role });
    
    // Revoke old refresh token and store new one
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [refreshToken]);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    
    return tokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [refreshToken]);
    } else {
      // Revoke all refresh tokens for user
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1', [userId]);
    }
    
    return { success: true };
  }

  async forgotPassword(phone: string) {
    const userResult = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if user exists
      return { success: true };
    }
    
    await this.sendOtp(phone, 'forgot_password');
    
    return { success: true };
  }

  async resetPassword(phone: string, otp: string, newPassword: string) {
    await this.verifyOtp(phone, otp, 'forgot_password');
    
    const userResult = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    const passwordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userResult.rows[0].id]);
    
    // Revoke all refresh tokens
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1', [userResult.rows[0].id]);
    
    return { success: true };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    // Hash the refresh token for storage
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async getUserById(userId: string) {
    const result = await query(
      `SELECT u.id, u.phone, u.email, u.full_name, u.role, u.is_active, u.created_at,
              cp.fcm_token, cp.loyalty_points, cp.total_orders, cp.total_spent
       FROM users u
       LEFT JOIN customer_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    
    return result.rows[0];
  }
}

export const authService = new AuthService();