import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, VEHICLE_FUEL_TYPES, VEHICLE_HEALTH_TYPES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatCurrency, formatNumber } from '@/utils/helpers';

type Props = RootStackScreenProps<'VehicleDetail'>;

export default function VehicleDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { vehicleId } = route.params;
  const { currentTrip, vehicles, members, fuelEntries, tollEntries, updateVehicle } = useAppStore();

  const vehicle = vehicles.find(v => v.id === vehicleId);
  const trip = currentTrip;
  const vehicleMembers = members.filter(m => m.vehicleId === vehicleId);
  const vehicleFuel = fuelEntries.filter(f => f.vehicleId === vehicleId);
  const vehicleTolls = tollEntries.filter(t => t.vehicleId === vehicleId);
  const driver = members.find(m => m.userId === vehicle?.driverId);
  const passengers = vehicleMembers.filter(m => !m.isDriver);
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const isDriver = currentUser?.userId === vehicle?.driverId;
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role || '');

  if (!vehicle) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Vehicle not found</Text></View>;
  }

  const totalFuel = vehicleFuel.reduce((sum, f) => sum + f.amount, 0);
  const totalToll = vehicleTolls.reduce((sum, t) => sum + t.amount, 0);
  const avgMileage = vehicleFuel.length > 0 ? vehicleFuel.reduce((sum, f) => sum + f.mileage, 0) / vehicleFuel.length : 0;
  const totalLitres = vehicleFuel.reduce((sum, f) => sum + f.litres, 0);

  const [editingHealth, setEditingHealth] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<Record<string, string>>({});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => {}} style={styles.editButton}>
            <Ionicons name="create" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle Header */}
      <Card style={styles.vehicleHeaderCard} variant="elevated">
        <CardContent>
          <View style={styles.vehicleHeaderRow}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-sport" size={40} color={COLORS.accent} />
            </View>
            <View style={styles.vehicleHeaderInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleReg}>{vehicle.registrationNumber}</Text>
              <View style={styles.vehicleTags}>
                <View style={[styles.tag, { backgroundColor: `${COLORS.accent}20` }]}>
                  <Text style={styles.tagText}>{VEHICLE_FUEL_TYPES.find(f => f.id === vehicle.fuelType)?.label}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#4ECDC420' }]}>
                  <Text style={{ color: '#4ECDC4' }}>{vehicle.tankCapacity}L Tank</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.vehicleStats}>
            <StatItem label="Fuel Level" value={`${vehicle.fuelLevel || 0}%`} icon="battery" color="#4ECDC4" />
            <StatItem label="Range" value={`${vehicle.fuelLevel ? Math.round(vehicle.fuelLevel * 5) : 0} km`} icon="navigate" color="#45B7D1" />
            <StatItem label="Odometer" value={`${formatNumber(vehicle.currentMileage)} km`} icon="speedometer" color="#F8B500" />
            <StatItem label="Avg Mileage" value={`${avgMileage.toFixed(1)} km/L`} icon="gas-station" color="#FF6B35" />
          </View>

          <View style={styles.vehicleCosts}>
            <CostItem label="Total Fuel" value={formatCurrency(totalFuel)} icon="gas-station" color="#FF6B35" />
            <CostItem label="Total Toll" value={formatCurrency(totalToll)} icon="road" color="#4ECDC4" />
            <CostItem label="Total Cost" value={formatCurrency(totalFuel + totalToll)} icon="cash" color="#F8B500" />
          </View>
        </CardContent>
      </Card>

      {/* Driver & Passengers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Occupants</Text>
        <Card style={styles.occupantsCard} variant="elevated">
          <CardContent>
            {driver && (
              <View style={styles.driverSection}>
                <Text style={styles.driverLabel}>DRIVER</Text>
                <TouchableOpacity style={styles.driverRow} onPress={() => navigation.navigate('MemberProfile', { userId: driver.userId })}>
                  <Avatar name={driver.user.name} size="md" source={driver.user.avatar} />
                  <View>
                    <Text style={styles.driverName}>{driver.user.name}</Text>
                    <Text style={styles.driverRole}>Driver</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {passengers.length > 0 && (
              <View style={styles.passengersSection}>
                <Text style={styles.passengersLabel}>PASSENGERS ({passengers.length})</Text>
                {passengers.map(member => (
                  <TouchableOpacity key={member.userId} style={styles.passengerRow} onPress={() => navigation.navigate('MemberProfile', { userId: member.userId })}>
                    <Avatar name={member.user.name} size="sm" source={member.user.avatar} />
                    <Text style={styles.passengerName}>{member.user.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {vehicleMembers.length === 0 && (
              <View style={styles.emptyOccupants}>
                <Ionicons name="people" size={32} color={COLORS.textMuted} />
                <Text>No occupants assigned</Text>
              </View>
            )}
          </CardContent>
        </Card>
      </View>

      {/* Vehicle Health Checklist */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Checklist</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => navigation.navigate('VehicleHealth', { vehicleId })}>
              <Button title="Manage" variant="ghost" size="sm" onPress={() => navigation.navigate('VehicleHealth', { vehicleId })} />
            </TouchableOpacity>
          )}
        </View>
        <Card style={styles.healthCard} variant="elevated">
          <CardContent>
            {VEHICLE_HEALTH_TYPES.map(type => (
              <HealthRow
                key={type.id}
                type={type}
                status={healthStatus[type.id] || 'unknown'}
                onPress={() => setEditingHealth(type.id)}
              />
            ))}
          </CardContent>
        </Card>
      </View>

      {/* Fuel History */}
      {vehicleFuel.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fuel History ({vehicleFuel.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FuelDetail', { tripId: trip?.id, vehicleId })}>
              <Button title="Add" variant="ghost" size="sm" onPress={() => navigation.navigate('FuelDetail', { tripId: trip?.id, vehicleId })} />
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {vehicleFuel.slice(0, 5).map(entry => (
              <FuelHistoryRow key={entry.id} entry={entry} onPress={() => navigation.navigate('FuelDetail', { entryId: entry.id })} />
            ))}
          </View>
        </View>
      )}

      {/* Toll History */}
      {vehicleTolls.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Toll History ({vehicleTolls.length})</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TollDetail', { tripId: trip?.id, vehicleId })}>
              <Button title="Add" variant="ghost" size="sm" onPress={() => navigation.navigate('TollDetail', { tripId: trip?.id, vehicleId })} />
            </TouchableOpacity>
          </View>
          <View style={styles.historyList}>
            {vehicleTolls.slice(0, 5).map(entry => (
              <TollHistoryRow key={entry.id} entry={entry} onPress={() => navigation.navigate('TollDetail', { entryId: entry.id })} />
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton icon="gas-station" label="Add Fuel" color="#FF6B35" onPress={() => navigation.navigate('FuelDetail', { tripId: trip?.id, vehicleId })} />
          <ActionButton icon="road" label="Add Toll" color="#4ECDC4" onPress={() => navigation.navigate('TollDetail', { tripId: trip?.id, vehicleId })} />
          <ActionButton icon="construct" label="Health Check" color="#9B59B6" onPress={() => navigation.navigate('VehicleHealth', { vehicleId })} />
        </View>
      </View>
    </ScrollView>
  );
}

const StatItem = ({ label, value, icon, color }: any) => (
  <View style={styles.statItem}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const CostItem = ({ label, value, icon, color }: any) => (
  <View style={styles.costItem}>
    <View style={[styles.costIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View>
      <Text style={styles.costLabel}>{label}</Text>
      <Text style={styles.costValue}>{value}</Text>
    </View>
  </View>
);

const HealthRow = ({ type, status, onPress }: any) => {
  const statusColors: Record<string, string> = {
    good: '#2ECC71',
    warning: '#F39C12',
    critical: '#E74C3C',
    unknown: COLORS.textMuted,
  };
  const statusLabels: Record<string, string> = {
    good: 'Good',
    warning: 'Warning',
    critical: 'Critical',
    unknown: 'Not checked',
  };
  return (
    <TouchableOpacity style={styles.healthRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.healthIcon}>
        <Text style={styles.healthIconText}>{type.icon}</Text>
      </View>
      <Text style={styles.healthLabel}>{type.label}</Text>
      <View style={[styles.healthStatusBadge, { backgroundColor: `${statusColors[status]}20` }]}>
        <Text style={[styles.healthStatusText, { color: statusColors[status] }]}>{statusLabels[status]}</Text>
      </View>
    </TouchableOpacity>
  );
};

const FuelHistoryRow = ({ entry, onPress }: any) => (
  <TouchableOpacity style={styles.historyRow} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.historyLeft}>
      <Text style={styles.historyDate}>{require('@/utils/helpers').formatRelativeTime(entry.createdAt)}</Text>
      <Text style={styles.historyDesc}>{entry.litres}L @ ₹{entry.pricePerLitre}/L</Text>
    </View>
    <View style={styles.historyRight}>
      <Text style={styles.historyAmount}>{formatCurrency(entry.amount)}</Text>
      <Text style={styles.historyMileage}>{entry.mileage.toFixed(1)} km/L</Text>
    </View>
  </TouchableOpacity>
);

const TollHistoryRow = ({ entry, onPress }: any) => (
  <TouchableOpacity style={styles.historyRow} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.historyLeft}>
      <Text style={styles.historyDate}>{require('@/utils/helpers').formatRelativeTime(entry.createdAt)}</Text>
      <Text style={styles.historyDesc}>{entry.name}</Text>
    </View>
    <Text style={styles.historyAmount}>{formatCurrency(entry.amount)}</Text>
  </TouchableOpacity>
);

const ActionButton = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={[styles.actionButton, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
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
  editButton: {
    padding: SPACING.xs,
  },
  vehicleHeaderCard: {
    marginBottom: SPACING.lg,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  vehicleIcon: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleHeaderInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  vehicleReg: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  vehicleTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  tagText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.accent,
  },
  vehicleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  vehicleCosts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  costIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  costValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
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
  occupantsCard: {},
  driverSection: {
    marginBottom: SPACING.lg,
  },
  driverLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  driverName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  driverRole: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    fontWeight: '500',
  },
  passengersSection: {},
  passengersLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  passengerName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  emptyOccupants: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  healthCard: {},
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  healthIconText: {
    fontSize: 18,
  },
  healthLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  healthStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  healthStatusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  historyList: {
    gap: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  historyDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  historyMileage: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
});