export type RootStackParamList = {
  Home: undefined;
  AddTransaction: { transactionId?: string; type?: 'income' | 'expense' | 'transfer' } | undefined;
  Transactions: { filters?: any } | undefined;
  Budgets: undefined;
  Reports: undefined;
  Accounts: undefined;
  Settings: undefined;
  CategoryManager: { type?: 'income' | 'expense' } | undefined;
  AccountManager: { accountId?: string } | undefined;
  BudgetManager: { budgetId?: string } | undefined;
  RecurringManager: { recurringId?: string } | undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Reports: undefined;
  Settings: undefined;
};