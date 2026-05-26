// src/components/ProgressBar.js
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function ProgressBar({ probability }) {
  // Clamp probability between 0 and 100
  const percentage = Math.min(Math.max(probability || 0, 0), 100);
  
  // Choose beautiful blue or green based on percentage
  const isHigh = percentage >= 60;
  const barColor = isHigh ? COLORS.accentGreen : COLORS.accentBlue;
  const trackBg = isHigh ? COLORS.accentGreenLight : COLORS.accentBlueLight;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Probability</Text>
        <Text style={[styles.value, { color: barColor }]}>{percentage}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: trackBg }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${percentage}%`, 
              backgroundColor: barColor 
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  value: {
    ...TYPOGRAPHY.h3,
    fontWeight: 'bold',
  },
  track: {
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});
