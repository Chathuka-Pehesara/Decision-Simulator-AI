// src/styles/theme.js

export const COLORS = {
  background: '#FFFFFF',
  surface: '#F8F9FA',      // Very light gray for backgrounds or subtle card divisions
  card: '#FFFFFF',
  
  // Typography
  textPrimary: '#0E0E10',   // Deep black for headers and main content
  textSecondary: '#4B5563', // Slate gray for descriptions and helper text
  textMuted: '#9CA3AF',     // Muted gray for timestamps and borders
  
  // Accent Colors
  accentBlue: '#0066FF',    // Electric Blue (Primary Action)
  accentGreen: '#00B074',   // Emerald Green (Success, High Probability)
  accentBlueLight: '#E6F0FF', // Very light blue for selected states or badges
  accentGreenLight: '#E6F7F1', // Very light green for positive badges
  
  // Risk levels
  riskLow: '#00B074',
  riskLowBg: '#E6F7F1',
  riskMedium: '#0066FF',
  riskMediumBg: '#E6F0FF',
  riskHigh: '#374151',      // Dark slate gray to remain neutral and avoid banned colors
  riskHighBg: '#F3F4F6',    // Light gray bg for high risk
  
  // UI Details
  border: '#EBEBEB',
  borderDark: '#D1D5DB',
  divider: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2, // Android elevation
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
