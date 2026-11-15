import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';

type Props = RootStackScreenProps<'MemberProfile'>;

export default function MemberProfileScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { userId } = route.params;
  const { members, currentTrip, trips, expenses, settlements } = useAppStore();

  const member = members.find(m => m.userId === userId);
  const trip = currentTrip || trips[0];
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const isSelf = member?.userId === currentUser?.userId;
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role || '');

  if (!member) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Member not found</Text></View>;
  }

  const memberExpenses = expenses.filter(e => e.paidBy === member.userId);
  const memberShare = expenses.reduce((sum, e) => {
    const p = e.participants.find(p => p.userId === member.userId);
    return sum + (p?.amount || 0);
  }, 0);
  const memberPaid = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = memberPaid - memberShare;

  const memberSettlements = settlements.filter(s => s.fromUserId === member.userId || s.toUserId === member.userId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Profile</Text>
        {isAdmin && !isSelf && (
          <TouchableOpacity onPress={() => {}} style={styles.moreButton}>
            <Ionicons name="more" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar name={member.user.name} size="xl" source={member.user.avatar} style={styles.profileAvatar} />
        <Text style={styles.profileName}>{member.user.name}</Text>
        <Text style={styles.profileEmail}>{member.user.email}</Text>
        <View style={styles.profileBadges}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(member.role) }]}>
            <Text style={styles.roleBadgeText}>{member.role.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: member.isOnline ? '#2ECC7120' : COLORS.textMuted }]}>
            <Text style={[styles.statusBadgeText, { color: member.isOnline ? '#2ECC71' : COLORS.textMuted }]}>
              {member.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.profileStats}>
          <StatItem label="Paid" value={formatCurrency(memberPaid)} color="#2ECC71" />
          <StatItem label="Share" value={formatCurrency(memberShare)} color="#45B7D1" />
          <StatItem label="Balance" value={formatCurrency(Math.abs(balance))} color={balance >= 0 ? '#2ECC71' : '#E74C3C'} />
        </View>
      </View>

      {/* Trip Role & Vehicle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Info</Text>
        <Card style={styles.infoCard} variant="elevated">
          <CardContent>
            <InfoRow icon="shield" label="Role" value={member.role} />
            <Divider />
            {member.vehicleId && (
              <InfoRow
                icon="car"
                label="Vehicle"
                value={useAppStore.getState().vehicles.find(v => v.id === member.vehicleId)?.name}
              />
            )}
            <Divider />
            <InfoRow icon="location" label="Location Sharing" value={member.locationSharing ? 'Enabled' : 'Disabled'} />
            <Divider />
            <InfoRow icon="time" label="Joined" value={require('@/utils/helpers').formatDate(member.joinedAt)} />
            <Divider />
            <InfoRow icon="wifi" label="Last Seen" value={formatRelativeTime(member.lastSeen)} />
          </CardContent>
        </Card>
      </View>

      {/* Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenses Paid ({memberExpenses.length})</Text>
        </View>
        {memberExpenses.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="cash" size={32} color={COLORS.textMuted} />
                <Text>No expenses paid</Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.expensesList}>
            {memberExpenses.slice(0, 5).map(expense => (
              <ExpenseRow key={expense.id} expense={expense} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })} />
            ))}
          </View>
        )}
      </View>

      {/* Settlements */}
      {memberSettlements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settlements ({memberSettlements.length})</Text>
          <View style={styles.settlementsList}>
            {memberSettlements.slice(0, 5).map(settlement => (
              <SettlementRow key={settlement.id} settlement={settlement} currentUserId={member.userId} />
            ))}
          </View>
        </View>
      )}

      {/* Admin Actions */}
      {isAdmin && !isSelf && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>
          <Card style={styles.adminCard} variant="elevated">
            <CardContent>
              <AdminAction
                icon="person-remove"
                title="Remove from Trip"
                description="This member will lose access to this trip"
                color={COLORS.error}
                onPress={() => {}}
              />
              <Divider />
              <AdminAction
                icon="shield"
                title="Change Role"
                description="Update member permissions"
                color={COLORS.accent}
                onPress={() => {}}
              />
              <Divider />
              <AdminAction
                icon="car"
                title="Change Vehicle"
                description="Reassign to different vehicle"
                color="#4ECDC4"
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'owner': return '#9B59B6';
    case 'admin': return '#3498DB';
    case 'driver': return '#2ECC71';
    case 'member': return '#F39C12';
    case 'viewer': return COLORS.textMuted;
    default: return COLORS.textMuted;
  }
}

const StatItem = ({ label, value, color }: any) => (
  <View style={styles.statItem}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const InfoRow = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIcon, { backgroundColor: `${COLORS.accent}20` }]}>
      <Ionicons name={icon} size={18} color={COLORS.accent} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ExpenseRow = ({ expense, onPress }: any) => (
  <TouchableOpacity style={styles.expenseRow} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.expenseCategoryDot, { backgroundColor: require('@/utils/helpers').getCategoryColor(expense.category) }]} />
    <View style={styles.expenseRowInfo}>
      <Text style={styles.expenseRowDescription}>{expense.description}</Text>
      <Text style={styles.expenseRowMeta}>
        {require('@/constants').EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.label} • {require('@/utils/helpers').formatRelativeTime(expense.createdAt)}
      </Text>
    </View>
    <Text style={styles.expenseRowAmount}>{formatCurrency(expense.amount)}</Text>
  </TouchableOpacity>
);

const SettlementRow = ({ settlement, currentUserId }: any) => {
  const isFrom = settlement.fromUserId === currentUserId;
  const otherUser = isFrom ? settlement.toUser : settlement.fromUser;
  return (
    <View style={styles.settlementRow}>
      <View style={styles.settlementDirection}>
        <Avatar name={otherUser.name} size="xs" />
        <Ionicons name={isFrom ? 'arrow-forward' : 'arrow-back'} size={16} color={COLORS.textMuted} />
        <Text style={styles.settlementUser}>{otherUser.name}</Text>
      </View>
      <View style={styles.settlementAmounts}>
        <Text style={[styles.settlementAmount, { color: isFrom ? '#E74C3C' : '#2ECC71' }]}>
          {isFrom ? '-' : '+'}{formatCurrency(settlement.amount)}
        </Text>
        <Text style={styles.settlementStatus}>{settlement.status}</Text>
      </View>
    </View>
  );
};

const AdminAction = ({ icon, title, description, color, onPress }: any) => (
  <TouchableOpacity style={styles.adminAction} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.adminIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.adminText}>
      <Text style={styles.adminTitle}>{title}</Text>
      <Text style={styles.adminDescription}>{description}</Text>
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
  moreButton: {
    padding: SPACING.xs,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    marginHorizontal: -SPACING.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileAvatar: {
    borderWidth: 4,
    borderColor: COLORS.background,
    marginBottom: SPACING.md,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: 2,
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
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  infoCard: {},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  expensesList: {
    gap: SPACING.sm,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  expenseCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  expenseRowInfo: {
    flex: 1,
  },
  expenseRowDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  expenseRowMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  expenseRowAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  settlementsList: {
    gap: SPACING.sm,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settlementDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settlementUser: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settlementAmounts: {
    alignItems: 'flex-end',
  },
  settlementAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  settlementStatus: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  adminCard: {},
  adminAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminText: {
    flex: 1,
  },
  adminTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  adminDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});