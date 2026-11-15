import { format } from 'date-fns';
import { CURRENCY_SYMBOL } from '@/constants';

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

export const formatDate = (date: number | Date, pattern = 'dd MMM yyyy'): string => {
  return format(typeof date === 'number' ? new Date(date) : date, pattern);
};

export const formatDateTime = (date: number | Date): string => {
  return format(typeof date === 'number' ? new Date(date) : date, 'dd MMM yyyy, HH:mm');
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

export const getCategorySuggestions = (note: string, categories: { id: string; name: string }[]): { id: string; name: string }[] => {
  const lowerNote = note.toLowerCase();
  const keywords: Record<string, string[]> = {
    'food': ['food', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast', 'swiggy', 'zomato', 'dominos', 'pizza', 'burger'],
    'transport': ['uber', 'ola', 'rapido', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'parking', 'auto'],
    'utilities': ['electricity', 'water', 'gas', 'broadband', 'wifi', 'internet', 'phone', 'recharge', 'bill'],
    'rent': ['rent', 'landlord', 'house rent', 'flat rent'],
    'health': ['medical', 'hospital', 'doctor', 'pharmacy', 'medicine', 'health', 'clinic', 'lab', 'test'],
    'shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping', 'mall', 'store', 'purchase'],
    'investments': ['mutual fund', 'sip', 'stock', 'equity', 'zerodha', 'groww', 'upstox', 'investment', 'elss', 'ppf'],
    'emi': ['emi', 'loan', 'instalment', 'installment', 'home loan', 'car loan', 'personal loan'],
    'insurance': ['insurance', 'premium', 'lic', 'policy', 'term plan', 'health insurance'],
    'salary': ['salary', 'wage', 'payroll', 'income', 'credited', 'neft', 'imps', 'rtgs'],
  };

  const matched = new Set<string>();
  for (const [category, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowerNote.includes(word)) {
        matched.add(category);
        break;
      }
    }
  }

  return categories
    .filter((c) => matched.has(c.name.toLowerCase().replace(/[^a-z]/g, '')))
    .slice(0, 3);
};

export const calculateBudgetProgress = (spent: number, budget: number): number => {
  if (budget <= 0) return 0;
  return Math.min(100, (spent / budget) * 100);
};

export const getBudgetStatus = (spent: number, budget: number, threshold = 0.8): 'safe' | 'warning' | 'exceeded' => {
  const ratio = budget > 0 ? spent / budget : 0;
  if (ratio >= 1) return 'exceeded';
  if (ratio >= threshold) return 'warning';
  return 'safe';
};

export const groupTransactionsByDate = (transactions: { date: number }[]): Record<string, typeof transactions> => {
  return transactions.reduce((groups, transaction) => {
    const dateKey = formatDate(transaction.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(transaction);
    return groups;
  }, {} as Record<string, typeof transactions>);
};

export const groupTransactionsByCategory = (transactions: { categoryId: string; amount: number }[]): Record<string, number> => {
  return transactions.reduce((groups, transaction) => {
    groups[transaction.categoryId] = (groups[transaction.categoryId] || 0) + transaction.amount;
    return groups;
  }, {} as Record<string, number>);
};