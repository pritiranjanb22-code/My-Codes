import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, EMERGENCY_TYPES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatRelativeTime, formatDistance } from '@/utils/helpers';

type Props = RootStackScreenProps<'Emergency'>;

export default function EmergencyScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { emergencyEvents, members, currentTrip, trips, addEmergencyEvent } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find(t => t.id === tripId);
  const tripEmergencies = emergencyEvents;
  const activeEmergencies = tripEmergencies.filter(e => e.status === 'active');
  const resolvedEmergencies = tripEmergencies.filter(e => e.status === 'resolved');

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showTrigger, setShowTrigger] = useState(false);
  const [description, setDescription] = useState('');

  const handleTriggerEmergency = (type: string) => {
    setSelectedType(type);
    setShowTrigger(true);
  };

  const confirmEmergency = () => {
    if (!trip) return;
    const emergency = {
      id: `emergency-${Date.now()}`,
      tripId: trip.id,
      userId: useAppStore.getState().user?.id || '',
      user: useAppStore.getState().user!,
      type: selectedType as any,
      location: useAppStore.getState().currentLocation || { latitude: 0, longitude: 0, address: 'Current location' },
      description,
      status: 'active' as const,
      notifiedMembers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addEmergencyEvent(emergency);
    setShowTrigger(false);
    setDescription('');
    setSelectedType(null);
    Alert.alert('Emergency Triggered', 'Your group has been notified. Help is on the way.');
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
          <Text style={styles.headerTitle}>Emergency</Text>
        </View>

        {showTrigger && selectedType && (
          <View style={styles.triggerModal}>
            <Card style={styles.triggerCard} variant="elevated">
              <CardContent>
                <View style={styles.triggerHeader}>
                  <View style={[styles.triggerTypeBadge, { backgroundColor: EMERGENCY_TYPES.find(t => t.id === selectedType)?.color }]}>
                    <Text style={styles.triggerTypeText}>{EMERGENCY_TYPES.find(t => t.id === selectedType)?.label}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setShowTrigger(false); setSelectedType(null); }} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.triggerTitle}>Confirm Emergency</Text>
                <Text style={styles.triggerDescription}>This will notify all trip members immediately with your location.</Text>
                <Input
                  label="Description (Optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details about the situation..."
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.triggerActions}>
                  <Button title="Cancel" variant="outline" onPress={() => { setShowTrigger(false); setSelectedType(null); }} />
                  <Button title="SEND EMERGENCY ALERT" variant="danger" onPress={confirmEmergency} />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        <View style={styles.content}>
          <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('SOS')} activeOpacity={0.9}>
            <View style={styles.sosButtonInner}>
              <Ionicons name="alert-circle" size={48} color={COLORS.white} />
              <Text style={styles.sosButtonText}>HOLD FOR SOS</Text>
              <Text style={styles.sosButtonSubtitle}>Long press to activate emergency</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Types</Text>
            <View style={styles.emergencyTypeGrid}>
              {EMERGENCY_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.emergencyTypeButton, { borderColor: type.color }]}
                  onPress={() => handleTriggerEmergency(type.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.emergencyTypeIcon, { backgroundColor: `${type.color}20` }]}>
                    <Text style={styles.emergencyTypeIconText}>{type.icon}</Text>
                  </View>
                  <Text style={[styles.emergencyTypeLabel, { color: type.color }]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {activeEmergencies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Emergencies ({activeEmergencies.length})</Text>
              <View style={styles.emergencyList}>
                {activeEmergencies.map(emergency => (
                  <EmergencyCard key={emergency.id} emergency={emergency} tripMembers={members} />
                ))}
              </View>
            </View>
          )}

          {resolvedEmergencies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resolved Emergencies</Text>
              <View style={styles.emergencyList}>
                {resolvedEmergencies.map(emergency => (
                  <EmergencyCard key={emergency.id} emergency={emergency} tripMembers={members} />
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nearby Emergency Services</Text>
            <Card style={styles.servicesCard} variant="elevated">
              <CardContent>
                <ServiceRow icon="hospital" label="Hospital" detail="Apollo Hospital - 2.3 km" color="#E74C3C" />
                <Divider />
                <ServiceRow icon="medical" label="Ambulance" detail="108 Emergency - Available" color="#E74C3C" />
                <Divider />
                <ServiceRow icon="police" label="Police" detail="Police Station - 1.8 km" color="#3498DB" />
                <Divider />
                <ServiceRow icon="fire" label="Fire Dept" detail="Fire Station - 3.1 km" color="#E74C3C" />
                <Divider />
                <ServiceRow icon="construct" label="Mechanic" detail="Auto Care - 1.2 km" color="#F39C12" />
              </CardContent>
            </Card>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const EmergencyCard = ({ emergency, tripMembers }: any) => (
  <Card style={styles.emergencyCard} variant="outlined">
    <CardContent>
      <View style={styles.emergencyHeader}>
        <View style={[styles.emergencyTypeBadge, { backgroundColor: EMERGENCY_TYPES.find(t => t.id === emergency.type)?.color }]}>
          <Text style={styles.emergencyTypeText}>{EMERGENCY_TYPES.find(t => t.id === emergency.type)?.label}</Text>
        </View>
        <Text style={styles.emergencyStatus}>{emergency.status.toUpperCase()}</Text>
      </View>
      <View style={styles.emergencyInfo}>
        <View style={styles.emergencyUser}>
          <Avatar name={emergency.user.name} size="sm" />
          <Text style={styles.emergencyUserName}>{emergency.user.name}</Text>
        </View>
        <Text style={styles.emergencyTime}>{formatRelativeTime(emergency.createdAt)}</Text>
      </View>
      {emergency.description && (
        <Text style={styles.emergencyDescription}>{emergency.description}</Text>
      )}
      <Text style={styles.emergencyLocation}>
        <Ionicons name="location" size={14} color={COLORS.textMuted} />
        {emergency.location.address || 'Location shared'}
      </Text>
      {emergency.status === 'active' && (
        <Button title="Mark Resolved" variant="outline" onPress={() => {}} fullWidth style={{ marginTop: SPACING.md }} />
      )}
    </CardContent>
  </Card>
);

const ServiceRow = ({ icon, label, detail, color }: any) => (
  <TouchableOpacity style={styles.serviceRow} activeOpacity={0.8}>
    <View style={[styles.serviceIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.serviceInfo}>
      <Text style={styles.serviceLabel}>{label}</Text>
      <Text style={styles.serviceDetail}>{detail}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

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
    marginLeft: SPACING.md,
  },
  triggerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.md,
    zIndex: 100,
  },
  triggerCard: {
    maxHeight: '80%',
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  triggerTypeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  triggerTypeText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  triggerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  triggerDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  triggerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sosButton: {
    marginBottom: SPACING.lg,
  },
  sosButtonInner: {
    padding: SPACING.xl,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  sosButtonText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  sosButtonSubtitle: {
    fontSize: FONT_SIZES.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: SPACING.xs,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emergencyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  emergencyTypeButton: {
    width: '48%',
    aspectRatio: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  emergencyTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTypeIconText: {
    fontSize: 24,
  },
  emergencyTypeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  emergencyList: {
    gap: SPACING.md,
  },
  emergencyCard: {},
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emergencyTypeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  emergencyTypeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  emergencyStatus: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.warning,
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  emergencyUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emergencyUserName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  emergencyTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  emergencyDescription: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emergencyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  servicesCard: {},
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  serviceDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});