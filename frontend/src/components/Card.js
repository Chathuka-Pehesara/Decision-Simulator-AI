// src/components/Card.js
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Card({ children, style, outlined = true, shadowed = true }) {
  const { theme, themeName } = useTheme();

  const shadowStyle = themeName === 'accessibility' || themeName === 'minimal' ? {} : {
    shadowColor: theme.colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  };

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
        },
        outlined && {
          borderWidth: themeName === 'accessibility' ? 2 : 1.5,
          borderColor: theme.colors.border,
        },
        shadowed && shadowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
