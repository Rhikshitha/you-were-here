import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { placesService } from '../../services/places';
import { memoriesService } from '../../services/memories';
import { useLocation } from '../../context/LocationContext';
import { PlaceSummary, MemoryItem } from '../../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { verifyLocationUnlock } from '../../lib/locationVerification';
import { UnlockStatusCard } from '../../components/place/UnlockStatusCard';
import { MemoryCard } from '../../components/memory/MemoryCard';
import { ShareModal } from '../../components/sharing/ShareModal';
import { formatDistance } from '../../lib/distance';
import { ArrowLeft, Plus, Share2, Compass, MessageSquare, AlertCircle } from 'lucide-react-native';

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

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { location, refreshLocation } = useLocation();

  const [place, setPlace] = useState<PlaceSummary | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [memoryError, setMemoryError] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const fetchDetailsAndMemories = async () => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch Place info
    const placeData = await placesService.getPlaceById(id as string, location || undefined);
    setPlace(placeData);
    setLoading(false);

    // 2. Verify physical presence & fetch unlocked memories stream
    if (placeData) {
      setLoadingMemories(true);
      const { data, error } = await memoriesService.getUnlockedMemories(
        id as string,
        location || null
      );
      if (error) {
        setMemoryError(error);
        setMemories([]);
      } else {
        setMemoryError(null);
        setMemories(data || []);
      }
      setLoadingMemories(false);
    }
  };

  useEffect(() => {
    fetchDetailsAndMemories();
  }, [id, location]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await fetchDetailsAndMemories();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={COLORS.textPrimary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Place Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This location might have moved or no longer exists.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const emoji = CATEGORY_EMOJIS[place.category] || '📍';
  const verification = verifyLocationUnlock(
    location,
    { latitude: place.latitude, longitude: place.longitude },
    place.radius_meters
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={COLORS.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {place.name}
        </Text>
        <TouchableOpacity
          style={styles.shareHeaderButton}
          onPress={() => setShareModalVisible(true)}
        >
          <Share2 color={COLORS.primary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Place Hero Card */}
        <View style={styles.placeHeroCard}>
          <View style={styles.emojiCircle}>
            <Text style={styles.heroEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.heroTitle}>{place.name}</Text>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>
              {place.category} • Radius: {place.radius_meters}m
            </Text>
          </View>

          {place.distance_meters !== undefined && (
            <View style={styles.distanceRow}>
              <Compass color={COLORS.secondary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.distanceLabel}>
                Current distance: {formatDistance(place.distance_meters)}
              </Text>
            </View>
          )}
        </View>

        {/* Location Verification Status Card */}
        <UnlockStatusCard verification={verification} onRefreshLocation={refreshLocation} />

        {/* Unlocked Memories Section */}
        <View style={styles.memoriesSection}>
          <View style={styles.sectionHeaderRow}>
            <MessageSquare color={COLORS.primary} size={18} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>
              Unlocked Memories ({memories.length})
            </Text>
          </View>

          {loadingMemories ? (
            <View style={styles.loadingMemoriesBox}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.loadingMemoriesText}>Unlocking memories stream...</Text>
            </View>
          ) : memoryError ? (
            <View style={styles.errorBox}>
              <AlertCircle color={COLORS.error} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.errorBoxText}>{memoryError}</Text>
            </View>
          ) : memories.length === 0 ? (
            <View style={styles.emptyMemoriesBox}>
              <Text style={styles.emptyMemoriesTitle}>No memories unlocked yet</Text>
              <Text style={styles.emptyMemoriesSub}>
                Be the first to leave a hidden memory at this location!
              </Text>
            </View>
          ) : (
            <View style={styles.memoriesList}>
              {memories.map((mem) => (
                <MemoryCard key={mem.id} memory={mem} />
              ))}
            </View>
          )}
        </View>

        {/* Leave Memory Action Button */}
        <TouchableOpacity
          style={[styles.leaveButton, !verification.isUnlocked && styles.leaveButtonLocked]}
          onPress={() => router.push({ pathname: '/create-memory', params: { placeId: id } })}
        >
          <Plus color={COLORS.textPrimary} size={18} style={{ marginRight: 8 }} />
          <Text style={styles.leaveButtonText}>Leave Something Here</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Share Teaser Modal */}
      <ShareModal
        visible={shareModalVisible}
        placeId={id as string}
        placeName={place.name}
        onClose={() => setShareModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.sm,
  },
  shareHeaderButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  errorSubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  placeHeroCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  categoryPill: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xs,
  },
  categoryPillText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  distanceLabel: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  memoriesSection: {
    gap: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  loadingMemoriesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  loadingMemoriesText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginLeft: SPACING.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flex: 1,
  },
  emptyMemoriesBox: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyMemoriesTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  emptyMemoriesSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 4,
    textAlign: 'center',
  },
  memoriesList: {
    gap: SPACING.md,
  },
  leaveButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaveButtonLocked: {
    opacity: 0.8,
  },
  leaveButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
