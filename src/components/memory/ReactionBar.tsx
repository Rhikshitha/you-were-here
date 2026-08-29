import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ReactionEmoji } from '../../types/database';
import { APP_CONFIG } from '../../constants/config';
import { reactionsService } from '../../services/reactions';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';

interface ReactionBarProps {
  memoryId: string;
  initialCounts?: Record<string, number>;
  initialUserReaction?: ReactionEmoji | null;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  memoryId,
  initialCounts = {},
  initialUserReaction = null,
}) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionEmoji | null>(initialUserReaction);

  const handleToggle = async (emoji: ReactionEmoji) => {
    const userId = user?.id || 'guest-user';

    // Optimistic state update
    const isRemoving = userReaction === emoji;
    const newCounts = { ...counts };

    if (isRemoving) {
      newCounts[emoji] = Math.max(0, (newCounts[emoji] || 1) - 1);
      setUserReaction(null);
    } else {
      if (userReaction) {
        newCounts[userReaction] = Math.max(0, (newCounts[userReaction] || 1) - 1);
      }
      newCounts[emoji] = (newCounts[emoji] || 0) + 1;
      setUserReaction(emoji);
    }
    setCounts(newCounts);

    // Call service API
    await reactionsService.toggleReaction(memoryId, userId, emoji);
  };

  return (
    <View style={styles.bar}>
      {APP_CONFIG.REACTIONS.map((emoji) => {
        const count = counts[emoji] || 0;
        const isActive = userReaction === emoji;

        return (
          <TouchableOpacity
            key={emoji}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => handleToggle(emoji as ReactionEmoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
            {count > 0 && (
              <Text style={[styles.countText, isActive && styles.countTextActive]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  pillActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  emojiText: {
    fontSize: 14,
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginLeft: 4,
  },
  countTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
