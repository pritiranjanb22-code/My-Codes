import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatCompactCurrency, formatDate, getMonthStart, getMonthEnd, calculateBudgetProgress, getBudgetStatus } from '@/utils/helpers';
import { CURRENCY_SYMBOL, CHART_COLORS } from '@/constants';
import { VictoryPie, VictoryChart, VictoryTheme, VictoryBar, VictoryAxis, VictoryLine, VictoryLabel, VictoryScatter } from 'victory-native';

type DashboardNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const { accounts, transactions, budgets, categories, refreshAll } = useFinanceStore();
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number }[]>([]);

  const now = new Date();
  const monthStart = getMonthStart(now);
  const monthEnd = getMonthEnd(now);

  const monthlyIncome = transactions
    .filter((t) => t.type === 'income' && t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const netFlow = monthlyIncome - monthlyExpense;

  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense' && t.date >= monthStart && t.date <= monthEnd)
    .reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([categoryId, amount], index) => {
      const category = categories.find((c) => c.id === categoryId);
      return { categoryId, amount, category, color: CHART_COLORS[index % CHART_COLORS.length] };
    });

  const activeBudgets = budgets.filter((b) => b.isActive && b.startDate <= now.getTime() && b.endDate >= now.getTime());
  const budgetAlerts = activeBudgets
    .map((b) => {
      const category = categories.find((c) => c.id === b.categoryId);
      const status = getBudgetStatus(b.spent, b.amount, b.alertThreshold);
      return { budget: b, category, status, progress: calculateBudgetProgress(b.spent, b.amount) };
    })
    .filter((b) => b.status !== 'safe')
    .sort((a, b) => (b.status === 'exceeded' ? 1 : 0) - (a.status === 'exceeded' ? 1 : 0));

  const recentTransactions = transactions.slice(0, 5);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  useEffect(() => {
    // Load monthly trend data
    // This would come from the database
  }, []);

  const getCategoryIcon = (iconName: string) => <Ionicons name={iconName} size={20} />;

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A1A2E']} />}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}</Text>
          <Text style={styles.monthLabel}>{formatDate(now, 'MMMM yyyy')}</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={[styles.balanceAmount, { color: totalBalance >= 0 ? '#2ECC71' : '#E74C3C' }]}>
            {formatCurrency(totalBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-down-circle" size={24} color="#2ECC71" />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={styles.summaryAmountIncome}>{formatCompactCurrency(monthlyIncome)}</Text>
          </View>
        </Card>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="arrow-up-circle" size={24} color="#E74C3C" />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={styles.summaryAmountExpense}>{formatCompactCurrency(monthlyExpense)}</Text>
          </View>
        </Card>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <Ionicons name="trending-up" size={24} color={netFlow >= 0 ? '#2ECC71' : '#E74C3C'} />
          </View>
          <View>
            <Text style={styles.summaryLabel}>Net Flow</Text>
            <Text style={[styles.summaryAmount, { color: netFlow >= 0 ? '#2ECC71' : '#E74C3C' }]}>
              {formatCompactCurrency(netFlow)}
            </Text>
          </View>
        </Card>
      </View>

      {budgetAlerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Alerts</Text>
          </View>
          <View style={styles.budgetAlerts}>
            {budgetAlerts.slice(0, 3).map(({ budget, category, status, progress }) => (
              <Card key={budget.id} style={styles.budgetAlertCard}>
                <View style={styles.budgetAlertHeader}>
                  <View style={styles.budgetAlertInfo}>
                    <View style={{ backgroundColor: category?.color + '20', borderRadius: 8, padding: 8 }}>
                      <Ionicons name={category?.icon || 'help'} size={18} color={category?.color || '#666'} />
                    </View>
                    <View>
                      <Text style={styles.budgetAlertCategory}>{category?.name}</Text>
                      <Text style={styles.budgetAlertStatus}>
                        {status === 'exceeded' ? 'Over budget' : 'Near limit'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.budgetAlertAmount, { color: status === 'exceeded' ? '#E74C3C' : '#F39C12' }]}>
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: status === 'exceeded' ? '#E74C3C' : '#F39C12',
                      }}
                    />
                  </View>
                  <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {topCategories.length > 0 ? (
          <Card>
            <View style={styles.categoryList}>
              {topCategories.map(({ category, amount, color }, index) => (
                <TouchableOpacity
                  key={category?.id || index}
                  style={styles.categoryItem}
                  onPress={() => navigation.navigate('Transactions', { filters: { categoryId: category?.id } })}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={category?.icon || 'help'} size={20} color={color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category?.name}</Text>
                    <Text style={styles.categoryPercent}>
                      {monthlyExpense > 0 ? ((amount / monthlyExpense) * 100).toFixed(1) : 0}%
                    </Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No expenses this month</Text>
            <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Accounts')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.accountList}>
          {accounts.filter((a) => a.isActive).map((account) => (
            <TouchableOpacity
              key={account.id}
              style={styles.accountItem}
              onPress={() => navigation.navigate('AccountManager', { accountId: account.id })}
            >
              <View style={[styles.accountIcon, { backgroundColor: account.color + '20' }]}>
                <Ionicons name={account.icon} size={22} color={account.color} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>{account.type.replace('_', ' ')}</Text>
              </View>
              <Text style={[styles.accountBalance, { color: account.balance >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                {formatCurrency(account.balance)}
              </Text>
            </TouchableOpacity>
          ))}
          {accounts.filter((a) => a.isActive).length === 0 && (
            <Card style={styles.emptyState}>
              <Ionicons name="card-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No accounts yet</Text>
              <Text style={styles.emptySubtext}>Add an account to start tracking</Text>
            </Card>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length > 0 ? (
          <Card>
            <View style={styles.transactionList}>
              {recentTransactions.map((txn) => {
                const category = categories.find((c) => c.id === txn.categoryId);
                const account = accounts.find((a) => a.id === txn.accountId);
                const isIncome = txn.type === 'income';
                return (
                  <TouchableOpacity
                    key={txn.id}
                    style={styles.transactionItem}
                    onPress={() => navigation.navigate('AddTransaction', { transactionId: txn.id })}
                  >
                    <View style={[styles.transactionIcon, { backgroundColor: category?.color + '20' }]}>
                      <Ionicons name={category?.icon || 'help'} size={20} color={category?.color || '#666'} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{category?.name || 'Unknown'}</Text>
                      <Text style={styles.transactionMeta}>
                        {account?.name} • {formatDate(txn.date, 'dd MMM • HH:mm')}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: isIncome ? '#2ECC71' : '#E74C3C' },
                      ]}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(txn.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first transaction</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 14, color: '#888' },
  monthLabel: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginTop: 2 },
  balanceCard: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 13, color: '#888' },
  balanceAmount: { fontSize: 28, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  summaryIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryAmountIncome: { fontSize: 16, fontWeight: '600', color: '#2ECC71' },
  summaryAmountExpense: { fontSize: 16, fontWeight: '600', color: '#E74C3C' },
  summaryAmount: { fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  seeAll: { fontSize: 14, color: '#6C63FF', fontWeight: '500' },
  budgetAlerts: { gap: 12 },
  budgetAlertCard: { padding: 16 },
  budgetAlertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  budgetAlertInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetAlertCategory: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  budgetAlertStatus: { fontSize: 12, color: '#888' },
  budgetAlertAmount: { fontSize: 15, fontWeight: '600' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPercent: { fontSize: 12, fontWeight: '600', color: '#666', width: 40 },
  categoryList: { gap: 12 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, gap: 2 },
  categoryName: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  categoryPercent: { fontSize: 12, color: '#888' },
  categoryAmount: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  accountList: { gap: 8 },
  accountItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  accountIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, gap: 2 },
  accountName: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  accountType: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  accountBalance: { fontSize: 15, fontWeight: '600' },
  transactionList: { gap: 8 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  transactionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  transactionMeta: { fontSize: 12, color: '#888' },
  transactionAmount: { fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#666' },
  emptySubtext: { fontSize: 13, color: '#999' },
});