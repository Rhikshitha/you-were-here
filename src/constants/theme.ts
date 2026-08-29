// src/constants/theme.ts

// Light‑mode palette – default theme
export const LIGHT_THEME = {
  // Backgrounds
  background: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F2F2F2',
  surfaceBorder: '#E0E0E0',

  // Primary Branding & Accent Colors
  primary: '#2A68FF', // Calm blue
  primaryGlow: 'rgba(42, 104, 255, 0.25)',
  secondary: '#FF6B6B', // Soft red
  ghost: '#FFB400', // Amber / Gold (Ghost memories)
  ancient: '#E71D36', // Deep crimson (Ancient memories)
  mystery: '#A06CD5', // Mystic violet

  // Memory type specific colors
  memoryTypes: {
    memory: '#2A68FF',
    warning: '#FF9F1C',
    confession: '#FF4D6D',
    question: '#4EA8DE',
    time_capsule: '#FFB400',
    mystery: '#A06CD5',
  },

  // Text colors
  textPrimary: '#222222',
  textSecondary: '#555555',
  textMuted: '#777777',
  textDark: '#111111',

  // System & functional colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(255, 255, 255, 0.85)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
} as const;

// Dark‑mode palette (kept for future use)
export const DARK_THEME = {
  // Backgrounds
  background: '#0B0D10',
  surface: '#15181E',
  surfaceElevated: '#1E232D',
  surfaceBorder: '#2A2F3D',

  // Primary Branding & Accent Colors
  primary: '#FF6B35', // Warm Ember
  primaryGlow: 'rgba(255, 107, 53, 0.25)',
  secondary: '#2EC4B6', // Cyan discovery accent
  ghost: '#F7B801', // Amber / Gold (Ghost memories)
  ancient: '#E71D36',
  mystery: '#A06CD5',

  // Memory type specific colors
  memoryTypes: {
    memory: '#2EC4B6',
    warning: '#FF9F1C',
    confession: '#FF4D6D',
    question: '#4EA8DE',
    time_capsule: '#F7B801',
    mystery: '#A06CD5',
  },

  // Text colors (dark theme)
  textPrimary: '#F0F4F8',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDark: '#0D1117',

  // System & functional colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(11, 13, 16, 0.85)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
} as const;

// Export the active palette – light theme by default
export const COLORS = LIGHT_THEME;

// Typography, spacing and radius definitions (unchanged)
export const TYPOGRAPHY = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 34,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 9999,
} as const;
