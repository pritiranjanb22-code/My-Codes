import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { customerService } from '../services/customerService.js';
import { addressService } from '../services/addressService.js';
import { cartService } from '../services/cartService.js';
import { orderService } from '../services/orderService.js';
import { productService } from '../services/productService.js';
import { shopSettingsService } from '../services/shopSettingsService.js';
import { 
  updateProfileSchema, createAddressSchema, updateAddressSchema, 
  addToCartSchema, updateCartSchema, createOrderSchema, confirmPaymentSchema,
  idParamSchema, productQuerySchema, paginationSchema 
} from '../validators/index.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { notificationService } from '../services/notificationService.js';

export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  return sendSuccess(res, profile);
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data = updateProfileSchema.parse(req.body);
  const profile = await customerService.updateProfile(req.user!.id, data);
  return sendSuccess(res, profile);
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return sendError(res, 'Current password and new password are required', 400, 'MISSING_FIELDS');
  }
  
  await customerService.changePassword(req.user!.id, currentPassword, newPassword);
  return sendSuccess(res, { message: 'Password changed successfully' });
});

export const getAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const addresses = await addressService.getAddresses(profile.id);
  return sendSuccess(res, addresses);
});

export const getDefaultAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const address = await addressService.getDefaultAddress(profile.id);
  return sendSuccess(res, address);
});

export const createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const data = createAddressSchema.parse(req.body);
  const address = await addressService.createAddress(profile.id, data);
  return sendSuccess(res, address, 201);
});

export const updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { id } = req.params;
  const data = updateAddressSchema.parse(req.body);
  const address = await addressService.updateAddress(id, profile.id, data);
  return sendSuccess(res, address);
});

export const deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { id } = req.params;
  await addressService.deleteAddress(id, profile.id);
  return sendSuccess(res, { success: true });
});

export const setDefaultAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { id } = req.params;
  await addressService.setDefaultAddress(id, profile.id);
  return sendSuccess(res, { success: true });
});

export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const cart = await cartService.getCart(profile.id);
  return sendSuccess(res, cart);
});

export const addToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const data = addToCartSchema.parse(req.body);
  const cart = await cartService.addToCart(profile.id, data);
  return sendSuccess(res, cart);
});

export const updateCartItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { productId } = req.params;
  const { quantity } = updateCartSchema.parse(req.body);
  const cart = await cartService.updateQuantity(profile.id, productId, quantity);
  return sendSuccess(res, cart);
});

export const removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { productId } = req.params;
  const cart = await cartService.removeFromCart(profile.id, productId);
  return sendSuccess(res, cart);
});

export const clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  await cartService.clearCart(profile.id);
  return sendSuccess(res, { success: true, items: [], subtotal: 0, itemCount: 0 });
});

export const validateCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const validation = await cartService.validateCart(profile.id);
  return sendSuccess(res, validation);
});

export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const data = createOrderSchema.parse(req.body);
  
  const cart = await cartService.getCart(profile.id);
  
  if (cart.items.length === 0) {
    return sendError(res, 'Cart is empty', 400, 'EMPTY_CART');
  }
  
  const items = cart.items.map(item => ({
    productId: item.productId || item.id,
    quantity: item.quantity,
  }));
  
  const order = await orderService.createOrder(
    { customerId: profile.id, addressId: data.addressId, notes: data.notes, couponCode: data.couponCode },
    items
  );
  
  return sendSuccess(res, order, 201);
});

export const getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  
  const result = await customerService.getOrderHistory(req.user!.id, page, limit, status);
  return sendPaginated(res, result.orders, result.page, result.limit, result.total);
});

export const getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { id } = req.params;
  const order = await orderService.getOrderById(id);
  
  if (order.customer_id !== profile.id) {
    return sendError(res, 'Order not found', 404, 'ORDER_NOT_FOUND');
  }
  
  return sendSuccess(res, order);
});

export const submitPaymentConfirmation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await customerService.getProfile(req.user!.id);
  const { id } = req.params;
  const data = confirmPaymentSchema.parse(req.body);
  
  const order = await orderService.submitPaymentConfirmation(id, profile.id, data.utrNumber, data.paymentAmount, data.paymentDate, data.paymentScreenshot);
  
  return sendSuccess(res, order);
});

export const reorder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await customerService.reorder(id, req.user!.id);
  return sendSuccess(res, { message: 'Items added to cart' });
});

export const getProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filters = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    categoryId: req.query.categoryId as string,
    search: req.query.search as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
    isFeatured: req.query.isFeatured === 'true',
    inStock: req.query.inStock === 'true',
  };
  
  const result = await productService.getProducts(filters);
  return sendPaginated(res, result.products, result.page, result.limit, result.total);
});

export const getProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const product = await productService.getProductById(id);
  return sendSuccess(res, product);
});

export const searchProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (!q) {
    return sendError(res, 'Search query required', 400, 'MISSING_QUERY');
  }
  
  const products = await productService.searchProducts(q as string, limit);
  return sendSuccess(res, products);
});

export const getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const categories = await productService.getCategories();
  return sendSuccess(res, categories);
});

export const getFeaturedProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const products = await productService.getFeaturedProducts(limit);
  return sendSuccess(res, products);
});

export const getShopSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const settings = await shopSettingsService.getPublicSettings();
  return sendSuccess(res, settings);
});

export const getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const unreadOnly = req.query.unreadOnly === 'true';
  
  const { notifications, ...meta } = await notificationService.getUserNotifications(req.user!.id, page, limit, unreadOnly);
  return sendPaginated(res, notifications, page, limit, meta.total);
});

export const markNotificationsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { notificationIds } = req.body;
  
  if (notificationIds && notificationIds.length > 0) {
    await notificationService.markAsRead(req.user!.id, notificationIds);
  } else {
    await notificationService.markAllAsRead(req.user!.id);
  }
  
  return sendSuccess(res, { success: true });
});

export const getUnreadNotificationCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(req.user!.id);
  return sendSuccess(res, { count });
});

import { notificationService } from '../services/notificationService.js';