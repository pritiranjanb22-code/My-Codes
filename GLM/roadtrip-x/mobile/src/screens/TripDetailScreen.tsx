import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, TRIP_STATUS } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDate, formatCurrency, getTripStatusColor } from '@/utils/helpers';

type Props = RootStackScreenProps<'TripDetail'>;

export default function TripDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { currentTrip, trips, members, vehicles, itinerary, expenses, wallet, budget } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find((t) => t.id === tripId);
  const tripMembers = members;
  const tripVehicles = vehicles;
  const tripItinerary = itinerary;
  const tripExpenses = expenses;
  const tripWallet = wallet;
  const tripBudget = budget;

  const currentUser = tripMembers.find((m) => m.userId === useAppStore.getState().user?.id);
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role || '');
  const onlineMembers = tripMembers.filter((m) => m.isOnline).length;

  if (!trip) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Trip not found</Text>
      </View>
    );
  }

  const totalExpenses = tripExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Trip Header */}
      <View style={styles.tripHeader}>
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.tripHeaderGradient}>
          <View style={styles.tripHeaderContent}>
            <View style={styles.tripHeaderInfo}>
              <View style={[styles.tripStatusBadge, { backgroundColor: getTripStatusColor(trip.status) }]}>
                <Text style={styles.tripStatusText}>{trip.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.tripDetailName}>{trip.name}</Text>
              <Text style={styles.tripDetailRoute}>
                {trip.startLocation.name} → {trip.endLocation.name}
              </Text>
              <View style={styles.tripDetailMeta}>
                <View style={styles.tripDetailMetaItem}>
                  <Ionicons name="calendar" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.tripDetailMetaText}>
                    {formatDate(trip.startDate)} - {trip.endDate ? formatDate(trip.endDate) : 'Ongoing'}
                  </Text>
                </View>
                <View style={styles.tripDetailMetaItem}>
                  <Ionicons name="people" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.tripDetailMetaText}>{tripMembers.length} members</Text>
                </View>
                <View style={styles.tripDetailMetaItem}>
                  <Ionicons name="car" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.tripDetailMetaText}>{tripVehicles.length} vehicles</Text>
                </View>
              </View>
            </View>
            {isAdmin && (
              <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('TripSettings', { tripId })}>
                <Ionicons name="settings" size={24} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon="cash"
          color="#45B7D1"
        />
        <StatCard
          title="Group Status"
          value={`${onlineMembers}/${tripMembers.length} Online`}
          icon="people"
          color="#4ECDC4"
        />
        <StatCard
          title="Itinerary"
          value={`${tripItinerary.filter(s => s.isCompleted).length}/${tripItinerary.length} Done`}
          icon="map-marker"
          color="#F8B500"
        />
        <StatCard
          title="Wallet"
          value={tripWallet ? formatCurrency(tripWallet.remaining) : '—'}
          icon="wallet"
          color="#9B59B6"
        />
      </View>

      {/* Budget Progress */}
      {tripBudget && (
        <View style={styles.section}>
          <BudgetProgressCard budget={tripBudget} spent={totalExpenses} />
        </View>
      )}

      {/* Vehicles */}
      {tripVehicles.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Vehicles" action={{ label: 'Manage', onPress: () => {} }} />
          <FlatList
            data={tripVehicles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VehicleDetailCard
                vehicle={item}
                members={tripMembers.filter((m) => m.vehicleId === item.id)}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Members */}
      <View style={styles.section}>
        <SectionHeader title="Members" action={{ label: isAdmin ? 'Manage' : '', onPress: () => {} }} />
        <FlatList
          data={tripMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberDetailItem
              member={item}
              isAdmin={isAdmin}
              onPress={() => navigation.navigate('MemberProfile', { userId: item.userId })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Itinerary */}
      {tripItinerary.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Itinerary" action={{ label: 'View All', onPress: () => {} }} />
          <FlatList
            data={tripItinerary.slice(0, 5)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ItineraryDetailItem
                stop={item}
                onPress={() => navigation.navigate('ItineraryDetail', { stopId: item.id })}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="qr-code"
            label="Trip QR Code"
            color="#45B7D1"
            onPress={() => {}}
          />
          <ActionButton
            icon="share"
            label="Invite Members"
            color="#4ECDC4"
            onPress={() => {}}
          />
          <ActionButton
            icon="download"
            label="Export Data"
            color="#9B59B6"
            onPress={() => {}}
          />
          <ActionButton
            icon="image"
            label="Photo Album"
            color="#F8B500"
            onPress={() => navigation.navigate('PhotoAlbum', { tripId })}
          />
          <ActionButton
            icon="replay"
            label="Trip Replay"
            color="#E74C3C"
            onPress={() => navigation.navigate('TripReplay', { tripId })}
          />
          <ActionButton
            icon="document"
            label="Trip Recap"
            color="#2ECC71"
            onPress={() => navigation.navigate('TripRecap', { tripId })}
          />
        </View>
      </View>

      {/* Danger Zone */}
      {isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerActions}>
            <ActionButton
              icon="archive"
              label="Archive Trip"
              color="#F39C12"
              variant="outline"
              onPress={() => {}}
            />
            <ActionButton
              icon="trash"
              label="Delete Trip"
              color="#E74C3C"
              variant="outline"
              onPress={() => {}}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
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
      </CardContent>
    </Card>
  );
};

const SectionHeader = ({ title, action }: any) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action?.label && (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const VehicleDetailCard = ({ vehicle, members, onPress }: any) => (
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
          <Ionicons name="gas-station" size={16} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel || 0}% fuel</Text>
        </View>
        <View style={styles.vehicleDetail}>
          <Ionicons name="navigate" size={16} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel ? Math.round(vehicle.fuelLevel * 5) : 0} km range</Text>
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

const MemberDetailItem = ({ member, isAdmin, onPress }: any) => (
  <TouchableOpacity style={styles.memberItem} onPress={onPress} activeOpacity={0.8}>
    <Avatar name={member.user.name} size="md" source={member.user.avatar} />
    <View style={styles.memberInfo}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberName}>{member.user.name}</Text>
        <View style={[styles.memberRoleBadge, { backgroundColor: getRoleColor(member.role) }]}>
          <Text style={styles.memberRoleText}>{member.role.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.memberMeta}>
        {member.vehicleId && (
          <Text style={styles.memberMetaItem}>
            <Ionicons name="car" size={12} color={COLORS.textMuted} />
            {useAppStore.getState().vehicles.find(v => v.id === member.vehicleId)?.name}
          </Text>
        )}
        <Text style={styles.memberMetaItem}>
          <Ionicons name={member.isOnline ? 'wifi' : 'wifi-off'} size={12} color={member.isOnline ? '#2ECC71' : COLORS.textMuted} />
          {member.isOnline ? 'Online' : formatRelativeTime(member.lastSeen)}
        </Text>
        {member.locationSharing && (
          <Text style={styles.memberMetaItem}>
            <Ionicons name="location" size={12} color="#45B7D1" />
            Sharing location
          </Text>
        )}
      </View>
    </View>
    {isAdmin && member.role !== 'owner' && (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    )}
  </TouchableOpacity>
);

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

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch {
    return 'Unknown';
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

const ItineraryDetailItem = ({ stop, onPress }: any) => (
  <TouchableOpacity style={styles.itineraryItem} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.itineraryItemRow}>
      <View style={[styles.itineraryNumber, stop.isCompleted && styles.itineraryNumberCompleted]}>
        <Text style={styles.itineraryNumberText}>{stop.order}</Text>
        {stop.isCompleted && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
      </View>
      <View style={styles.itineraryInfo}>
        <Text style={[styles.itineraryName, stop.isCompleted && styles.itineraryCompleted]}>{stop.name}</Text>
        <Text style={styles.itineraryAddress}>{stop.location.address}</Text>
        <View style={styles.itineraryMeta}>
          {stop.arrivalTime && (
            <Text style={styles.itineraryMetaItem}>
              <Ionicons name="time" size={12} color={COLORS.textMuted} />
              Arrive: {formatTime(stop.arrivalTime)}
            </Text>
          )}
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

const ActionButton = ({ icon, label, color, variant = 'primary', onPress }: any) => (
  <TouchableOpacity style={[styles.actionButton, variant === 'outline' && styles.actionButtonOutline]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionButtonIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.actionButtonLabel, variant === 'outline' && styles.actionButtonLabelOutline, { color: variant === 'outline' ? color : COLORS.text }]}>{label}</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tripHeaderInfo: {
    flex: 1,
  },
  tripStatusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  tripStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  tripDetailName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  tripDetailRoute: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.md,
  },
  tripDetailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  tripDetailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripDetailMetaText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  editButton: {
    padding: SPACING.xs,
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  memberName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  memberRoleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  memberRoleText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  memberMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  memberMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  itineraryItem: {
    paddingVertical: SPACING.xs,
  },
  itineraryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  itineraryNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itineraryNumberCompleted: {
    backgroundColor: '#2ECC71',
  },
  itineraryNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  itineraryCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  itineraryAddress: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itineraryMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  itineraryMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionButtonLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtonLabelOutline: {
    color: COLORS.text,
  },
  dangerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});