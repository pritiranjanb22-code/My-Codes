import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();

// Create trip
router.post('/',
  authMiddleware,
  [
    body('name').trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('startLocation').isObject(),
    body('startLocation.latitude').isFloat(),
    body('startLocation.longitude').isFloat(),
    body('startLocation.address').optional().isString(),
    body('startLocation.name').optional().isString(),
    body('endLocation').isObject(),
    body('endLocation.latitude').isFloat(),
    body('endLocation.longitude').isFloat(),
    body('endLocation.address').optional().isString(),
    body('endLocation.name').optional().isString(),
    body('startDate').isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('currency').optional().isLength({ min: 3, max: 3 }),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'Validation failed', true, errors.array());
    }

    const trip = {
      id: `trip-${Date.now()}`,
      ...req.body,
      ownerId: req.user!.id,
      status: 'planning',
      currency: req.body.currency || 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json(trip);
  })
);

// Get user's trips
router.get('/',
  authMiddleware,
  [
    query('status').optional().isIn(['planning', 'active', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const trips = [
      {
        id: 'demo-trip-1',
        name: 'Coorg Road Trip',
        description: 'A scenic road trip through Karnataka',
        startLocation: { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
        endLocation: { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
        startDate: new Date().toISOString(),
        status: 'active',
        ownerId: req.user!.id,
        budget: 30000,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      },
    ];

    res.json(trips);
  })
);

// Get trip by ID
router.get('/:tripId',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const trip = {
      id: req.params.tripId,
      name: 'Coorg Road Trip',
      description: 'A scenic road trip through Karnataka',
      startLocation: { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
      endLocation: { name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
      startDate: new Date().toISOString(),
      status: 'active',
      ownerId: req.user!.id,
      budget: 30000,
      currency: 'INR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.json(trip);
  })
);

// Update trip
router.put('/:tripId',
  authMiddleware,
  [
    param('tripId').notEmpty(),
    body('name').optional().trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('budget').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['planning', 'active', 'completed', 'cancelled']),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const trip = {
      id: req.params.tripId,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json(trip);
  })
);

// Delete trip
router.delete('/:tripId',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Trip deleted' });
  })
);

// Join trip
router.post('/:tripId/join',
  authMiddleware,
  [
    param('tripId').notEmpty(),
    body('code').optional().isLength({ min: 6, max: 6 }),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const member = {
      id: `member-${Date.now()}`,
      tripId: req.params.tripId,
      userId: req.user!.id,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    res.status(201).json(member);
  })
);

// Leave trip
router.post('/:tripId/leave',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Left trip successfully' });
  })
);

// Get trip members
router.get('/:tripId/members',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const members = [
      {
        id: 'member-1',
        tripId: req.params.tripId,
        userId: req.user!.id,
        user: { id: req.user!.id, name: 'Demo User', email: req.user!.email },
        role: 'owner',
        joinedAt: new Date().toISOString(),
        isOnline: true,
        lastSeen: new Date().toISOString(),
      },
    ];

    res.json(members);
  })
);

// Update member role
router.put('/:tripId/members/:memberId/role',
  authMiddleware,
  [
    param('tripId').notEmpty(),
    param('memberId').notEmpty(),
    body('role').isIn(['owner', 'admin', 'member', 'driver', 'viewer']),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Role updated' });
  })
);

// Remove member
router.delete('/:tripId/members/:memberId',
  authMiddleware,
  [param('tripId').notEmpty(), param('memberId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Member removed' });
  })
);

// Get trip code
router.get('/:tripId/code',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    res.json({ code });
  })
);

// Get trip QR code
router.get('/:tripId/qr',
  authMiddleware,
  [param('tripId').notEmpty()],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const joinUrl = `${process.env.CORS_ORIGIN}/join/${req.params.tripId}`;
    res.json({ qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}` });
  })
);

// Invite to trip
router.post('/:tripId/invite',
  authMiddleware,
  [
    param('tripId').notEmpty(),
    body('emails').optional().isArray(),
    body('phones').optional().isArray(),
  ],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({ message: 'Invitations sent' });
  })
);

export default router;