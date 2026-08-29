export const COLORS = {
  // Backgrounds
  background: '#0B0D10',
  surface: '#15181E',
  surfaceElevated: '#1E232D',
  surfaceBorder: '#2A2F3D',

  // Primary Branding & Accent Colors
  primary: '#FF6B35', // Warm Ember
  primaryGlow: 'rgba(255, 107, 53, 0.25)',
  
  secondary: '#2EC4B6', // Cyan Discovery Accent
  ghost: '#F7B801',     // Amber / Gold for Ghost Memories (>1 yr)
  ancient: '#E71D36',   // Deep Crimson for Ancient Memories (>5 yrs)
  mystery: '#A06CD5',   // Mystic Violet for Secret Memories

  // Memory Type Specific Colors
  memoryTypes: {
    memory: '#2EC4B6',
    warning: '#FF9F1C',
    confession: '#FF4D6D',
    question: '#4EA8DE',
    time_capsule: '#F7B801',
    mystery: '#A06CD5',
  },

  // Text Colors
  textPrimary: '#F0F4F8',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDark: '#0D1117',

  // System & Functional
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  overlay: 'rgba(11, 13, 16, 0.85)',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
} as const;

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
