import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatDate, formatDistance, formatDuration } from '@/utils/helpers';

type Props = RootStackScreenProps<'TripRecap'>;

export default function TripRecapScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { trips, expenses, media, itinerary, fuelEntries, tollEntries } = useAppStore();

  const trip = trips.find((t) => t.id === tripId);
  const tripExpenses = expenses;
  const tripMedia = media;
  const tripItinerary = itinerary;
  const tripFuel = fuelEntries;
  const tripToll = tollEntries;

  if (!trip) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Trip not found</Text></View>;
  }

  const totalExpenses = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryBreakdown = calculateCategoryBreakdown(tripExpenses);
  const totalDistance = calculateTotalDistance();
  const totalFuelCost = tripFuel.reduce((sum, f) => sum + f.amount, 0);
  const totalTollCost = tripToll.reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Trip Header */}
      <View style={styles.tripHeader}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.tripHeaderGradient}>
          <View style={styles.tripHeaderContent}>
            <Text style={styles.recapTitle}>TRIP RECAP</Text>
            <Text style={styles.tripName}>{trip.name}</Text>
            <Text style={styles.tripRoute}>{trip.startLocation.name} → {trip.endLocation.name}</Text>
            <Text style={styles.tripDates}>{formatDate(trip.startDate)} - {trip.endDate ? formatDate(trip.endDate) : 'Ongoing'}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsGrid}>
        <StatCard title="Total Distance" value={formatDistance(totalDistance)} icon="navigate" color="#45B7D1" />
        <StatCard title="Trip Duration" value={calculateTripDuration()} icon="time" color="#4ECDC4" />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon="cash" color="#F8B500" />
        <StatCard title="Photos" value={tripMedia.length.toString()} icon="image" color="#9B59B6" />
      </View>

      {/* Expense Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <Card style={styles.breakdownCard} variant="elevated">
          <CardContent>
            {Object.entries(categoryBreakdown).map(([category, amount]) => (
              <ExpenseBreakdownItem key={category} category={category} amount={amount} total={totalExpenses} />
            ))}
            <Divider />
            <ExpenseBreakdownItem category="total" amount={totalExpenses} total={totalExpenses} isTotal />
          </CardContent>
        </Card>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard label="Fuel Cost" value={formatCurrency(totalFuelCost)} icon="gas-station" color="#FF6B35" />
          <MetricCard label="Toll Cost" value={formatCurrency(totalTollCost)} icon="road" color="#4ECDC4" />
          <MetricCard label="Stops Visited" value={`${tripItinerary.filter(s => s.isCompleted).length}/${tripItinerary.length}`} icon="map-marker" color="#45B7D1" />
          <MetricCard label="Participants" value={useAppStore.getState().members.length.toString()} icon="people" color="#9B59B6" />
        </View>
      </View>

      {/* Share/Export */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Share Your Trip</Text>
        <View style={styles.shareActions}>
          <Button title="Export as PDF" variant="outline" onPress={() => {}} fullWidth style={{ marginBottom: SPACING.md }} />
          <Button title="Share as Image" variant="primary" onPress={() => {}} fullWidth />
        </View>
      </View>
    </ScrollView>
  );
}

function calculateCategoryBreakdown(expenses: any[]) {
  const breakdown: Record<string, number> = {};
  expenses.forEach((e) => {
    breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
  });
  return breakdown;
}

function calculateTotalDistance(): number {
  return 824000; // Demo: 824 km
}

function calculateTripDuration(): string {
  return '3 Days';
}

import { LinearGradient } from 'expo-linear-gradient';

const StatCard = ({ title, value, icon, color }: any) => (
  <Card style={styles.statCard} variant="elevated">
    <CardContent>
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </CardContent>
  </Card>
);

const ExpenseBreakdownItem = ({ category, amount, total, isTotal }: any) => {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const cat = category !== 'total' ? require('@/constants').EXPENSE_CATEGORIES.find(c => c.id === category) : null;
  return (
    <View style={[styles.breakdownItem, isTotal && styles.breakdownItemTotal]}>
      <View style={styles.breakdownLeft}>
        {cat && <Text style={styles.breakdownIcon}>{cat.icon}</Text>}
        <Text style={[styles.breakdownLabel, isTotal && styles.breakdownLabelTotal]}>{isTotal ? 'TOTAL' : cat?.label || category}</Text>
      </View>
      <View style={styles.breakdownRight}>
        <Text style={[styles.breakdownAmount, isTotal && styles.breakdownAmountTotal]}>{formatCurrency(amount)}</Text>
        {!isTotal && <Text style={styles.breakdownPercentage}>{percentage.toFixed(1)}%</Text>}
      </View>
    </View>
  );
};

const MetricCard = ({ label, value, icon, color }: any) => (
  <Card style={styles.metricCard} variant="elevated">
    <CardContent>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </CardContent>
  </Card>
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
  tripHeader: {
    marginHorizontal: -SPACING.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  tripHeaderGradient: {
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xl,
  },
  tripHeaderContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  recapTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  tripName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  tripRoute: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  tripDates: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  statsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  breakdownCard: {},
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  breakdownItemTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
    paddingTop: SPACING.lg,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  breakdownIcon: {
    fontSize: 20,
  },
  breakdownLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  breakdownLabelTotal: {
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  breakdownAmountTotal: {
    fontSize: FONT_SIZES.xl,
  },
  breakdownPercentage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: SPACING.md,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  metricValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  shareActions: {
    gap: SPACING.md,
  },
});