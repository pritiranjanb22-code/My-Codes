import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, TRIP_ROLES, TRIP_STATUS, VEHICLE_FUEL_TYPES, ROAD_TRIP_CHECKLIST } from '@/constants';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo, AntDesign } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatDate, formatRelativeTime, getCategoryIcon, getCategoryColor } from '@/utils/helpers';

type Props = RootStackScreenProps<'Trip'>;

export default function TripScreen({ navigation }: Props) {
  const {
    currentTrip,
    members,
    vehicles,
    itinerary,
    checklists,
    media,
    budget,
    getUpcomingStops,
    getCompletedStops,
  } = useAppStore();

  const upcomingStops = getUpcomingStops();
  const completedStops = getCompletedStops();
  const currentUser = members.find((m) => m.userId === useAppStore.getState().user?.id);
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role || '');

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="car-sport" size={64} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyText}>Create or join a trip to manage it</Text>
          <View style={styles.emptyButtons}>
            <Button title="Create Trip" onPress={() => navigation.navigate('CreateTrip')} variant="primary" />
            <Button title="Join Trip" onPress={() => navigation.navigate('JoinTrip')} variant="outline" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Trip Info Header */}
      <Card style={styles.tripInfoCard} variant="elevated">
        <CardContent>
          <View style={styles.tripInfoHeader}>
            <View style={styles.tripInfoMain}>
              <Text style={styles.tripInfoName}>{currentTrip.name}</Text>
              <Text style={styles.tripInfoRoute}>
                {currentTrip.startLocation.name} → {currentTrip.endLocation.name}
              </Text>
              <View style={styles.tripInfoMeta}>
                <Text style={styles.tripInfoMetaItem}>
                  <Ionicons name="calendar" size={14} color={COLORS.textMuted} />
                  {formatDate(currentTrip.startDate)} - {currentTrip.endDate ? formatDate(currentTrip.endDate) : 'Ongoing'}
                </Text>
                <Text style={styles.tripInfoMetaItem}>
                  <Ionicons name="people" size={14} color={COLORS.textMuted} />
                  {members.length} members
                </Text>
                <Text style={styles.tripInfoMetaItem}>
                  <Ionicons name="car" size={14} color={COLORS.textMuted} />
                  {vehicles.length} vehicles
                </Text>
              </View>
            </View>
            <View style={[
              styles.tripStatusBadge,
              { backgroundColor: getTripStatusColor(currentTrip.status) },
            ]}>
              <Text style={styles.tripStatusText}>{currentTrip.status.toUpperCase()}</Text>
            </View>
          </View>

          {budget && (
            <View style={styles.tripBudget}>
              <View style={styles.tripBudgetHeader}>
                <Text style={styles.tripBudgetTitle}>Trip Budget</Text>
                <Text style={styles.tripBudgetAmount}>
                  {formatCurrency(budget.totalBudget - budget.spent)} remaining
                </Text>
              </View>
              <View style={styles.tripBudgetBar}>
                <View
                  style={[
                    styles.tripBudgetFill,
                    { width: `${Math.min((budget.spent / budget.totalBudget) * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.tripBudgetDetail}>
                {formatCurrency(budget.spent)} / {formatCurrency(budget.totalBudget)} spent
              </Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatItem
          label="Stops"
          value={`${completedStops.length}/${itinerary.length}`}
          icon="map-marker"
          color="#45B7D1"
        />
        <StatItem
          label="Photos"
          value={media.length.toString()}
          icon="image"
          color="#4ECDC4"
        />
        <StatItem
          label="Expenses"
          value={useAppStore.getState().expenses.length.toString()}
          icon="cash"
          color="#F8B500"
        />
        <StatItem
          label="Checklist"
          value={`${getCompletedChecklistItems()}/${getTotalChecklistItems()}`}
          icon="checkmark-circle"
          color="#2ECC71"
        />
      </View>

      {/* Itinerary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddItineraryStop', { tripId: currentTrip.id })}>
            <Button title="Add Stop" variant="ghost" size="sm" onPress={() => navigation.navigate('AddItineraryStop', { tripId: currentTrip.id })} />
          </TouchableOpacity>
        </View>
        {itinerary.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="map-marker" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Stops Added</Text>
                <Text style={styles.emptyText}>Add stops to plan your route</Text>
                <Button title="Add First Stop" onPress={() => navigation.navigate('AddItineraryStop', { tripId: currentTrip.id })} size="sm" style={{ marginTop: SPACING.md }} />
              </View>
            </CardContent>
          </Card>
        ) : (
          <FlatList
            data={itinerary}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ItineraryItem stop={item} onPress={() => navigation.navigate('ItineraryDetail', { stopId: item.id })} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Vehicles */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicles</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => {}}>
              <Button title="Add Vehicle" variant="ghost" size="sm" onPress={() => {}} />
            </TouchableOpacity>
          )}
        </View>
        {vehicles.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="car-sport" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Vehicles Added</Text>
                <Text style={styles.emptyText}>Add vehicles to track fuel and assignments</Text>
                {isAdmin && (
                  <Button title="Add Vehicle" onPress={() => {}} size="sm" style={{ marginTop: SPACING.md }} />
                )}
              </View>
            </CardContent>
          </Card>
        ) : (
          <View style={styles.vehiclesGrid}>
            {vehicles.map((vehicle) => (
              <VehicleSummaryCard
                key={vehicle.id}
                vehicle={vehicle}
                members={members.filter((m) => m.vehicleId === vehicle.id)}
                onPress={() => navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })}
              />
            ))}
          </View>
        )}
      </View>

      {/* Members */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => {}}>
              <Button title="Invite" variant="ghost" size="sm" onPress={() => {}} />
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberItem member={item} isAdmin={isAdmin} onPress={() => navigation.navigate('MemberProfile', { userId: item.userId })} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Checklists */}
      {checklists.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checklists</Text>
          </View>
          <FlatList
            data={checklists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChecklistSummaryItem checklist={item} onPress={() => navigation.navigate('ChecklistDetail', { checklistId: item.id })} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Trip Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton
            icon="qr-code"
            label="Trip QR Code"
            color="#45B7D1"
            onPress={() => navigation.navigate('TripDetail', { tripId: currentTrip.id })}
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
            onPress={() => navigation.navigate('PhotoAlbum', { tripId: currentTrip.id })}
          />
          <ActionButton
            icon="replay"
            label="Trip Replay"
            color="#E74C3C"
            onPress={() => navigation.navigate('TripReplay', { tripId: currentTrip.id })}
          />
          <ActionButton
            icon="document"
            label="Trip Recap"
            color="#2ECC71"
            onPress={() => navigation.navigate('TripRecap', { tripId: currentTrip.id })}
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

function getTripStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#2ECC71';
    case 'planning': return '#3498DB';
    case 'completed': return '#9B59B6';
    case 'cancelled': return '#E74C3C';
    default: return COLORS.textMuted;
  }
}

function getCompletedChecklistItems(): number {
  return useAppStore.getState().checklists.reduce((sum, c) => sum + c.items.filter(i => i.isCompleted).length, 0);
}

function getTotalChecklistItems(): number {
  return useAppStore.getState().checklists.reduce((sum, c) => sum + c.items.length, 0);
}

const StatItem = ({ label, value, icon, color }: any) => (
  <TouchableOpacity style={styles.statItem} activeOpacity={0.8}>
    <View style={[styles.statItemIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statItemValue}>{value}</Text>
    <Text style={styles.statItemLabel}>{label}</Text>
  </TouchableOpacity>
);

const ItineraryItem = ({ stop, onPress }: any) => (
  <Card style={styles.itineraryItem} variant="default" onPress={onPress}>
    <CardContent>
      <View style={styles.itineraryItemRow}>
        <View style={styles.itineraryNumber}>
          <Text style={[styles.itineraryNumberText, stop.isCompleted && styles.itineraryNumberCompleted]}>{stop.order}</Text>
          {stop.isCompleted && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
        </View>
        <View style={styles.itineraryLine} />
        <View style={styles.itineraryInfo}>
          <View style={styles.itineraryHeader}>
            <Text style={[styles.itineraryName, stop.isCompleted && styles.itineraryCompleted]}>{stop.name}</Text>
            {stop.isCompleted && <Ionicons name="checkmark-circle" size={16} color="#2ECC71" />}
          </View>
          <Text style={styles.itineraryAddress}>{stop.location.address}</Text>
          <View style={styles.itineraryMeta}>
            {stop.arrivalTime && (
              <Text style={styles.itineraryMetaItem}>
                <Ionicons name="time" size={12} color={COLORS.textMuted} />
                Arrive: {formatTime(stop.arrivalTime)}
              </Text>
            )}
            {stop.departureTime && (
              <Text style={styles.itineraryMetaItem}>
                <Ionicons name="time" size={12} color={COLORS.textMuted} />
                Depart: {formatTime(stop.departureTime)}
              </Text>
            )}
            {stop.duration && (
              <Text style={styles.itineraryMetaItem}>
                <Ionicons name="timer" size={12} color={COLORS.textMuted} />
                {formatDuration(stop.duration)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </CardContent>
  </Card>
);

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const VehicleSummaryCard = ({ vehicle, members, onPress }: any) => (
  <Card style={styles.vehicleSummaryCard} variant="elevated" onPress={onPress}>
    <CardContent>
      <View style={styles.vehicleSummaryHeader}>
        <View style={styles.vehicleSummaryIcon}>
          <Ionicons name="car-sport" size={24} color={COLORS.accent} />
        </View>
        <View style={styles.vehicleSummaryInfo}>
          <Text style={styles.vehicleSummaryName}>{vehicle.name}</Text>
          <Text style={styles.vehicleSummaryReg}>{vehicle.registrationNumber}</Text>
        </View>
      </View>
      <View style={styles.vehicleSummaryDetails}>
        <View style={styles.vehicleSummaryDetail}>
          <Ionicons name="people" size={14} color={COLORS.textMuted} />
          <Text>{members.length} passengers</Text>
        </View>
        <View style={styles.vehicleSummaryDetail}>
          <Ionicons name="gas-station" size={14} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel || 0}% fuel</Text>
        </View>
        <View style={styles.vehicleSummaryDetail}>
          <Ionicons name="navigate" size={14} color={COLORS.textMuted} />
          <Text>{vehicle.fuelLevel ? Math.round(vehicle.fuelLevel * 5) : 0} km range</Text>
        </View>
      </View>
      <View style={styles.vehicleSummaryMembers}>
        {members.slice(0, 3).map((member) => (
          <Avatar key={member.userId} name={member.user.name} size="xs" style={styles.memberAvatar} />
        ))}
        {members.length > 3 && (
          <View style={styles.moreMembers}>
            <Text style={styles.moreMembersText}>+{members.length - 3}</Text>
          </View>
        )}
      </View>
    </CardContent>
  </Card>
);

const MemberItem = ({ member, isAdmin, onPress }: any) => (
  <TouchableOpacity style={styles.memberItem} onPress={onPress} activeOpacity={0.8}>
    <Avatar name={member.user.name} size="sm" source={member.user.avatar} />
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

const ChecklistSummaryItem = ({ checklist, onPress }: any) => {
  const completed = checklist.items.filter((i) => i.isCompleted).length;
  const total = checklist.items.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return (
    <Card style={styles.checklistItem} variant="default" onPress={onPress}>
      <CardContent>
        <View style={styles.checklistHeader}>
          <Text style={styles.checklistTitle}>{checklist.name}</Text>
          <Text style={styles.checklistProgress}>{completed}/{total}</Text>
        </View>
        <View style={styles.checklistBar}>
          <View
            style={[
              styles.checklistFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
      </CardContent>
    </Card>
  );
};

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
    marginBottom: SPACING.md,
  },
  emptyButtons: {
    width: '100%',
    gap: SPACING.md,
  },
  tripInfoCard: {
    marginBottom: SPACING.lg,
  },
  tripInfoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tripInfoMain: {
    flex: 1,
  },
  tripInfoName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tripInfoRoute: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  tripInfoMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  tripInfoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  tripStatusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  tripStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  tripBudget: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tripBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  tripBudgetTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  tripBudgetAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accent,
  },
  tripBudgetBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  tripBudgetFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  tripBudgetDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statItemIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statItemValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statItemLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
  emptyContent: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  itineraryItem: {},
  itineraryItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  itineraryNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itineraryNumberText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  itineraryNumberCompleted: {
    backgroundColor: '#2ECC71',
  },
  itineraryLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 34,
  },
  itineraryInfo: {
    flex: 1,
  },
  itineraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  itineraryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
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
    flexWrap: 'wrap',
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
  vehiclesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  vehicleSummaryCard: {
    width: '48%',
  },
  vehicleSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  vehicleSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleSummaryInfo: {
    flex: 1,
  },
  vehicleSummaryName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  vehicleSummaryReg: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  vehicleSummaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  vehicleSummaryDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleSummaryMembers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
  },
  memberAvatar: {
    marginLeft: -6,
  },
  moreMembers: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
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
  checklistItem: {},
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  checklistTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  checklistProgress: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  checklistBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  checklistFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 3,
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