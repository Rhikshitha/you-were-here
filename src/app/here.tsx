import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { placesService } from '../services/places';
import { PlaceCategory } from '../types/database';
import { PlaceSummary } from '../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { X, MapPin, AlertCircle, ArrowRight, Navigation } from 'lucide-react-native';

const CATEGORIES: { id: PlaceCategory; emoji: string }[] = [
  { id: 'Cafe', emoji: '☕' },
  { id: 'Restaurant', emoji: '🍽️' },
  { id: 'Park', emoji: '🌳' },
  { id: 'College', emoji: '🎓' },
  { id: 'Beach', emoji: '🏖️' },
  { id: 'Concert', emoji: '🎵' },
  { id: 'Tourist Attraction', emoji: '📸' },
  { id: 'Shopping', emoji: '🛍️' },
  { id: 'Landmark', emoji: '🗿' },
  { id: 'Other', emoji: '📍' },
];

type Status = 'locating' | 'searching' | 'found' | 'naming' | 'creating' | 'blocked';

export default function HereScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { location, permissionGranted, requestPermission, refreshLocation } = useLocation();

  const [status, setStatus] = useState<Status>('locating');
  // Bumped by resolve() so "Try Again" re-runs the search even when the
  // coordinates come back unchanged.
  const [retryNonce, setRetryNonce] = useState(0);
  const [place, setPlace] = useState<PlaceSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('Other');

  /**
   * Resolve where the user is, then decide: reuse an existing place, or ask
   * them to name this one.
   */
  const resolve = useCallback(async () => {
    setRetryNonce((n) => n + 1);
    setErrorMsg(null);
    setStatus('locating');

    if (permissionGranted === false) {
      const granted = await requestPermission();
      if (!granted) {
        setErrorMsg('Location access is needed to leave a memory where you are standing.');
        setStatus('blocked');
        return;
      }
    }

    await refreshLocation();
  }, [permissionGranted, requestPermission, refreshLocation]);

  useEffect(() => {
    resolve();
    // Run once on open; `location` arriving is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once coordinates land, look for a place that already covers this spot.
  //
  // Deps are strictly the inputs to the search. `status` must NOT be listed:
  // setStatus('searching') below would re-run the effect and cancel the very
  // query it just started. A genuine `location` change *should* restart it —
  // refreshLocation() hands back a new object, so this fires a second time on
  // open, which is correct and cheap.
  useEffect(() => {
    if (!location) return;

    let cancelled = false;
    (async () => {
      setStatus('searching');
      const { data, error } = await placesService.findPlaceAtLocation(location);
      if (cancelled) return;

      if (error) {
        setErrorMsg(error);
        setStatus('naming');
        return;
      }

      if (data) {
        setPlace(data);
        setStatus('found');
      } else {
        setStatus('naming');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location, retryNonce]);

  const goToComposer = (placeId: string) => {
    router.replace({ pathname: '/create-memory', params: { placeId } });
  };

  const handleCreatePlace = async () => {
    if (!location) {
      setErrorMsg('Still waiting on your location.');
      return;
    }

    setErrorMsg(null);
    setStatus('creating');

    const { data, error } = await placesService.createPlace({
      name,
      category,
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (error || !data) {
      setErrorMsg(error || 'Could not save this place.');
      setStatus('naming');
      return;
    }

    goToComposer(data.id);
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <X color={COLORS.textSecondary} size={22} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Leave a Memory Here</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Posting writes author_id, which RLS ties to the signed-in user.
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {header}
        <View style={styles.centered}>
          <MapPin color={COLORS.textMuted} size={40} />
          <Text style={styles.centeredTitle}>Sign in to leave a memory</Text>
          <Text style={styles.centeredSub}>
            Memories are tied to your profile so future visitors know someone was here.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'locating' || status === 'searching') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {header}
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.centeredTitle}>
            {status === 'locating' ? 'Finding you...' : 'Checking this spot...'}
          </Text>
          <Text style={styles.centeredSub}>
            {status === 'locating'
              ? 'Reading your current location.'
              : 'Looking for a place someone has already named here.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'blocked') {
    return (
      <SafeAreaView style={styles.safeArea}>
        {header}
        <View style={styles.centered}>
          <Navigation color={COLORS.error} size={40} />
          <Text style={styles.centeredTitle}>Location needed</Text>
          <Text style={styles.centeredSub}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={resolve}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // A place already covers this spot — reuse it.
  if (status === 'found' && place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {header}
        <View style={styles.centered}>
          <View style={styles.foundBadge}>
            <MapPin color={COLORS.secondary} size={28} />
          </View>
          <Text style={styles.foundLabel}>You're at</Text>
          <Text style={styles.foundName}>{place.name}</Text>
          <Text style={styles.centeredSub}>
            {place.category}
            {place.distance_meters !== undefined
              ? ` · ${Math.round(place.distance_meters)}m away`
              : ''}
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => goToComposer(place.id)}>
            <Text style={styles.primaryButtonText}>Leave a memory here</Text>
            <ArrowRight color={COLORS.textPrimary} size={16} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryLink}
            onPress={() => {
              setPlace(null);
              setStatus('naming');
            }}
          >
            <Text style={styles.secondaryLinkText}>Not here? Name this spot instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Nobody has named this spot yet.
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header}
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle color={COLORS.error} size={18} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.introBlock}>
            <Text style={styles.introTitle}>Nobody has named this spot</Text>
            <Text style={styles.introSub}>
              You're the first here. Name it, and everyone who stands in this spot after you
              will find it waiting.
            </Text>
            {location && (
              <Text style={styles.coordsText}>
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Place name</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ratna Cafe, Triplicane"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
                maxLength={80}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.sectionSub}>
              This sets how close someone must stand to unlock memories here.
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && styles.categoryLabelSelected,
                      ]}
                    >
                      {cat.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              styles.fullWidthButton,
              (status === 'creating' || name.trim().length < 2) && styles.primaryButtonDisabled,
            ]}
            onPress={handleCreatePlace}
            disabled={status === 'creating' || name.trim().length < 2}
          >
            {status === 'creating' ? (
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Name it & continue</Text>
                <ArrowRight color={COLORS.textPrimary} size={16} style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flexContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  headerSpacer: {
    width: 30,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  centeredTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  centeredSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  foundBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  foundLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  foundName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  fullWidthButton: {
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  secondaryLink: {
    marginTop: SPACING.md,
    padding: SPACING.xs,
  },
  secondaryLinkText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.error,
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    flex: 1,
  },
  introBlock: {
    gap: SPACING.xs,
  },
  introTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  introSub: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  coordsText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontVariant: ['tabular-nums'],
    marginTop: SPACING.xs,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  sectionSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    paddingVertical: SPACING.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  categoryLabelSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
