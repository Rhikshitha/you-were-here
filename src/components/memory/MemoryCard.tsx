import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MemoryItem } from '../../types/app';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { classifyMemoryAge, getAgeColor, getAgeLabel, formatExactTimeAgo } from '../../lib/time';
import { ReactionBar } from './ReactionBar';
import { ReportModal } from './ReportModal';
import { User, Clock, Flame, Flag, Sparkles } from 'lucide-react-native';

const MEMORY_TYPE_EMOJIS: Record<string, string> = {
  memory: '💭',
  Memory: '💭',
  warning: '⚠️',
  Warning: '⚠️',
  confession: '❤️',
  Confession: '❤️',
  question: '❓',
  Question: '❓',
  time_capsule: '🕰️',
  'Time Capsule': '🕰️',
  mystery: '🧩',
  Mystery: '🧩',
};

const FORMATTED_TYPE_TITLES: Record<string, string> = {
  memory: 'Memory',
  warning: 'Warning',
  confession: 'Confession',
  question: 'Question',
  time_capsule: 'Time Capsule',
  mystery: 'Mystery',
};

interface MemoryCardProps {
  memory: MemoryItem;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const ageCategory = classifyMemoryAge(memory.created_at);
  const ageColor = getAgeColor(ageCategory);
  const ageLabel = getAgeLabel(ageCategory);

  const isGhost = ageCategory === 'ghost';
  const isAncient = ageCategory === 'ancient';

  const typeEmoji = MEMORY_TYPE_EMOJIS[memory.memory_type] || '💭';
  const displayTitle = FORMATTED_TYPE_TITLES[memory.memory_type] || memory.memory_type;
  const exactTimeAgo = formatExactTimeAgo(memory.created_at);

  return (
    <View
      style={[
        styles.card,
        isGhost && styles.ghostCard,
        isAncient && styles.ancientCard,
      ]}
    >
      {/* Ghost / Ancient Special Header Banner */}
      {(isGhost || isAncient) && (
        <View
          style={[
            styles.specialBanner,
            { backgroundColor: isAncient ? 'rgba(231, 29, 54, 0.15)' : 'rgba(247, 184, 1, 0.15)' },
          ]}
        >
          {isAncient ? (
            <Sparkles color={COLORS.ancient} size={14} style={{ marginRight: 4 }} />
          ) : (
            <Flame color={COLORS.ghost} size={14} style={{ marginRight: 4 }} />
          )}
          <Text
            style={[
              styles.specialBannerText,
              { color: isAncient ? COLORS.ancient : COLORS.ghost },
            ]}
          >
            {isAncient ? 'ANCIENT ARTIFACT (> 5 YEARS OLD)' : 'GHOST MEMORY (> 1 YEAR OLD)'}
          </Text>
        </View>
      )}

      {/* Top Meta Bar */}
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeEmoji}>{typeEmoji}</Text>
          <Text style={styles.typeText}>{displayTitle}</Text>
        </View>

        <View style={styles.rightTopMeta}>
          <View style={[styles.ageTag, { borderColor: ageColor }]}>
            {isGhost || isAncient ? (
              <Flame color={ageColor} size={12} style={{ marginRight: 4 }} />
            ) : (
              <Clock color={ageColor} size={12} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.ageTagText, { color: ageColor }]}>{ageLabel.toUpperCase()}</Text>
          </View>

          <TouchableOpacity
            style={styles.flagButton}
            onPress={() => setReportModalVisible(true)}
          >
            <Flag color={COLORS.textMuted} size={14} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Memory Content */}
      <Text style={styles.content}>{memory.content}</Text>

      {/* Interactive Reactions Bar */}
      <View style={styles.reactionsSection}>
        <ReactionBar
          memoryId={memory.id}
          initialCounts={memory.reaction_counts}
          initialUserReaction={memory.user_reaction as any}
        />
      </View>

      {/* Footer info: Author & Time Engine */}
      <View style={styles.footerRow}>
        <View style={styles.authorRow}>
          <User color={COLORS.textMuted} size={14} style={{ marginRight: 4 }} />
          <Text style={styles.authorText}>
            {memory.identity_visibility === 'anonymous' || memory.identity_visibility === 'Anonymous'
              ? 'Anonymous'
              : memory.author_name || 'Explorer'}
          </Text>
        </View>

        <Text style={styles.timeAgoText}>{exactTimeAgo}</Text>
      </View>

      {/* Report Content Modal */}
      <ReportModal
        visible={reportModalVisible}
        memoryId={memory.id}
        onClose={() => setReportModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  ghostCard: {
    borderColor: COLORS.ghost,
    borderWidth: 1.5,
    shadowColor: COLORS.ghost,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  ancientCard: {
    borderColor: COLORS.ancient,
    borderWidth: 1.5,
    shadowColor: COLORS.ancient,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  specialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
  },
  specialBannerText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  typeEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  typeText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  rightTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  ageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  ageTagText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1,
  },
  flagButton: {
    padding: 4,
  },
  content: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
  },
  reactionsSection: {
    marginTop: SPACING.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  timeAgoText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontStyle: 'italic',
  },
});
