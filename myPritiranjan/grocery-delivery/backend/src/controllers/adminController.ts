import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { customerService } from '../services/customerService.js';
import { orderService } from '../services/orderService.js';
import { deliveryService } from '../services/deliveryService.js';
import { productService } from '../services/productService.js';
import { reportService } from '../services/reportService.js';
import { shopSettingsService } from '../services/shopSettingsService.js';
import { notificationService } from '../services/notificationService.js';
import { 
  updateOrderStatusSchema, verifyPaymentSchema, createProductSchema, updateProductSchema,
  createCategorySchema, updateCategorySchema, createOfferSchema, updateOfferSchema,
  assignDeliverySchema, updateDeliveryStatusSchema, updateShopSettingsSchema,
  productQuerySchema, paginationSchema, idParamSchema 
} from '../validators/index.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { uploadSingle, upload } from '../utils/upload.js';

export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await reportService.getDashboardStats();
  return sendSuccess(res, stats);
});

export const getAllOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const filters = {
    status: req.query.status as string,
    paymentStatus: req.query.paymentStatus as string,
    customerId: req.query.customerId as string,
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    search: req.query.search as string,
  };
  
  const result = await orderService.getAllOrders(page, limit, filters);
  return sendPaginated(res, result.orders, result.page, result.limit, result.total);
});

export const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const order = await orderService.getOrderById(id);
  return sendSuccess(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateOrderStatusSchema.parse(req.body);
  const order = await orderService.updateOrderStatus(id, data.status, data.notes, req.user!.id);
  return sendSuccess(res, order);
});

export const getPendingPayments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await orderService.getAllOrders(page, limit, { paymentStatus: 'verification_pending' });
  return sendPaginated(res, result.orders, result.page, result.limit, result.total);
});

export const verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = verifyPaymentSchema.parse(req.body);
  const order = await orderService.verifyPayment(id, data.action, req.user!.id, data.rejectionReason);
  return sendSuccess(res, order);
});

export const cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const order = await orderService.updateOrderStatus(id, 'cancelled', req.body.reason || 'Cancelled by admin', req.user!.id);
  return sendSuccess(res, order);
});

export const getProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = productQuerySchema.parse(req.query);
  const result = await productService.getProducts(filters);
  return sendPaginated(res, result.products, result.page, result.limit, result.total);
});

export const getProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const product = await productService.getProductById(id);
  return sendSuccess(res, product);
});

export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const product = await productService.createProduct(data, imageUrl);
  return sendSuccess(res, product, 201);
});

export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateProductSchema.parse(req.body);
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const product = await productService.updateProduct(id, data, imageUrl);
  return sendSuccess(res, product);
});

export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await productService.deleteProduct(id);
  return sendSuccess(res, { success: true });
});

export const updateProductStock = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { quantityChange, notes } = req.body;
  
  if (quantityChange === undefined) {
    return sendError(res, 'Quantity change is required', 400, 'MISSING_QUANTITY');
  }
  
  const result = await productService.updateStock(id, quantityChange, 'adjustment', undefined, notes);
  return sendSuccess(res, result);
});

export const getLowStockProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const products = await productService.getLowStockProducts();
  return sendSuccess(res, products);
});

export const getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await productService.getCategories();
  return sendSuccess(res, categories);
});

export const createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createCategorySchema.parse(req.body);
  const category = await productService.createCategory(data);
  return sendSuccess(res, category, 201);
});

export const updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateCategorySchema.parse(req.body);
  const category = await productService.updateCategory(id, data);
  return sendSuccess(res, category);
});

export const deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await productService.deleteCategory(id);
  return sendSuccess(res, { success: true });
});

export const getCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  
  const result = await customerService.getCustomers(page, limit, search);
  return sendPaginated(res, result.customers, result.page, result.limit, result.total);
});

export const getCustomerById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const customer = await customerService.getCustomerById(id);
  return sendSuccess(res, customer);
});

export const getCustomerOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await customerService.getCustomerOrders(id, page, limit);
  return sendPaginated(res, result.orders, result.page, result.limit, result.total);
});

export const getCustomerAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const addresses = await customerService.getCustomerAddresses(id);
  return sendSuccess(res, addresses);
});

export const getDeliveryPersons = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const availableOnly = req.query.availableOnly === 'true';
  const persons = await deliveryService.getDeliveryPersons(availableOnly);
  return sendSuccess(res, persons);
});

export const createDeliveryPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, employeeId, vehicleType, vehicleNumber, licenseNumber } = req.body;
  const person = await deliveryService.createDeliveryPerson(userId, { employeeId, vehicleType, vehicleNumber, licenseNumber });
  return sendSuccess(res, person, 201);
});

export const updateDeliveryPerson = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = req.body;
  const person = await deliveryService.updateDeliveryPerson(id, data);
  return sendSuccess(res, person);
});

export const getDeliveryAssignments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await deliveryService.getDeliveryAssignments(page, limit);
  return sendPaginated(res, result.assignments, result.page, result.limit, result.total);
});

export const assignDelivery = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = assignDeliverySchema.parse(req.body);
  const result = await deliveryService.assignOrder(data);
  return sendSuccess(res, result, 201);
});

export const getDeliveryStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await deliveryService.getDeliveryStats();
  return sendSuccess(res, stats);
});

export const getShopSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const settings = await shopSettingsService.getSettings();
  return sendSuccess(res, settings);
});

export const getPublicShopSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const settings = await shopSettingsService.getPublicSettings();
  return sendSuccess(res, settings);
});

export const updateShopSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = updateShopSettingsSchema.parse(req.body);
  const settings = await shopSettingsService.updateSettings(data);
  return sendSuccess(res, settings);
});

export const getUpiDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const settings = await shopSettingsService.getUpiDetails();
  return sendSuccess(res, settings);
});

export const updateUpiDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { upiId, qrCodeUrl, instructions } = req.body;
  const settings = await shopSettingsService.updateUpiDetails(upiId, qrCodeUrl, instructions);
  return sendSuccess(res, settings);
});

export const getSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to, groupBy } = req.query;
  
  if (!from || !to) {
    return sendError(res, 'From and to dates are required', 400, 'MISSING_DATES');
  }
  
  const report = await reportService.getSalesReport({ from: from as string, to: to as string }, (groupBy as any) || 'day');
  return sendSuccess(res, report);
});

export const getProductSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to } = req.query;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!from || !to) {
    return sendError(res, 'From and to dates are required', 400, 'MISSING_DATES');
  }
  
  const report = await reportService.getProductSalesReport({ from: from as string, to: to as string }, limit);
  return sendSuccess(res, report);
});

export const getCustomerStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
    return sendError(res, 'From and to dates are required', 400, 'MISSING_DATES');
  }
  
  const stats = await reportService.getCustomerStats({ from: from as string, to: to as string });
  return sendSuccess(res, stats);
});

export const getTopCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const { from, to } = req.query;
  
  const customers = await reportService.getTopCustomers(limit, from && to ? { from: from as string, to: to as string } : undefined);
  return sendSuccess(res, customers);
});

export const getInventoryReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const report = await reportService.getInventoryReport();
  return sendSuccess(res, report);
});

export const getDeliveryReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
    return sendError(res, 'From and to dates are required', 400, 'MISSING_DATES');
  }
  
  const report = await reportService.getDeliveryReport({ from: from as string, to: to as string });
  return sendSuccess(res, report);
});

export const exportSalesCsv = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { from, to } = req.query;
  
  if (!from || !to) {
    return sendError(res, 'From and to dates are required', 400, 'MISSING_DATES');
  }
  
  const csv = await reportService.exportSalesToCsv({ from: from as string, to: to as string });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="sales-${from}-to-${to}.csv"`);
  return res.send(csv);
});

export const sendNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, title, message, type, data } = req.body;
  
  if (!userId || !title || !message || !type) {
    return sendError(res, 'userId, title, message, and type are required', 400, 'MISSING_FIELDS');
  }
  
  await notificationService.create({ userId, title, message, type, data });
  return sendSuccess(res, { success: true });
});

export const sendBulkNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userIds, title, message, type, data } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message || !type) {
    return sendError(res, 'userIds array, title, message, and type are required', 400, 'MISSING_FIELDS');
  }
  
  const notifications = userIds.map((userId: string) => ({
    userId, title, message, type, data,
  }));
  
  await notificationService.createBulk(notifications);
  return sendSuccess(res, { success: true, sent: userIds.length });
});

export const getOffers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // This would need a new method in a offersService
  return sendSuccess(res, []);
});

export const createOffer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = createOfferSchema.parse(req.body);
  // This would need a new method in a offersService
  return sendSuccess(res, { success: true }, 201);
});

export const updateOffer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateOfferSchema.parse(req.body);
  // This would need a new method in a offersService
  return sendSuccess(res, { success: true });
});

export const deleteOffer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  // This would need a new method in a offersService
  return sendSuccess(res, { success: true });
});

export const uploadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400, 'NO_FILE');
  }

  const folder = req.body.folder || 'uploads';
  const fileUrl = `/uploads/${req.file.filename}`;
  
  return sendSuccess(res, { 
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  }, 201);
});

export const uploadMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.files || req.files.length === 0) {
    return sendError(res, 'No files uploaded', 400, 'NO_FILES');
  }

  const folder = req.body.folder || 'uploads';
  const files = req.files.map(file => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));
  
  return sendSuccess(res, files, 201);
});

export { uploadSingle, upload };