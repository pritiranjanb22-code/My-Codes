import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';

type Props = RootStackScreenProps<'PhotoAlbum'>;

export default function PhotoAlbumScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { media, trips } = useAppStore();

  const trip = trips.find((t) => t.id === tripId);
  const tripMedia = media;

  const groupedByDay = groupMediaByDay(tripMedia);

  if (!trip) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Trip not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Album</Text>
        <TouchableOpacity onPress={() => {}} style={styles.addButton}>
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {tripMedia.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Photos Yet</Text>
          <Text style={styles.emptyText}>Capture memories from your trip</Text>
          <Button title="Add Photos" onPress={() => {}} style={{ marginTop: SPACING.md, width: 200 }} />
        </View>
      ) : (
        <FlatList
          data={groupedByDay}
          keyExtractor={(item) => item.day}
          renderItem={({ item }) => (
            <View style={styles.daySection}>
              <Text style={styles.dayTitle}>{item.dayLabel}</Text>
              <Text style={styles.dayCount}>{item.media.length} photo{item.media.length !== 1 ? 's' : ''}</Text>
              <FlatList
                data={item.media}
                keyExtractor={(m) => m.id}
                renderItem={({ item: mediaItem }) => (
                  <TouchableOpacity style={styles.mediaItem} onPress={() => {}} activeOpacity={0.9}>
                    <View style={styles.mediaThumbnail}>
                      {mediaItem.type === 'video' && (
                        <View style={styles.videoOverlay}>
                          <Ionicons name="play-circle" size={32} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.mediaGrid}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

function groupMediaByDay(media: any[]) {
  const groups: Record<string, any[]> = {};
  media.forEach((m) => {
    const date = new Date(m.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(m);
  });
  return Object.entries(groups).map(([day, media]) => ({
    day,
    dayLabel: formatDayLabel(day),
    media: media.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  }));
}

function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  addButton: {
    padding: SPACING.xs,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
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
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  daySection: {
    marginBottom: SPACING.lg,
  },
  dayTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  dayCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  mediaGrid: {
    gap: SPACING.sm,
  },
  mediaItem: {
    width: '31.33%',
    aspectRatio: 1,
  },
  mediaThumbnail: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});