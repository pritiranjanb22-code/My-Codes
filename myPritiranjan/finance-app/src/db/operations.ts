import { getDatabase, mapRowToAccount, mapRowToCategory, mapRowToTransaction, mapRowToRecurringTransaction, mapRowToBudget, mapRowToSettings } from './index';
import { Account, Category, Transaction, RecurringTransaction, Budget, Settings } from '@/types';

const db = getDatabase();

export const accountDb = {
  getAll: (): Account[] => {
    return db.getAllSync('SELECT * FROM accounts WHERE is_active = 1 ORDER BY created_at').map(mapRowToAccount);
  },

  getById: (id: string): Account | null => {
    const row = db.getFirstSync('SELECT * FROM accounts WHERE id = ?', id);
    return row ? mapRowToAccount(row) : null;
  },

  create: (account: Omit<Account, 'createdAt' | 'updatedAt'>): Account => {
    const now = Date.now();
    db.runSync(
      `INSERT INTO accounts (id, name, type, balance, currency, color, icon, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      account.id, account.name, account.type, account.balance, account.currency, account.color, account.icon, account.isActive ? 1 : 0, now, now
    );
    return { ...account, createdAt: now, updatedAt: now };
  },

  update: (id: string, updates: Partial<Account>): boolean => {
    const now = Date.now();
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.balance !== undefined) { fields.push('balance = ?'); values.push(updates.balance); }
    if (updates.currency !== undefined) { fields.push('currency = ?'); values.push(updates.currency); }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
    if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    const result = db.runSync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, ...values);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.runSync('UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?', Date.now(), id);
    return result.changes > 0;
  },

  adjustBalance: (id: string, amount: number): boolean => {
    const result = db.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?', amount, Date.now(), id);
    return result.changes > 0;
  },
};

export const categoryDb = {
  getAll: (type?: 'income' | 'expense'): Category[] => {
    const query = type 
      ? 'SELECT * FROM categories WHERE type = ? ORDER BY is_default DESC, name'
      : 'SELECT * FROM categories ORDER BY is_default DESC, name';
    const params = type ? [type] : [];
    return db.getAllSync(query, ...params).map(mapRowToCategory);
  },

  getById: (id: string): Category | null => {
    const row = db.getFirstSync('SELECT * FROM categories WHERE id = ?', id);
    return row ? mapRowToCategory(row) : null;
  },

  create: (category: Omit<Category, 'createdAt' | 'updatedAt'>): Category => {
    const now = Date.now();
    db.runSync(
      `INSERT INTO categories (id, name, type, icon, color, parent_id, is_default, is_tax_deductible, tax_section, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      category.id, category.name, category.type, category.icon, category.color, category.parentId,
      category.isDefault ? 1 : 0, category.isTaxDeductible ? 1 : 0, category.taxSection, now, now
    );
    return { ...category, createdAt: now, updatedAt: now };
  },

  update: (id: string, updates: Partial<Category>): boolean => {
    const now = Date.now();
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }
    if (updates.parentId !== undefined) { fields.push('parent_id = ?'); values.push(updates.parentId); }
    if (updates.isTaxDeductible !== undefined) { fields.push('is_tax_deductible = ?'); values.push(updates.isTaxDeductible ? 1 : 0); }
    if (updates.taxSection !== undefined) { fields.push('tax_section = ?'); values.push(updates.taxSection); }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    const result = db.runSync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, ...values);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.runSync('DELETE FROM categories WHERE id = ? AND is_default = 0', id);
    return result.changes > 0;
  },
};

export const transactionDb = {
  getAll: (filters?: { accountId?: string; categoryId?: string; type?: string; startDate?: number; endDate?: number; limit?: number; offset?: number }): Transaction[] => {
    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.accountId) { query += ' AND account_id = ?'; params.push(filters.accountId); }
    if (filters?.categoryId) { query += ' AND category_id = ?'; params.push(filters.categoryId); }
    if (filters?.type) { query += ' AND type = ?'; params.push(filters.type); }
    if (filters?.startDate) { query += ' AND date >= ?'; params.push(filters.startDate); }
    if (filters?.endDate) { query += ' AND date <= ?'; params.push(filters.endDate); }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
    if (filters?.offset) { query += ' OFFSET ?'; params.push(filters.offset); }
    
    return db.getAllSync(query, ...params).map(mapRowToTransaction);
  },

  getById: (id: string): Transaction | null => {
    const row = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', id);
    return row ? mapRowToTransaction(row) : null;
  },

  getRecent: (limit = 10): Transaction[] => {
    return db.getAllSync('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?', limit).map(mapRowToTransaction);
  },

  getTotalByType: (type: 'income' | 'expense', startDate?: number, endDate?: number, accountId?: string): number => {
    let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = ?';
    const params: any[] = [type];
    
    if (startDate) { query += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND date <= ?'; params.push(endDate); }
    if (accountId) { query += ' AND account_id = ?'; params.push(accountId); }
    
    const row = db.getFirstSync(query, ...params);
    return row?.total || 0;
  },

  getCategoryBreakdown: (type: 'income' | 'expense', startDate: number, endDate: number, accountId?: string): { categoryId: string; total: number; count: number }[] => {
    let query = `
      SELECT category_id, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM transactions 
      WHERE type = ? AND date >= ? AND date <= ?
    `;
    const params: any[] = [type, startDate, endDate];
    
    if (accountId) { query += ' AND account_id = ?'; params.push(accountId); }
    
    query += ' GROUP BY category_id ORDER BY total DESC';
    
    return db.getAllSync(query, ...params);
  },

  getMonthlyTrend: (months = 12): { month: string; income: number; expense: number }[] => {
    const query = `
      SELECT 
        strftime('%Y-%m', date/1000, 'unixepoch') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= datetime('now', '-' || ? || ' months')
      GROUP BY month
      ORDER BY month
    `;
    return db.getAllSync(query, months);
  },

  create: (transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>): Transaction => {
    const now = Date.now();
    db.runSync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, note, payment_mode, date, recurring_id, is_recurring, transfer_to_account_id, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      transaction.id, transaction.accountId, transaction.categoryId, transaction.type, transaction.amount,
      transaction.currency, transaction.note, transaction.paymentMode, transaction.date,
      transaction.recurringId, transaction.isRecurring ? 1 : 0, transaction.transferToAccountId,
      JSON.stringify(transaction.tags), now, now
    );
    return { ...transaction, createdAt: now, updatedAt: now };
  },

  update: (id: string, updates: Partial<Transaction>): boolean => {
    const now = Date.now();
    const fields = [];
    const values = [];
    
    if (updates.accountId !== undefined) { fields.push('account_id = ?'); values.push(updates.accountId); }
    if (updates.categoryId !== undefined) { fields.push('category_id = ?'); values.push(updates.categoryId); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.currency !== undefined) { fields.push('currency = ?'); values.push(updates.currency); }
    if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }
    if (updates.paymentMode !== undefined) { fields.push('payment_mode = ?'); values.push(updates.paymentMode); }
    if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
    if (updates.transferToAccountId !== undefined) { fields.push('transfer_to_account_id = ?'); values.push(updates.transferToAccountId); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    const result = db.runSync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, ...values);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.runSync('DELETE FROM transactions WHERE id = ?', id);
    return result.changes > 0;
  },

  getCount: (filters?: { accountId?: string; categoryId?: string; type?: string; startDate?: number; endDate?: number }): number => {
    let query = 'SELECT COUNT(*) as count FROM transactions WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.accountId) { query += ' AND account_id = ?'; params.push(filters.accountId); }
    if (filters?.categoryId) { query += ' AND category_id = ?'; params.push(filters.categoryId); }
    if (filters?.type) { query += ' AND type = ?'; params.push(filters.type); }
    if (filters?.startDate) { query += ' AND date >= ?'; params.push(filters.startDate); }
    if (filters?.endDate) { query += ' AND date <= ?'; params.push(filters.endDate); }
    
    const row = db.getFirstSync(query, ...params);
    return row?.count || 0;
  },
};

export const recurringTransactionDb = {
  getAll: (activeOnly = true): RecurringTransaction[] => {
    const query = activeOnly 
      ? 'SELECT * FROM recurring_transactions WHERE is_active = 1 ORDER BY next_due_date'
      : 'SELECT * FROM recurring_transactions ORDER BY next_due_date';
    return db.getAllSync(query).map(mapRowToRecurringTransaction);
  },

  getDue: (): RecurringTransaction[] => {
    const now = Date.now();
    return db.getAllSync(
      'SELECT * FROM recurring_transactions WHERE is_active = 1 AND next_due_date <= ? ORDER BY next_due_date',
      now
    ).map(mapRowToRecurringTransaction);
  },

  getById: (id: string): RecurringTransaction | null => {
    const row = db.getFirstSync('SELECT * FROM recurring_transactions WHERE id = ?', id);
    return row ? mapRowToRecurringTransaction(row) : null;
  },

  create: (rt: Omit<RecurringTransaction, 'createdAt' | 'updatedAt'>): RecurringTransaction => {
    const now = Date.now();
    db.runSync(
      `INSERT INTO recurring_transactions (id, account_id, category_id, type, amount, currency, note, payment_mode, frequency, start_date, end_date, next_due_date, is_active, reminder_days_before, transfer_to_account_id, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      rt.id, rt.accountId, rt.categoryId, rt.type, rt.amount, rt.currency, rt.note, rt.paymentMode,
      rt.frequency, rt.startDate, rt.endDate, rt.nextDueDate, rt.isActive ? 1 : 0,
      rt.reminderDaysBefore, rt.transferToAccountId, JSON.stringify(rt.tags), now, now
    );
    return { ...rt, createdAt: now, updatedAt: now };
  },

  update: (id: string, updates: Partial<RecurringTransaction>): boolean => {
    const now = Date.now();
    const fields = [];
    const values = [];
    
    if (updates.accountId !== undefined) { fields.push('account_id = ?'); values.push(updates.accountId); }
    if (updates.categoryId !== undefined) { fields.push('category_id = ?'); values.push(updates.categoryId); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }
    if (updates.paymentMode !== undefined) { fields.push('payment_mode = ?'); values.push(updates.paymentMode); }
    if (updates.frequency !== undefined) { fields.push('frequency = ?'); values.push(updates.frequency); }
    if (updates.startDate !== undefined) { fields.push('start_date = ?'); values.push(updates.startDate); }
    if (updates.endDate !== undefined) { fields.push('end_date = ?'); values.push(updates.endDate); }
    if (updates.nextDueDate !== undefined) { fields.push('next_due_date = ?'); values.push(updates.nextDueDate); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    if (updates.reminderDaysBefore !== undefined) { fields.push('reminder_days_before = ?'); values.push(updates.reminderDaysBefore); }
    if (updates.transferToAccountId !== undefined) { fields.push('transfer_to_account_id = ?'); values.push(updates.transferToAccountId); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    const result = db.runSync(`UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`, ...values);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.runSync('DELETE FROM recurring_transactions WHERE id = ?', id);
    return result.changes > 0;
  },
};

export const budgetDb = {
  getAll: (activeOnly = true): Budget[] => {
    const query = activeOnly 
      ? 'SELECT * FROM budgets WHERE is_active = 1 ORDER BY start_date'
      : 'SELECT * FROM budgets ORDER BY start_date';
    return db.getAllSync(query).map(mapRowToBudget);
  },

  getActiveForPeriod: (date: number): Budget[] => {
    return db.getAllSync(
      'SELECT * FROM budgets WHERE is_active = 1 AND start_date <= ? AND end_date >= ?',
      date, date
    ).map(mapRowToBudget);
  },

  getById: (id: string): Budget | null => {
    const row = db.getFirstSync('SELECT * FROM budgets WHERE id = ?', id);
    return row ? mapRowToBudget(row) : null;
  },

  getByCategoryAndPeriod: (categoryId: string, startDate: number, endDate: number): Budget | null => {
    const row = db.getFirstSync(
      'SELECT * FROM budgets WHERE category_id = ? AND start_date = ? AND end_date = ? AND is_active = 1',
      categoryId, startDate, endDate
    );
    return row ? mapRowToBudget(row) : null;
  },

  create: (budget: Omit<Budget, 'createdAt' | 'updatedAt'>): Budget => {
    const now = Date.now();
    db.runSync(
      `INSERT INTO budgets (id, category_id, account_id, amount, spent, period, start_date, end_date, alert_threshold, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      budget.id, budget.categoryId, budget.accountId, budget.amount, budget.spent, budget.period,
      budget.startDate, budget.endDate, budget.alertThreshold, budget.isActive ? 1 : 0, now, now
    );
    return { ...budget, createdAt: now, updatedAt: now };
  },

  update: (id: string, updates: Partial<Budget>): boolean => {
    const now = Date.now();
    const fields = [];
    const values = [];
    
    if (updates.categoryId !== undefined) { fields.push('category_id = ?'); values.push(updates.categoryId); }
    if (updates.accountId !== undefined) { fields.push('account_id = ?'); values.push(updates.accountId); }
    if (updates.amount !== undefined) { fields.push('amount = ?'); values.push(updates.amount); }
    if (updates.spent !== undefined) { fields.push('spent = ?'); values.push(updates.spent); }
    if (updates.period !== undefined) { fields.push('period = ?'); values.push(updates.period); }
    if (updates.startDate !== undefined) { fields.push('start_date = ?'); values.push(updates.startDate); }
    if (updates.endDate !== undefined) { fields.push('end_date = ?'); values.push(updates.endDate); }
    if (updates.alertThreshold !== undefined) { fields.push('alert_threshold = ?'); values.push(updates.alertThreshold); }
    if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }
    
    if (fields.length === 0) return false;
    
    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);
    
    const result = db.runSync(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`, ...values);
    return result.changes > 0;
  },

  updateSpent: (id: string, spent: number): boolean => {
    const result = db.runSync('UPDATE budgets SET spent = ?, updated_at = ? WHERE id = ?', spent, Date.now(), id);
    return result.changes > 0;
  },

  delete: (id: string): boolean => {
    const result = db.runSync('DELETE FROM budgets WHERE id = ?', id);
    return result.changes > 0;
  },
};

export const settingsDb = {
  getAll: (): Settings => {
    const rows = db.getAllSync('SELECT * FROM settings');
    return mapRowToSettings(rows);
  },

  get: <K extends keyof Settings>(key: K): Settings[K] | undefined => {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', key);
    if (!row) return undefined;
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value as Settings[K];
    }
  },

  set: <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', key, strValue);
  },
};