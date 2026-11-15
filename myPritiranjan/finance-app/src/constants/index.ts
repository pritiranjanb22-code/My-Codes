import { Category, PaymentMode, RecurringFrequency } from '@/types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#FF6B6B', isDefault: true, isTaxDeductible: false },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#4ECDC4', isDefault: true, isTaxDeductible: false },
  { name: 'Utilities', type: 'expense', icon: 'bolt', color: '#FFD93D', isDefault: true, isTaxDeductible: false },
  { name: 'Rent', type: 'expense', icon: 'home', color: '#6BCB77', isDefault: true, isTaxDeductible: false },
  { name: 'Health & Medical', type: 'expense', icon: 'heart-pulse', color: '#FF6B9D', isDefault: true, isTaxDeductible: true, taxSection: '80D' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#A8D0E6', isDefault: true, isTaxDeductible: false },
  { name: 'Investments', type: 'expense', icon: 'trending-up', color: '#9B59B6', isDefault: true, isTaxDeductible: true, taxSection: '80C' },
  { name: 'EMI / Loans', type: 'expense', icon: 'credit-card', color: '#E74C3C', isDefault: true, isTaxDeductible: false },
  { name: 'Insurance', type: 'expense', icon: 'shield', color: '#3498DB', isDefault: true, isTaxDeductible: true, taxSection: '80C' },
  { name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#F39C12', isDefault: true, isTaxDeductible: true, taxSection: '80C' },
  { name: 'Entertainment', type: 'expense', icon: 'film', color: '#E67E22', isDefault: true, isTaxDeductible: false },
  { name: 'Personal Care', type: 'expense', icon: 'sparkles', color: '#FF9FF3', isDefault: true, isTaxDeductible: false },
  { name: 'Gifts & Donations', type: 'expense', icon: 'gift', color: '#FD79A8', isDefault: true, isTaxDeductible: false },
  { name: 'Travel', type: 'expense', icon: 'plane', color: '#00CEC9', isDefault: true, isTaxDeductible: false },
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#2ECC71', isDefault: true, isTaxDeductible: false },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#27AE60', isDefault: true, isTaxDeductible: false },
  { name: 'Investments Returns', type: 'income', icon: 'trending-up', color: '#16A085', isDefault: true, isTaxDeductible: false },
  { name: 'Gifts Received', type: 'income', icon: 'gift', color: '#8E44AD', isDefault: true, isTaxDeductible: false },
  { name: 'Refunds', type: 'income', icon: 'rotate-ccw', color: '#2980B9', isDefault: true, isTaxDeductible: false },
  { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#7F8C8D', isDefault: true, isTaxDeductible: false },
];

export const PAYMENT_MODES: { value: PaymentMode; label: string; icon: string }[] = [
  { value: 'cash', label: 'Cash', icon: 'banknote' },
  { value: 'upi', label: 'UPI', icon: 'smartphone' },
  { value: 'card', label: 'Card', icon: 'credit-card' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: 'building-2' },
];

export const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', icon: 'building-2', color: '#3498DB' },
  { value: 'cash', label: 'Cash', icon: 'banknote', color: '#27AE60' },
  { value: 'credit_card', label: 'Credit Card', icon: 'credit-card', color: '#E74C3C' },
  { value: 'wallet', label: 'Digital Wallet', icon: 'smartphone', color: '#9B59B6' },
  { value: 'investment', label: 'Investment', icon: 'trending-up', color: '#F39C12' },
];

export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const DATE_FORMAT = 'dd MMM yyyy';
export const DATETIME_FORMAT = 'dd MMM yyyy, HH:mm';

export const TAX_SECTIONS = [
  { value: '80C', label: 'Section 80C (Investments, Insurance, ELSS, PPF)' },
  { value: '80D', label: 'Section 80D (Health Insurance Premiums)' },
  { value: '80CCD', label: 'Section 80CCD (NPS Contributions)' },
  { value: 'other', label: 'Other' },
];

export const BUDGET_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#FF6B9D',
  '#A8D0E6', '#9B59B6', '#E74C3C', '#3498DB', '#F39C12',
  '#E67E22', '#FF9FF3', '#FD79A8', '#00CEC9', '#2ECC71',
];