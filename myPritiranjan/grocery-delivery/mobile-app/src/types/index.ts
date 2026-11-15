export interface User {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  role: 'customer' | 'admin' | 'delivery_person';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  productCount?: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  imagesUrls: string[];
  sellingPrice: number;
  mrpPrice: number | null;
  discountPercentage: number;
  unit: string;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  brand: string | null;
  barcode: string | null;
  category?: Category;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  mrpPrice: number | null;
  discountPercentage: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: 'pending' | 'verification_pending' | 'paid' | 'rejected' | 'refunded';
  upiId: string | null;
  upiTransactionId: string | null;
  upiTransactionAmount: number | null;
  upiTransactionDate: string | null;
  paymentScreenshotUrl: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  qrCode?: string;
  upiUrl?: string;
  instructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  addressId: string;
  status: 'payment_pending' | 'payment_verification_pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'verification_pending' | 'paid' | 'rejected' | 'refunded';
  subtotal: number;
  discountAmount: number;
  deliveryCharge: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  cancelledReason: string | null;
  cancelledAt: string | null;
  confirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  address?: Address;
  payment?: Payment;
  customerName?: string;
  customerPhone?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  data: Record<string, any> | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopOpeningHours: string;
  shopLogoUrl: string;
  deliveryRadiusKm: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  minOrderValue: number;
  upiId: string;
  upiQrCodeUrl: string;
  paymentInstructions: string;
  taxPercentage: number;
  maintenanceMode: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
  isFeatured?: boolean;
  inStock?: boolean;
}