import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, SETTLEMENT_STATUS, PAYMENT_METHODS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';

type Props = RootStackScreenProps<'SettlementDetail'>;

export default function SettlementDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { settlementId } = route.params;
  const { settlements, members, updateSettlement } = useAppStore();

  const settlement = settlements.find(s => s.id === settlementId);
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const isFromUser = settlement?.fromUserId === currentUser?.userId;
  const isToUser = settlement?.toUserId === currentUser?.userId;

  if (!settlement) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Settlement not found</Text></View>;
  }

  const canConfirm = isToUser && settlement.status === 'pending';
  const canCancel = (isFromUser || isToUser) && settlement.status === 'pending';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlement Details</Text>
      </View>

      {/* Main Settlement Card */}
      <Card style={styles.mainCard} variant="elevated">
        <CardContent>
          <View style={styles.settlementHeader}>
            <View style={styles.settlementAmountContainer}>
              <Text style={styles.settlementAmountLabel}>Amount</Text>
              <Text style={styles.settlementAmount}>{formatCurrency(settlement.amount)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(settlement.status) }]}>
              <Text style={styles.statusText}>{settlement.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.settlementUsers}>
            <View style={styles.userColumn}>
              <Text style={styles.userColumnLabel}>FROM</Text>
              <Avatar name={settlement.fromUser.name} size="lg" source={settlement.fromUser.avatar} />
              <Text style={styles.userName}>{settlement.fromUser.name}</Text>
              <Text style={styles.userRole}>Pays</Text>
            </View>
            <View style={styles.arrowColumn}>
              <Ionicons name="arrow-forward" size={32} color={COLORS.accent} />
            </View>
            <View style={styles.userColumn}>
              <Text style={styles.userColumnLabel}>TO</Text>
              <Avatar name={settlement.toUser.name} size="lg" source={settlement.toUser.avatar} />
              <Text style={styles.userName}>{settlement.toUser.name}</Text>
              <Text style={styles.userRole}>Receives</Text>
            </View>
          </View>

          <View style={styles.settlementDetails}>
            <DetailItem label="Payment Method" value={settlement.paymentMethod || 'Not specified'} icon="card" />
            {settlement.paymentReference && (
              <DetailItem label="Reference" value={settlement.paymentReference} icon="hash" />
            )}
            {settlement.confirmedBy && (
              <DetailItem label="Confirmed By" value={useAppStore.getState().members.find(m => m.userId === settlement.confirmedBy)?.user.name || 'Unknown'} icon="checkmark-circle" />
            )}
            <DetailItem label="Created" value={formatRelativeTime(settlement.createdAt)} icon="time" />
            {settlement.confirmedAt && (
              <DetailItem label="Confirmed" value={formatRelativeTime(settlement.confirmedAt)} icon="checkmark-circle" />
            )}
          </View>

          {settlement.paymentScreenshot && (
            <View style={styles.screenshotSection}>
              <Text style={styles.screenshotLabel}>Payment Screenshot</Text>
              <View style={styles.screenshotPreview}>
                <Text style={styles.screenshotPlaceholder}>Screenshot preview</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          {canConfirm && (
            <View style={styles.actionButtons}>
              <Button title="Confirm Received" variant="primary" onPress={() => confirmSettlement()} fullWidth style={{ marginBottom: SPACING.md }} />
              <Button title="Add Screenshot" variant="outline" onPress={() => {}} fullWidth />
            </View>
          )}
          {canCancel && !canConfirm && (
            <Button title="Cancel Settlement" variant="danger" onPress={() => cancelSettlement()} fullWidth />
          )}
          {settlement.status === 'completed' && (
            <View style={styles.completedNotice}>
              <Ionicons name="checkmark-circle" size={20} color="#2ECC71" />
              <Text>Settlement completed successfully</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Related Expenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Related Expenses</Text>
        <Card style={styles.relatedCard} variant="elevated">
          <CardContent>
            <Text style={styles.relatedText}>This settlement covers expenses between these two members. View expense breakdown in the Expenses tab.</Text>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}

function confirmSettlement() {
  console.log('Confirm settlement');
}

function cancelSettlement() {
  console.log('Cancel settlement');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#2ECC71';
    case 'pending': return '#F39C12';
    case 'cancelled': return '#E74C3C';
    default: return COLORS.textMuted;
  }
}

const DetailItem = ({ label, value, icon }: any) => (
  <View style={styles.detailItem}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={18} color={COLORS.textMuted} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

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
    marginLeft: SPACING.md,
  },
  mainCard: {
    marginBottom: SPACING.lg,
  },
  settlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  settlementAmountContainer: {
    flex: 1,
  },
  settlementAmountLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  settlementAmount: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  settlementUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  userColumn: {
    alignItems: 'center',
  },
  userColumnLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  userRole: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  arrowColumn: {
    paddingHorizontal: SPACING.md,
  },
  settlementDetails: {
    marginBottom: SPACING.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  detailIcon: {
    width: 28,
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginTop: 2,
  },
  screenshotSection: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  screenshotLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  screenshotPreview: {
    height: 150,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenshotPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  actionButtons: {
    marginBottom: SPACING.md,
  },
  completedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#2ECC7120',
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'center',
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
  relatedCard: {},
  relatedText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});