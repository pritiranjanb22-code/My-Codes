import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as deliveryController from '../controllers/deliveryController.js';
import { validate } from '../middleware/validate.js';
import { updateDeliveryStatusSchema, idParamSchema } from '../validators/index.js';

const router = Router();

// All routes require delivery person authentication
router.use(authMiddleware);
router.use(requireRole('delivery_person'));

// Profile
router.get('/profile', deliveryController.getMyProfile);
router.put('/profile', deliveryController.updateMyProfile);

// Assignments
router.get('/assignments', deliveryController.getMyAssignments);
router.get('/assignments/:id', validate(idParamSchema), deliveryController.getAssignmentDetails);
router.put('/assignments/:id/status', validate(updateDeliveryStatusSchema), deliveryController.updateDeliveryStatus);

// Stats
router.get('/stats', deliveryController.getMyStats);

export default router;