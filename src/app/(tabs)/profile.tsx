import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { achievementsService, AchievementBadge } from '../../services/achievements';
import { UserProfileStats } from '../../types/app';
import { BadgeCard } from '../../components/profile/BadgeCard';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { User, Award, Compass, MessageSquare, Flame, LogOut, LogIn } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [stats, setStats] = useState<UserProfileStats | null>(null);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatsAndBadges() {
      setLoading(true);
      const userStats = await achievementsService.getUserStats(user?.id);
      const userBadges = await achievementsService.getBadgesWithProgress(user?.id);
      setStats(userStats);
      setBadges(userBadges);
      setLoading(false);
    }
    loadStatsAndBadges();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const username = profile?.username || (user ? 'Explorer' : 'Guest Explorer');
  const displayName = profile?.display_name || username;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User color={COLORS.primary} size={36} />
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
          <Text style={styles.joinedBadge}>Member of the Memory Layer</Text>

          {!user ? (
            <TouchableOpacity
              style={styles.authActionButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <LogIn color={COLORS.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.authActionText}>Sign In / Sign Up</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut color={COLORS.error} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.signOutText}>Log Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Compass color={COLORS.secondary} size={22} />
            <Text style={styles.statNumber}>{stats?.places_discovered || 0}</Text>
            <Text style={styles.statLabel}>Discovered</Text>
          </View>
          <View style={styles.statCard}>
            <MessageSquare color={COLORS.primary} size={22} />
            <Text style={styles.statNumber}>{stats?.memories_left || 0}</Text>
            <Text style={styles.statLabel}>Memories Left</Text>
          </View>
          <View style={styles.statCard}>
            <Flame color={COLORS.ghost} size={22} />
            <Text style={styles.statNumber}>{stats?.ghost_memories_found || 0}</Text>
            <Text style={styles.statLabel}>Ghost Found</Text>
          </View>
        </View>

        {/* Dynamic Achievements Section */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Award color={COLORS.ghost} size={18} />
            <Text style={styles.sectionTitle}>Exploration Badges ({badges.filter(b => b.unlocked).length}/{badges.length})</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} size="small" style={{ marginVertical: SPACING.md }} />
          ) : (
            <View style={styles.badgeContainer}>
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.primary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 2,
  },
  joinedBadge: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  authActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
  },
  authActionText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
  },
  signOutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  achievementsSection: {
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  badgeContainer: {
    gap: SPACING.sm,
  },
});
