import { Router } from 'express';
import authRoutes from './auth.js';
import customerRoutes from './customer.js';
import adminRoutes from './admin.js';
import deliveryRoutes from './delivery.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/admin', adminRoutes);
router.use('/delivery', deliveryRoutes);

// Serve uploaded files
router.use('/uploads', (req, res, next) => {
  // This would be handled by express.static in production
  next();
});

export const apiRoutes = router;