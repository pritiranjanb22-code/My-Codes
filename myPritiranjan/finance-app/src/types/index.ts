export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'wallet' | 'investment';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId?: string;
  isDefault: boolean;
  isTaxDeductible: boolean;
  taxSection?: '80C' | '80D' | '80CCD' | 'other';
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  note: string;
  paymentMode: PaymentMode;
  date: number;
  recurringId?: string;
  isRecurring: boolean;
  transferToAccountId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RecurringTransaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  note: string;
  paymentMode: PaymentMode;
  frequency: RecurringFrequency;
  startDate: number;
  endDate?: number;
  nextDueDate: number;
  isActive: boolean;
  reminderDaysBefore: number;
  transferToAccountId?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  accountId?: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
  startDate: number;
  endDate: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  biometricEnabled: boolean;
  pinEnabled: boolean;
  pinHash?: string;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: number;
  defaultAccountId?: string;
  weekStartsOn: 0 | 1 | 6;
}