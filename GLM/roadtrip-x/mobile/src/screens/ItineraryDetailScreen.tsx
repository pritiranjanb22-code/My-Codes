import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDate, formatTime, formatDuration } from '@/utils/helpers';

type Props = RootStackScreenProps<'ItineraryDetail'>;

export default function ItineraryDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { stopId } = route.params;
  const { itinerary, trips, currentTrip, expenses, media, updateItineraryStop } = useAppStore();

  const stop = itinerary.find(s => s.id === stopId);
  const trip = currentTrip || trips[0];

  if (!stop) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Stop not found</Text></View>;
  }

  const stopExpenses = expenses.filter(e => e.stopId === stopId);
  const stopMedia = media.filter(m => m.stopId === stopId);
  const totalExpenses = stopExpenses.reduce((sum, e) => sum + e.amount, 0);
  const isCompleted = stop.isCompleted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stop Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddItineraryStop', { stopId: stop.id })}>
          <Ionicons name="create" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Stop Header */}
      <Card style={styles.stopCard} variant="elevated">
        <CardContent>
          <View style={styles.stopHeader}>
            <View style={[styles.stopNumber, isCompleted && styles.stopNumberCompleted]}>
              <Text style={styles.stopNumberText}>{stop.order}</Text>
              {isCompleted && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.stopAddress}>{stop.location.address}</Text>
            </View>
            <View style={styles.stopStatus}>
              <TouchableOpacity
                style={[styles.statusButton, isCompleted && styles.statusButtonCompleted]}
                onPress={() => updateItineraryStop({ ...stop, isCompleted: !isCompleted })}
              >
                <Text style={[styles.statusButtonText, isCompleted && styles.statusButtonTextCompleted]}>
                  {isCompleted ? 'Completed' : 'Mark Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stopMeta}>
            {stop.arrivalTime && (
              <MetaItem icon="time" label="Arrival" value={formatTime(stop.arrivalTime)} />
            )}
            {stop.departureTime && (
              <MetaItem icon="time" label="Departure" value={formatTime(stop.departureTime)} />
            )}
            {stop.duration && (
              <MetaItem icon="timer" label="Duration" value={formatDuration(stop.duration)} />
            )}
          </View>

          {stop.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{stop.notes}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Expenses at this stop */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenses ({stopExpenses.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { tripId: trip?.id, stopId: stop.id })}>
            <Button title="Add" variant="ghost" size="sm" onPress={() => navigation.navigate('AddExpense', { tripId: trip?.id, stopId: stop.id })} />
          </TouchableOpacity>
        </View>
        {stopExpenses.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="cash" size={32} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Expenses</Text>
                <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense', { tripId: trip?.id, stopId: stop.id })} size="sm" />
              </View>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.expensesList}>
            {stopExpenses.map(expense => (
              <ExpenseRow key={expense.id} expense={expense} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })} />
            ))}
            <View style={styles.expenseTotal}>
              <Text>Total at this stop</Text>
              <Text style={styles.expenseTotalAmount}>{require('@/utils/helpers').formatCurrency(totalExpenses)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Photos at this stop */}
      {stopMedia.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({stopMedia.length})</Text>
          <View style={styles.mediaGrid}>
            {stopMedia.map(item => (
              <TouchableOpacity key={item.id} style={styles.mediaItem} onPress={() => {}} activeOpacity={0.9}>
                <View style={styles.mediaThumbnail}>
                  {item.type === 'video' && (
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={28} color={COLORS.white} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Activities */}
      {stop.activities && stop.activities.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <Card style={styles.activitiesCard} variant="elevated">
            <CardContent>
              {stop.activities.map((activity, index) => (
                <View key={index} style={styles.activityRow}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.activityText}>{activity}</Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>
      )}

      {/* Actions */}
      <View style={styles.section}>
        <Button title="Add Expense" variant="outline" onPress={() => navigation.navigate('AddExpense', { tripId: trip?.id, stopId: stop.id })} fullWidth style={{ marginBottom: SPACING.md }} />
        <Button title="Add Photos" variant="primary" onPress={() => {}} fullWidth style={{ marginBottom: SPACING.md }} />
        <Button title="Add Activity" variant="outline" onPress={() => {}} fullWidth />
      </View>
    </ScrollView>
  );
}

const MetaItem = ({ icon, label, value }: any) => (
  <View style={styles.metaItem}>
    <Ionicons name={icon} size={16} color={COLORS.textMuted} />
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
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
    <Text style={styles.expenseRowAmount}>{require('@/utils/helpers').formatCurrency(expense.amount)}</Text>
  </TouchableOpacity>
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
  stopCard: {
    marginBottom: SPACING.lg,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  stopNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberCompleted: {
    backgroundColor: COLORS.success,
  },
  stopNumberText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  stopAddress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  stopStatus: {
    marginLeft: 'auto',
  },
  statusButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusButtonCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  statusButtonText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusButtonTextCompleted: {
    color: COLORS.white,
  },
  stopMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
  },
  metaLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.text,
  },
  notesSection: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notesLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
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
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
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
  expenseTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  expenseTotalAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  mediaItem: {
    width: '31.33%',
    aspectRatio: 1,
  },
  mediaThumbnail: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitiesCard: {},
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  activityText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});