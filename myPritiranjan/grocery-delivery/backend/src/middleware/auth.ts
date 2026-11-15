import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { query } from '../db/pool.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    phone: string;
    email: string | null;
    full_name: string;
    role: 'customer' | 'admin' | 'delivery_person';
  };
  token?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }
    
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    
    // Get user from database
    const result = await query(
      `SELECT id, phone, email, full_name, role, is_active 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      throw new AppError('Account deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }
    
    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
    req.token = token;
    
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: ('customer' | 'admin' | 'delivery_person')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch {
      return next();
    }
    
    const result = await query(
      `SELECT id, phone, email, full_name, role, is_active 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    
    if (result.rows.length > 0 && result.rows[0].is_active) {
      const user = result.rows[0];
      req.user = {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      };
      req.token = token;
    }
    
    next();
  } catch (error) {
    next();
  }
};

export const generateTokens = (user: { id: string; phone: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string; type: string };
};