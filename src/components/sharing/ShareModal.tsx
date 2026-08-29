import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { sharingService } from '../../services/sharing';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { Share2, Copy, Check, X, MapPin, Lock } from 'lucide-react-native';

interface ShareModalProps {
  visible: boolean;
  placeId: string;
  placeName: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  visible,
  placeId,
  placeName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const deepLink = sharingService.getPlaceDeepLink(placeId);
  const webLink = sharingService.getPlaceWebLink(placeId);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    await sharingService.sharePlace(placeName, placeId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Share2 color={COLORS.primary} size={20} style={{ marginRight: 6 }} />
              <Text style={styles.title}>Share Location Link</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Place Teaser Banner */}
          <View style={styles.teaserCard}>
            <MapPin color={COLORS.secondary} size={20} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.teaserPlaceName}>{placeName}</Text>
              <Text style={styles.teaserCopy}>
                Invites others to visit this physical location to unlock what people left behind.
              </Text>
            </View>
          </View>

          {/* Zero Leakage Rule Notice */}
          <View style={styles.privacyNotice}>
            <Lock color={COLORS.ghost} size={14} style={{ marginRight: 6 }} />
            <Text style={styles.privacyText}>
              Memory content is zero-leakage and will only be revealed when they physically arrive.
            </Text>
          </View>

          {/* Link display & copy button */}
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>
              {webLink}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              {copied ? (
                <>
                  <Check color={COLORS.success} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.copyText, { color: COLORS.success }]}>Copied!</Text>
                </>
              ) : (
                <>
                  <Copy color={COLORS.textPrimary} size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.copyText}>Copy Link</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Main Share Trigger */}
          <TouchableOpacity style={styles.mainShareButton} onPress={handleNativeShare}>
            <Share2 color={COLORS.textPrimary} size={16} style={{ marginRight: 8 }} />
            <Text style={styles.mainShareText}>Send Teaser via App</Text>
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderTopWidth: 1,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  teaserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  teaserPlaceName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  teaserCopy: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 184, 1, 0.1)',
    borderColor: 'rgba(247, 184, 1, 0.3)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  privacyText: {
    color: COLORS.ghost,
    fontSize: 11,
    flex: 1,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flex: 1,
    marginRight: SPACING.sm,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  copyText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  mainShareButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainShareText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
