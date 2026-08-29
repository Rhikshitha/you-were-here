import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AchievementBadge } from '../../services/achievements';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { Award, Lock } from 'lucide-react-native';

interface BadgeCardProps {
  badge: AchievementBadge;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge }) => {
  return (
    <View style={[styles.card, badge.unlocked ? styles.unlockedCard : styles.lockedCard]}>
      <View style={styles.emojiBox}>
        <Text style={[styles.emoji, !badge.unlocked && styles.lockedEmoji]}>{badge.emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !badge.unlocked && styles.lockedText]}>{badge.title}</Text>
          {badge.unlocked ? (
            <View style={styles.unlockedTag}>
              <Award color={COLORS.primary} size={12} style={{ marginRight: 4 }} />
              <Text style={styles.unlockedTagText}>Unlocked</Text>
            </View>
          ) : (
            <View style={styles.progressTag}>
              <Lock color={COLORS.textMuted} size={10} style={{ marginRight: 4 }} />
              <Text style={styles.progressText}>
                {badge.currentCount}/{badge.targetCount}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.desc}>{badge.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  unlockedCard: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  lockedCard: {
    opacity: 0.7,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  desc: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  unlockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  unlockedTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  progressTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
