// src/screens/ResultScreen.js
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Share, 
  Alert 
} from 'react-native';
import ScenarioCard from '../components/ScenarioCard';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function ResultScreen({ route, navigation }) {
  // Read params sent during navigation
  const { simulation, decision } = route.params || {};

  if (!simulation) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No simulation data available.</Text>
          <Button title="Go Home" onPress={() => navigation.navigate('Home')} />
        </View>
      </SafeAreaView>
    );
  }

  const { scenarios = [], key_factors_to_consider = [], final_note = '' } = simulation;

  const handleShare = async () => {
    try {
      // Assemble structured plain-text for sharing
      let shareText = `🔮 Decision Simulator AI Outcome\n`;
      shareText += `Decision: "${decision}"\n\n`;
      
      scenarios.forEach((sc, i) => {
        shareText += `${i + 1}. [${sc.probability}%] ${sc.title}\n`;
        shareText += `   Timeline: ${sc.timeline || 'N/A'}\n`;
        shareText += `   Risk: ${sc.risk_level?.toUpperCase()}\n`;
        shareText += `   Emotional: ${sc.emotional_impact}\n`;
        shareText += `   Outcome: ${sc.description}\n\n`;
      });

      if (key_factors_to_consider.length > 0) {
        shareText += `📌 Key Factors to Consider:\n`;
        key_factors_to_consider.forEach(factor => {
          shareText += ` - ${factor}\n`;
        });
        shareText += `\n`;
      }

      shareText += `⚠️ Note:\n${final_note}\n`;

      await Share.share({
        message: shareText,
        title: 'Decision Simulation Outcome',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share simulation results.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decision Summary Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>Simulating Decision</Text>
          <Text style={styles.bannerTitle}>"{decision}"</Text>
        </View>

        {/* Section Scenarios */}
        <Text style={styles.sectionTitle}>Possible Future Scenarios</Text>
        {scenarios.map((scenario, index) => (
          <ScenarioCard key={index.toString()} scenario={scenario} />
        ))}

        {/* Key Factors */}
        {key_factors_to_consider.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Key Factors to Monitor</Text>
            <Card outlined shadowed={false} style={styles.factorsCard}>
              {key_factors_to_consider.map((factor, index) => (
                <View key={index.toString()} style={styles.factorItem}>
                  <Text style={styles.factorBullet}>•</Text>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Strict Neutral AI Callout Box */}
        {final_note ? (
          <View style={styles.sectionContainer}>
            <Card outlined={true} shadowed={false} style={styles.calloutCard}>
              <Text style={styles.calloutEmoji}>ℹ️</Text>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>Neutral Analytical Simulation</Text>
                <Text style={styles.calloutText}>{final_note}</Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Actions Footer */}
        <View style={styles.footerRow}>
          <Button
            title="📤 Share Simulation"
            onPress={handleShare}
            variant="outline"
            style={styles.actionBtn}
          />
          <Button
            title="Done"
            onPress={() => navigation.navigate('Home')}
            variant="primary"
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  banner: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  bannerLabel: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.accentBlue,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  bannerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
  },
  sectionContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  factorsCard: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  factorBullet: {
    fontSize: 16,
    color: COLORS.accentBlue,
    marginRight: SPACING.sm,
    lineHeight: 20,
  },
  factorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  calloutCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderDark,
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  calloutEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  calloutContent: {
    flex: 1,
  },
  calloutTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  calloutText: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionBtn: {
    flex: 1,
  },
});
