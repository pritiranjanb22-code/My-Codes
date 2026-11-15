import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, EXPENSE_CATEGORIES, SETTLEMENT_STATUS, PAYMENT_METHODS } from '@/constants';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, getCategoryIcon, getCategoryColor, optimizeSettlements } from '@/utils/helpers';

type Props = RootStackScreenProps<'Expenses'>;

export default function ExpensesScreen({ navigation }: Props) {
  const {
    currentTrip,
    expenses,
    settlements,
    wallet,
    budget,
    getTotalExpenses,
    getUserBalance,
    getOptimizedSettlements,
    expenses: allExpenses,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSettlements, setShowSettlements] = useState(false);

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="cash" size={64} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyText}>Select a trip to view expenses</Text>
        </View>
      </View>
    );
  }

  const totalExpenses = getTotalExpenses();
  const userBalance = getUserBalance(useAppStore.getState().user?.id || '');
  const optimizedSettlements = getOptimizedSettlements();
  const categoryTotals = calculateCategoryTotals(expenses);

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter((e) => e.category === selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon="cash"
          color="#45B7D1"
          trend={"+12% from yesterday"}
        />
        <SummaryCard
          title="You Paid"
          value={formatCurrency(calculateUserPaid())}
          icon="arrow-up"
          color="#2ECC71"
          trend={userBalance >= 0 ? "You're owed money" : "You owe money"}
        />
        <SummaryCard
          title={userBalance >= 0 ? 'You Get' : 'You Owe'}
          value={formatCurrency(Math.abs(userBalance))}
          icon={userBalance >= 0 ? 'arrow-down' : 'arrow-up'}
          color={userBalance >= 0 ? '#2ECC71' : '#E74C3C'}
          trend={optimizedSettlements.length > 0 ? `${optimizedSettlements.length} settlements pending` : 'All settled'}
        />
        {wallet && (
          <SummaryCard
            title="Trip Wallet"
            value={formatCurrency(wallet.remaining)}
            icon="wallet"
            color="#9B59B6"
            trend={`${wallet.spent > 0 ? formatCurrency(wallet.spent) : '—'} spent of ${formatCurrency(wallet.totalContributed)}`
          />
        )}
      </View>

      {/* Budget Progress */}
      {budget && (
        <BudgetProgressCard budget={budget} spent={totalExpenses} />
      )}

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <Text style={styles.filterTitle}>Categories</Text>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip label="All" selected={selectedCategory === 'all'} onPress={() => setSelectedCategory('all')} />
          {EXPENSE_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              color={cat.color}
              selected={selectedCategory === cat.id}
              onPress={() => setSelectedCategory(cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Expenses List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenses ({filteredExpenses.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddExpense')}>
            <Button title="Add" variant="ghost" size="sm" onPress={() => navigation.navigate('AddExpense')} />
          </TouchableOpacity>
        </View>
        {filteredExpenses.length === 0 ? (
          <Card style={styles.emptyExpenses} variant="outlined">
            <CardContent>
              <View style={styles.emptyExpensesContent}>
                <Ionicons name="receipt" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyExpensesTitle}>No Expenses</Text>
                <Text style={styles.emptyExpensesText}>
                  {selectedCategory === 'all' ? 'Start adding expenses for this trip' : `No ${EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()} expenses yet`}
                </Text>
                <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense')} size="sm" style={{ marginTop: SPACING.md }} />
              </View>
            </CardContent>
          </Card>
        ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ExpenseItem expense={item} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })} />}
            ListEmptyComponent={() => null}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Settlements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Settlements</Text>
          <TouchableOpacity onPress={() => setShowSettlements(!showSettlements)}>
            <Text style={styles.sectionAction}>{showSettlements ? 'Hide' : 'Show'} All</Text>
          </TouchableOpacity>
        </View>
        {optimizedSettlements.length > 0 && (
          <Card style={styles.settlementsCard} variant="elevated">
            <CardContent>
              <Text style={styles.settlementsTitle}>Optimized Settlements</Text>
              <Text style={styles.settlementsSubtitle}>Minimum transactions to settle all debts</Text>
              {showSettlements && (
                <View style={styles.settlementsList}>
                  {optimizedSettlements.map((s, i) => (
                    <SettlementRow key={`${s.fromUserId}-${s.toUserId}-${i}`} settlement={s} />
                  ))}
                </View>
              )}
              {!showSettlements && (
                <Text style={styles.settlementsPreview}>
                  {optimizedSettlements.length} transaction{optimizedSettlements.length > 1 ? 's' : ''} needed. Tap to view.
                </Text>
              )}
            </CardContent>
          </Card>
        )}
        {settlements.length > 0 && (
          <View style={styles.settlementsHistory}>
            <Text style={styles.settlementsHistoryTitle}>Recent Settlements</Text>
            <FlatList
              data={settlements.slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SettlementHistoryItem settlement={item} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.categoryBreakdown}>
          {Object.entries(categoryTotals).map(([category, amount]) => (
            <CategoryBreakdownItem
              key={category}
              category={category}
              amount={amount}
              total={totalExpenses}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function calculateCategoryTotals(expenses: any[]) {
  const totals: Record<string, number> = {};
  expenses.forEach((e) => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

function calculateUserPaid(): number {
  const userId = useAppStore.getState().user?.id;
  if (!userId) return 0;
  return useAppStore.getState().expenses
    .filter((e) => e.paidBy === userId)
    .reduce((sum, e) => sum + e.amount, 0);
}

const SummaryCard = ({ title, value, icon, color, trend }: any) => (
  <Card style={styles.summaryCard} variant="elevated">
    <CardContent>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.summaryValue}>{value}</Text>
          <Text style={styles.summaryTitle}>{title}</Text>
          <Text style={styles.summaryTrend}>{trend}</Text>
        </View>
      </View>
    </CardContent>
  </Card>
);

const BudgetProgressCard = ({ budget, spent }: any) => {
  const percentage = Math.min((spent / budget.totalBudget) * 100, 100);
  const isOver = spent > budget.totalBudget;
  return (
    <Card style={styles.budgetCard} variant="elevated">
      <CardContent>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetTitle}>Trip Budget</Text>
          <Text style={[styles.budgetAmount, { color: isOver ? COLORS.error : COLORS.text }]}>
            {formatCurrency(spent)} / {formatCurrency(budget.totalBudget)}
          </Text>
        </View>
        <View style={styles.budgetProgress}>
          <View style={styles.budgetBar}>
            <View
              style={[
                styles.budgetFill,
                { width: `${percentage}%`, backgroundColor: isOver ? COLORS.error : COLORS.accent },
              ]}
            />
          </View>
          <Text style={[styles.budgetPercentage, { color: isOver ? COLORS.error : COLORS.text }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
        {budget.perPersonBudget && (
          <Text style={styles.budgetPerPerson}>
            Per person: {formatCurrency(budget.perPersonBudget)}
          </Text>
        )}
      </CardContent>
    </Card>
  );
};

const FilterChip = ({ label, icon, color, selected, onPress }: any) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {icon && <Text style={[styles.filterChipIcon, { color: selected ? COLORS.white : color }]}>{icon}</Text>}
    <Text style={[styles.filterChipLabel, { color: selected ? COLORS.white : COLORS.text }]}>{label}</Text>
  </TouchableOpacity>
);

const ExpenseItem = ({ expense, onPress }: any) => (
  <Card style={styles.expenseItem} variant="default" onPress={onPress}>
    <CardContent>
      <View style={styles.expenseItemRow}>
        <View style={[styles.expenseCategoryIcon, { backgroundColor: `${getCategoryColor(expense.category)}20` }]}>
          <Text style={styles.expenseCategoryIconText}>{getCategoryIcon(expense.category)}</Text>
        </View>
        <View style={styles.expenseItemInfo}>
          <Text style={styles.expenseItemDescription}>{expense.description}</Text>
          <View style={styles.expenseItemMeta}>
            <Text style={styles.expenseItemCategory}>
              <Ionicons name="pricetag" size={12} color={COLORS.textMuted} />
              {EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.label}
            </Text>
            <Text style={styles.expenseItemSplit}>
              <Ionicons name="people" size={12} color={COLORS.textMuted} />
              {expense.participants.length} people
            </Text>
            <Text style={styles.expenseItemTime}>
              <Ionicons name="time" size={12} color={COLORS.textMuted} />
              {formatRelativeTime(expense.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.expenseItemRight}>
          <Text style={styles.expenseItemAmount}>{formatCurrency(expense.amount)}</Text>
          <Text style={styles.expenseItemPaidBy}>Paid by {expense.paidByUser?.name}</Text>
        </View>
      </View>
    </CardContent>
  </Card>
);

const SettlementRow = ({ settlement }: any) => (
  <View style={styles.settlementRow}>
    <View style={styles.settlementFrom}>
      <Avatar name={settlement.fromUser.name} size="sm" />
      <Text style={styles.settlementFromName}>{settlement.fromUser.name}</Text>
    </View>
    <Ionicons name="arrow-forward" size={20} color={COLORS.textMuted} />
    <View style={styles.settlementTo}>
      <Avatar name={settlement.toUser.name} size="sm" />
      <Text style={styles.settlementToName}>{settlement.toUser.name}</Text>
    </View>
    <Text style={styles.settlementAmount}>{formatCurrency(settlement.amount)}</Text>
    <View style={[styles.settlementStatus, { backgroundColor: getStatusColor(settlement.status) }]}>
      <Text style={styles.settlementStatusText}>{settlement.status}</Text>
    </View>
  </View>
);

const SettlementHistoryItem = ({ settlement }: any) => (
  <View style={styles.settlementHistoryItem}>
    <View style={styles.settlementHistoryInfo}>
      <Text style={styles.settlementHistoryNames}>
        {settlement.fromUser.name} → {settlement.toUser.name}
      </Text>
      <Text style={styles.settlementHistoryMeta}>
        {formatCurrency(settlement.amount)} • {formatRelativeTime(settlement.createdAt)} • {settlement.paymentMethod}
      </Text>
    </View>
    <View style={[styles.settlementHistoryStatus, { backgroundColor: getStatusColor(settlement.status) }]}>
      <Text style={styles.settlementHistoryStatusText}>{settlement.status}</Text>
    </View>
  </View>
);

const CategoryBreakdownItem = ({ category, amount, total, onPress }: any) => {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const cat = EXPENSE_CATEGORIES.find(c => c.id === category);
  return (
    <TouchableOpacity style={styles.categoryBreakdownItem} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.categoryBreakdownHeader}>
        <View style={styles.categoryBreakdownIcon}>
          <Text style={styles.categoryBreakdownIconText}>{cat?.icon || '📦'}</Text>
        </View>
        <View style={styles.categoryBreakdownInfo}>
          <Text style={styles.categoryBreakdownLabel}>{cat?.label || category}</Text>
          <View style={styles.categoryBreakdownBar}>
            <View
              style={[
                styles.categoryBreakdownFill,
                { width: `${percentage}%`, backgroundColor: cat?.color || COLORS.textMuted },
              ]}
            />
          </View>
        </View>
      </View>
      <View style={styles.categoryBreakdownValues}>
        <Text style={styles.categoryBreakdownAmount}>{formatCurrency(amount)}</Text>
        <Text style={styles.categoryBreakdownPercentage}>{percentage.toFixed(1)}%</Text>
      </View>
    </TouchableOpacity>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#2ECC71';
    case 'pending': return '#F39C12';
    case 'cancelled': return '#E74C3C';
    default: return COLORS.textMuted;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
    width: '100%',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  summaryGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryTrend: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  budgetCard: {
    marginBottom: SPACING.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  budgetTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  budgetAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  budgetBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    minWidth: 40,
    textAlign: 'right',
  },
  budgetPerPerson: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  categoryFilter: {
    marginBottom: SPACING.lg,
  },
  filterTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipIcon: {
    fontSize: 14,
  },
  filterChipLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  sectionAction: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
  },
  emptyExpenses: {
    padding: SPACING.xl,
  },
  emptyExpensesContent: {
    alignItems: 'center',
  },
  emptyExpensesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyExpensesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  expenseItem: {},
  expenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  expenseCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseCategoryIconText: {
    fontSize: 18,
  },
  expenseItemInfo: {
    flex: 1,
  },
  expenseItemDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  expenseItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  expenseItemCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  expenseItemSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  expenseItemTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  expenseItemRight: {
    alignItems: 'flex-end',
  },
  expenseItemAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  expenseItemPaidBy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settlementsCard: {
    marginBottom: SPACING.lg,
  },
  settlementsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settlementsSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  settlementsList: {
    gap: SPACING.sm,
  },
  settlementsPreview: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  settlementFrom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  settlementFromName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  settlementTo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  settlementToName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  settlementAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accent,
    marginHorizontal: SPACING.md,
  },
  settlementStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  settlementStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  settlementsHistory: {
    marginTop: SPACING.lg,
  },
  settlementsHistoryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  settlementHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settlementHistoryInfo: {
    flex: 1,
  },
  settlementHistoryNames: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  settlementHistoryMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settlementHistoryStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  settlementHistoryStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  categoryBreakdown: {
    gap: SPACING.md,
  },
  categoryBreakdownItem: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryBreakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBreakdownIconText: {
    fontSize: 16,
  },
  categoryBreakdownInfo: {
    flex: 1,
  },
  categoryBreakdownLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryBreakdownBar: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBreakdownFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryBreakdownValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBreakdownAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  categoryBreakdownPercentage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});