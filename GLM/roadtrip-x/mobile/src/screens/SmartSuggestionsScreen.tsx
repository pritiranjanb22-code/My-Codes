import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDistance } from '@/utils/helpers';

type Props = RootStackScreenProps<'SmartSuggestions'>;

export default function SmartSuggestionsScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { currentTrip, trips } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find(t => t.id === tripId);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'fuel' | 'food' | 'restroom' | 'hotel' | 'viewpoint' | 'mechanic'>('all');

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuggestions([
      { id: '1', type: 'fuel', title: 'Shell Petrol Pump', description: 'Open 24/7 • ₹98.50/L', distance: 2.3, rating: 4.2, priceLevel: 2 },
      { id: '2', type: 'food', title: 'Coorg Cuisine', description: 'Multi-cuisine • 4.5★', distance: 4.1, rating: 4.5, priceLevel: 3 },
      { id: '3', type: 'restroom', title: 'Highway Rest Stop', description: 'Clean facilities • Free', distance: 1.8, rating: 3.8, priceLevel: 0 },
      { id: '4', type: 'hotel', title: 'The Ibnii Resort', description: 'Luxury eco-resort • 4.7★', distance: 8.2, rating: 4.7, priceLevel: 4 },
      { id: '5', type: 'viewpoint', title: 'Raja\'s Seat', description: 'Sunset viewpoint • Popular', distance: 3.5, rating: 4.6, priceLevel: 0 },
      { id: '6', type: 'mechanic', title: 'Auto Care Center', description: 'Car & bike repair • 4.0★', distance: 2.1, rating: 4.0, priceLevel: 2 },
      { id: '7', type: 'fuel', title: 'Indian Oil', description: 'Diesel & Petrol • ₹97.20/L', distance: 5.6, rating: 4.1, priceLevel: 2 },
      { id: '8', type: 'food', title: 'Coffee Corner', description: 'Filter coffee & snacks • 4.3★', distance: 1.2, rating: 4.3, priceLevel: 1 },
    ]);
    setLoading(false);
  };

  const filteredSuggestions = filter === 'all'
    ? suggestions
    : suggestions.filter(s => s.type === filter);

  const typeFilters = [
    { id: 'all', label: 'All', icon: 'grid' },
    { id: 'fuel', label: 'Fuel', icon: 'gas-station' },
    { id: 'food', label: 'Food', icon: 'restaurant' },
    { id: 'restroom', label: 'Restroom', icon: 'water' },
    { id: 'hotel', label: 'Hotel', icon: 'hotel' },
    { id: 'viewpoint', label: 'Viewpoint', icon: 'image' },
    { id: 'mechanic', label: 'Mechanic', icon: 'construct' },
  ];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fuel: '#FF6B35',
      food: '#F8B500',
      restroom: '#4ECDC4',
      hotel: '#96CEB4',
      viewpoint: '#45B7D1',
      mechanic: '#F39C12',
    };
    return colors[type] || COLORS.accent;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      fuel: 'gas-station',
      food: 'restaurant',
      restroom: 'water',
      hotel: 'hotel',
      viewpoint: 'image',
      mechanic: 'construct',
    };
    return icons[type] || 'map-marker';
  };

  if (!trip) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Trip not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Suggestions</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.locationCard} variant="elevated">
          <CardContent>
            <View style={styles.locationHeader}>
              <Ionicons name="location" size={20} color={COLORS.accent} />
              <View>
                <Text style={styles.locationLabel}>Searching near</Text>
                <Text style={styles.locationName}>Current Location</Text>
              </View>
              <TouchableOpacity onPress={loadSuggestions} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
            {loading && <Text style={styles.loadingText}>Loading suggestions...</Text>}
          </CardContent>
        </Card>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {typeFilters.map(f => (
            <FilterTab
              key={f.id}
              label={f.label}
              icon={f.icon}
              selected={filter === f.id}
              color={getTypeColor(f.id)}
              onPress={() => setFilter(f.id as any)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map(i => (
              <SuggestionSkeleton key={i} />
            ))}
          </View>
        ) : filteredSuggestions.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="search" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Suggestions</Text>
                <Text style={styles.emptyText}>No {filter === 'all' ? '' : filter} suggestions nearby</Text>
              </View>
            </CardContent>
          </Card>
        ) : (
          <FlatList
            data={filteredSuggestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <SuggestionCard suggestion={item} onPress={() => {}} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const FilterTab = ({ label, icon, selected, color, onPress }: any) => (
  <TouchableOpacity style={[styles.filterTab, selected && styles.filterTabSelected, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.filterIcon, { backgroundColor: selected ? color : `${color}20` }]}>
      <Ionicons name={icon} size={18} color={selected ? COLORS.white : color} />
    </View>
    <Text style={[styles.filterLabel, { color: selected ? color : COLORS.text }]}>{label}</Text>
  </TouchableOpacity>
);

const SuggestionCard = ({ suggestion, onPress }: any) => (
  <TouchableOpacity style={styles.suggestionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.suggestionLeft}>
      <View style={[styles.suggestionTypeIcon, { backgroundColor: `${getTypeColor(suggestion.type)}20` }]}>
        <Ionicons name={getTypeIcon(suggestion.type)} size={24} color={getTypeColor(suggestion.type)} />
      </View>
      <View>
        <View style={styles.suggestionHeader}>
          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
          <View style={[styles.suggestionTypeBadge, { backgroundColor: `${getTypeColor(suggestion.type)}20` }]}>
            <Text style={[styles.suggestionTypeText, { color: getTypeColor(suggestion.type) }]}>{suggestion.type.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
        <View style={styles.suggestionMeta}>
          <Text style={styles.suggestionDistance}>
            <Ionicons name="navigate" size={12} color={COLORS.textMuted} />
            {formatDistance(suggestion.distance * 1000)} away
          </Text>
          <Text style={styles.suggestionRating}>
            <Ionicons name="star" size={12} color="#F8B500" />
            {suggestion.rating}
          </Text>
          <Text style={styles.suggestionPrice}>
            {'₹'.repeat(suggestion.priceLevel)} {' '.repeat(4 - suggestion.priceLevel)}
          </Text>
        </View>
      </View>
    </View>
    <View style={styles.suggestionRight}>
      <TouchableOpacity style={styles.addToItineraryButton}>
        <Ionicons name="add" size={20} color={COLORS.accent} />
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    fuel: '#FF6B35',
    food: '#F8B500',
    restroom: '#4ECDC4',
    hotel: '#96CEB4',
    viewpoint: '#45B7D1',
    mechanic: '#F39C12',
  };
  return colors[type] || COLORS.accent;
}

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    fuel: 'gas-station',
    food: 'restaurant',
    restroom: 'water',
    hotel: 'hotel',
    viewpoint: 'image',
    mechanic: 'construct',
  };
  return icons[type] || 'map-marker';
}

const SuggestionSkeleton = () => (
  <Card style={styles.skeletonCard} variant="elevated">
    <CardContent>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
    </CardContent>
  </Card>
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  locationCard: {
    marginBottom: SPACING.lg,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  locationLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  locationName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  filterTabSelected: {
    backgroundColor: 'transparent',
  },
  filterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: SPACING.xxl,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  suggestionTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  suggestionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  suggestionTypeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  suggestionTypeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  suggestionDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  suggestionDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  suggestionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: FONT_SIZES.xs,
    color: '#F8B500',
  },
  suggestionPrice: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  suggestionRight: {
    paddingLeft: SPACING.md,
  },
  addToItineraryButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    gap: SPACING.md,
  },
  skeletonCard: {},
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  skeletonContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    width: '80%',
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    width: '50%',
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
  emptyCard: {},
  emptyContent: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});