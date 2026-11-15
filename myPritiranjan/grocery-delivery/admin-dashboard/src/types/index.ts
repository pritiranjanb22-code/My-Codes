export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin' | 'delivery_person';
  phone: string;
  avatar?: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  customerEmail?: string;
}

export interface Customer {
  id: string;
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  addresses?: Address[];
}

export interface DeliveryPerson {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  phone: string;
  vehicleType: string | null;
  vehicleNumber: string | null;
  isAvailable: boolean;
  totalDeliveries: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPersonId: string;
  status: 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered';
  assignedAt: string;
  pickedUpAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  deliveryNotes: string | null;
  deliveryOtp: string | null;
  customerSignatureUrl: string | null;
  order?: Order;
  deliveryPerson?: DeliveryPerson;
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

export interface DashboardStats {
  today: {
    ordersCount: number;
    sales: number;
    pendingPayments: number;
  };
  thisMonth: {
    ordersCount: number;
    sales: number;
    salesGrowth: number;
  };
  lastMonth: {
    ordersCount: number;
    sales: number;
  };
  inventory: {
    outOfStock: number;
    lowStock: number;
    inStock: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    quantitySold: number;
  }>;
  recentOrders: Order[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
}