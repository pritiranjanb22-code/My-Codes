import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId, formatDate, formatTime } from '@/utils/helpers';

type Props = RootStackScreenProps<'AddItineraryStop'>;

export default function AddItineraryStopScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId, stopId } = route.params;
  const { currentTrip, itinerary, vehicles, addItineraryStop, updateItineraryStop } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : useAppStore.getState().trips.find(t => t.id === tripId);
  const tripItinerary = itinerary;
  const existingStop = stopId ? tripItinerary.find(s => s.id === stopId) : null;
  const isEditing = !!stopId;
  const nextOrder = tripItinerary.length > 0 ? Math.max(...tripItinerary.map(s => s.order)) + 1 : 1;

  const [formData, setFormData] = useState({
    name: '',
    location: { name: '', address: '', latitude: 0, longitude: 0 },
    arrivalTime: '',
    departureTime: '',
    duration: '',
    notes: '',
    order: isEditing ? existingStop!.order : nextOrder,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingStop) {
      setFormData({
        name: existingStop.name,
        location: existingStop.location,
        arrivalTime: existingStop.arrivalTime ? existingStop.arrivalTime.slice(0, 16) : '',
        departureTime: existingStop.departureTime ? existingStop.departureTime.slice(0, 16) : '',
        duration: existingStop.duration?.toString() || '',
        notes: existingStop.notes || '',
        order: existingStop.order,
      });
    }
  }, [existingStop]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Stop name is required';
    if (!formData.location.name) newErrors.location = 'Select a location';
    if (formData.arrivalTime && formData.departureTime) {
      const arr = new Date(formData.arrivalTime).getTime();
      const dep = new Date(formData.departureTime).getTime();
      if (dep <= arr) newErrors.departureTime = 'Departure must be after arrival';
    }
    if (formData.duration && (isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0)) {
      newErrors.duration = 'Enter valid duration in minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !trip) return;

    const stopData = {
      id: isEditing ? stopId! : generateId(),
      tripId: trip.id,
      order: formData.order,
      name: formData.name,
      location: formData.location,
      arrivalTime: formData.arrivalTime || undefined,
      departureTime: formData.departureTime || undefined,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      notes: formData.notes || undefined,
      photos: [],
      expenses: [],
      activities: [],
      isCompleted: false,
      createdAt: isEditing ? existingStop!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      updateItineraryStop(stopData);
    } else {
      addItineraryStop(stopData);
    }
    navigation.goBack();
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
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Stop' : 'Add Stop'}</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <Input
                label="Stop Name"
                value={formData.name}
                onChangeText={value => handleChange('name', value)}
                error={errors.name}
                placeholder="e.g., Mysore Palace"
                autoCapitalize="words"
              />

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
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

              <View style={styles.timeRow}>
                <Input
                  label="Arrival"
                  value={formData.arrivalTime}
                  onChangeText={value => handleChange('arrivalTime', value)}
                  error={errors.arrivalTime}
                  editable={false}
                  rightIcon={<Ionicons name="time" size={20} color={COLORS.textSecondary} />}
                  placeholder="Select arrival"
                />
                <Input
                  label="Departure"
                  value={formData.departureTime}
                  onChangeText={value => handleChange('departureTime', value)}
                  error={errors.departureTime}
                  editable={false}
                  rightIcon={<Ionicons name="time" size={20} color={COLORS.textSecondary} />}
                  placeholder="Select departure"
                />
              </View>

              <Input
                label="Duration (minutes)"
                value={formData.duration}
                onChangeText={value => handleChange('duration', value)}
                error={errors.duration}
                keyboardType="numeric"
                placeholder="Auto-calculated from times"
              />

              <Input
                label="Notes (Optional)"
                value={formData.notes}
                onChangeText={value => handleChange('notes', value)}
                multiline
                numberOfLines={3}
                placeholder="Add any notes about this stop"
                autoCapitalize="sentences"
              />

              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Order</Text>
                <View style={styles.orderControl}>
                  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, order: Math.max(1, prev.order - 1) }))} style={styles.orderButton}>
                    <Ionicons name="remove" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.orderValue}>{formData.order}</Text>
                  <TouchableOpacity onPress={() => setFormData(prev => ({ ...prev, order: prev.order + 1 }))} style={styles.orderButton}>
                    <Ionicons name="add" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card style={styles.quickCard} variant="outlined">
            <CardContent>
              <Text style={styles.quickTitle}>Quick Add from Suggestions</Text>
              <View style={styles.suggestionButtons}>
                <SuggestionButton icon="restaurant" label="Restaurant" color="#F8B500" onPress={() => {}} />
                <SuggestionButton icon="gas-station" label="Fuel Stop" color="#FF6B35" onPress={() => {}} />
                <SuggestionButton icon="hotel" label="Hotel" color="#96CEB4" onPress={() => {}} />
                <SuggestionButton icon="map-marker" label="Viewpoint" color="#45B7D1" onPress={() => {}} />
              </View>
            </CardContent>
          </Card>

          <Button
            title={isEditing ? 'Save Changes' : 'Add Stop'}
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

const SuggestionButton = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={[styles.suggestionButton, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.suggestionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={[styles.suggestionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
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
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  orderButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    minWidth: 40,
    textAlign: 'center',
  },
  quickCard: {
    marginTop: SPACING.lg,
  },
  quickTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  suggestionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  suggestionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
});