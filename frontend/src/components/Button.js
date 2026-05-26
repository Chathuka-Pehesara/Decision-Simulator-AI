// src/components/Button.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'light'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const isOutline = variant === 'outline';
  const isLight = variant === 'light';
  
  const buttonStyles = [
    styles.base,
    isOutline && styles.outline,
    isLight && styles.light,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    isOutline && styles.textOutline,
    isLight && styles.textLight,
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isOutline ? COLORS.accentBlue : isLight ? COLORS.textPrimary : '#FFFFFF'} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    // High-end neon glowing blue drop shadow
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.8,
    borderColor: COLORS.accentBlue,
  },
  light: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    // Subtle button shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  disabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase', // Bold modern high-end feel
  },
  textOutline: {
    color: COLORS.accentBlue,
  },
  textLight: {
    color: COLORS.textPrimary,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
});
