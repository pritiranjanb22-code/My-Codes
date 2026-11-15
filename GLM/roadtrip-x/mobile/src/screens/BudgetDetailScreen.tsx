import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, BUDGET_ALERT_THRESHOLDS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatPercentage } from '@/utils/helpers';

type Props = RootStackScreenProps<'BudgetDetail'>;

export default function BudgetDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { currentTrip, trips, budget, expenses, members, updateBudget } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find(t => t.id === tripId);
  const tripBudget = budget;
  const tripExpenses = expenses;
  const tripMembers = members;

  if (!trip || !tripBudget) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No budget set for this trip</Text></View>;
  }

  const totalSpent = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = tripBudget.totalBudget - totalSpent;
  const percentage = tripBudget.totalBudget > 0 ? (totalSpent / tripBudget.totalBudget) * 100 : 0;
  const isOver = totalSpent > tripBudget.totalBudget;
  const isWarning = percentage >= BUDGET_ALERT_THRESHOLDS.warning * 100;
  const isCritical = percentage >= BUDGET_ALERT_THRESHOLDS.critical * 100;

  const perPersonSpent = tripMembers.length > 0 ? totalSpent / tripMembers.length : 0;
  const perPersonBudget = tripBudget.perPersonBudget || tripBudget.totalBudget / tripMembers.length;
  const perPersonRemaining = perPersonBudget - perPersonSpent;

  // Forecast
  const completedStops = useAppStore.getState().itinerary.filter(s => s.isCompleted).length;
  const totalStops = useAppStore.getState().itinerary.length;
  const progress = totalStops > 0 ? completedStops / totalStops : 0;
  const forecastTotal = progress > 0 ? totalSpent / progress : totalSpent;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Budget</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="create" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Main Budget Card */}
      <Card style={styles.mainCard} variant="elevated">
        <CardContent>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetStatus}>
              <View style={[styles.statusRing, { borderColor: isOver ? COLORS.error : isCritical ? COLORS.warning : COLORS.success }]}>
                <Text style={[styles.statusPercentage, { color: isOver ? COLORS.error : isCritical ? COLORS.warning : COLORS.success }]}>
                  {Math.round(percentage)}%
                </Text>
              </View>
              <View style={styles.statusLabels}>
                <Text style={styles.statusLabel}>Spent</Text>
                <Text style={styles.statusValue}>{formatCurrency(totalSpent)}</Text>
              </View>
            </View>
            <View style={styles.budgetAmounts}>
              <BudgetAmount label="Budget" value={formatCurrency(tripBudget.totalBudget)} color={COLORS.text} />
              <BudgetAmount label="Remaining" value={formatCurrency(Math.max(0, remaining))} color={isOver ? COLORS.error : COLORS.success} />
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(percentage, 100)}%`, backgroundColor: isOver ? COLORS.error : isCritical ? COLORS.warning : COLORS.accent },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>0%</Text>
              <Text style={[styles.progressLabel, { color: COLORS.warning }]}>{Math.round(BUDGET_ALERT_THRESHOLDS.warning * 100)}%</Text>
              <Text style={[styles.progressLabel, { color: COLORS.error }]}>100%</Text>
            </View>
          </View>

          {isOver && (
            <View style={styles.alertBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.alertText}>Over budget by {formatCurrency(Math.abs(remaining))}!</Text>
            </View>
          )}
          {isWarning && !isOver && (
            <View style={[styles.alertBanner, { backgroundColor: '#F39C1220' }]}>
              <Ionicons name="warning" size={18} color={COLORS.warning} />
              <Text style={[styles.alertText, { color: COLORS.warning }]}>Approaching budget limit ({Math.round(percentage)}%)</Text>
            </View>
          )}

          {tripBudget.perPersonBudget && (
            <View style={styles.perPersonSection}>
              <Text style={styles.perPersonTitle}>Per Person Budget</Text>
              <View style={styles.perPersonGrid}>
                <BudgetAmount label="Per Person Budget" value={formatCurrency(perPersonBudget)} color={COLORS.text} />
                <BudgetAmount label="Per Person Spent" value={formatCurrency(perPersonSpent)} color={perPersonSpent > perPersonBudget ? COLORS.error : COLORS.text} />
                <BudgetAmount label="Per Person Left" value={formatCurrency(Math.max(0, perPersonRemaining))} color={perPersonRemaining < 0 ? COLORS.error : COLORS.success} />
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Forecast */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Forecast</Text>
        <Card style={styles.forecastCard} variant="elevated">
          <CardContent>
            <View style={styles.forecastRow}>
              <ForecastItem
                label="Current Spending"
                value={formatCurrency(totalSpent)}
                icon="cash"
                color="#45B7D1"
              />
              <ForecastItem
                label="Estimated Final"
                value={formatCurrency(forecastTotal)}
                icon="trending-up"
                color={forecastTotal > tripBudget.totalBudget ? COLORS.error : COLORS.success}
              />
              <ForecastItem
                label="Budget"
                value={formatCurrency(tripBudget.totalBudget)}
                icon="flag"
                color="#9B59B6"
              />
            </View>
            <View style={styles.forecastStatus}>
              <View style={[styles.forecastStatusDot, { backgroundColor: forecastTotal > tripBudget.totalBudget ? COLORS.error : COLORS.success }]} />
              <Text style={styles.forecastStatusText}>
                {forecastTotal > tripBudget.totalBudget ? '⚠ Likely to exceed budget' : '✓ Within budget'}
              </Text>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <Card style={styles.categoryCard} variant="elevated">
          <CardContent>
            {getCategoryBreakdown(tripExpenses).map((item, index) => (
              <CategoryBudgetRow key={index} {...item} total={totalSpent} budget={tripBudget.totalBudget} />
            ))}
          </CardContent>
        </Card>
      </View>

      {/* Member Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Member</Text>
        <Card style={styles.memberCard} variant="elevated">
          <CardContent>
            {tripMembers.map(member => {
              const memberPaid = tripExpenses.filter(e => e.paidBy === member.userId).reduce((sum, e) => sum + e.amount, 0);
              const memberShare = tripExpenses.reduce((sum, e) => {
                const p = e.participants.find(p => p.userId === member.userId);
                return sum + (p?.amount || 0);
              }, 0);
              return (
                <MemberBudgetRow key={member.userId} member={member} paid={memberPaid} share={memberShare} />
              );
            })}
          </CardContent>
        </Card>
      </View>

      {/* Budget Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Settings</Text>
        <Card style={styles.settingsCard} variant="elevated">
          <CardContent>
            <SettingsRow
              icon="cash"
              title="Total Budget"
              subtitle={formatCurrency(tripBudget.totalBudget)}
              onPress={() => {}}
            />
            <Divider />
            <SettingsRow
              icon="people"
              title="Per Person Budget"
              subtitle={tripBudget.perPersonBudget ? formatCurrency(tripBudget.perPersonBudget) : 'Auto-calculated'}
              onPress={() => {}}
            />
            <Divider />
            <SettingsRow
              icon="warning"
              title="Alert Threshold"
              subtitle={`${Math.round(tripBudget.alertThreshold * 100)}%`}
              onPress={() => {}}
            />
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

function getCategoryBreakdown(expenses: any[]) {
  const breakdown: Record<string, number> = {};
  expenses.forEach(e => {
    breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
  });
  return Object.entries(breakdown).map(([category, amount]) => ({ category, amount }));
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

const BudgetAmount = ({ label, value, color }: any) => (
  <View style={styles.budgetAmountItem}>
    <Text style={styles.budgetAmountLabel}>{label}</Text>
    <Text style={[styles.budgetAmountValue, { color }]}>{value}</Text>
  </View>
);

const ForecastItem = ({ label, value, icon, color }: any) => (
  <View style={styles.forecastItem}>
    <View style={[styles.forecastIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={styles.forecastLabel}>{label}</Text>
      <Text style={[styles.forecastValue, { color }]}>{value}</Text>
    </View>
  </View>
);

const CategoryBudgetRow = ({ category, amount, total, budget }: any) => {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const budgetPercentage = budget > 0 ? (amount / budget) * 100 : 0;
  const cat = require('@/constants').EXPENSE_CATEGORIES.find((c: any) => c.id === category);
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryLeft}>
        <View style={[styles.categoryIcon, { backgroundColor: `${cat?.color}20` }]}>
          <Text style={styles.categoryIconText}>{cat?.icon}</Text>
        </View>
        <Text style={styles.categoryName}>{cat?.label || category}</Text>
      </View>
      <View style={styles.categoryRight}>
        <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
        <View style={styles.categoryProgress}>
          <View style={styles.categoryProgressBar}>
            <View style={[styles.categoryProgressFill, { width: `${budgetPercentage}%`, backgroundColor: cat?.color }]} />
          </View>
          <Text style={styles.categoryPercentage}>{budgetPercentage.toFixed(1)}% of budget</Text>
        </View>
      </View>
    </View>
  );
};

const MemberBudgetRow = ({ member, paid, share }: any) => (
  <View style={styles.memberBudgetRow}>
    <View style={styles.memberBudgetLeft}>
      <Avatar name={member.user.name} size="sm" />
      <View>
        <Text style={styles.memberBudgetName}>{member.user.name}</Text>
        <Text style={styles.memberBudgetRole}>{member.role}</Text>
      </View>
    </View>
    <View style={styles.memberBudgetRight}>
      <View style={styles.memberBudgetItem}>
        <Text style={styles.memberBudgetItemLabel}>Paid</Text>
        <Text style={styles.memberBudgetItemValue}>{formatCurrency(paid)}</Text>
      </View>
      <View style={styles.memberBudgetItem}>
        <Text style={styles.memberBudgetItemLabel}>Share</Text>
        <Text style={styles.memberBudgetItemValue}>{formatCurrency(share)}</Text>
      </View>
      <View style={styles.memberBudgetItem}>
        <Text style={styles.memberBudgetItemLabel}>Balance</Text>
        <Text style={[styles.memberBudgetItemValue, { color: paid - share >= 0 ? COLORS.success : COLORS.error }]}>
          {formatCurrency(paid - share)}
        </Text>
      </View>
    </View>
  </View>
);

const SettingsRow = ({ icon, title, subtitle, onPress }: any) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.settingsIcon, { backgroundColor: `${COLORS.accent}20` }]}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
    </View>
    <View style={styles.settingsText}>
      <Text style={styles.settingsTitle}>{title}</Text>
      <Text style={styles.settingsSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

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
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  mainCard: {
    marginBottom: SPACING.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  budgetStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPercentage: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statusLabels: {},
  statusLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  budgetAmounts: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  budgetAmountItem: {
    alignItems: 'flex-end',
  },
  budgetAmountLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetAmountValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  progressBarContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#E74C3C20',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  alertText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  perPersonSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  perPersonTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  perPersonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  forecastCard: {},
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  forecastLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  forecastValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  forecastStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
  },
  forecastStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  forecastStatusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  categoryCard: {},
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  categoryRight: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  categoryAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  categoryProgress: {
    alignItems: 'flex-end',
  },
  categoryProgressBar: {
    width: 100,
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercentage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  memberCard: {},
  memberBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  memberBudgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  memberBudgetName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  memberBudgetRole: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  memberBudgetRight: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  memberBudgetItem: {
    alignItems: 'flex-end',
  },
  memberBudgetItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberBudgetItemValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingsCard: {},
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingsSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});