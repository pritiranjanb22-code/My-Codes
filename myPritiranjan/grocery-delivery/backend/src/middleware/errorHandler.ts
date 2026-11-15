import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { QueryResultError } from 'pg';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // PostgreSQL errors
  if (err instanceof QueryResultError) {
    // Unique constraint violation
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY',
        details: err.detail,
      });
    }
    
    // Foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'Invalid reference',
        code: 'INVALID_REFERENCE',
        details: err.detail,
      });
    }
    
    // Check constraint violation
    if (err.code === '23514') {
      return res.status(400).json({
        error: 'Constraint violation',
        code: 'CONSTRAINT_VIOLATION',
        details: err.detail,
      });
    }
  }

  // App errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
      });
    }
    return res.status(400).json({
      error: err.message,
      code: 'UPLOAD_ERROR',
    });
  }

  // Default error
  return res.status(500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
};

// Async wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

import { config } from '../config/index.js';