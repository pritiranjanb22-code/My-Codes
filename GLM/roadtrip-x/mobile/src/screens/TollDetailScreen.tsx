import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId, formatCurrency } from '@/utils/helpers';

type Props = RootStackScreenProps<'TollDetail'>;

export default function TollDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId, entryId } = route.params;
  const { currentTrip, vehicles, tollEntries, addTollEntry, updateTollEntry, user } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : useAppStore.getState().trips.find(t => t.id === tripId);
  const tripVehicles = vehicles;
  const existingEntry = entryId ? tollEntries.find(e => e.id === entryId) : null;
  const isEditing = !!entryId;

  const [formData, setFormData] = useState({
    vehicleId: tripVehicles[0]?.id || '',
    amount: '',
    location: { name: '', address: '', latitude: 0, longitude: 0 },
    name: '',
    paidBy: user?.id || '',
    receiptUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        vehicleId: existingEntry.vehicleId,
        amount: existingEntry.amount.toString(),
        location: existingEntry.location,
        name: existingEntry.name,
        paidBy: existingEntry.paidBy,
        receiptUrl: existingEntry.receiptUrl || '',
      });
    }
  }, [existingEntry]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);

    if (!formData.vehicleId) newErrors.vehicleId = 'Select a vehicle';
    if (!amount || amount <= 0) newErrors.amount = 'Enter toll amount';
    if (!formData.name.trim()) newErrors.name = 'Enter toll plaza name';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !trip) return;

    const entryData = {
      id: isEditing ? entryId! : generateId(),
      tripId: trip.id,
      vehicleId: formData.vehicleId,
      vehicle: tripVehicles.find(v => v.id === formData.vehicleId)!,
      amount: parseFloat(formData.amount),
      location: formData.location,
      name: formData.name,
      paidBy: formData.paidBy,
      paidByUser: useAppStore.getState().members.find(m => m.userId === formData.paidBy)?.user!,
      receiptUrl: formData.receiptUrl || undefined,
      createdAt: isEditing ? existingEntry!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      updateTollEntry(entryData);
    } else {
      addTollEntry(entryData);
    }
    navigation.goBack();
  };

  const selectedVehicle = tripVehicles.find(v => v.id === formData.vehicleId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Toll Entry' : 'Add Toll Entry'}</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              {/* Vehicle Selection */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Vehicle</Text>
                <TouchableOpacity style={styles.vehicleButton}>
                  <View style={styles.vehicleButtonContent}>
                    <Ionicons name="car-sport" size={20} color={COLORS.accent} />
                    <Text style={styles.vehicleButtonText}>{selectedVehicle?.name || 'Select vehicle'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              {errors.vehicleId && <Text style={styles.errorText}>{errors.vehicleId}</Text>}

              {/* Toll Amount */}
              <Input
                label="Toll Amount (₹)"
                value={formData.amount}
                onChangeText={value => handleChange('amount', value)}
                error={errors.amount}
                keyboardType="numeric"
                placeholder="0"
                leftIcon={<Text style={styles.currencyPrefix}>₹</Text>}
              />

              {/* Toll Plaza Name */}
              <Input
                label="Toll Plaza Name"
                value={formData.name}
                onChangeText={value => handleChange('name', value)}
                error={errors.name}
                placeholder="e.g., Bangalore Expressway"
                autoCapitalize="words"
              />

              {/* Location */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Location</Text>
                <TouchableOpacity style={styles.locationButton}>
                  <View style={styles.locationButtonContent}>
                    <Ionicons name="location" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.locationButtonText}>
                      {formData.location.name || formData.location.address || 'Select location'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Paid By */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Paid By</Text>
                <TouchableOpacity style={styles.paidByButton}>
                  <Text style={styles.paidByButtonText}>
                    {useAppStore.getState().members.find(m => m.userId === formData.paidBy)?.user.name || 'Select'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Receipt */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Receipt</Text>
                <TouchableOpacity style={styles.receiptButton}>
                  <Ionicons name="camera" size={20} color={COLORS.accent} />
                  <Text style={styles.receiptButtonText}>Attach Receipt</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Trip Toll Summary */}
          {tollEntries.length > 0 && (
            <Card style={styles.statsCard} variant="elevated">
              <CardContent>
                <Text style={styles.statsTitle}>Trip Toll Summary</Text>
                <View style={styles.statsGrid}>
                  <StatItem label="Total Toll" value={formatCurrency(tollEntries.reduce((sum, e) => sum + e.amount, 0))} icon="road" color="#4ECDC4" />
                  <StatItem label="Entries" value={tollEntries.length.toString()} icon="list" color="#45B7D1" />
                  <StatItem label="Avg per Entry" value={formatCurrency(tollEntries.reduce((sum, e) => sum + e.amount, 0) / tollEntries.length)} icon="calculator" color="#F8B500" />
                </View>
                <View style={styles.tollBreakdown}>
                  <Text style={styles.breakdownTitle}>By Vehicle</Text>
                  {tripVehicles.map(vehicle => {
                    const vehicleTolls = tollEntries.filter(e => e.vehicleId === vehicle.id);
                    const vehicleTotal = vehicleTolls.reduce((sum, e) => sum + e.amount, 0);
                    return vehicleTolls.length > 0 && (
                      <View key={vehicle.id} style={styles.vehicleTollRow}>
                        <View style={styles.vehicleTollInfo}>
                          <Ionicons name="car-sport" size={16} color={COLORS.accent} />
                          <Text>{vehicle.name}</Text>
                        </View>
                        <Text style={styles.vehicleTollAmount}>{formatCurrency(vehicleTotal)} ({vehicleTolls.length})</Text>
                      </View>
                    );
                  })}
                </View>
              </CardContent>
            </Card>
          )}

          <Button
            title={isEditing ? 'Save Changes' : 'Add Toll Entry'}
            onPress={handleSubmit}
            fullWidth
            size="lg"
            style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  content: {
    paddingVertical: SPACING.md,
  },
  formCard: {},
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vehicleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  vehicleButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingRight: SPACING.sm,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  locationButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  paidByButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paidByButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
  statsCard: {
    marginTop: SPACING.lg,
  },
  statsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tollBreakdown: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  vehicleTollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  vehicleTollInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  vehicleTollAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
});