import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import { PlaceSummary, LocationCoordinates } from '../../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';

export interface PlacesMapProps {
  places: PlaceSummary[];
  userLocation?: LocationCoordinates | null;
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceSummary) => void;
  style?: any;
}

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/**
 * Native map (iOS/Android) drawing OpenStreetMap raster tiles.
 *
 * On Android `mapType="none"` blanks the built-in basemap so only OSM tiles
 * render. iOS has no equivalent, so the OSM tiles are drawn over the Apple
 * basemap — visually they cover it completely at normal opacity.
 */
export const PlacesMap: React.FC<PlacesMapProps> = ({
  places,
  userLocation,
  selectedPlaceId,
  onSelectPlace,
  style,
}) => {
  const mapRef = useRef<MapView | null>(null);
  // Centre on the user only once; later fixes shouldn't yank the map around.
  const didCentreRef = useRef(false);

  const initialRegion: Region = {
    latitude: userLocation?.latitude ?? APP_CONFIG.DEFAULT_MAP_REGION.latitude,
    longitude: userLocation?.longitude ?? APP_CONFIG.DEFAULT_MAP_REGION.longitude,
    latitudeDelta: APP_CONFIG.DEFAULT_MAP_REGION.latitudeDelta,
    longitudeDelta: APP_CONFIG.DEFAULT_MAP_REGION.longitudeDelta,
  };

  // initialRegion is fixed at mount, but the first GPS fix usually lands after
  // that — so centre on the user as soon as one arrives.
  useEffect(() => {
    if (!userLocation || !mapRef.current || didCentreRef.current) return;
    didCentreRef.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400
    );
  }, [userLocation]);

  // Recentre when a place is picked from the list.
  useEffect(() => {
    if (!selectedPlaceId || !mapRef.current) return;
    const place = places.find((p) => p.id === selectedPlaceId);
    if (!place) return;

    mapRef.current.animateToRegion(
      {
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400
    );
  }, [selectedPlaceId, places]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        rotateEnabled={false}
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} zIndex={-1} />

        {places.map((place) => (
          <Marker
            key={place.id}
            identifier={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.name}
            description={`${place.category} · ${place.memory_count} memories`}
            onPress={() => onSelectPlace?.(place)}
          />
        ))}
      </MapView>

      {/* OSM's tile usage policy requires visible attribution. */}
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceElevated,
  },
  attribution: {
    position: 'absolute',
    right: SPACING.xs,
    bottom: SPACING.xs,
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  attributionText: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
});
