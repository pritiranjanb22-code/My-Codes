import { formatDistanceToNow, format, parseISO, isValid, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { COLORS, CURRENCY_SYMBOL } from '@/constants';

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  if (currency === 'INR') {
    return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const formatNumber = (num: number): string => {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Unknown';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
};

export const formatDate = (dateString: string, pattern = 'MMM d, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, pattern);
  } catch {
    return 'Invalid date';
  }
};

export const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid time';
    return format(date, 'h:mm a');
  } catch {
    return 'Invalid time';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Invalid date';
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid date';
  }
};

export const getTimeAgo = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return 'Unknown';
  }
};

export const calculateSplit = (
  amount: number,
  participantCount: number,
  splitType: 'equal' | 'exact' | 'percentage' | 'shares' | 'custom',
  customValues?: number[]
): number[] => {
  switch (splitType) {
    case 'equal':
      const equalShare = Math.round((amount / participantCount) * 100) / 100;
      const remainder = Math.round((amount - equalShare * participantCount) * 100) / 100;
      const shares = Array(participantCount).fill(equalShare);
      if (remainder !== 0) {
        shares[0] = Math.round((shares[0] + remainder) * 100) / 100;
      }
      return shares;
    case 'exact':
    case 'percentage':
    case 'shares':
    case 'custom':
      return customValues || Array(participantCount).fill(0);
    default:
      return Array(participantCount).fill(0);
  }
};

export const optimizeSettlements = (balances: { userId: string; user: any; balance: number }[]) => {
  const creditors = balances.filter((b) => b.balance > 0).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < 0).sort((a, b) => a.balance - b.balance);

  const settlements: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(amount * 100) / 100,
    });

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  return settlements;
};

export const generateTripCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const getCategoryColor = (category: string): string => {
  const categoryColors: Record<string, string> = {
    fuel: '#FF6B35',
    toll: '#4ECDC4',
    food: '#45B7D1',
    hotel: '#96CEB4',
    parking: '#FFEAA7',
    tickets: '#DDA0DD',
    shopping: '#98D8C8',
    vehicle_repair: '#F7DC6F',
    water: '#85C1E9',
    snacks: '#F8B500',
    other: '#BDC3C7',
  };
  return categoryColors[category] || COLORS.textMuted;
};

export const getCategoryIcon = (category: string): string => {
  const categoryIcons: Record<string, string> = {
    fuel: '⛽',
    toll: '🛣',
    food: '🍔',
    hotel: '🏨',
    parking: '🅿',
    tickets: '🎟',
    shopping: '🛒',
    vehicle_repair: '🔧',
    water: '💧',
    snacks: '☕',
    other: '📦',
  };
  return categoryIcons[category] || '📦';
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const parseQueryString = (query: string): Record<string, string> => {
  const params: Record<string, string> = {};
  query.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
};

export const buildQueryString = (params: Record<string, any>): string => {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
};