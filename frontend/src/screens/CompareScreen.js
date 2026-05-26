// src/screens/CompareScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { getSimulations } from '../services/storage';

export default function CompareScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idA, setIdA] = useState(null);
  const [idB, setIdB] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const data = await getSimulations();
      setHistory(data);
      if (data.length >= 2) {
        setIdA(data[0].id);
        setIdB(data[1].id);
      }
      setLoading(false);
    };

    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });

    return unsubscribe;
  }, [navigation]);

  const selectOptions = history.map(item => ({
    label: item.decision.length > 40 ? item.decision.slice(0, 40) + '...' : item.decision,
    value: item.id
  }));

  const recordA = history.find(item => item.id === idA);
  const recordB = history.find(item => item.id === idB);

  // Helper to extract highest probability scenario
  const getLeadingScenario = (record) => {
    if (!record || !record.result || !record.result.scenarios) return null;
    const list = [...record.result.scenarios];
    return list.sort((a, b) => b.probability - a.probability)[0];
  };

  const leadingA = getLeadingScenario(recordA);
  const leadingB = getLeadingScenario(recordB);

  const renderGridRow = (label, valueA, valueB, highlight = false) => {
    return (
      <View style={styles.gridRow}>
        <View style={styles.gridLabelCell}>
          <Text style={styles.gridRowLabel}>{label}</Text>
        </View>
        <View style={[styles.gridValueCell, highlight && styles.cellHighlight]}>
          <Text style={[styles.gridValueText, highlight && styles.textHighlightBlue]}>
            {valueA}
          </Text>
        </View>
        <View style={[styles.gridValueCell, highlight && styles.cellHighlight]}>
          <Text style={[styles.gridValueText, highlight && styles.textHighlightGreen]}>
            {valueB}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Decision Comparer</Text>
          <Text style={styles.subtitle}>
            Contrast risk profiles and leading scenarios of two distinct options side-by-side.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length < 2 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Insufficient Simulations</Text>
            <Text style={styles.emptySubtitle}>
              You need at least 2 simulated decisions saved in your history to compare them side-by-side.
            </Text>
            <Button 
              title="Go Simulate Decisions" 
              onPress={() => navigation.navigate('Home')}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.dashboardContainer}>
            {/* Pickers Card */}
            <Card style={styles.pickersCard} outlined shadowed={false}>
              <Dropdown
                label="First Choice (Option A)"
                placeholder="Choose decision..."
                selectedValue={idA}
                onValueChange={setIdA}
                options={selectOptions}
              />
              <Dropdown
                label="Second Choice (Option B)"
                placeholder="Choose decision..."
                selectedValue={idB}
                onValueChange={setIdB}
                options={selectOptions}
              />
            </Card>

            {/* Comparison Grid */}
            {recordA && recordB && (
              <View style={styles.comparisonFrame}>
                <View style={styles.gridHeaderRow}>
                  <View style={styles.gridLabelCell} />
                  <View style={styles.gridHeaderCell}>
                    <Text style={styles.headerCellTitle}>Option A</Text>
                  </View>
                  <View style={styles.gridHeaderCell}>
                    <Text style={[styles.headerCellTitle, styles.greenText]}>Option B</Text>
                  </View>
                </View>

                {/* Decision Statements */}
                <View style={styles.gridDecisionRow}>
                  <View style={styles.gridLabelCell}>
                    <Text style={styles.gridRowLabel}>Decision Statement</Text>
                  </View>
                  <View style={styles.gridValueCell}>
                    <Text style={styles.decisionStatement}>{recordA.decision}</Text>
                  </View>
                  <View style={styles.gridValueCell}>
                    <Text style={styles.decisionStatement}>{recordB.decision}</Text>
                  </View>
                </View>

                {/* Grid stats */}
                {renderGridRow('Risk Rating', recordA.risk?.toUpperCase(), recordB.risk?.toUpperCase())}
                {renderGridRow('Lens Style', recordA.personality?.toUpperCase(), recordB.personality?.toUpperCase())}
                
                {renderGridRow(
                  'Highest Prob.', 
                  leadingA ? `${leadingA.probability}%` : 'N/A', 
                  leadingB ? `${leadingB.probability}%` : 'N/A', 
                  true
                )}

                {/* Leading Scenario */}
                <View style={styles.gridDecisionRow}>
                  <View style={styles.gridLabelCell}>
                    <Text style={styles.gridRowLabel}>Leading Scenario</Text>
                  </View>
                  <View style={styles.gridValueCell}>
                    {leadingA ? (
                      <View>
                        <Text style={styles.leadingScenarioTitle}>{leadingA.title}</Text>
                        <Text style={styles.leadingScenarioDesc}>{leadingA.description}</Text>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No scenario</Text>
                    )}
                  </View>
                  <View style={styles.gridValueCell}>
                    {leadingB ? (
                      <View>
                        <Text style={styles.leadingScenarioTitle}>{leadingB.title}</Text>
                        <Text style={styles.leadingScenarioDesc}>{leadingB.description}</Text>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No scenario</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Quick Summary review */}
            {recordA && recordB && leadingA && leadingB && (
              <Card style={styles.reviewCard} outlined={false} shadowed={true}>
                <Text style={styles.reviewTitle}>💡 Comparative Intelligence</Text>
                <View style={styles.reviewList}>
                  <Text style={styles.reviewItem}>
                    • **Option A** has a leading probability of **{leadingA.probability}%** with the outcome: *"{leadingA.title}"*.
                  </Text>
                  <Text style={styles.reviewItem}>
                    • **Option B** has a leading probability of **{leadingB.probability}%** with the outcome: *"{leadingB.title}"*.
                  </Text>
                  <Text style={styles.reviewItem}>
                    • Choose between **{recordA.risk?.toUpperCase()}** risk and **{recordB.risk?.toUpperCase()}** risk structures depending on your stability buffers.
                  </Text>
                </View>
              </Card>
            )}
          </View>
        )}
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
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  centeredState: {
    paddingVertical: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    alignSelf: 'stretch',
  },
  dashboardContainer: {
    gap: SPACING.lg,
  },
  pickersCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  comparisonFrame: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.border,
  },
  gridLabelCell: {
    width: '28%',
    padding: SPACING.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  gridHeaderCell: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  headerCellTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
  greenText: {
    color: COLORS.accentGreen,
  },
  gridDecisionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  decisionStatement: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
    lineHeight: 16,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  gridRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValueCell: {
    flex: 1,
    padding: SPACING.sm,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    justifyContent: 'center',
  },
  cellHighlight: {
    backgroundColor: COLORS.surface,
  },
  gridValueText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  textHighlightBlue: {
    color: COLORS.accentBlue,
    fontSize: 15,
    fontWeight: 'bold',
  },
  textHighlightGreen: {
    color: COLORS.accentGreen,
    fontSize: 15,
    fontWeight: 'bold',
  },
  leadingScenarioTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  leadingScenarioDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  reviewCard: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  reviewTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  reviewList: {
    gap: SPACING.xs,
  },
  reviewItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
