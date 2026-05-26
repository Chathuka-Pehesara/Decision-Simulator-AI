// src/components/Card.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from '../styles/theme';

export default function Card({ children, style, outlined = true, shadowed = true }) {
  return (
    <View
      style={[
        styles.card,
        outlined && styles.outlined,
        shadowed && styles.shadowed,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  shadowed: {
    ...SHADOWS.light,
  },
});
