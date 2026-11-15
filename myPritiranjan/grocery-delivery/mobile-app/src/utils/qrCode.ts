import { format } from 'date-fns';

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (currency === 'INR') {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return formatted.replace('INR', '').trim();
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)} K`;
  }
  return `₹${amount.toFixed(0)}`;
};

export const formatDate = (date: string | number | Date, pattern = 'dd MMM yyyy'): string => {
  return format(new Date(date), pattern);
};

export const formatDateTime = (date: string | number | Date): string => {
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

export const getMonthStart = (date = new Date()): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

export const getMonthEnd = (date = new Date()): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
};

export const getYearStart = (date = new Date()): number => {
  return new Date(date.getFullYear(), 0, 1).getTime();
};

export const getYearEnd = (date = new Date()): number => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
};

export const generateId = (prefix = ''): string => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const parseCurrencyInput = (value: string): number => {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const validatePhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode);
};

export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

export const maskPhone = (phone: string): string => {
  if (phone.length === 10) {
    return `${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return phone;
};

export const calculateDiscount = (mrp: number, sellingPrice: number): number => {
  if (mrp <= 0) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

export const calculateDeliveryCharge = (subtotal: number, freeThreshold: number, deliveryCharge: number): number => {
  return subtotal >= freeThreshold ? 0 : deliveryCharge;
};

export const calculateTax = (amount: number, taxPercentage: number): number => {
  return (amount * taxPercentage) / 100;
};

export const calculateOrderTotal = (subtotal: number, discount: number, deliveryCharge: number, tax: number): number => {
  return subtotal - discount + deliveryCharge + tax;
};

export const formatAddress = (address: any): string => {
  const parts = [
    address.houseNumber,
    address.street,
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean);
  return parts.join(', ');
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateUpiQrCode = async (upiId: string, amount: number, note: string = ''): Promise<string> => {
  const upiUrl = `upi://pay?pa=${upiId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || 'Grocery Order Payment')}`;
  
  try {
    // Use a QR code generation service or library
    // For now, return a placeholder - in production, use react-native-qrcode-svg or similar
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
    return qrApiUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
};

export const formatUpiUrl = (upiId: string, amount: number, note: string = ''): string => {
  return `upi://pay?pa=${upiId}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
};