import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as customerController from '../controllers/customerController.js';
import { validate } from '../middleware/validate.js';
import { 
  updateProfileSchema, createAddressSchema, updateAddressSchema,
  addToCartSchema, updateCartSchema, createOrderSchema, confirmPaymentSchema,
  idParamSchema 
} from '../validators/index.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// All routes require customer authentication
router.use(authMiddleware);
router.use(requireRole('customer'));

// Profile
router.get('/profile', customerController.getProfile);
router.put('/profile', validate(updateProfileSchema), customerController.updateProfile);
router.put('/profile/password', customerController.changePassword);

// Addresses
router.get('/addresses', customerController.getAddresses);
router.get('/addresses/default', customerController.getDefaultAddress);
router.post('/addresses', validate(createAddressSchema), customerController.createAddress);
router.put('/addresses/:id', validate(updateAddressSchema), customerController.updateAddress);
router.delete('/addresses/:id', customerController.deleteAddress);
router.put('/addresses/:id/default', customerController.setDefaultAddress);

// Cart
router.get('/cart', customerController.getCart);
router.post('/cart', validate(addToCartSchema), customerController.addToCart);
router.put('/cart/:productId', validate(updateCartSchema), customerController.updateCartItem);
router.delete('/cart/:productId', customerController.removeFromCart);
router.delete('/cart', customerController.clearCart);
router.get('/cart/validate', customerController.validateCart);

// Orders
router.post('/orders', validate(createOrderSchema), customerController.createOrder);
router.get('/orders', customerController.getOrders);
router.get('/orders/:id', customerController.getOrderById);
router.post('/orders/:id/payment-confirmation', validate(confirmPaymentSchema), customerController.submitPaymentConfirmation);
router.post('/orders/:id/reorder', customerController.reorder);

// Products
router.get('/products', customerController.getProducts);
router.get('/products/search', customerController.searchProducts);
router.get('/products/featured', customerController.getFeaturedProducts);
router.get('/products/:id', customerController.getProductById);

// Categories
router.get('/categories', customerController.getCategories);

// Shop Settings
router.get('/shop-settings', customerController.getShopSettings);

// Notifications
router.get('/notifications', customerController.getNotifications);
router.put('/notifications/read', customerController.markNotificationsRead);
router.get('/notifications/unread-count', customerController.getUnreadNotificationCount);

export default router;