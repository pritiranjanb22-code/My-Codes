import { z } from 'zod';

// Auth validators
export const sendOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  purpose: z.enum(['login', 'register', 'forgot_password']).default('login'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  purpose: z.enum(['login', 'register', 'forgot_password']).default('login'),
  name: z.string().min(2).max(100).optional(), // Required for registration
  email: z.string().email().optional(),
  fcmToken: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// Customer profile validators
export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  dateOfBirth: z.string().date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  fcmToken: z.string().optional(),
});

// Address validators
export const createAddressSchema = z.object({
  label: z.string().min(1).max(50).default('Home'),
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  houseNumber: z.string().min(1).max(100),
  street: z.string().min(1).max(255),
  area: z.string().min(1).max(255),
  landmark: z.string().max(255).optional().nullable(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

// Cart validators
export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive().min(0.01),
});

export const updateCartSchema = z.object({
  quantity: z.number().positive().min(0.01),
});

// Order validators
export const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
});

export const confirmPaymentSchema = z.object({
  utrNumber: z.string().min(1).max(100),
  paymentAmount: z.number().positive(),
  paymentDate: z.string().datetime(),
  paymentScreenshot: z.string().url().optional(),
});

// Product validators
export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sellingPrice: z.number().positive(),
  mrpPrice: z.number().positive().optional(),
  unit: z.string().min(1).max(50).default('kg'),
  minOrderQuantity: z.number().positive().min(0.01).default(1),
  maxOrderQuantity: z.number().positive().optional(),
  stockQuantity: z.number().min(0).default(0),
  lowStockThreshold: z.number().positive().default(10),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  brand: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(['name', 'price', 'created_at', 'popularity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  isFeatured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
});

// Category validators
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.number().int().default(0),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Order management validators
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'payment_pending',
    'payment_verification_pending',
    'confirmed',
    'preparing',
    'ready_for_delivery',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ]),
  notes: z.string().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

// Delivery validators
export const assignDeliverySchema = z.object({
  deliveryPersonId: z.string().uuid(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['picked_up', 'out_for_delivery', 'delivered']),
  deliveryOtp: z.string().regex(/^\d{6}$/).optional(),
  customerSignature: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

// Shop settings validators
export const updateShopSettingsSchema = z.object({
  shopName: z.string().min(1).max(255).optional(),
  shopPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  shopAddress: z.string().max(500).optional(),
  shopOpeningHours: z.string().max(50).optional(),
  shopLogoUrl: z.string().url().optional(),
  deliveryRadiusKm: z.number().positive().optional(),
  deliveryCharge: z.number().min(0).optional(),
  freeDeliveryThreshold: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  upiId: z.string().max(100).optional(),
  upiQrCodeUrl: z.string().url().optional(),
  paymentInstructions: z.string().max(1000).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  maintenanceMode: z.boolean().optional(),
});

// Offer validators
export const createOfferSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['percentage', 'flat', 'buy_x_get_y']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  applicableOn: z.enum(['all', 'category', 'product']).default('all'),
  categoryId: z.string().uuid().optional().nullable(),
  productIds: z.array(z.string().uuid()).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

// Pagination validator
export const paginationSchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

// ID param validator
export const idParamSchema = z.object({
  id: z.string().uuid(),
});