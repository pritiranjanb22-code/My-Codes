import * as SQLite from 'expo-sqlite';
import { Account, Category, Transaction, RecurringTransaction, Budget, Settings } from '@/types';

const DB_NAME = 'finance.db';

export const getDatabase = () => {
  return SQLite.openDatabaseSync(DB_NAME);
};

export const initDatabase = (db: SQLite.SQLiteDatabase) => {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      parent_id TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_tax_deductible INTEGER NOT NULL DEFAULT 0,
      tax_section TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      note TEXT,
      payment_mode TEXT NOT NULL,
      date INTEGER NOT NULL,
      recurring_id TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      transfer_to_account_id TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (transfer_to_account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      note TEXT,
      payment_mode TEXT NOT NULL,
      frequency TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER,
      next_due_date INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      reminder_days_before INTEGER NOT NULL DEFAULT 1,
      transfer_to_account_id TEXT,
      tags TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (transfer_to_account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      account_id TEXT,
      amount REAL NOT NULL,
      spent REAL NOT NULL DEFAULT 0,
      period TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      alert_threshold REAL NOT NULL DEFAULT 0.8,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category_id, date);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_transactions(next_due_date, is_active);
    CREATE INDEX IF NOT EXISTS idx_budgets_category_period ON budgets(category_id, start_date, end_date);
  `);
};

export const seedDefaultData = (db: SQLite.SQLiteDatabase) => {
  const now = Date.now();
  
  const existingCategories = db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM categories WHERE is_default = 1');
  if (existingCategories[0]?.count > 0) return;

  const defaultCategories = [
    { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#FF6B6B', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_transport', name: 'Transport', type: 'expense', icon: 'car', color: '#4ECDC4', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_utilities', name: 'Utilities', type: 'expense', icon: 'bolt', color: '#FFD93D', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_rent', name: 'Rent', type: 'expense', icon: 'home', color: '#6BCB77', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_health', name: 'Health & Medical', type: 'expense', icon: 'heart-pulse', color: '#FF6B9D', parent_id: null, is_default: 1, is_tax_deductible: 1, tax_section: '80D' },
    { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#A8D0E6', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_investments', name: 'Investments', type: 'expense', icon: 'trending-up', color: '#9B59B6', parent_id: null, is_default: 1, is_tax_deductible: 1, tax_section: '80C' },
    { id: 'cat_emi', name: 'EMI / Loans', type: 'expense', icon: 'credit-card', color: '#E74C3C', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_insurance', name: 'Insurance', type: 'expense', icon: 'shield', color: '#3498DB', parent_id: null, is_default: 1, is_tax_deductible: 1, tax_section: '80C' },
    { id: 'cat_education', name: 'Education', type: 'expense', icon: 'graduation-cap', color: '#F39C12', parent_id: null, is_default: 1, is_tax_deductible: 1, tax_section: '80C' },
    { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'film', color: '#E67E22', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_personal', name: 'Personal Care', type: 'expense', icon: 'sparkles', color: '#FF9FF3', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_gifts', name: 'Gifts & Donations', type: 'expense', icon: 'gift', color: '#FD79A8', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_travel', name: 'Travel', type: 'expense', icon: 'plane', color: '#00CEC9', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_salary', name: 'Salary', type: 'income', icon: 'briefcase', color: '#2ECC71', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_freelance', name: 'Freelance', type: 'income', icon: 'laptop', color: '#27AE60', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_inv_returns', name: 'Investment Returns', type: 'income', icon: 'trending-up', color: '#16A085', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_gifts_recv', name: 'Gifts Received', type: 'income', icon: 'gift', color: '#8E44AD', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_refunds', name: 'Refunds', type: 'income', icon: 'rotate-ccw', color: '#2980B9', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
    { id: 'cat_other_income', name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#7F8C8D', parent_id: null, is_default: 1, is_tax_deductible: 0, tax_section: null },
  ];

  const insertCategory = db.prepareSync(`
    INSERT INTO categories (id, name, type, icon, color, parent_id, is_default, is_tax_deductible, tax_section, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of defaultCategories) {
    insertCategory.runSync(cat.id, cat.name, cat.type, cat.icon, cat.color, cat.parent_id, cat.is_default, cat.is_tax_deductible, cat.tax_section, now, now);
  }

  const defaultAccounts = [
    { id: 'acc_cash', name: 'Cash', type: 'cash', balance: 0, currency: 'INR', color: '#27AE60', icon: 'banknote', is_active: 1 },
    { id: 'acc_bank', name: 'Primary Bank', type: 'bank', balance: 0, currency: 'INR', color: '#3498DB', icon: 'building-2', is_active: 1 },
  ];

  const insertAccount = db.prepareSync(`
    INSERT INTO accounts (id, name, type, balance, currency, color, icon, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const acc of defaultAccounts) {
    insertAccount.runSync(acc.id, acc.name, acc.type, acc.balance, acc.currency, acc.color, acc.icon, acc.is_active, now, now);
  }

  const defaultSettings = [
    { key: 'currency', value: 'INR' },
    { key: 'language', value: 'en' },
    { key: 'theme', value: 'system' },
    { key: 'biometricEnabled', value: 'false' },
    { key: 'pinEnabled', value: 'false' },
    { key: 'backupEnabled', value: 'false' },
    { key: 'backupFrequency', value: 'weekly' },
    { key: 'weekStartsOn', value: '0' },
  ];

  const insertSetting = db.prepareSync('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const setting of defaultSettings) {
    insertSetting.runSync(setting.key, setting.value);
  }
};

export const mapRowToAccount = (row: any): Account => ({
  id: row.id,
  name: row.name,
  type: row.type,
  balance: row.balance,
  currency: row.currency,
  color: row.color,
  icon: row.icon,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapRowToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  type: row.type,
  icon: row.icon,
  color: row.color,
  parentId: row.parent_id,
  isDefault: Boolean(row.is_default),
  isTaxDeductible: Boolean(row.is_tax_deductible),
  taxSection: row.tax_section,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapRowToTransaction = (row: any): Transaction => ({
  id: row.id,
  accountId: row.account_id,
  categoryId: row.category_id,
  type: row.type,
  amount: row.amount,
  currency: row.currency,
  note: row.note || '',
  paymentMode: row.payment_mode,
  date: row.date,
  recurringId: row.recurring_id,
  isRecurring: Boolean(row.is_recurring),
  transferToAccountId: row.transfer_to_account_id,
  tags: row.tags ? JSON.parse(row.tags) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapRowToRecurringTransaction = (row: any): RecurringTransaction => ({
  id: row.id,
  accountId: row.account_id,
  categoryId: row.category_id,
  type: row.type,
  amount: row.amount,
  currency: row.currency,
  note: row.note || '',
  paymentMode: row.payment_mode,
  frequency: row.frequency,
  startDate: row.start_date,
  endDate: row.end_date,
  nextDueDate: row.next_due_date,
  isActive: Boolean(row.is_active),
  reminderDaysBefore: row.reminder_days_before,
  transferToAccountId: row.transfer_to_account_id,
  tags: row.tags ? JSON.parse(row.tags) : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapRowToBudget = (row: any): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  accountId: row.account_id,
  amount: row.amount,
  spent: row.spent,
  period: row.period,
  startDate: row.start_date,
  endDate: row.end_date,
  alertThreshold: row.alert_threshold,
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapRowToSettings = (rows: { key: string; value: string }[]): Settings => {
  const settings: Partial<Settings> = {};
  for (const row of rows) {
    try {
      (settings as any)[row.key] = JSON.parse(row.value);
    } catch {
      (settings as any)[row.key] = row.value;
    }
  }
  return settings as Settings;
};