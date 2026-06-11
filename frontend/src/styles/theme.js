import { Platform } from 'react-native';

const DISPLAY_FONT = Platform.OS === 'web' ? 'Orbitron' : 'sans-serif';
const MONO_FONT = Platform.OS === 'web' ? 'IBM Plex Mono' : 'monospace';

// Font Families and Styling Helpers
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Default Sci-Fi Theme Tokens
const sciFiColors = {
  background: '#03050d',    // Deep space dark matter
  surface: 'rgba(0, 229, 255, 0.04)', // Frosted glass core overlay
  card: 'rgba(8, 12, 28, 0.85)',      // Dark matter glassy panel
  textPrimary: '#00e5ff',   // Glowing bioluminescent cyan
  textSecondary: '#a855f7', // Electric neon violet
  textMuted: '#587396',     // Terminal muted steel blue
  accentBlue: '#00e5ff',    // Bioluminescent Cyan
  accentViolet: '#a855f7',  // Bioluminescent Violet
  accentBlueLight: 'rgba(0, 229, 255, 0.08)',
  accentGreenLight: 'rgba(168, 85, 247, 0.08)',
  riskLow: '#00e5ff',
  riskLowBg: 'rgba(0, 229, 255, 0.1)',
  riskMedium: '#a855f7',
  riskMediumBg: 'rgba(168, 85, 247, 0.1)',
  riskHigh: '#f43f5e',
  riskHighBg: 'rgba(244, 63, 94, 0.1)',
  border: 'rgba(0, 229, 255, 0.15)',  // Cyan glow border
  borderDark: 'rgba(0, 229, 255, 0.35)',
  divider: 'rgba(0, 229, 255, 0.08)',
  overlay: 'rgba(3, 5, 13, 0.85)',
};

// Minimal Clean White Theme
const minimalColors = {
  background: '#f8fafc',    // Crisp Slate 50
  surface: 'rgba(255, 255, 255, 0.75)', // Glassy white surface
  card: '#ffffff',          // Solid white card
  textPrimary: '#0f172a',   // Dark Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94a3b8',     // Muted Slate 400
  accentBlue: '#3b82f6',    // Soft Royal Blue
  accentViolet: '#8b5cf6',  // Soft Indigo/Violet
  accentBlueLight: 'rgba(59, 130, 246, 0.08)',
  accentGreenLight: 'rgba(139, 92, 246, 0.08)',
  riskLow: '#10b981',       // Soft Emerald Green
  riskLowBg: 'rgba(16, 185, 129, 0.1)',
  riskMedium: '#f59e0b',    // Soft Amber
  riskMediumBg: 'rgba(245, 158, 11, 0.1)',
  riskHigh: '#ef4444',      // Soft Red
  riskHighBg: 'rgba(239, 68, 68, 0.1)',
  border: '#e2e8f0',        // Slate 200 border
  borderDark: '#cbd5e1',    // Slate 300 border
  divider: '#f1f5f9',       // Slate 100 divider
  overlay: 'rgba(15, 23, 42, 0.3)',
};

// Focus Mode Theme (Grayscale Dark)
const focusColors = {
  background: '#09090b',    // Zinc 950
  surface: '#18181b',       // Zinc 900
  card: '#18181b',          // Zinc 900 card
  textPrimary: '#fafafa',   // Zinc 50
  textSecondary: '#a1a1aa', // Zinc 400
  textMuted: '#52525b',     // Zinc 600
  accentBlue: '#a1a1aa',    // Zinc Accent
  accentViolet: '#71717a',  // Zinc secondary
  accentBlueLight: 'rgba(161, 161, 170, 0.08)',
  accentGreenLight: 'rgba(113, 113, 122, 0.08)',
  riskLow: '#a1a1aa',
  riskLowBg: 'rgba(161, 161, 170, 0.1)',
  riskMedium: '#71717a',
  riskMediumBg: 'rgba(113, 113, 122, 0.1)',
  riskHigh: '#e4e4e7',
  riskHighBg: 'rgba(228, 228, 231, 0.1)',
  border: '#27272a',        // Zinc 800 border
  borderDark: '#3f3f46',    // Zinc 700 border
  divider: '#27272a',
  overlay: 'rgba(9, 9, 11, 0.85)',
};

// High-Contrast Accessibility Theme
const accessibilityColors = {
  background: '#000000',    // Pure Black
  surface: '#000000',       // Pure Black
  card: '#000000',          // Pure Black
  textPrimary: '#ffffff',   // Pure White
  textSecondary: '#ffff00', // Neon Yellow for readability contrast
  textMuted: '#ffffff',     // Keep pure white for screen readers/readability
  accentBlue: '#00ffff',    // Pure Cyan
  accentViolet: '#ffff00',  // Pure Yellow
  accentBlueLight: 'rgba(0, 255, 255, 0.15)',
  accentGreenLight: 'rgba(255, 255, 0, 0.15)',
  riskLow: '#00ff00',       // Pure Green
  riskLowBg: 'rgba(0, 255, 0, 0.2)',
  riskMedium: '#ffff00',    // Pure Yellow
  riskMediumBg: 'rgba(255, 255, 0, 0.2)',
  riskHigh: '#ff0000',      // Pure Red
  riskHighBg: 'rgba(255, 0, 0, 0.2)',
  border: '#ffffff',        // Heavy contrast white borders
  borderDark: '#ffffff',
  divider: '#ffffff',
  overlay: 'rgba(0, 0, 0, 0.95)',
};

// Generates typography configuration per theme
const getTypography = (colors, isAccessibility = false) => {
  return {
    h1: {
      fontFamily: DISPLAY_FONT,
      fontSize: isAccessibility ? 28 : 26,
      fontWeight: '900',
      color: colors.textPrimary,
      lineHeight: isAccessibility ? 36 : 32,
      letterSpacing: isAccessibility ? 2.5 : 2,
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: DISPLAY_FONT,
      fontSize: isAccessibility ? 20 : 18,
      fontWeight: '800',
      color: colors.textPrimary,
      lineHeight: isAccessibility ? 28 : 24,
      letterSpacing: isAccessibility ? 2 : 1.5,
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: DISPLAY_FONT,
      fontSize: isAccessibility ? 16 : 14,
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: isAccessibility ? 22 : 20,
      letterSpacing: isAccessibility ? 1.5 : 1,
      textTransform: 'uppercase',
    },
    body: {
      fontFamily: MONO_FONT,
      fontSize: isAccessibility ? 16 : 14,
      fontWeight: isAccessibility ? 'bold' : 'normal',
      color: isAccessibility ? '#ffffff' : colors.textMuted === '#fafafa' ? '#d4d4d8' : colors.textPrimary === '#0f172a' ? '#334155' : '#94A3B8',
      lineHeight: isAccessibility ? 24 : 20,
    },
    subtext: {
      fontFamily: DISPLAY_FONT,
      fontSize: isAccessibility ? 13 : 11,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: isAccessibility ? 1.5 : 1.2,
      textTransform: 'uppercase',
    },
    badge: {
      fontFamily: MONO_FONT,
      fontSize: isAccessibility ? 13 : 11,
      fontWeight: '700',
      lineHeight: isAccessibility ? 16 : 14,
    },
  };
};

export const THEMES = {
  'sci-fi': {
    name: 'Sci-Fi Simulation',
    colors: sciFiColors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: getTypography(sciFiColors),
    isDark: true,
  },
  'minimal': {
    name: 'Minimal Clean White',
    colors: minimalColors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: getTypography(minimalColors),
    isDark: false,
  },
  'focus': {
    name: 'Zinc Focus Mode',
    colors: focusColors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: getTypography(focusColors),
    isDark: true,
  },
  'accessibility': {
    name: 'High Contrast Access',
    colors: accessibilityColors,
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: getTypography(accessibilityColors, true),
    isDark: true,
  },
};

export const COLORS = sciFiColors; // Fallback legacy export
export const SHADOWS = {
  light: {
    shadowColor: '#00e5ff',
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
export const TYPOGRAPHY = getTypography(sciFiColors);

export default {
  COLORS,
  THEMES,
  SPACING,
  BORDER_RADIUS,
  TYPOGRAPHY,
  SHADOWS,
};
