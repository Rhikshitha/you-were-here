import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LocationVerificationResult } from '../../lib/locationVerification';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { Lock, Unlock, Compass, AlertTriangle } from 'lucide-react-native';

interface UnlockStatusCardProps {
  verification: LocationVerificationResult;
  onRefreshLocation: () => void;
}

export const UnlockStatusCard: React.FC<UnlockStatusCardProps> = ({
  verification,
  onRefreshLocation,
}) => {
  const { isUnlocked, message, accuracyWarning } = verification;

  return (
    <View style={[styles.card, isUnlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, isUnlocked ? styles.iconBoxUnlocked : styles.iconBoxLocked]}>
          {isUnlocked ? (
            <Unlock color={COLORS.success} size={28} />
          ) : (
            <Lock color={COLORS.primary} size={28} />
          )}
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.badge}>{isUnlocked ? 'UNLOCKED' : 'PHYSICAL UNLOCK REQUIRED'}</Text>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      </View>

      {accuracyWarning && (
        <View style={styles.warningBox}>
          <AlertTriangle color={COLORS.warning} size={14} style={{ marginRight: 6 }} />
          <Text style={styles.warningText}>
            Low GPS accuracy detected. Move near open sky for better verification.
          </Text>
        </View>
      )}

      {!isUnlocked && (
        <TouchableOpacity style={styles.refreshButton} onPress={onRefreshLocation}>
          <Compass color={COLORS.primary} size={16} style={{ marginRight: 6 }} />
          <Text style={styles.refreshButtonText}>Check My Location Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardLocked: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderColor: COLORS.primary,
  },
  cardUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: COLORS.success,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxLocked: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  iconBoxUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoCol: {
    flex: 1,
  },
  badge: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.warning,
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  refreshButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
