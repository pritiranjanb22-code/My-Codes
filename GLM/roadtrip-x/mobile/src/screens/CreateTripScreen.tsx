import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, VEHICLE_FUEL_TYPES } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { apiService } from '@/services/api';
import { generateId, formatDate } from '@/utils/helpers';

type Props = RootStackScreenProps<'CreateTrip'>;

export default function CreateTripScreen({ navigation }: Props) {
  const { setCurrentTrip, addTrip, user, setAuthLoading } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startLocation: { name: '', address: '', latitude: 12.9716, longitude: 77.5946 },
    endLocation: { name: '', address: '', latitude: 12.9716, longitude: 77.5946 },
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: '',
    currency: 'INR',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required';
    }

    if (!formData.startLocation.name) {
      newErrors.startLocation = 'Start location is required';
    }

    if (!formData.endLocation.name) {
      newErrors.endLocation = 'End location is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.budget && isNaN(Number(formData.budget))) {
      newErrors.budget = 'Budget must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTrip = async () => {
    if (!validateForm() || !user) return;

    setIsCreating(true);
    try {
      const newTrip = {
        id: generateId(),
        name: formData.name,
        description: formData.description,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        status: 'planning' as const,
        ownerId: user.id,
        budget: formData.budget ? Number(formData.budget) : undefined,
        currency: formData.currency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addTrip(newTrip);
      setCurrentTrip(newTrip);
      navigation.navigate('TripDetail', { tripId: newTrip.id });
    } catch (error) {
      console.error('Create trip error:', error);
      alert('Failed to create trip. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

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
          <Text style={styles.headerTitle}>Create Trip</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Plan Your Road Trip</Text>
          <Text style={styles.subtitle}>Fill in the details to create a new trip</Text>

          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Basic Info</Text>
                <Input
                  label="Trip Name"
                  placeholder="e.g., Bangalore → Coorg Road Trip"
                  value={formData.name}
                  onChangeText={(value) => handleChange('name', value)}
                  error={errors.name}
                />
                <Input
                  label="Description (Optional)"
                  placeholder="Add a description for your trip"
                  value={formData.description}
                  onChangeText={(value) => handleChange('description', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Route</Text>
                <View style={styles.locationRow}>
                  <View style={styles.locationInput}>
                    <Text style={styles.locationLabel}>From</Text>
                    <TouchableOpacity style={styles.locationButton} onPress={() => handleLocationPick('start')}>
                      <View style={styles.locationButtonContent}>
                        <Ionicons name="location" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.locationButtonText}>
                          {formData.startLocation.name || 'Select start location'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {errors.startLocation && <Text style={styles.errorText}>{errors.startLocation}</Text>}
                  </View>
                  <Ionicons name="arrow-forward" size={24} color={COLORS.accent} style={styles.arrowIcon} />
                  <View style={styles.locationInput}>
                    <Text style={styles.locationLabel}>To</Text>
                    <TouchableOpacity style={styles.locationButton} onPress={() => handleLocationPick('end')}>
                      <View style={styles.locationButtonContent}>
                        <Ionicons name="location" size={18} color={COLORS.textSecondary} />
                        <Text style={styles.locationButtonText}>
                          {formData.endLocation.name || 'Select end location'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {errors.endLocation && <Text style={styles.errorText}>{errors.endLocation}</Text>}
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Dates</Text>
                <View style={styles.dateRow}>
                  <Input
                    label="Start Date"
                    value={formData.startDate}
                    onChangeText={(value) => handleChange('startDate', value)}
                    error={errors.startDate}
                    editable={false}
                    rightIcon={<Ionicons name="calendar" size={20} color={COLORS.textSecondary} />}
                  />
                  <Input
                    label="End Date (Optional)"
                    value={formData.endDate}
                    onChangeText={(value) => handleChange('endDate', value)}
                    editable={false}
                    rightIcon={<Ionicons name="calendar" size={20} color={COLORS.textSecondary} />}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Budget (Optional)</Text>
                <Input
                  label="Total Budget"
                  placeholder="e.g., 30000"
                  value={formData.budget}
                  onChangeText={(value) => handleChange('budget', value)}
                  error={errors.budget}
                  keyboardType="numeric"
                  leftIcon={<Text style={styles.currencyPrefix}>₹</Text>}
                />
              </View>
            </CardContent>
          </Card>

          <Button
            title={isCreating ? 'Creating...' : 'Create Trip'}
            onPress={handleCreateTrip}
            fullWidth
            size="lg"
            disabled={isCreating}
            loading={isCreating}
          />

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function handleLocationPick(type: 'start' | 'end') {
  console.log('Pick location for:', type);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
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
    paddingVertical: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  formCard: {},
  formSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  locationInput: {
    flex: 1,
  },
  locationLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
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
  arrowIcon: {
    marginHorizontal: SPACING.xs,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  currencyPrefix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingRight: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});