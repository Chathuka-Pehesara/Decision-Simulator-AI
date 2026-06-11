// src/screens/CompareScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import Card from '../components/Card';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getSimulations } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export default function CompareScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  
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

  const getRiskColor = (risk) => {
    if (!risk) return theme.colors.textPrimary;
    const r = risk.toLowerCase();
    if (r === 'low') return theme.colors.riskLow;
    if (r === 'medium') return theme.colors.riskMedium;
    if (r === 'high') return theme.colors.riskHigh;
    return theme.colors.textPrimary;
  };

  const getOutcomeText = (rec) => {
    if (!rec || !rec.outcome) return 'PENDING';
    return rec.outcome.rating.toUpperCase();
  };

  const getOutcomeColor = (rec) => {
    if (!rec || !rec.outcome) return theme.colors.textMuted;
    return rec.outcome.rating === 'positive' ? '#10b981' : rec.outcome.rating === 'negative' ? theme.colors.riskHigh : theme.colors.textSecondary;
  };

  const renderGridRow = (label, valueA, valueB, highlight = false, colorA = null, colorB = null) => {
    return (
      <View style={[styles.gridRow, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.gridLabelCell, { borderRightColor: theme.colors.border }]}>
          <Text style={[styles.gridRowLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
        <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }, highlight && { backgroundColor: theme.colors.surface }]}>
          <Text style={[
            styles.gridValueText, 
            { color: colorA || theme.colors.textPrimary }, 
            highlight && { color: colorA || theme.colors.accentBlue, fontSize: 15, fontWeight: 'bold' }
          ]}>
            {valueA}
          </Text>
        </View>
        <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }, highlight && { backgroundColor: theme.colors.surface }]}>
          <Text style={[
            styles.gridValueText, 
            { color: colorB || theme.colors.textPrimary }, 
            highlight && { color: colorB || theme.colors.accentViolet, fontSize: 15, fontWeight: 'bold' }
          ]}>
            {valueB}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[
            styles.title, 
            { 
              color: theme.colors.accentBlue, 
              fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
              fontWeight: '900',
              fontSize: themeName === 'accessibility' ? 24 : 22,
              letterSpacing: 1.5,
              textTransform: 'uppercase'
            }
          ]}>
            Decision Comparer
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Contrast risk profiles and leading scenarios of two distinct options side-by-side.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading history...</Text>
          </View>
        ) : history.length < 2 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Insufficient Simulations</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
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
            <Card 
              style={[
                styles.pickersCard, 
                { 
                  backgroundColor: themeName === 'accessibility' ? '#000000' : theme.colors.surface, 
                  borderColor: theme.colors.border 
                }
              ]} 
              outlined 
              shadowed={false}
            >
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
              <View style={[styles.comparisonFrame, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
                <View style={[styles.gridHeaderRow, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.gridLabelCell, { borderRightColor: theme.colors.border }]} />
                  <View style={[styles.gridHeaderCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.headerCellTitle, { color: theme.colors.accentBlue }]}>Option A</Text>
                    <Text numberOfLines={1} style={[styles.headerDecisionSubtitle, { color: theme.colors.textMuted }]}>
                      {recordA.decision}
                    </Text>
                  </View>
                  <View style={[styles.gridHeaderCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.headerCellTitle, { color: theme.colors.accentViolet }]}>Option B</Text>
                    <Text numberOfLines={1} style={[styles.headerDecisionSubtitle, { color: theme.colors.textMuted }]}>
                      {recordB.decision}
                    </Text>
                  </View>
                </View>

                {/* Decision Statements */}
                <View style={[styles.gridDecisionRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.gridLabelCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.gridRowLabel, { color: theme.colors.textSecondary }]}>Decision Statement</Text>
                  </View>
                  <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.decisionStatement, { color: theme.colors.textPrimary }]}>{recordA.decision}</Text>
                  </View>
                  <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.decisionStatement, { color: theme.colors.textPrimary }]}>{recordB.decision}</Text>
                  </View>
                </View>

                {/* Grid stats */}
                {renderGridRow('Category', (recordA.category || 'general').toUpperCase(), (recordB.category || 'general').toUpperCase())}
                {renderGridRow('Risk Rating', recordA.risk?.toUpperCase(), recordB.risk?.toUpperCase(), false, getRiskColor(recordA.risk), getRiskColor(recordB.risk))}
                {renderGridRow('Lens Style', recordA.personality?.toUpperCase(), recordB.personality?.toUpperCase())}
                
                {renderGridRow(
                  'Bias Index', 
                  recordA.result?.cognitive_analysis?.bias_score !== undefined ? `${recordA.result.cognitive_analysis.bias_score}%` : 'N/A', 
                  recordB.result?.cognitive_analysis?.bias_score !== undefined ? `${recordB.result.cognitive_analysis.bias_score}%` : 'N/A',
                  false,
                  recordA.result?.cognitive_analysis?.bias_score > 50 ? theme.colors.riskHigh : theme.colors.accentBlue,
                  recordB.result?.cognitive_analysis?.bias_score > 50 ? theme.colors.riskHigh : theme.colors.accentViolet
                )}

                {renderGridRow(
                  'Emotional Toll', 
                  recordA.result?.emotional_analysis?.intensity_score !== undefined ? `${recordA.result.emotional_analysis.intensity_score}%` : 'N/A', 
                  recordB.result?.emotional_analysis?.intensity_score !== undefined ? `${recordB.result.emotional_analysis.intensity_score}%` : 'N/A'
                )}

                {renderGridRow(
                  'Highest Prob.', 
                  leadingA ? `${leadingA.probability}%` : 'N/A', 
                  leadingB ? `${leadingB.probability}%` : 'N/A', 
                  true
                )}

                {renderGridRow(
                  'Journaled Outcome',
                  getOutcomeText(recordA),
                  getOutcomeText(recordB),
                  false,
                  getOutcomeColor(recordA),
                  getOutcomeColor(recordB)
                )}

                {/* Leading Scenario */}
                <View style={[styles.gridDecisionRow, { borderBottomColor: theme.colors.border }]}>
                  <View style={[styles.gridLabelCell, { borderRightColor: theme.colors.border }]}>
                    <Text style={[styles.gridRowLabel, { color: theme.colors.textSecondary }]}>Leading Scenario</Text>
                  </View>
                  <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }]}>
                    {leadingA ? (
                      <View>
                        <Text style={[styles.leadingScenarioTitle, { color: theme.colors.accentBlue }]}>{leadingA.title}</Text>
                        <Text style={[styles.leadingScenarioDesc, { color: theme.colors.textMuted }]}>{leadingA.description}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No scenario</Text>
                    )}
                  </View>
                  <View style={[styles.gridValueCell, { borderRightColor: theme.colors.border }]}>
                    {leadingB ? (
                      <View>
                        <Text style={[styles.leadingScenarioTitle, { color: theme.colors.accentViolet }]}>{leadingB.title}</Text>
                        <Text style={[styles.leadingScenarioDesc, { color: theme.colors.textMuted }]}>{leadingB.description}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No scenario</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Quick Summary review */}
            {recordA && recordB && leadingA && leadingB && (
              <Card 
                style={[
                  styles.reviewCard, 
                  { 
                    backgroundColor: themeName === 'accessibility' ? '#000000' : theme.colors.surface, 
                    borderColor: theme.colors.border 
                  }
                ]} 
                outlined 
                shadowed={false}
              >
                <Text style={[styles.reviewTitle, { color: theme.colors.textPrimary, fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron' }]}>
                  💡 Comparative Intelligence
                </Text>
                <View style={styles.reviewList}>
                  <Text style={[styles.reviewItem, { color: theme.colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: theme.colors.accentBlue }}>Option A</Text> has a leading probability of <Text style={{ fontWeight: 'bold', color: theme.colors.accentBlue }}>{leadingA.probability}%</Text> with the outcome: <Text style={{ fontStyle: 'italic', color: theme.colors.textPrimary }}>"{leadingA.title}"</Text>.
                  </Text>
                  <Text style={[styles.reviewItem, { color: theme.colors.textSecondary }]}>
                    • <Text style={{ fontWeight: 'bold', color: theme.colors.accentViolet }}>Option B</Text> has a leading probability of <Text style={{ fontWeight: 'bold', color: theme.colors.accentViolet }}>{leadingB.probability}%</Text> with the outcome: <Text style={{ fontStyle: 'italic', color: theme.colors.textPrimary }}>"{leadingB.title}"</Text>.
                  </Text>
                  <Text style={[styles.reviewItem, { color: theme.colors.textSecondary }]}>
                    • Choose between <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{recordA.risk?.toUpperCase()}</Text> risk and <Text style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>{recordB.risk?.toUpperCase()}</Text> risk structures depending on your stability buffers.
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
    fontSize: 22,
  },
  subtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
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
    fontFamily: 'Orbitron',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontFamily: 'Orbitron',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
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
  },
  comparisonFrame: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
  },
  gridLabelCell: {
    width: '28%',
    padding: SPACING.sm,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  gridHeaderCell: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  headerCellTitle: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerDecisionSubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: '95%',
  },
  gridDecisionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  decisionStatement: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  gridRowLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridValueCell: {
    flex: 1,
    padding: SPACING.sm,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  gridValueText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    fontWeight: '600',
  },
  leadingScenarioTitle: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  leadingScenarioDesc: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    lineHeight: 16,
  },
  reviewCard: {
    padding: SPACING.md,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  reviewList: {
    gap: SPACING.xs,
  },
  reviewItem: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
  },
});
