// src/components/Button.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'light'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const { theme, themeName } = useTheme();

  const isOutline = variant === 'outline';
  const isLight = variant === 'light';

  // Dynamic Styles
  const containerStyle = {
    height: 52,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
  };

  let themeContainerStyle = {};
  let themeTextStyle = {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  };

  if (isOutline) {
    themeContainerStyle = {
      backgroundColor: 'transparent',
      borderWidth: 1.8,
      borderColor: theme.colors.accentBlue,
    };
    themeTextStyle.color = theme.colors.accentBlue;
  } else if (isLight) {
    themeContainerStyle = {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    };
    themeTextStyle.color = theme.colors.textPrimary;
  } else {
    // Primary
    themeContainerStyle = {
      backgroundColor: theme.colors.accentBlue,
    };
    if (themeName !== 'accessibility' && themeName !== 'minimal') {
      themeContainerStyle.shadowColor = theme.colors.accentBlue;
      themeContainerStyle.shadowOffset = { width: 0, height: 6 };
      themeContainerStyle.shadowOpacity = 0.35;
      themeContainerStyle.shadowRadius = 12;
      themeContainerStyle.elevation = 6;
    }
    themeTextStyle.color = themeName === 'sci-fi' ? '#03050d' : '#FFFFFF';
  }

  if (disabled || loading) {
    themeContainerStyle.backgroundColor = themeName === 'accessibility' ? '#555555' : 'rgba(255, 255, 255, 0.05)';
    themeContainerStyle.borderColor = 'transparent';
    themeTextStyle.color = theme.colors.textMuted || '#587396';
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[containerStyle, themeContainerStyle, style]}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isOutline ? theme.colors.accentBlue : isLight ? theme.colors.textPrimary : '#FFFFFF'} 
        />
      ) : (
        <Text style={[themeTextStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
