// src/styles/theme.js
import { Platform } from 'react-native';

export const COLORS = {
  background: '#03050d',    // Deep space dark matter
  surface: 'rgba(0, 229, 255, 0.04)', // Frosted glass core overlay
  card: 'rgba(8, 12, 28, 0.85)',      // Dark matter glassy panel
  
  // Typography
  textPrimary: '#00e5ff',   // Glowing bioluminescent cyan
  textSecondary: '#a855f7', // Electric neon violet
  textMuted: '#587396',     // Terminal muted steel blue
  
  // Accent Colors
  accentBlue: '#00e5ff',    // Bioluminescent Cyan (Teal)
  accentViolet: '#a855f7',  // Bioluminescent Violet
  accentBlueLight: 'rgba(0, 229, 255, 0.08)',
  accentGreenLight: 'rgba(168, 85, 247, 0.08)',
  
  // Risk levels
  riskLow: '#00e5ff',
  riskLowBg: 'rgba(0, 229, 255, 0.1)',
  riskMedium: '#a855f7',
  riskMediumBg: 'rgba(168, 85, 247, 0.1)',
  riskHigh: '#f43f5e',
  riskHighBg: 'rgba(244, 63, 94, 0.1)',
  
  // UI Details
  border: 'rgba(0, 229, 255, 0.15)',  // Cyan glow border
  borderDark: 'rgba(0, 229, 255, 0.35)',
  divider: 'rgba(0, 229, 255, 0.08)',
  overlay: 'rgba(3, 5, 13, 0.85)',
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
    shadowColor: '#00e5ff', // Bioluminescent Cyan glow shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  medium: {
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Font Families
const DISPLAY_FONT = Platform.OS === 'web' ? 'Orbitron' : 'sans-serif';
const MONO_FONT = Platform.OS === 'web' ? 'IBM Plex Mono' : 'monospace';

export const TYPOGRAPHY = {
  h1: {
    fontFamily: DISPLAY_FONT,
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    lineHeight: 32,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  h2: {
    fontFamily: DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  h3: {
    fontFamily: DISPLAY_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: MONO_FONT,
    fontSize: 14,
    fontWeight: 'normal',
    color: '#94A3B8', // Silver slate text for console readability
    lineHeight: 20,
  },
  subtext: {
    fontFamily: DISPLAY_FONT,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  badge: {
    fontFamily: MONO_FONT,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
};

export default {
  COLORS,
  SPACING,
  SHADOWS,
  BORDER_RADIUS,
  TYPOGRAPHY,
};
