import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, MAP_FILTERS } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import MapView, { Marker, Callout, Circle } from 'react-native-maps';

type Props = RootStackScreenProps<'Map'>;

const INITIAL_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function MapScreen({ navigation }: Props) {
  const { currentTrip, locationSessions, vehicles, convoyMode, setConvoyMode } = useAppStore();

  const mapFilters = MAP_FILTERS;

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="map" size={64} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyText}>Select a trip to view the map</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        mapType="standard"
      >
        {/* Route Polyline - would be added here */}
        
        {/* Stops */}
        {/* Members */}
        {locationSessions.map((session) => (
          <Marker
            key={session.id}
            coordinate={{ latitude: session.latitude, longitude: session.longitude }}
            title={session.user.name}
            description={`${session.user.name} • ${session.vehicleId ? 'Car' : 'Walking'}`}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{session.user.name}</Text>
                <Text style={styles.calloutDetail}>
                  {session.speed ? `${Math.round(session.speed * 3.6)} km/h` : 'Stationary'}
                </Text>
                <Text style={styles.calloutDetail}>
                  {session.batteryLevel ? `Battery: ${session.batteryLevel}%` : ''}
                </Text>
                <Text style={styles.calloutDetail}>
                  Updated: {new Date(session.updatedAt).toLocaleTimeString()}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Vehicles */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            coordinate={{ latitude: 12.9716, longitude: 77.5946 }} // Would be actual vehicle location
            title={vehicle.name}
          >
            <View style={styles.vehicleMarker}>
              <Ionicons name="car-sport" size={32} color={COLORS.accent} />
            </View>
          </Marker>
        ))}

        {/* Current User Location */}
        {useAppStore.getState().currentLocation && (
          <Circle
            center={{
              latitude: useAppStore.getState().currentLocation!.latitude,
              longitude: useAppStore.getState().currentLocation!.longitude,
            }}
            radius={100}
            strokeWidth={2}
            strokeColor={COLORS.accent}
            fillColor={`${COLORS.accent}30`}
          />
        )}
      </MapView>

      {/* Map Controls Overlay */}
      <View style={styles.controlsOverlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.navigate('SmartSuggestions')}>
            <Ionicons name="search" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => setConvoyMode(!convoyMode)}>
            <Ionicons name={convoyMode ? 'layers' : 'layers-outline'} size={24} color={convoyMode ? COLORS.accent : COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.navigate('TripDetail', { tripId: currentTrip.id })}>
            <Ionicons name="information-circle" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <MapFiltersPanel />
          <View style={styles.bottomActionButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: COLORS.accent }]} onPress={() => {}}>
              <Ionicons name="navigate" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <Ionicons name="locate" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Emergency')}>
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const MapFiltersPanel = () => (
  <Card style={styles.filtersPanel} variant="elevated">
    <CardContent>
      <Text style={styles.filtersTitle}>Map Filters</Text>
      <View style={styles.filtersGrid}>
        {Object.entries(mapFilters).map(([key, label]) => (
          <FilterToggle key={key} label={label} defaultValue={true} />
        ))}
      </View>
    </CardContent>
  </Card>
);

const FilterToggle = ({ label, defaultValue }: any) => {
  const [enabled, setEnabled] = React.useState(defaultValue);
  return (
    <TouchableOpacity style={styles.filterItem} onPress={() => setEnabled(!enabled)} activeOpacity={0.9}>
      <View style={[styles.filterCheckbox, enabled && styles.filterCheckboxChecked]} />
      <Text style={styles.filterLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
    width: '100%',
    maxWidth: 320,
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
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    pointerEvents: 'box-none',
  },
  filtersPanel: {
    marginBottom: SPACING.md,
    maxHeight: 200,
  },
  filtersTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
  },
  filterCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  filterCheckboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  bottomActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  callout: {
    padding: SPACING.sm,
    minWidth: 150,
  },
  calloutName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  calloutDetail: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  vehicleMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
});