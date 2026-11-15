export const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  secondary: '#FF9800',
  secondaryLight: '#FFB74D',
  secondaryDark: '#F57C00',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#9E9E9E',
  border: '#E0E0E0',
  error: '#D32F2F',
  errorLight: '#FFCDD2',
  success: '#388E3C',
  successLight: '#C8E6C9',
  warning: '#F57C00',
  warningLight: '#FFE0B2',
  info: '#1976D2',
  infoLight: '#BBDEFB',
  disabled: '#BDBDBD',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_pending: 'Payment Pending',
  payment_verification_pending: 'Payment Verification Pending',
  confirmed: 'Order Confirmed',
  preparing: 'Preparing',
  ready_for_delivery: 'Ready for Delivery',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  payment_pending: COLORS.warning,
  payment_verification_pending: COLORS.info,
  confirmed: COLORS.primary,
  preparing: COLORS.info,
  ready_for_delivery: COLORS.primary,
  out_for_delivery: COLORS.secondary,
  delivered: COLORS.success,
  cancelled: COLORS.error,
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  verification_pending: 'Under Verification',
  paid: 'Paid',
  rejected: 'Rejected',
  refunded: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  verification_pending: COLORS.info,
  paid: COLORS.success,
  rejected: COLORS.error,
  refunded: COLORS.info,
};

export const STOCK_STATUS_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export const STOCK_STATUS_COLORS: Record<string, string> = {
  in_stock: COLORS.success,
  low_stock: COLORS.warning,
  out_of_stock: COLORS.error,
};

export const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'packet', 'bottle', 'can', 'box', 'dozen'];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry', 'Ladakh'
];

export const CATEGORIES = [
  { name: 'Rice & Grains', icon: '🌾', color: '#8D6E63' },
  { name: 'Dal & Pulses', icon: '🫘', color: '#D84315' },
  { name: 'Flour', icon: '🌾', color: '#F9A825' },
  { name: 'Oil & Ghee', icon: '🫒', color: '#F57F17' },
  { name: 'Spices', icon: '🌶️', color: '#D84315' },
  { name: 'Biscuits', icon: '🍪', color: '#6D4C41' },
  { name: 'Snacks', icon: '🍿', color: '#FF9800' },
  { name: 'Beverages', icon: '🥤', color: '#0288D1' },
  { name: 'Dairy', icon: '🥛', color: '#1976D2' },
  { name: 'Bread', icon: '🍞', color: '#8D6E63' },
  { name: 'Fruits', icon: '🍎', color: '#E53935' },
  { name: 'Vegetables', icon: '🥕', color: '#43A047' },
  { name: 'Personal Care', icon: '🧴', color: '#7B1FA2' },
  { name: 'Household Items', icon: '🏠', color: '#5D4037' },
  { name: 'Cleaning Products', icon: '🧽', color: '#0288D1' },
];

export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.0.2.2:3000/api/v1' : 'https://api.yourdomain.com/api/v1',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CART: 'cart',
  RECENT_SEARCHES: 'recent_searches',
  FCM_TOKEN: 'fcm_token',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

export const REGEX = {
  PHONE: /^[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PINCODE: /^\d{6}$/,
  OTP: /^\d{6}$/,
  UTR: /^[A-Za-z0-9]{12,}$/,
};

export const DELAYS = {
  DEBOUNCE: 300,
  TOAST_DURATION: 3000,
  ANIMATION: 300,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const ORDER_STATUS_FLOW = [
  'payment_pending',
  'payment_verification_pending',
  'confirmed',
  'preparing',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
];

export const DELIVERY_STATUSES = [
  'picked_up',
  'out_for_delivery',
  'delivered',
];