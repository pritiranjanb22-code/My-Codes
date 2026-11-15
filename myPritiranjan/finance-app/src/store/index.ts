import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Account, Category, Transaction, RecurringTransaction, Budget, Settings } from '@/types';
import { accountDb, categoryDb, transactionDb, recurringTransactionDb, budgetDb, settingsDb } from '@/db/operations';
import { initDatabase, seedDefaultData, getDatabase } from '@/db';

interface FinanceState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  budgets: Budget[];
  settings: Settings;
  isInitialized: boolean;
  isLoading: boolean;

  initialize: () => Promise<void>;
  refreshAll: () => Promise<void>;

  addAccount: (account: Omit<Account, 'createdAt' | 'updatedAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => boolean;
  deleteAccount: (id: string) => boolean;
  adjustAccountBalance: (id: string, amount: number) => boolean;

  addCategory: (category: Omit<Category, 'createdAt' | 'updatedAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => boolean;
  deleteCategory: (id: string) => boolean;

  addTransaction: (transaction: Omit<Transaction, 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => boolean;
  loadTransactions: (filters?: any) => Promise<void>;

  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'createdAt' | 'updatedAt'>) => RecurringTransaction;
  updateRecurringTransaction: (id: string, updates: Partial<RecurringTransaction>) => boolean;
  deleteRecurringTransaction: (id: string) => boolean;
  loadRecurringTransactions: () => Promise<void>;

  addBudget: (budget: Omit<Budget, 'createdAt' | 'updatedAt'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => boolean;
  deleteBudget: (id: string) => boolean;
  loadBudgets: () => Promise<void>;

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      accounts: [],
      categories: [],
      transactions: [],
      recurringTransactions: [],
      budgets: [],
      settings: {
        currency: 'INR',
        language: 'en',
        theme: 'system',
        biometricEnabled: false,
        pinEnabled: false,
        backupEnabled: false,
        backupFrequency: 'weekly',
        weekStartsOn: 0,
      },
      isInitialized: false,
      isLoading: false,

      initialize: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        try {
          const db = getDatabase();
          initDatabase(db);
          seedDefaultData(db);
          
          await get().refreshAll();
          set({ isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize database:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      refreshAll: async () => {
        set({
          accounts: accountDb.getAll(),
          categories: categoryDb.getAll(),
          transactions: transactionDb.getRecent(50),
          recurringTransactions: recurringTransactionDb.getAll(),
          budgets: budgetDb.getAll(),
          settings: settingsDb.getAll(),
        });
      },

      addAccount: (account) => {
        const newAccount = accountDb.create(account);
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
        return newAccount;
      },

      updateAccount: (id, updates) => {
        const success = accountDb.update(id, updates);
        if (success) {
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
          }));
        }
        return success;
      },

      deleteAccount: (id) => {
        const success = accountDb.delete(id);
        if (success) {
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== id),
          }));
        }
        return success;
      },

      adjustAccountBalance: (id, amount) => {
        const success = accountDb.adjustBalance(id, amount);
        if (success) {
          set((state) => ({
            accounts: state.accounts.map((a) =>
              a.id === id ? { ...a, balance: a.balance + amount } : a
            ),
          }));
        }
        return success;
      },

      addCategory: (category) => {
        const newCategory = categoryDb.create(category);
        set((state) => ({ categories: [...state.categories, newCategory] }));
        return newCategory;
      },

      updateCategory: (id, updates) => {
        const success = categoryDb.update(id, updates);
        if (success) {
          set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          }));
        }
        return success;
      },

      deleteCategory: (id) => {
        const success = categoryDb.delete(id);
        if (success) {
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
          }));
        }
        return success;
      },

      addTransaction: (transaction) => {
        const newTransaction = transactionDb.create(transaction);
        
        if (transaction.type === 'income' || transaction.type === 'expense') {
          get().adjustAccountBalance(transaction.accountId, transaction.type === 'income' ? transaction.amount : -transaction.amount);
        } else if (transaction.type === 'transfer' && transaction.transferToAccountId) {
          get().adjustAccountBalance(transaction.accountId, -transaction.amount);
          get().adjustAccountBalance(transaction.transferToAccountId, transaction.amount);
        }

        const budgets = budgetDb.getActiveForPeriod(transaction.date);
        for (const budget of budgets) {
          if (budget.categoryId === transaction.categoryId && transaction.type === 'expense') {
            budgetDb.updateSpent(budget.id, budget.spent + transaction.amount);
          }
        }

        set((state) => ({
          transactions: [newTransaction, ...state.transactions].slice(0, 100),
        }));
        return newTransaction;
      },

      updateTransaction: (id, updates) => {
        const oldTransaction = get().transactions.find((t) => t.id === id);
        const success = transactionDb.update(id, updates);
        
        if (success && oldTransaction) {
          const newTransaction = { ...oldTransaction, ...updates };
          
          if (oldTransaction.type === 'income' || oldTransaction.type === 'expense') {
            const oldAmount = oldTransaction.type === 'income' ? oldTransaction.amount : -oldTransaction.amount;
            const newAmount = (updates.type || oldTransaction.type) === 'income' 
              ? (updates.amount ?? oldTransaction.amount) 
              : -(updates.amount ?? oldTransaction.amount);
            get().adjustAccountBalance(oldTransaction.accountId, newAmount - oldAmount);
          } else if (oldTransaction.type === 'transfer' && oldTransaction.transferToAccountId) {
            get().adjustAccountBalance(oldTransaction.accountId, oldTransaction.amount);
            get().adjustAccountBalance(oldTransaction.transferToAccountId, -oldTransaction.amount);
            
            const newType = updates.type || oldTransaction.type;
            const newAmount = updates.amount ?? oldTransaction.amount;
            const newFromAccount = updates.accountId || oldTransaction.accountId;
            const newToAccount = updates.transferToAccountId ?? oldTransaction.transferToAccountId;
            
            if (newType === 'transfer' && newToAccount) {
              get().adjustAccountBalance(newFromAccount, -newAmount);
              get().adjustAccountBalance(newToAccount, newAmount);
            }
          }

          if (oldTransaction.type === 'expense') {
            const budgets = budgetDb.getActiveForPeriod(oldTransaction.date);
            for (const budget of budgets) {
              if (budget.categoryId === oldTransaction.categoryId) {
                budgetDb.updateSpent(budget.id, Math.max(0, budget.spent - oldTransaction.amount));
              }
            }
          }
          
          if ((updates.type || oldTransaction.type) === 'expense') {
            const newDate = updates.date ?? oldTransaction.date;
            const budgets = budgetDb.getActiveForPeriod(newDate);
            for (const budget of budgets) {
              if (budget.categoryId === (updates.categoryId || oldTransaction.categoryId)) {
                budgetDb.updateSpent(budget.id, budget.spent + (updates.amount ?? oldTransaction.amount));
              }
            }
          }

          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === id ? newTransaction : t)),
          }));
        }
        return success;
      },

      deleteTransaction: (id) => {
        const transaction = get().transactions.find((t) => t.id === id);
        const success = transactionDb.delete(id);
        
        if (success && transaction) {
          if (transaction.type === 'income' || transaction.type === 'expense') {
            get().adjustAccountBalance(transaction.accountId, transaction.type === 'income' ? -transaction.amount : transaction.amount);
          } else if (transaction.type === 'transfer' && transaction.transferToAccountId) {
            get().adjustAccountBalance(transaction.accountId, transaction.amount);
            get().adjustAccountBalance(transaction.transferToAccountId, -transaction.amount);
          }

          if (transaction.type === 'expense') {
            const budgets = budgetDb.getActiveForPeriod(transaction.date);
            for (const budget of budgets) {
              if (budget.categoryId === transaction.categoryId) {
                budgetDb.updateSpent(budget.id, Math.max(0, budget.spent - transaction.amount));
              }
            }
          }

          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }));
        }
        return success;
      },

      loadTransactions: async (filters) => {
        const transactions = transactionDb.getAll(filters);
        set({ transactions });
      },

      addRecurringTransaction: (rt) => {
        const newRt = recurringTransactionDb.create(rt);
        set((state) => ({ recurringTransactions: [...state.recurringTransactions, newRt] }));
        return newRt;
      },

      updateRecurringTransaction: (id, updates) => {
        const success = recurringTransactionDb.update(id, updates);
        if (success) {
          set((state) => ({
            recurringTransactions: state.recurringTransactions.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          }));
        }
        return success;
      },

      deleteRecurringTransaction: (id) => {
        const success = recurringTransactionDb.delete(id);
        if (success) {
          set((state) => ({
            recurringTransactions: state.recurringTransactions.filter((r) => r.id !== id),
          }));
        }
        return success;
      },

      loadRecurringTransactions: async () => {
        const rts = recurringTransactionDb.getAll();
        set({ recurringTransactions: rts });
      },

      addBudget: (budget) => {
        const newBudget = budgetDb.create(budget);
        set((state) => ({ budgets: [...state.budgets, newBudget] }));
        return newBudget;
      },

      updateBudget: (id, updates) => {
        const success = budgetDb.update(id, updates);
        if (success) {
          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
          }));
        }
        return success;
      },

      deleteBudget: (id) => {
        const success = budgetDb.delete(id);
        if (success) {
          set((state) => ({
            budgets: state.budgets.filter((b) => b.id !== id),
          }));
        }
        return success;
      },

      loadBudgets: async () => {
        const budgets = budgetDb.getAll();
        set({ budgets });
      },

      loadSettings: async () => {
        const settings = settingsDb.getAll();
        set({ settings });
      },

      updateSetting: (key, value) => {
        settingsDb.set(key, value);
        set((state) => ({ settings: { ...state.settings, [key]: value } }));
      },
    }),
    {
      name: 'finance-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const db = getDatabase();
          const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', name);
          return row?.value || null;
        },
        setItem: (name, value) => {
          const db = getDatabase();
          db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', name, value);
        },
        removeItem: (name) => {
          const db = getDatabase();
          db.runSync('DELETE FROM settings WHERE key = ?', name);
        },
      })),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);