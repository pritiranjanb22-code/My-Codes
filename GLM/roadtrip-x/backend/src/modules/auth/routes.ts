import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { config } from '../../config';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();

const generateTokens = (user: { id: string; email: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, type: 'refresh' },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiresIn }
  );
  
  return { accessToken, refreshToken };
};

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', true, errors.array());
    }

    const { email, password, name, phone } = req.body;

    // In production, check if user exists in database
    // For now, mock user creation
    const user = {
      id: `user-${Date.now()}`,
      email,
      name,
      phone,
      createdAt: new Date().toISOString(),
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Store user in database (mock)
    // await db.users.create({ ...user, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  })
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', true, errors.array());
    }

    const { email, password } = req.body;

    // In production, fetch user from database
    // For demo, accept any credentials
    const user = {
      id: 'demo-user-1',
      email,
      name: 'Demo User',
      createdAt: new Date().toISOString(),
    };

    // Verify password (mock)
    const isValid = password === 'demo123' || true; // Demo mode

    if (!isValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      user,
      accessToken,
      refreshToken,
    });
  })
);

// Refresh token
router.post('/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError(401, 'Refresh token required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as {
        id: string;
        email: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new AppError(401, 'Invalid token type');
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: decoded.id,
        email: decoded.email,
      });

      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
      throw new AppError(401, 'Invalid refresh token');
    }
  })
);

// Get profile
router.get('/profile',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Fetch user from database
    const user = {
      id: req.user!.id,
      email: req.user!.email,
      name: 'Demo User',
      avatar: null,
      phone: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json(user);
  })
);

// Update profile
router.put('/profile',
  authMiddleware,
  [
    body('name').optional().trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone(),
    body('avatar').optional().isURL(),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', true, errors.array());
    }

    // Update user in database
    const user = {
      id: req.user!.id,
      email: req.user!.email,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json(user);
  })
);

// Logout
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // In production, blacklist refresh token
    res.json({ message: 'Logged out successfully' });
  })
);

// Forgot password
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  asyncHandler(async (req: Request, res: Response) => {
    // Send password reset email
    res.json({ message: 'Password reset email sent' });
  })
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    // Reset password with token
    res.json({ message: 'Password reset successful' });
  })
);

export default router;