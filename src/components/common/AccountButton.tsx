import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants/theme';
import { User, LogOut, LogIn, Bell } from 'lucide-react-native';
import { useMemoryReminders } from '../../hooks/useMemoryReminders';

/**
 * Avatar circle shown in every screen header. Replaces the old Profile tab,
 * which only ever held the account identity and the log in/out action.
 */
export const AccountButton: React.FC = () => {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const reminders = useMemoryReminders();

  const username = profile?.username || (user ? 'Explorer' : 'Guest Explorer');
  const displayName = profile?.display_name || username;

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleSignIn = () => {
    setOpen(false);
    router.push('/(auth)/login');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Account"
      >
        <User color={COLORS.primary} size={18} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Tapping anywhere outside the card dismisses the sheet. */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.cardAvatar}>
              <User color={COLORS.primary} size={28} />
            </View>

            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.memberNote}>Member of the Memory Layer</Text>

            {user && reminders.supported && (
              <View style={styles.reminderRow}>
                <Bell color={COLORS.secondary} size={16} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>Remind me when I pass by</Text>
                  <Text style={styles.reminderSub}>
                    {reminders.status?.error
                      ? reminders.status.error
                      : reminders.enabled
                      ? `Watching ${reminders.status?.watching ?? 0} of your places.`
                      : 'Get a nudge at places you left a memory.'}
                  </Text>
                </View>
                {reminders.busy ? (
                  <ActivityIndicator color={COLORS.secondary} size="small" />
                ) : (
                  <Switch value={reminders.enabled} onValueChange={reminders.toggle} />
                )}
              </View>
            )}

            {user ? (
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <LogOut color={COLORS.error} size={16} style={{ marginRight: 6 }} />
                <Text style={styles.signOutText}>Log Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <LogIn color={COLORS.primary} size={18} style={{ marginRight: 6 }} />
                <Text style={styles.signInText}>Sign In / Sign Up</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  displayName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  username: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: 2,
  },
  memberNote: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  reminderTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  reminderSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.lg,
  },
  signOutText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.lg,
  },
  signInText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});
