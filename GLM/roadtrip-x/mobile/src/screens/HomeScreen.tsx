import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, EXPENSE_CATEGORIES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatDistance, formatDuration, getCategoryIcon, getCategoryColor } from '@/utils/helpers';
import { LinearGradient } from 'expo-linear-gradient';

type Props = RootStackScreenProps<'Home'>;

const QUICK_ACTIONS = [
  { id: 'expense', label: 'Expense', icon: 'cash', color: '#45B7D1' },
  { id: 'fuel', label: 'Fuel', icon: 'gas-station', color: '#FF6B35' },
  { id: 'location', label: 'Location', icon: 'location', color: '#4ECDC4' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#F8B500' },
  { id: 'stop', label: 'Stop', icon: 'map-marker', color: '#9B59B6' },
  { id: 'sos', label: 'SOS', icon: 'alert', color: '#E74C3C' },
  { id: 'photo', label: 'Photo', icon: 'camera', color: '#85C1E9' },
  { id: 'chat', label: 'Chat', icon: 'chatbubbles', color: '#3498DB' },
];

export default function HomeScreen({ navigation }: Props) {
  const {
    currentTrip,
    members,
    vehicles,
    expenses,
    wallet,
    itinerary,
    fuelEntries,
    emergencyEvents,
    getTotalExpenses,
    getUpcomingStops,
    getActiveEmergencyEvents,
    isLoading,
  } = useAppStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const totalExpenses = getTotalExpenses();
  const upcomingStops = getUpcomingStops();
  const activeEmergencies = getActiveEmergencyEvents();
  const onlineMembers = members.filter((m) => m.isOnline).length;
  const currentUser = members.find((m) => m.userId === useAppStore.getState().user?.id);
  const nextStop = upcomingStops[0];

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="car-sport" size={64} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyText}>Create or join a trip to get started</Text>
          <View style={styles.emptyButtons}>
            <Button title="Create Trip" onPress={() => navigation.navigate('CreateTrip')} variant="primary" />
            <Button title="Join Trip" onPress={() => navigation.navigate('JoinTrip')} variant="outline" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.accent]} />}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Trip Header */}
      <View style={styles.tripHeader}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.tripHeaderGradient}>
          <View style={styles.tripHeaderContent}>
            <View style={styles.tripInfo}>
              <Text style={styles.tripName}>{currentTrip.name}</Text>
              <Text style={styles.tripRoute}>
                {currentTrip.startLocation.name} → {currentTrip.endLocation.name}
              </Text>
            </View>
            <View style={styles.tripStatus}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getTripStatusColor(currentTrip.status) },
              ]}>
                <Text style={styles.statusText}>{currentTrip.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Distance Remaining"
          value={nextStop ? formatDistance(calculateDistanceToStop(nextStop)) : '—'}
          icon="navigate"
          iconColor="#45B7D1"
          subtitle="ETA: 2h 14m"
        />
        <StatCard
          title="Group Status"
          value={`${onlineMembers} Online`}
          icon="people"
          iconColor="#4ECDC4"
          subtitle={`${vehicles.length} Vehicles`}
        />
        <StatCard
          title="Trip Expenses"
          value={formatCurrency(totalExpenses)}
          icon="cash"
          iconColor="#F8B500"
          subtitle={`Your share: ${formatCurrency(currentUser ? calculateUserShare(currentUser.userId) : 0)}`}
        />
        <StatCard
          title="Wallet Balance"
          value={wallet ? formatCurrency(wallet.remaining) : '—'}
          icon="wallet"
          iconColor="#2ECC71"
          subtitle={`of ${wallet ? formatCurrency(wallet.totalContributed) : '—'} contributed`}
        />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" action={{ label: 'All', onPress: () => {} }} />
      <View style={styles.quickActions}>
        {QUICK_ACTIONS.map((action) => (
          <QuickActionButton
            key={action.id}
            icon={action.icon}
            label={action.label}
            color={action.color}
            onPress={handleQuickAction}
            navigation={navigation}
          />
        ))}
      </View>

      {/* Emergency Button */}
      {activeEmergencies.length > 0 && (
        <EmergencyBanner emergencies={activeEmergencies} onPress={() => navigation.navigate('Emergency')} />
      )}

      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => navigation.navigate('Emergency')}
        activeOpacity={0.9}
      >
        <Ionicons name="alert-circle" size={24} color={COLORS.white} />
        <Text style={styles.emergencyButtonText}>EMERGENCY ASSISTANCE</Text>
      </TouchableOpacity>

      {/* Next Stop */}
      {nextStop && (
        <View style={styles.section}>
          <SectionHeader title="Next Stop" />
          <NextStopCard stop={nextStop} onPress={() => navigation.navigate('ItineraryDetail', { stopId: nextStop.id })} />
        </View>
      )}

      {/* Group Vehicles */}
      {vehicles.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Group Vehicles" />
          <View style={styles.vehiclesList}>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                members={members.filter((m) => m.vehicleId === vehicle.id)}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
              />
            ))}
          </View>
        </View>
      )}

      {/* Recent Expenses */}
      {expenses.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Recent Expenses" action={{ label: 'View All', onPress: () => navigation.navigate('Expenses') }} />
          <View style={styles.expensesList}>
            {expenses.slice(0, 3).map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })} />
            ))}
          </View>
        </View>
      )}

      {/* Active Emergencies */}
      {activeEmergencies.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Active Emergencies" />
          <View style={styles.emergenciesList}>
            {activeEmergencies.map((emergency) => (
              <EmergencyCard key={emergency.id} emergency={emergency} onPress={() => navigation.navigate('Emergency')} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function calculateDistanceToStop(stop: any): number {
  return Math.random() * 50000 + 5000;
}

function calculateUserShare(userId: string): number {
  return Math.random() * 5000;
}

function getTripStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#2ECC71';
    case 'planning': return '#3498DB';
    case 'completed': return '#9B59B6';
    case 'cancelled': return '#E74C3C';
    default: return COLORS.textMuted;
  }
}

function handleQuickAction(actionId: string, navigation: any) {
  switch (actionId) {
    case 'expense':
      navigation.navigate('AddExpense' as any);
      break;
    case 'fuel':
      navigation.navigate('FuelDetail' as any);
      break;
    case 'location':
      navigation.navigate('Map' as any);
      break;
    case 'food':
      navigation.navigate('AddExpense' as any, { category: 'food' });
      break;
    case 'stop':
      navigation.navigate('AddItineraryStop' as any);
      break;
    case 'sos':
      navigation.navigate('SOS' as any);
      break;
    case 'photo':
      navigation.navigate('PhotoAlbum' as any);
      break;
    case 'chat':
      navigation.navigate('Chat' as any);
      break;
  }
}

const StatCard = ({ title, value, icon, iconColor, subtitle }: any) => (
  <Card style={styles.statCard} variant="elevated">
    <CardContent>
      <View style={styles.statRow}>
        <View style={[styles.statIcon, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </CardContent>
  </Card>
);

const QuickActionButton = ({ icon, label, color, onPress, navigation }: any) => (
  <TouchableOpacity onPress={() => onPress?.(navigation)} style={styles.quickAction} activeOpacity={0.8}>
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title, action }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const NextStopCard = ({ stop, onPress }: any) => (
  <Card style={styles.nextStopCard} variant="elevated" onPress={onPress}>
    <CardContent>
      <View style={styles.nextStopRow}>
        <View style={[styles.nextStopIcon, { backgroundColor: '#45B7D120' }]}>
          <Ionicons name="map-marker" size={24} color="#45B7D1" />
        </View>
        <View style={styles.nextStopInfo}>
          <Text style={styles.nextStopName}>{stop.name}</Text>
          <Text style={styles.nextStopAddress}>{stop.location.address}</Text>
          <View style={styles.nextStopMeta}>
            <Text style={styles.nextStopMetaItem}>
              <Ionicons name="time" size={14} color={COLORS.textMuted} />
              {stop.arrivalTime && `Arrive: ${formatTime(stop.arrivalTime)}`}
            </Text>
            <Text style={styles.nextStopMetaItem}>
              <Ionicons name="navigate" size={14} color={COLORS.textMuted} />
              {formatDistance(calculateDistanceToStop(stop))} away
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </View>
    </CardContent>
  </Card>
);

const VehicleCard = ({ vehicle, members, onPress }: any) => (
  <Card style={styles.vehicleCard} variant="elevated" onPress={onPress}>
    <CardContent>
      <View style={styles.vehicleHeader}>
        <View style={styles.vehicleIcon}>
          <Ionicons name="car-sport" size={28} color={COLORS.accent} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.vehicleReg}>{vehicle.registrationNumber}</Text>
        </View>
        <View style={styles.vehicleStatus}>
          <View style={[styles.statusDot, { backgroundColor: '#2ECC71' }]} />
          <Text style={styles.vehicleStatusText}>Healthy</Text>
        </View>
      </View>
      <View style={styles.vehicleDetails}>
        <View style={styles.vehicleDetail}>
          <Ionicons name="people" size={16} color={COLORS.textMuted} />
          <Text>{members.length} passengers</Text>
        </View>
        <View style={styles.vehicleDetail}>
          <Ionicons name="battery" size={16} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel || 62}% fuel</Text>
        </View>
        <View style={styles.vehicleDetail}>
          <Ionicons name="navigate" size={16} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel ? Math.round(vehicle.fuelLevel * 5) : 320} km range</Text>
        </View>
      </View>
      <View style={styles.vehicleMembers}>
        {members.slice(0, 4).map((member) => (
          <Avatar key={member.userId} name={member.user.name} size="sm" />
        ))}
        {members.length > 4 && (
          <View style={styles.moreMembers}>
            <Text style={styles.moreMembersText}>+{members.length - 4}</Text>
          </View>
        )}
      </View>
    </CardContent>
  </Card>
);

const ExpenseCard = ({ expense, onPress }: any) => (
  <Card style={styles.expenseCard} variant="default" onPress={onPress}>
    <CardContent>
      <View style={styles.expenseRow}>
        <View style={[styles.expenseCategoryIcon, { backgroundColor: `${getCategoryColor(expense.category)}20` }]}>
          <Text style={styles.expenseCategoryIconText}>{getCategoryIcon(expense.category)}</Text>
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDescription}>{expense.description}</Text>
          <Text style={styles.expenseMeta}>
            {expense.paidByUser?.name || 'Someone'} • {formatRelativeTime(expense.createdAt)}
          </Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
      </View>
    </CardContent>
  </Card>
);

const EmergencyCard = ({ emergency, onPress }: any) => (
  <Card style={styles.emergencyCard} variant="outlined" onPress={onPress}>
    <CardContent>
      <View style={styles.emergencyRow}>
        <View style={[styles.emergencyIcon, { backgroundColor: '#E74C3C20' }]}>
          <Ionicons name="alert-circle" size={20} color="#E74C3C" />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyType}>{emergency.type.toUpperCase()}</Text>
          <Text style={styles.emergencyUser}>{emergency.user.name} needs help</Text>
          <Text style={styles.emergencyLocation}>{emergency.location.address || 'Unknown location'}</Text>
        </View>
        <Text style={styles.emergencyTime}>{formatRelativeTime(emergency.createdAt)}</Text>
      </View>
    </CardContent>
  </Card>
);

const EmergencyBanner = ({ emergencies, onPress }: any) => (
  <TouchableOpacity style={styles.emergencyBanner} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.emergencyBannerIcon}>
      <Ionicons name="alert-circle" size={24} color={COLORS.white} />
    </View>
    <View style={styles.emergencyBannerText}>
      <Text style={styles.emergencyBannerTitle}>{emergencies.length} Active Emergenc{emergencies.length > 1 ? 'ies' : 'y'}</Text>
      <Text style={styles.emergencyBannerSubtitle}>Tap to view and respond</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
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
    marginBottom: SPACING.lg,
  },
  emptyButtons: {
    width: '100%',
    gap: SPACING.md,
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
  },
  tripHeaderContent: {
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripInfo: {
    flex: 1,
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
  },
  tripStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
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
  statSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
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
    paddingHorizontal: SPACING.xs,
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  quickAction: {
    width: '25%',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  emergencyButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  nextStopCard: {},
  nextStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  nextStopIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStopInfo: {
    flex: 1,
  },
  nextStopName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  nextStopAddress: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  nextStopMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  nextStopMetaItem: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehiclesList: {
    gap: SPACING.md,
  },
  vehicleCard: {},
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  vehicleReg: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  vehicleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vehicleStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: '#2ECC71',
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  moreMembersText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  expensesList: {
    gap: SPACING.sm,
  },
  expenseCard: {},
  expenseRow: {
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
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  expenseMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  emergenciesList: {
    gap: SPACING.sm,
  },
  emergencyCard: {},
  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyType: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#E74C3C',
  },
  emergencyUser: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 2,
  },
  emergencyLocation: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emergencyTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  emergencyBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyBannerText: {
    flex: 1,
  },
  emergencyBannerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  emergencyBannerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});