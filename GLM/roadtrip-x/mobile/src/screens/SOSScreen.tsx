import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';

type Props = RootStackScreenProps<'SOS'>;

export default function SOSScreen({ navigation }: Props) {
  const { currentTrip, members, addEmergencyEvent } = useAppStore();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const startHold = () => {
    if (activated) return;
    setIsHolding(true);
    setProgress(0);
    progressAnim.setValue(0);
    
    holdTimeout.current = setTimeout(() => {
      activateSOS();
    }, 3000);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      if (!activated) {
        clearInterval(countdownInterval);
      }
    });
  };

  const endHold = () => {
    if (activated) return;
    setIsHolding(false);
    setCountdown(3);
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    progressAnim.stopAnimation();
    setProgress(0);
  };

  const activateSOS = () => {
    if (activated) return;
    setActivated(true);
    setIsHolding(false);
    
    // Trigger emergency
    const emergency = {
      id: `sos-${Date.now()}`,
      tripId: currentTrip?.id || '',
      userId: useAppStore.getState().user?.id || '',
      user: useAppStore.getState().user!,
      type: 'other' as const,
      location: useAppStore.getState().currentLocation || { latitude: 0, longitude: 0, address: 'Current location' },
      description: 'SOS activated by user',
      status: 'active' as const,
      notifiedMembers: members.map(m => m.userId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addEmergencyEvent(emergency);
    
    // Vibrate
    // Vibration.vibrate([0, 500, 200, 500]);
  };

  const resetSOS = () => {
    setActivated(false);
    setProgress(0);
    progressAnim.setValue(0);
  };

  useEffect(() => {
    progressAnim.addListener(({ value }) => setProgress(value));
    return () => progressAnim.removeAllListeners();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOS Emergency</Text>
      </View>

      <View style={styles.content}>
        {activated ? (
          <ActivatedSOSView onReset={resetSOS} />
        ) : (
          <SOSButtonView
            isHolding={isHolding}
            progress={progress}
            countdown={countdown}
            onStart={startHold}
            onEnd={endHold}
          />
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens when you activate SOS:</Text>
          <View style={styles.infoList}>
            <InfoItem number="1" text="Immediate alert sent to all trip members with your location" />
            <InfoItem number="2" text="Emergency services contact info displayed" />
            <InfoItem number="3" text="Your location shared continuously until resolved" />
            <InfoItem number="4" text="Group can track your location in real-time" />
          </View>
        </View>

        <View style={styles.emergencyNumbers}>
          <Text style={styles.emergencyNumbersTitle}>Emergency Numbers (India)</Text>
          <View style={styles.emergencyNumbersGrid}>
            <EmergencyNumber label="Police" number="100" color="#3498DB" />
            <EmergencyNumber label="Ambulance" number="108" color="#E74C3C" />
            <EmergencyNumber label="Fire" number="101" color="#E74C3C" />
            <EmergencyNumber label="Women Helpline" number="1091" color="#9B59B6" />
            <EmergencyNumber label="Child Helpline" number="1098" color="#F39C12" />
            <EmergencyNumber label="Road Accident" number="1073" color="#4ECDC4" />
          </View>
        </View>
      </View>
    </View>
  );
}

const SOSButtonView = ({ isHolding, progress, countdown, onStart, onEnd }: any) => (
  <View style={styles.sosContainer}>
    <Animated.View
      style={[
        styles.progressRing,
        {
          transform: [{ rotate: `${progress * 360}deg` }],
        },
      ]}
    />
    <TouchableOpacity
      onPressIn={onStart}
      onPressOut={onEnd}
      onLongPress={onStart}
      style={styles.sosButton}
      activeOpacity={1}
    >
      <View style={styles.sosButtonContent}>
        <Ionicons name="alert-circle" size={64} color={COLORS.white} />
        <Text style={styles.sosButtonLabel}>HOLD FOR SOS</Text>
        {isHolding && (
          <Text style={styles.sosCountdown}>{countdown}</Text>
        )}
      </View>
    </TouchableOpacity>
    <Text style={styles.sosInstruction}>Press and hold for 3 seconds to activate</Text>
  </View>
);

const ActivatedSOSView = ({ onReset }: any) => (
  <View style={styles.activatedContainer}>
    <View style={styles.activatedIcon}>
      <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
    </View>
    <Text style={styles.activatedTitle}>SOS ACTIVATED</Text>
    <Text style={styles.activatedSubtitle}>Emergency alert sent to all trip members</Text>
    <View style={styles.activatedDetails}>
      <ActivatedDetail icon="people" label="Members Notified" value={useAppStore.getState().members.length} />
      <ActivatedDetail icon="location" label="Location Shared" value="Yes" />
      <ActivatedDetail icon="time" label="Time" value={new Date().toLocaleTimeString()} />
    </View>
    <Button title="RESET SOS" variant="outline" onPress={onReset} fullWidth style={{ marginTop: SPACING.lg, width: 200 }} />
  </View>
);

const ActivatedDetail = ({ icon, label, value }: any) => (
  <View style={styles.activatedDetail}>
    <Ionicons name={icon} size={20} color={COLORS.accent} />
    <View>
      <Text style={styles.activatedDetailLabel}>{label}</Text>
      <Text style={styles.activatedDetailValue}>{value}</Text>
    </View>
  </View>
);

const InfoItem = ({ number, text }: any) => (
  <View style={styles.infoItem}>
    <View style={styles.infoNumber}>{number}</View>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const EmergencyNumber = ({ label, number, color }: any) => (
  <TouchableOpacity style={[styles.emergencyNumberButton, { backgroundColor: `${color}20`, borderColor: color }]} activeOpacity={0.8}>
    <Text style={[styles.emergencyNumberLabel, { color }]}>{label}</Text>
    <Text style={[styles.emergencyNumberValue, { color }]}>{number}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sosContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  progressRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    borderColor: `${COLORS.error}40`,
    borderTopColor: COLORS.error,
  },
  sosButton: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  sosButtonContent: {
    alignItems: 'center',
  },
  sosButtonLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  sosCountdown: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  sosInstruction: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  activatedContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  activatedIcon: {
    marginBottom: SPACING.md,
  },
  activatedTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  activatedSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  activatedDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  activatedDetail: {
    alignItems: 'center',
  },
  activatedDetailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  activatedDetailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: 2,
  },
  infoSection: {
    marginTop: SPACING.xl,
  },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoList: {
    gap: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
    marginTop: 2,
  },
  emergencyNumbers: {
    marginTop: SPACING.xl,
  },
  emergencyNumbersTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emergencyNumbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  emergencyNumberButton: {
    width: '30%',
    aspectRatio: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  emergencyNumberLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  emergencyNumberValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
});