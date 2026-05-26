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
    height: 50,
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.accentBlue,
  },
  light: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    backgroundColor: COLORS.divider,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
