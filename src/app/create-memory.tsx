import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { memoriesService } from '../services/memories';
import { MemoryType, IdentityVisibility, ExpirationType } from '../types/database';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { X, Send, AlertCircle, Eye, Shield, Clock } from 'lucide-react-native';

const MEMORY_TYPES: { type: MemoryType; label: string; emoji: string; desc: string }[] = [
  { type: 'memory', label: 'Memory', emoji: '💭', desc: 'A personal moment or story' },
  { type: 'warning', label: 'Warning', emoji: '⚠️', desc: 'Tip or heads up for future visitors' },
  { type: 'confession', label: 'Confession', emoji: '❤️', desc: 'An honest or unspoken truth' },
  { type: 'question', label: 'Question', emoji: '❓', desc: 'Ask someone who visits next' },
  { type: 'time_capsule', label: 'Time Capsule', emoji: '🕰️', desc: 'A note meant for long ago' },
  { type: 'mystery', label: 'Mystery', emoji: '🧩', desc: 'Riddle or hidden clue' },
];

const IDENTITY_OPTIONS: { id: IdentityVisibility; label: string; sub: string }[] = [
  { id: 'anonymous', label: 'Anonymous', sub: 'Nobody sees your profile' },
  { id: 'display_name', label: 'Display Name', sub: 'Shows your display name' },
  { id: 'username', label: 'Username', sub: 'Shows @username' },
];

const EXPIRATION_OPTIONS: { id: ExpirationType; label: string }[] = [
  { id: 'never', label: 'Never (Permanent)' },
  { id: '24h', label: '24 Hours' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
];

export default function CreateMemoryScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<MemoryType>('memory');
  const [identity, setIdentity] = useState<IdentityVisibility>('anonymous');
  const [expiration, setExpiration] = useState<ExpirationType>('never');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    setErrorMsg(null);
    if (!content.trim()) {
      setErrorMsg('Please write your memory before publishing.');
      return;
    }
    if (content.trim().length > APP_CONFIG.MEMORY_MAX_CHARACTERS) {
      setErrorMsg(`Memory must be ${APP_CONFIG.MEMORY_MAX_CHARACTERS} characters or less.`);
      return;
    }
    if (!placeId) {
      setErrorMsg('Missing place identifier.');
      return;
    }

    setSubmitting(true);
    const { error } = await memoriesService.createMemory({
      placeId: placeId as string,
      userId: user?.id || 'guest-user',
      content: content.trim(),
      memoryType: selectedType,
      identityVisibility: identity,
      visibility: 'anyone',
      expirationType: expiration,
    });
    setSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      router.back();
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > APP_CONFIG.MEMORY_MAX_CHARACTERS;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color={COLORS.textSecondary} size={22} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Leave Something Here</Text>

          <TouchableOpacity
            style={[styles.publishHeaderButton, isOverLimit && styles.publishHeaderButtonDisabled]}
            onPress={handlePublish}
            disabled={submitting || isOverLimit}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.textPrimary} size="small" />
            ) : (
              <>
                <Send color={COLORS.textPrimary} size={14} style={{ marginRight: 4 }} />
                <Text style={styles.publishHeaderText}>Publish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle color={COLORS.error} size={18} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Text Input Area */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="Write what you want future visitors to discover..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={APP_CONFIG.MEMORY_MAX_CHARACTERS + 20}
              autoFocus
            />
            <View style={styles.charCounterRow}>
              <Text
                style={[
                  styles.charCounterText,
                  isOverLimit && styles.charCounterOverLimit,
                ]}
              >
                {charCount} / {APP_CONFIG.MEMORY_MAX_CHARACTERS}
              </Text>
            </View>
          </View>

          {/* Memory Type Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Eye color={COLORS.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Memory Type</Text>
            </View>

            <View style={styles.grid2Col}>
              {MEMORY_TYPES.map((item) => {
                const isSelected = selectedType === item.type;
                return (
                  <TouchableOpacity
                    key={item.type}
                    style={[styles.typeCard, isSelected && styles.typeCardSelected]}
                    onPress={() => setSelectedType(item.type)}
                  >
                    <Text style={styles.typeCardEmoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.typeCardTitle,
                          isSelected && styles.typeCardTitleSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.typeCardDesc} numberOfLines={1}>
                        {item.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Identity Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield color={COLORS.secondary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Identity</Text>
            </View>

            <View style={styles.optionsColumn}>
              {IDENTITY_OPTIONS.map((opt) => {
                const isSelected = identity === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    onPress={() => setIdentity(opt.id)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          isSelected && styles.optionTitleSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Expiration Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock color={COLORS.ghost} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Expiration</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EXPIRATION_OPTIONS.map((exp) => {
                const isSelected = expiration === exp.id;
                return (
                  <TouchableOpacity
                    key={exp.id}
                    style={[styles.expPill, isSelected && styles.expPillSelected]}
                    onPress={() => setExpiration(exp.id)}
                  >
                    <Text
                      style={[styles.expPillText, isSelected && styles.expPillTextSelected]}
                    >
                      {exp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
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
  publishHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  publishHeaderButtonDisabled: {
    opacity: 0.5,
  },
  publishHeaderText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
  inputCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 160,
  },
  textInput: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounterRow: {
    alignItems: 'flex-end',
    marginTop: SPACING.xs,
  },
  charCounterText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  charCounterOverLimit: {
    color: COLORS.error,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  section: {
    gap: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  typeCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  typeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  typeCardEmoji: {
    fontSize: 20,
  },
  typeCardTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  typeCardTitleSelected: {
    color: COLORS.primary,
  },
  typeCardDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  optionsColumn: {
    gap: SPACING.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  optionRowSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surfaceElevated,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
  },
  radioCircleSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondary,
  },
  optionTitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  optionTitleSelected: {
    color: COLORS.textPrimary,
  },
  optionSub: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  expPill: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    marginRight: SPACING.xs,
  },
  expPillSelected: {
    borderColor: COLORS.ghost,
    backgroundColor: COLORS.surfaceElevated,
  },
  expPillText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  expPillTextSelected: {
    color: COLORS.ghost,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
});
