import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { 
  updateOrderStatusSchema, verifyPaymentSchema, createProductSchema, updateProductSchema,
  createCategorySchema, updateCategorySchema, createOfferSchema, updateOfferSchema,
  assignDeliverySchema, updateDeliveryStatusSchema, updateShopSettingsSchema,
  productQuerySchema, paginationSchema, idParamSchema 
} from '../validators/index.js';
import { uploadSingle, upload, uploadFile, uploadMultipleFiles } from '../controllers/adminController.js';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Orders
router.get('/orders', adminController.getAllOrders);
router.get('/orders/pending-payments', adminController.getPendingPayments);
router.get('/orders/:id', validate(idParamSchema), adminController.getOrderById);
router.put('/orders/:id/status', validate(updateOrderStatusSchema), adminController.updateOrderStatus);
router.post('/orders/:id/verify-payment', validate(verifyPaymentSchema), adminController.verifyPayment);
router.post('/orders/:id/cancel', adminController.cancelOrder);

// Products
router.get('/products', validate(productQuerySchema), adminController.getProducts);
router.get('/products/low-stock', adminController.getLowStockProducts);
router.get('/products/:id', validate(idParamSchema), adminController.getProductById);
router.post('/products', uploadSingle('image'), validate(createProductSchema), adminController.createProduct);
router.put('/products/:id', uploadSingle('image'), validate(updateProductSchema), adminController.updateProduct);
router.delete('/products/:id', validate(idParamSchema), adminController.deleteProduct);
router.post('/products/:id/stock', adminController.updateProductStock);

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', validate(createCategorySchema), adminController.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), adminController.updateCategory);
router.delete('/categories/:id', validate(idParamSchema), adminController.deleteCategory);

// Customers
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', validate(idParamSchema), adminController.getCustomerById);
router.get('/customers/:id/orders', adminController.getCustomerOrders);

// Delivery
router.get('/delivery/persons', adminController.getDeliveryPersons);
router.post('/delivery/persons', adminController.createDeliveryPerson);
router.put('/delivery/persons/:id', adminController.updateDeliveryPerson);
router.get('/delivery/assignments', adminController.getDeliveryAssignments);
router.post('/delivery/assign', validate(assignDeliverySchema), adminController.assignDelivery);
router.get('/delivery/stats', adminController.getDeliveryStats);

// Shop Settings
router.get('/settings', adminController.getShopSettings);
router.get('/settings/public', adminController.getPublicShopSettings);
router.put('/settings', validate(updateShopSettingsSchema), adminController.updateShopSettings);
router.get('/settings/upi', adminController.getUpiDetails);
router.put('/settings/upi', adminController.updateUpiDetails);

// Reports
router.get('/reports/sales', adminController.getSalesReport);
router.get('/reports/product-sales', adminController.getProductSalesReport);
router.get('/reports/customers', adminController.getCustomerStats);
router.get('/reports/top-customers', adminController.getTopCustomers);
router.get('/reports/inventory', adminController.getInventoryReport);
router.get('/reports/delivery', adminController.getDeliveryReport);
router.get('/reports/export/sales', adminController.exportSalesCsv);

// Notifications
router.post('/notifications', adminController.sendNotification);
router.post('/notifications/bulk', adminController.sendBulkNotification);

// Offers
router.get('/offers', adminController.getOffers);
router.post('/offers', validate(createOfferSchema), adminController.createOffer);
router.put('/offers/:id', validate(updateOfferSchema), adminController.updateOffer);
router.delete('/offers/:id', validate(idParamSchema), adminController.deleteOffer);

// File Upload
router.post('/upload', uploadSingle('file'), adminController.uploadFile);
router.post('/upload/multiple', upload.array('files', 10), adminController.uploadMultipleFiles);

export default router;