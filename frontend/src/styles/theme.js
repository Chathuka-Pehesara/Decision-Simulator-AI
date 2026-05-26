// src/styles/theme.js

export const COLORS = {
  background: '#090D16',    // Deep cosmic space dark blue
  surface: '#151D2F',       // Sleek dark glass layer
  card: '#0F1524',          // Rich obsidian dark card
  
  // Typography
  textPrimary: '#F8FAFC',   // Crisp, high-end white-blue
  textSecondary: '#94A3B8', // Slate grey for subtitles
  textMuted: '#64748B',     // Cool muted steel grey
  
  // Accent Colors
  accentBlue: '#3B82F6',    // Vibrant electric neon blue
  accentGreen: '#10B981',   // Neon emerald green
  accentBlueLight: 'rgba(59, 130, 246, 0.12)', // Subtle neon blue aura
  accentGreenLight: 'rgba(16, 185, 129, 0.12)', // Subtle neon green aura
  
  // Risk levels
  riskLow: '#10B981',
  riskLowBg: 'rgba(16, 185, 129, 0.12)',
  riskMedium: '#3B82F6',
  riskMediumBg: 'rgba(59, 130, 246, 0.12)',
  riskHigh: '#F43F5E',      // Rose-crimson red
  riskHighBg: 'rgba(244, 63, 94, 0.12)',
  
  // UI Details
  border: 'rgba(255, 255, 255, 0.08)',  // Sleek glassy micro-borders
  borderDark: 'rgba(255, 255, 255, 0.15)',
  divider: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const SHADOWS = {
  light: {
    shadowColor: '#3B82F6', // Sleek electric glow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: 'normal',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
};

export default {
  COLORS,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
  TYPOGRAPHY,
};
