import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { apiService } from '@/services/api';
import { generateId } from '@/utils/helpers';

type Props = RootStackScreenProps<'JoinTrip'>;

export default function JoinTripScreen({ navigation }: Props) {
  const { setCurrentTrip, addTrip, user, trips, setAuthLoading } = useAppStore();
  const [joinMethod, setJoinMethod] = useState<'code' | 'qr' | 'link'>('code');
  const [tripCode, setTripCode] = useState('');
  const [isJoining, setIsJoining] = false;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleJoinByCode = async () => {
    if (!tripCode.trim()) {
      setErrors({ tripCode: 'Please enter a trip code' });
      return;
    }

    setIsJoining(true);
    try {
      // Demo mode - simulate joining a trip
      const mockTrip = {
        id: generateId(),
        name: 'Coorg Road Trip',
        description: 'A scenic road trip through Karnataka',
        startLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, Karnataka',
          name: 'Bangalore',
        },
        endLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Bangalore, Karnataka',
          name: 'Bangalore',
        },
        startDate: new Date().toISOString(),
        endDate: undefined,
        status: 'active' as const,
        ownerId: 'demo-user-1',
        budget: 30000,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addTrip(mockTrip);
      setCurrentTrip(mockTrip);
      navigation.navigate('TripDetail', { tripId: mockTrip.id });
    } catch (error) {
      console.error('Join trip error:', error);
      Alert.alert('Error', 'Failed to join trip. Please check the code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleScanQR = () => {
    setJoinMethod('qr');
    // Would open camera to scan QR code
    Alert.alert('QR Scanner', 'Camera permission required to scan QR codes');
  };

  const handleDeepLink = (url: string) => {
    // Parse deep link and join trip
    console.log('Deep link:', url);
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
          <Text style={styles.headerTitle}>Join Trip</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Join a Road Trip</Text>
          <Text style={styles.subtitle}>Enter a trip code or scan a QR code to join</Text>

          {/* Join Method Tabs */}
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[styles.methodTab, joinMethod === 'code' && styles.methodTabActive]}
              onPress={() => setJoinMethod('code')}
            >
              <Ionicons name="key" size={20} color={joinMethod === 'code' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.methodTabLabel, joinMethod === 'code' && styles.methodTabLabelActive]}>Trip Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodTab, joinMethod === 'qr' && styles.methodTabActive]}
              onPress={handleScanQR}
            >
              <Ionicons name="qr-code" size={20} color={joinMethod === 'qr' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.methodTabLabel, joinMethod === 'qr' && styles.methodTabLabelActive]}>QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodTab, joinMethod === 'link' && styles.methodTabActive]}
              onPress={() => setJoinMethod('link')}
            >
              <Ionicons name="link" size={20} color={joinMethod === 'link' ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.methodTabLabel, joinMethod === 'link' && styles.methodTabLabelActive]}>Deep Link</Text>
            </TouchableOpacity>
          </View>

          {joinMethod === 'code' && (
            <Card style={styles.formCard} variant="elevated">
              <CardContent>
                <Input
                  label="Trip Code"
                  placeholder="ABC123"
                  value={tripCode}
                  onChangeText={(value) => {
                    setTripCode(value.toUpperCase());
                    if (errors.tripCode) setErrors({});
                  }}
                  error={errors.tripCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  style={styles.codeInput}
                />
                <Text style={styles.codeHint}>Enter the 6-digit code shared by the trip host</Text>
                <Button
                  title={isJoining ? 'Joining...' : 'Join Trip'}
                  onPress={handleJoinByCode}
                  fullWidth
                  size="lg"
                  disabled={isJoining}
                  loading={isJoining}
                  style={{ marginTop: SPACING.md }}
                />
              </CardContent>
            </Card>
          )}

          {joinMethod === 'qr' && (
            <Card style={styles.formCard} variant="elevated">
              <CardContent>
                <View style={styles.qrScanner}>
                  <View style={styles.qrFrame}>
                    <View style={styles.qrCorners} />
                    <View style={styles.qrCorners} />
                    <View style={styles.qrCorners} />
                    <View style={styles.qrCorners} />
                  </View>
                  <Text style={styles.qrInstruction}>Point camera at QR code to scan</Text>
                  <TouchableOpacity style={styles.qrFlashlight} onPress={() => {}}>
                    <Ionicons name="flashlight" size={24} color={COLORS.white} />
                    <Text style={styles.qrFlashlightText}>Flashlight</Text>
                  </TouchableOpacity>
                </View>
                <Button
                  title="Enter Code Manually"
                  variant="outline"
                  onPress={() => setJoinMethod('code')}
                  fullWidth
                  style={{ marginTop: SPACING.md }}
                />
              </CardContent>
            </Card>
          )}

          {joinMethod === 'link' && (
            <Card style={styles.formCard} variant="elevated">
              <CardContent>
                <Input
                  label="Trip Link"
                  placeholder="https://roadtripx.app/trip/..."
                  onChangeText={handleDeepLink}
                  autoCapitalize="none"
                />
                <Text style={styles.codeHint}>Paste the trip invitation link here</Text>
                <Button
                  title="Join Trip"
                  onPress={() => {}}
                  fullWidth
                  size="lg"
                  style={{ marginTop: SPACING.md }}
                />
              </CardContent>
            </Card>
          )}

          {/* Demo Trip */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Trip</Text>
            <Card style={styles.demoCard} variant="outlined" onPress={handleJoinByCode}>
              <CardContent>
                <View style={styles.demoCardContent}>
                  <View style={styles.demoCardIcon}>
                    <Ionicons name="car-sport" size={28} color={COLORS.accent} />
                  </View>
                  <View style={styles.demoCardInfo}>
                    <Text style={styles.demoCardName}>Coorg Road Trip</Text>
                    <Text style={styles.demoCardRoute}>Bangalore → Mysore → Coorg → Chikmagalur → Bangalore</Text>
                    <View style={styles.demoCardMeta}>
                      <Text style={styles.demoCardMetaItem}>
                        <Ionicons name="people" size={12} color={COLORS.textMuted} />
                        5 members
                      </Text>
                      <Text style={styles.demoCardMetaItem}>
                        <Ionicons name="car" size={12} color={COLORS.textMuted} />
                        2 vehicles
                      </Text>
                      <Text style={styles.demoCardMetaItem}>
                        <Ionicons name="calendar" size={12} color={COLORS.textMuted} />
                        Active
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.textMuted} />
                </View>
              </CardContent>
            </Card>
            <Text style={styles.demoHint}>Tap to join the demo trip instantly</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
  methodTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  methodTabActive: {
    backgroundColor: COLORS.accent,
  },
  methodTabLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  methodTabLabelActive: {
    color: COLORS.white,
  },
  formCard: {},
  codeInput: {
    fontSize: FONT_SIZES.xl,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
  },
  codeHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  qrScanner: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  qrFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  qrCorners: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  qrInstruction: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  qrFlashlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
  },
  qrFlashlightText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.white,
  },
  demoSection: {
    marginTop: SPACING.xl,
  },
  demoTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  demoCard: {},
  demoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  demoCardIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCardInfo: {
    flex: 1,
  },
  demoCardName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  demoCardRoute: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  demoCardMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  demoCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  demoHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});