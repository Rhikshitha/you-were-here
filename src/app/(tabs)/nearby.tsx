import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { placesService } from '../../services/places';
import { useLocation } from '../../context/LocationContext';
import { PlaceSummary } from '../../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { formatDistance } from '../../lib/distance';
import { formatMemoryAge } from '../../lib/time';
import { Compass, Lock, Unlock, ChevronRight } from 'lucide-react-native';

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

export default function NearbyScreen() {
  const router = useRouter();
  const { location, refreshLocation } = useLocation();

  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNearbyPlaces = async () => {
    setLoading(true);
    const data = await placesService.getPlaces({
      userLocation: location || undefined,
    });
    setPlaces(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNearbyPlaces();
  }, [location]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await fetchNearbyPlaces();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Compass color={COLORS.secondary} size={24} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Nearby Places</Text>
        </View>
        <Text style={styles.subtitle}>
          Places with hidden memories ordered by physical distance.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.secondary} size="large" />
          <Text style={styles.loadingText}>Locating nearby memories...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.secondary}
            />
          }
        >
          {places.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No places found nearby</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to leave something in this area!
              </Text>
            </View>
          ) : (
            places.map((place) => {
              const emoji = CATEGORY_EMOJIS[place.category] || '📍';
              const isUnlocked = place.is_unlocked ?? false;

              return (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeCard, isUnlocked && styles.placeCardUnlocked]}
                  onPress={() => router.push(`/place/${place.id}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>
                        {place.distance_meters !== undefined
                          ? `${formatDistance(place.distance_meters)} away`
                          : 'Nearby'}
                      </Text>
                    </View>

                    <View style={styles.statusPill}>
                      {isUnlocked ? (
                        <View style={styles.unlockedTag}>
                          <Unlock color={COLORS.success} size={14} style={{ marginRight: 4 }} />
                          <Text style={styles.unlockedText}>Unlocked</Text>
                        </View>
                      ) : (
                        <View style={styles.lockedTag}>
                          <Lock color={COLORS.textMuted} size={14} style={{ marginRight: 4 }} />
                          <Text style={styles.lockedText}>Locked ({place.radius_meters}m)</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.categoryEmoji}>{emoji}</Text>
                    <View style={styles.placeDetails}>
                      <Text style={styles.placeName}>{place.name}</Text>
                      <Text style={styles.memoryCountText}>
                        {place.memory_count} {place.memory_count === 1 ? 'memory' : 'memories'}
                        {place.oldest_memory_created_at && (
                          <Text style={styles.ageSubtext}>
                            {' '}
                            • Oldest: {formatMemoryAge(place.oldest_memory_created_at)}
                          </Text>
                        )}
                      </Text>
                    </View>
                    <ChevronRight color={COLORS.textMuted} size={20} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
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
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  placeCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  placeCardUnlocked: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surfaceElevated,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  distanceText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusPill: {},
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    color: COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  lockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  memoryCountText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  ageSubtext: {
    color: COLORS.textMuted,
  },
});
