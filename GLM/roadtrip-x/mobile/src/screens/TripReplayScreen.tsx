import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'TripReplay'>;

export default function TripReplayScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Replay</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        <View style={styles.mapPreview}>
          <Text style={styles.mapPreviewText}>Map View - Trip Route Animation</Text>
          <View style={styles.routeLine}>
            <View style={[styles.progressDot, { left: `${progress}%` }]} />
          </View>
        </View>

        {/* Playback Controls */}
        <Card style={styles.controlsCard} variant="elevated">
          <CardContent>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%` },
                ]}
              />
            </View>
            <View style={styles.playbackControls}>
              <TouchableOpacity style={styles.controlButton} onPress={() => setProgress(Math.max(0, progress - 10))}>
                <Ionicons name="skip-backward" size={28} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: COLORS.accent }]}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => setProgress(Math.min(100, progress + 10))}>
                <Ionicons name="skip-forward" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.speedControls}>
              <Text style={styles.speedLabel}>Speed: 1x</Text>
              <View style={styles.speedOptions}>
                {['0.5x', '1x', '2x', '4x'].map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[styles.speedOption, speed === '1x' && styles.speedOptionActive]}
                    onPress={() => {}}
                  >
                    <Text style={[styles.speedOptionText, speed === '1x' && styles.speedOptionTextActive]}>{speed}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Timeline Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Events</Text>
          <Card style={styles.eventsCard} variant="elevated">
            <CardContent>
              {[
                { time: '08:00', icon: 'play', color: '#2ECC71', title: 'Trip Started', subtitle: 'Bangalore' },
                { time: '09:30', icon: 'gas-station', color: '#FF6B35', title: 'Fuel Stop', subtitle: '₹2,500 - Shell Bangalore' },
                { time: '10:45', icon: 'map-marker', color: '#45B7D1', title: 'Reached Mysore', subtitle: 'Mysore Palace visit' },
                { time: '12:30', icon: 'restaurant', color: '#F8B500', title: 'Lunch', subtitle: '₹1,250 - Hotel RRR' },
                { time: '14:00', icon: 'camera', color: '#9B59B6', title: 'Photos', subtitle: '12 photos at Mysore Palace' },
                { time: '16:30', icon: 'car', color: '#4ECDC4', title: 'Departed Mysore', subtitle: 'Heading to Coorg' },
                { time: '19:00', icon: 'map-marker', color: '#45B7D1', title: 'Reached Coorg', subtitle: 'Check-in at resort' },
              ].map((event, i) => (
                <View key={i} style={styles.eventItem}>
                  <View style={styles.eventTimeline}>
                    <View style={[styles.eventDot, { backgroundColor: event.color }]} />
                    <View style={styles.eventLine} />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTime}>{event.time}</Text>
                    <View style={styles.eventInfo}>
                      <View style={[styles.eventIcon, { backgroundColor: `${event.color}20` }]}>
                        <Ionicons name={event.icon} size={18} color={event.color} />
                      </View>
                      <View>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        </View>

        {/* Export */}
        <View style={styles.section}>
          <Button title="Export Replay Video" variant="outline" onPress={() => {}} fullWidth style={{ marginBottom: SPACING.md }} />
          <Button title="Share Trip Replay" variant="primary" onPress={() => {}} fullWidth />
        </View>
      </ScrollView>
    </View>
  );
}

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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  mapPreview: {
    height: 200,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mapPreviewText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  routeLine: {
    width: '80%',
    height: 2,
    backgroundColor: COLORS.border,
    position: 'relative',
  },
  progressDot: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.accent,
    transform: [{ translateX: -7 }],
  },
  controlsCard: {
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
  },
  controlButton: {
    padding: SPACING.sm,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  speedControls: {
    alignItems: 'center',
  },
  speedLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  speedOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  speedOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
  },
  speedOptionActive: {
    backgroundColor: COLORS.accent,
  },
  speedOptionText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  speedOptionTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  eventsCard: {},
  eventItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
  },
  eventTimeline: {
    alignItems: 'center',
    width: 24,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  eventLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.md,
    marginLeft: SPACING.md,
  },
  eventTime: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    minWidth: 50,
    marginTop: 4,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  eventSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});