import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { APP_CONFIG } from '../../constants/config';
import { MapPin, Compass, AlertCircle } from 'lucide-react-native';

interface LocationPromptModalProps {
  visible: boolean;
  onGrantPermission: () => void;
  onDismiss: () => void;
}

export const LocationPromptModal: React.FC<LocationPromptModalProps> = ({
  visible,
  onGrantPermission,
  onDismiss,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Compass color={COLORS.primary} size={36} />
          </View>

          <Text style={styles.badge}>📍 {APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.title}>The World Has Memories</Text>
          <Text style={styles.description}>
            You need location access to discover memories where you physically go.
          </Text>

          <View style={styles.privacyNoteBox}>
            <AlertCircle color={COLORS.secondary} size={16} style={{ marginRight: 8 }} />
            <Text style={styles.privacyNoteText}>
              Your continuous location history is never saved or shared.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onGrantPermission}>
            <MapPin color={COLORS.textPrimary} size={18} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Enable Location Access</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
            <Text style={styles.secondaryButtonText}>Browse Map First</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.lg,
    width: '100%',
  },
  privacyNoteText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
  },
  secondaryButtonText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
