import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, EXPENSE_CATEGORIES, PAYMENT_METHODS, SETTLEMENT_STATUS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatRelativeTime, getCategoryIcon, getCategoryColor } from '@/utils/helpers';

type Props = RootStackScreenProps<'ExpenseDetail'>;

export default function ExpenseDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { expenseId } = route.params;
  const { expenses, members, settlements, updateExpense, addSettlement } = useAppStore();

  const expense = expenses.find(e => e.id === expenseId);
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const isPaidByCurrentUser = expense?.paidBy === currentUser?.userId;

  if (!expense) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Expense not found</Text></View>;
  }

  const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
  const totalOwed = expense.participants.filter(p => p.userId !== expense.paidBy).reduce((sum, p) => sum + p.amount, 0);
  const paidCount = expense.participants.filter(p => p.isPaid).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { expenseId: expense.id })}>
          <Ionicons name="create" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Main Expense Card */}
      <Card style={styles.mainCard} variant="elevated">
        <CardContent>
          <View style={styles.mainHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: `${category?.color}20` }]}>
              <Text style={styles.categoryIcon}>{category?.icon}</Text>
            </View>
            <View style={styles.mainInfo}>
              <Text style={styles.mainAmount}>{formatCurrency(expense.amount)}</Text>
              <Text style={styles.mainCategory}>{category?.label}</Text>
            </View>
          </View>

          <Text style={styles.description}>{expense.description}</Text>

          <View style={styles.mainMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color={COLORS.textMuted} />
              <Text>Paid by {expense.paidByUser?.name}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={COLORS.textMuted} />
              <Text>{formatRelativeTime(expense.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={COLORS.textMuted} />
              <Text>{expense.participants.length} participants</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="swap" size={16} color={COLORS.textMuted} />
              <Text>{getSplitTypeLabel(expense.splitType)} split</Text>
            </View>
          </View>

          {expense.vehicleId && (
            <View style={styles.metaItem}>
              <Ionicons name="car" size={16} color={COLORS.textMuted} />
              <Text>Vehicle: {useAppStore.getState().vehicles.find(v => v.id === expense.vehicleId)?.name}</Text>
            </View>
          )}

          {expense.stopId && (
            <View style={styles.metaItem}>
              <Ionicons name="map-marker" size={16} color={COLORS.textMuted} />
              <Text>Stop: {useAppStore.getState().itinerary.find(s => s.id === expense.stopId)?.name}</Text>
            </View>
          )}

          {expense.receiptUrl && (
            <TouchableOpacity style={styles.receiptButton}>
              <Ionicons name="document" size={18} color={COLORS.accent} />
              <Text style={styles.receiptButtonText}>View Receipt</Text>
            </TouchableOpacity>
          )}
        </CardContent>
      </Card>

      {/* Participants & Settlement Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Participants ({paidCount}/{expense.participants.length} settled)</Text>
        <Card style={styles.participantsCard} variant="elevated">
          <CardContent>
            {expense.participants.map((participant, index) => (
              <ParticipantRow
                key={`${participant.userId}-${index}`}
                participant={participant}
                expense={expense}
                currentUserId={currentUser?.userId}
                onSettle={() => handleSettle(participant)}
              />
            ))}
          </CardContent>
        </Card>
      </View>

      {/* Settlement History */}
      const expenseSettlements = settlements.filter(s => 
        expense.participants.some(p => p.userId === s.fromUserId) && 
        expense.participants.some(p => p.userId === s.toUserId)
      );

      if (expenseSettlements.length > 0) {
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlement History</Text>
          <Card style={styles.settlementsCard} variant="elevated">
            <CardContent>
              {expenseSettlements.map((settlement, index) => (
                <SettlementRow key={`${settlement.id}-${index}`} settlement={settlement} />
              ))}
            </CardContent>
          </Card>
        </View>
      }

      {/* Quick Settle Actions */}
      {expense.participants.some(p => !p.isPaid && p.userId !== expense.paidBy) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <Button
              title="Mark All Settled"
              variant="outline"
              onPress={() => markAllSettled()}
              style={{ flex: 1 }}
            />
            <Button
              title="Request Payment"
              variant="primary"
              onPress={() => requestPayment()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function getSplitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    equal: 'Equal',
    exact: 'Exact Amounts',
    percentage: 'Percentage',
    shares: 'Shares',
    custom: 'Custom',
  };
  return labels[type] || type;
}

function handleSettle(participant: any) {
  console.log('Settle:', participant);
}

function markAllSettled() {
  console.log('Mark all settled');
}

function requestPayment() {
  console.log('Request payment');
}

const ParticipantRow = ({ participant, expense, currentUserId, onSettle }: any) => {
  const member = useAppStore.getState().members.find(m => m.userId === participant.userId);
  const isPaid = participant.isPaid;
  const isCurrentUser = participant.userId === currentUserId;
  const isPayer = participant.userId === expense.paidBy;

  return (
    <View style={[styles.participantRow, index > 0 && styles.participantRowBorder]}>
      <Avatar name={member?.user.name || ''} size="sm" />
      <View style={styles.participantInfo} style={{ flex: 1 }}>
        <View style={styles.participantHeader}>
          <Text style={styles.participantName}>{member?.user.name}</Text>
          {isPayer && <Text style={styles.payerBadge}>PAID</Text>}
          {isPaid && !isPayer && <Text style={styles.settledBadge}>SETTLED</Text>}
        </View>
        <Text style={styles.participantShare}>Share: {formatCurrency(participant.amount)}</Text>
      </View>
      {!isPaid && !isPayer && isCurrentUser && (
        <Button title="Settle" size="sm" onPress={onSettle} variant="primary" />
      )}
    </View>
  );
};

const SettlementRow = ({ settlement }: any) => (
  <View style={styles.settlementRow}>
    <View style={styles.settlementInfo}>
      <View style={styles.settlementUsers}>
        <Avatar name={settlement.fromUser.name} size="xs" />
        <Ionicons name="arrow-forward" size={16} color={COLORS.textMuted} />
        <Avatar name={settlement.toUser.name} size="xs" />
      </View>
      <Text style={styles.settlementMeta}>
        {formatCurrency(settlement.amount)} • {settlement.paymentMethod} • {formatRelativeTime(settlement.createdAt)}
      </Text>
    </View>
    <View style={[styles.settlementStatus, { backgroundColor: getStatusColor(settlement.status) }]}>
      <Text style={styles.settlementStatusText}>{settlement.status}</Text>
    </View>
  </View>
);

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
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  categoryBadge: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontSize: 28,
  },
  mainInfo: {
    flex: 1,
  },
  mainAmount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  mainCategory: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  mainMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  receiptButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
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
  participantsCard: {},
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  participantRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  participantInfo: {
    flex: 1,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  participantName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  payerBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#2ECC71',
    backgroundColor: '#2ECC7120',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  settledBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#2ECC71',
    backgroundColor: '#2ECC7120',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  participantShare: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  settlementsCard: {},
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  settlementMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  settlementStatus: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  settlementStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});