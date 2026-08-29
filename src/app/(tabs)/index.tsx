import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { placesService } from '../../services/places';
import { useLocation } from '../../context/LocationContext';
import { PlaceSummary } from '../../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';
import { formatDistance } from '../../lib/distance';
import { formatMemoryAge } from '../../lib/time';
import { Search, MapPin, Compass, ChevronRight, X } from 'lucide-react-native';
import { AccountButton } from '../../components/common/AccountButton';
import { PlacesMap } from '../../components/map/PlacesMap';

// Category Emoji Mapping
const CATEGORY_EMOJIS: Record<string, string> = {
  Cafe: '☕',
  Restaurant: '🍽️',
  Park: '🌳',
  College: '🎓',
  Beach: '🏖️',
  Concert: '🎵',
  'Tourist Attraction': '🏛️',
  Shopping: '🛍️',
  Landmark: '📍',
  Other: '📌',
};

const CATEGORIES = ['All', 'Cafe', 'Park', 'College', 'Beach', 'Concert', 'Landmark', 'Shopping'];

export default function MapHomeScreen() {
  const router = useRouter();
  const { location, permissionGranted, requestPermission } = useLocation();

  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load places on filter change or location update
  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true);
      const data = await placesService.getPlaces({
        category: selectedCategory,
        searchQuery: searchQuery,
        userLocation: location || undefined,
      });
      setPlaces(data);
      setLoading(false);
    }
    fetchPlaces();
  }, [selectedCategory, searchQuery, location]);

  const handleSelectPlace = (place: PlaceSummary) => {
    setSelectedPlace(place);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          {location && (
            <View style={styles.locationActiveBadge}>
              <Compass color={COLORS.secondary} size={12} style={{ marginRight: 4 }} />
              <Text style={styles.locationActiveText}>GPS Active</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <AccountButton />
        </View>

        {/* Search Input */}
        <View style={styles.searchWrapper}>
          <Search color={COLORS.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places by name or area..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={COLORS.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const emoji = CATEGORY_EMOJIS[cat] || '';
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {emoji} {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Discovery Map Canvas & List Container */}
      <View style={styles.mapCanvas}>
        {permissionGranted === false && (
          <TouchableOpacity style={styles.permissionBanner} onPress={requestPermission}>
            <Compass color={COLORS.ghost} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.permissionBannerText}>
              Enable location access to see what's around you.
            </Text>
          </TouchableOpacity>
        )}

        <PlacesMap
          style={styles.map}
          places={places}
          userLocation={location}
          selectedPlaceId={selectedPlace?.id ?? null}
          onSelectPlace={handleSelectPlace}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Scanning memory layer...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.placesListContent}>
            {places.map((place) => {
              const emoji = CATEGORY_EMOJIS[place.category] || '📍';
              const isSelected = selectedPlace?.id === place.id;

              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeMarkerCard, isSelected && styles.placeMarkerCardSelected]}
                  onPress={() => handleSelectPlace(place)}
                >
                  <View style={styles.markerBadge}>
                    <Text style={styles.markerEmoji}>{emoji}</Text>
                    <Text style={styles.markerCount}>{place.memory_count}</Text>
                  </View>

                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.categoryTag}>{place.category}</Text>
                      {place.distance_meters !== undefined && (
                        <Text style={styles.distanceText}>
                          • {formatDistance(place.distance_meters)} away
                        </Text>
                      )}
                    </View>
                  </View>

                  <ChevronRight color={COLORS.textMuted} size={18} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Selected Place Preview Bottom Sheet */}
      {selectedPlace && (
        <View style={styles.previewSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetEmoji}>
                {CATEGORY_EMOJIS[selectedPlace.category] || '📍'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{selectedPlace.name}</Text>
                <Text style={styles.sheetCategory}>
                  {selectedPlace.category}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                <X color={COLORS.textMuted} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sheetStatsBox}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{selectedPlace.memory_count}</Text>
              <Text style={styles.statLabel}>Memories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {selectedPlace.oldest_memory_created_at
                  ? formatMemoryAge(selectedPlace.oldest_memory_created_at)
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Oldest Memory</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {selectedPlace.newest_memory_created_at
                  ? formatMemoryAge(selectedPlace.newest_memory_created_at)
                  : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Newest Memory</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.exploreActionButton}
            onPress={() => router.push(`/place/${selectedPlace.id}`)}
          >
            <MapPin color={COLORS.textPrimary} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Explore Place</Text>
            <ChevronRight color={COLORS.textPrimary} size={18} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
    gap: SPACING.xs,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoBadge: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    letterSpacing: 2,
  },
  locationActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    borderColor: COLORS.secondary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  locationActiveText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  categoryScroll: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  categoryPill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  categoryTextActive: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 184, 1, 0.15)',
    borderColor: COLORS.ghost,
    borderWidth: 1,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  permissionBannerText: {
    color: COLORS.ghost,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.sm,
  },
  map: {
    height: 260,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  placesListContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  placeMarkerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  placeMarkerCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginRight: SPACING.md,
  },
  markerEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  markerCount: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryTag: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  distanceText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: 4,
  },
  previewSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  sheetHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingBottom: SPACING.sm,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sheetEmoji: {
    fontSize: 28,
  },
  sheetName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sheetCategory: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  sheetStatsBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.surfaceBorder,
  },
  exploreActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
