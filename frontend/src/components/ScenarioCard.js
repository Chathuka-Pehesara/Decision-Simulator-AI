// src/components/ScenarioCard.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ScenarioCard({ scenario }) {
  const [expanded, setExpanded] = useState(false);

  const {
    title,
    description,
    risk_level,
    emotional_impact,
    probability,
    reasoning,
    timeline,
  } = scenario;

  const toggleExpand = () => {
    // Smooth layout transitions
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Setup risk styles dynamically
  let riskStyle = styles.riskMedium;
  let riskText = 'Medium Risk';
  if (risk_level?.toLowerCase() === 'low') {
    riskStyle = styles.riskLow;
    riskText = 'Low Risk';
  } else if (risk_level?.toLowerCase() === 'high') {
    riskStyle = styles.riskHigh;
    riskText = 'High Risk';
  } else if (risk_level) {
    // Treat any other values cleanly
    riskText = risk_level.charAt(0).toUpperCase() + risk_level.slice(1) + ' Risk';
  }

  return (
    <Card style={styles.cardContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {timeline && <Text style={styles.timeline}>{timeline}</Text>}
      </View>

      <Text style={styles.description}>{description}</Text>

      {/* Badges Container */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, riskStyle.bg]}>
          <Text style={[styles.badgeText, riskStyle.text]}>{riskText}</Text>
        </View>
        {emotional_impact && (
          <View style={[styles.badge, styles.emotionBadge]}>
            <Text style={[styles.badgeText, styles.emotionText]}>
              😊 {emotional_impact}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      {/* ProgressBar Integration */}
      <ProgressBar probability={probability} />

      {/* Accordion Reasoning Section */}
      {reasoning && (
        <View style={styles.accordionContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleExpand}
            style={styles.accordionHeader}
          >
            <Text style={styles.accordionTitle}>Why this outcome? (AI Reasoning)</Text>
            <Text style={styles.accordionArrow}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.accordionBody}>
              <Text style={styles.reasoningText}>{reasoning}</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    flex: 1,
    paddingRight: SPACING.xs,
  },
  timeline: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
  },
  
  // Custom compliance risk color badge configs
  riskLow: {
    bg: { backgroundColor: COLORS.riskLowBg },
    text: { color: COLORS.riskLow },
  },
  riskMedium: {
    bg: { backgroundColor: COLORS.riskMediumBg },
    text: { color: COLORS.riskMedium },
  },
  riskHigh: {
    bg: { backgroundColor: COLORS.riskHighBg },
    text: { color: COLORS.riskHigh },
  },

  emotionBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emotionText: {
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  accordionContainer: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  accordionTitle: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '600',
    color: COLORS.accentBlue,
  },
  accordionArrow: {
    fontSize: 10,
    color: COLORS.accentBlue,
  },
  accordionBody: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
  },
  reasoningText: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
