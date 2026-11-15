import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, VEHICLE_FUEL_TYPES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId, formatCurrency, formatNumber } from '@/utils/helpers';

type Props = RootStackScreenProps<'FuelDetail'>;

export default function FuelDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId, entryId } = route.params;
  const { currentTrip, vehicles, fuelEntries, addFuelEntry, updateFuelEntry, user } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : useAppStore.getState().trips.find(t => t.id === tripId);
  const tripVehicles = vehicles;
  const existingEntry = entryId ? fuelEntries.find(e => e.id === entryId) : null;
  const isEditing = !!entryId;

  const [formData, setFormData] = useState({
    vehicleId: tripVehicles[0]?.id || '',
    fuelType: 'petrol' as any,
    amount: '',
    litres: '',
    pricePerLitre: '',
    odometer: '',
    mileage: '',
    paidBy: user?.id || '',
    receiptUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        vehicleId: existingEntry.vehicleId,
        fuelType: existingEntry.fuelType,
        amount: existingEntry.amount.toString(),
        litres: existingEntry.litres.toString(),
        pricePerLitre: existingEntry.pricePerLitre.toString(),
        odometer: existingEntry.odometer.toString(),
        mileage: existingEntry.mileage.toString(),
        paidBy: existingEntry.paidBy,
        receiptUrl: existingEntry.receiptUrl || '',
      });
    }
  }, [existingEntry]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    calculateDerived();
  };

  const calculateDerived = () => {
    const amount = parseFloat(formData.amount) || 0;
    const litres = parseFloat(formData.litres) || 0;
    const price = parseFloat(formData.pricePerLitre) || 0;
    const odometer = parseFloat(formData.odometer) || 0;

    if (amount > 0 && litres > 0 && !formData.pricePerLitre) {
      setFormData(prev => ({ ...prev, pricePerLitre: (amount / litres).toFixed(2) }));
    }
    if (litres > 0 && price > 0 && !formData.amount) {
      setFormData(prev => ({ ...prev, amount: (litres * price).toFixed(2) }));
    }
    if (amount > 0 && price > 0 && !formData.litres) {
      setFormData(prev => ({ ...prev, litres: (amount / price).toFixed(2) }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);
    const litres = parseFloat(formData.litres);
    const price = parseFloat(formData.pricePerLitre);
    const odometer = parseFloat(formData.odometer);

    if (!formData.vehicleId) newErrors.vehicleId = 'Select a vehicle';
    if (!amount || amount <= 0) newErrors.amount = 'Enter amount';
    if (!litres || litres <= 0) newErrors.litres = 'Enter litres';
    if (!price || price <= 0) newErrors.pricePerLitre = 'Enter price per litre';
    if (!odometer || odometer <= 0) newErrors.odometer = 'Enter odometer reading';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !trip) return;

    const amount = parseFloat(formData.amount);
    const litres = parseFloat(formData.litres);
    const price = parseFloat(formData.pricePerLitre);
    const odometer = parseFloat(formData.odometer);
    const mileage = parseFloat(formData.mileage) || (odometer > 0 && litres > 0 ? odometer / litres : 0);

    const entryData = {
      id: isEditing ? entryId! : generateId(),
      tripId: trip.id,
      vehicleId: formData.vehicleId,
      vehicle: tripVehicles.find(v => v.id === formData.vehicleId)!,
      fuelType: formData.fuelType,
      amount,
      litres,
      pricePerLitre: price,
      odometer,
      mileage,
      paidBy: formData.paidBy,
      paidByUser: useAppStore.getState().members.find(m => m.userId === formData.paidBy)?.user!,
      receiptUrl: formData.receiptUrl || undefined,
      createdAt: isEditing ? existingEntry!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      updateFuelEntry(entryData);
    } else {
      addFuelEntry(entryData);
    }
    navigation.goBack();
  };

  const selectedVehicle = tripVehicles.find(v => v.id === formData.vehicleId);
  const costPerKm = formData.mileage && formData.pricePerLitre 
    ? (parseFloat(formData.pricePerLitre) / parseFloat(formData.mileage)).toFixed(2)
    : '—';

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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</Text>
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

              {/* Fuel Type */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Fuel Type</Text>
                <TouchableOpacity style={styles.fuelTypeButton}>
                  <View style={styles.fuelTypeButtonContent}>
                    <Text style={styles.fuelTypeText}>{VEHICLE_FUEL_TYPES.find(f => f.id === formData.fuelType)?.label}</Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Amount, Litres, Price */}
              <View style={styles.calcRow}>
                <Input
                  label="Amount (₹)"
                  value={formData.amount}
                  onChangeText={value => handleChange('amount', value)}
                  error={errors.amount}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Input
                  label="Litres"
                  value={formData.litres}
                  onChangeText={value => handleChange('litres', value)}
                  error={errors.litres}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Input
                  label="Price/L (₹)"
                  value={formData.pricePerLitre}
                  onChangeText={value => handleChange('pricePerLitre', value)}
                  error={errors.pricePerLitre}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>

              {/* Odometer & Mileage */}
              <View style={styles.calcRow}>
                <Input
                  label="Odometer (km)"
                  value={formData.odometer}
                  onChangeText={value => handleChange('odometer', value)}
                  error={errors.odometer}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Input
                  label="Mileage (km/L)"
                  value={formData.mileage}
                  onChangeText={value => handleChange('mileage', value)}
                  keyboardType="numeric"
                  placeholder="Auto-calculated"
                  editable={false}
                />
              </View>

              {/* Derived Values */}
              <View style={styles.derivedValues}>
                <DerivedValue label="Cost/km" value={`₹${costPerKm}`} icon="cash" />
                <DerivedValue label="Total Fuel" value={`${parseFloat(formData.litres) || 0} L`} icon="gas-station" />
                <DerivedValue label="Est. Range" value={`${Math.round((parseFloat(formData.mileage) || 0) * (selectedVehicle?.tankCapacity || 50))} km`} icon="navigate" />
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

          {/* Quick Stats from History */}
          {fuelEntries.length > 0 && (
            <Card style={styles.statsCard} variant="elevated">
              <CardContent>
                <Text style={styles.statsTitle}>Trip Fuel Summary</Text>
                <View style={styles.statsGrid}>
                  <StatItem label="Total Fuel" value={`${fuelEntries.reduce((sum, e) => sum + e.litres, 0).toFixed(1)} L`} icon="gas-station" color="#FF6B35" />
                  <StatItem label="Total Cost" value={formatCurrency(fuelEntries.reduce((sum, e) => sum + e.amount, 0))} icon="cash" color="#F8B500" />
                  <StatItem label="Avg Mileage" value={`${(fuelEntries.reduce((sum, e) => sum + e.mileage, 0) / fuelEntries.length).toFixed(1)} km/L`} icon="speedometer" color="#4ECDC4" />
                  <StatItem label="Avg Cost/km" value={`₹${(fuelEntries.reduce((sum, e) => sum + e.amount / e.mileage, 0) / fuelEntries.length).toFixed(2)}`} icon="cash" color="#45B7D1" />
                </View>
              </CardContent>
            </Card>
          )}

          <Button
            title={isEditing ? 'Save Changes' : 'Add Fuel Entry'}
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

const DerivedValue = ({ label, value, icon }: any) => (
  <View style={styles.derivedItem}>
    <View style={[styles.derivedIcon, { backgroundColor: `${COLORS.accent}20` }]}>
      <Ionicons name={icon} size={20} color={COLORS.accent} />
    </View>
    <View>
      <Text style={styles.derivedLabel}>{label}</Text>
      <Text style={styles.derivedValue}>{value}</Text>
    </View>
  </View>
);

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
  fuelTypeButton: {
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
  fuelTypeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fuelTypeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  calcRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  derivedValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  derivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  derivedIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  derivedLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  derivedValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
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
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
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
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
});