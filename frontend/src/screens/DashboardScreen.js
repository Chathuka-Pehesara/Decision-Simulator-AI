// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import Card from '../components/Card';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getSimulations, getSubscriptionTier } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export default function DashboardScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTier, setSubTier] = useState({ tier: 'free', count: 0 });
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'org'

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setLoading(true);
      const data = await getSimulations();
      setHistory(data);
      const sub = await getSubscriptionTier();
      setSubTier(sub);
      if (sub.tier !== 'teams') {
        setActiveTab('personal');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centeredContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>ANALYZING COGNITIVE HISTORY...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.centeredContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Analytics Available</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Run and save decision simulations first. The dashboard will automatically map your cognitive trends, biases, and outcome calibrations.
          </Text>
          <Button 
            title="Start First Simulation" 
            onPress={() => navigation.navigate('Home')}
            style={styles.simulateBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- STATS CALCULATION ---
  const totalSims = history.length;
  
  // 1. Average bias score
  const totalBias = history.reduce((sum, item) => sum + (item.result?.cognitive_analysis?.bias_score || 0), 0);
  const avgBias = Math.round(totalBias / totalSims);

  // 2. Average emotional intensity
  const totalEmotion = history.reduce((sum, item) => sum + (item.result?.emotional_analysis?.intensity_score || 0), 0);
  const avgEmotion = Math.round(totalEmotion / totalSims);

  // 3. Outcomes calibration
  const journaledSims = history.filter(item => item.outcome);
  const totalJournaled = journaledSims.length;
  const positiveJournaled = journaledSims.filter(item => item.outcome.rating === 'positive').length;
  const calibrationRatio = totalJournaled > 0 ? Math.round((positiveJournaled / totalJournaled) * 100) : 0;

  // 4. Compile prone biases frequency
  const biasCounts = {};
  history.forEach(item => {
    const biases = item.result?.cognitive_analysis?.detected_biases || [];
    biases.forEach(b => {
      biasCounts[b.name] = (biasCounts[b.name] || 0) + 1;
    });
  });
  
  const sortedBiases = Object.entries(biasCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // 5. Compile category-level trigger scores
  const categoryStats = {
    career: { totalScore: 0, count: 0 },
    finance: { totalScore: 0, count: 0 },
    relationships: { totalScore: 0, count: 0 },
    health: { totalScore: 0, count: 0 },
    general: { totalScore: 0, count: 0 }
  };

  history.forEach(item => {
    const cat = item.category || 'general';
    const score = item.result?.cognitive_analysis?.bias_score || 0;
    if (categoryStats[cat]) {
      categoryStats[cat].totalScore += score;
      categoryStats[cat].count += 1;
    }
  });

  const categoryBreakdown = Object.entries(categoryStats).map(([name, stat]) => {
    return {
      name,
      count: stat.count,
      avgScore: stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0
    };
  }).filter(c => c.count > 0);

  // 6. Calculate Improvement Trend (first 50% vs last 50% chronologically)
  // Note: history is sorted newest first, so reverse to read chronologically
  const chronologicalHistory = [...history].reverse();
  let improvementMessage = "Simulate more decisions to identify self-improvement indices.";
  let improvementColor = theme.colors.textMuted;
  
  if (totalSims >= 2) {
    const splitIndex = Math.ceil(chronologicalHistory.length / 2);
    const firstHalf = chronologicalHistory.slice(0, splitIndex);
    const secondHalf = chronologicalHistory.slice(splitIndex);

    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + (item.result?.cognitive_analysis?.bias_score || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + (item.result?.cognitive_analysis?.bias_score || 0), 0) / secondHalf.length;

    const diff = firstHalfAvg - secondHalfAvg;
    const pctDiff = firstHalfAvg > 0 ? Math.round((diff / firstHalfAvg) * 100) : 0;

    if (diff > 0) {
      improvementMessage = `🎉 Excellent! Your average cognitive bias score decreased by ${pctDiff}% over the course of your simulations.`;
      improvementColor = '#10b981'; // Green
    } else if (diff < 0) {
      improvementMessage = `⚠️ Attention: Your average bias score has increased by ${Math.abs(pctDiff)}% recently. Pause and use the Socratic mode.`;
      improvementColor = theme.colors.riskHigh; // Red
    } else {
      improvementMessage = `⚖️ Stable rationality index. Your average bias level remains consolidated at ${Math.round(secondHalfAvg)}%.`;
      improvementColor = theme.colors.accentBlue;
    }
  }

  // --- SVG PLOTTING CALCULATION ---
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 48, 550);
  const chartHeight = 160;
  const paddingX = 35;
  const paddingY = 20;

  // Plot line chart coordinates
  let svgPath = '';
  const points = [];
  
  if (totalSims > 0) {
    const activePoints = chronologicalHistory.slice(-7); // Plot at most last 7 records for layout spacing
    const divisor = activePoints.length > 1 ? activePoints.length - 1 : 1;
    
    activePoints.forEach((item, idx) => {
      const x = paddingX + (idx * (chartWidth - 2 * paddingX)) / divisor;
      const score = item.result?.cognitive_analysis?.bias_score || 0;
      const y = chartHeight - paddingY - (score * (chartHeight - 2 * paddingY)) / 100;
      points.push({ x, y, score, date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    });

    if (points.length > 0) {
      svgPath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        // Curve construction
        const prev = points[i - 1];
        const curr = points[i];
        const cpX1 = prev.x + (curr.x - prev.x) / 2;
        const cpY1 = prev.y;
        const cpX2 = prev.x + (curr.x - prev.x) / 2;
        const cpY2 = curr.y;
        svgPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
      }
    }
  }

  const getThemeDisplayColor = (baseColor) => {
    return themeName === 'accessibility' ? '#ffffff' : baseColor;
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Segment Control */}
        <View style={[styles.segmentControl, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('personal')}
            style={[
              styles.segmentBtn,
              activeTab === 'personal' && { backgroundColor: theme.colors.accentBlue }
            ]}
          >
            <Text style={[
              styles.segmentBtnText,
              { color: activeTab === 'personal' ? (themeName === 'sci-fi' ? '#03050d' : '#FFFFFF') : theme.colors.textSecondary }
            ]}>
              Personal Analytics
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (subTier.tier === 'teams') {
                setActiveTab('org');
              } else {
                Alert.alert(
                  'Enterprise Analytics Locked',
                  'Organization-Level Analytics are exclusive to the Enterprise Teams tier. Co-simulate, track room consensus, and map team cognitive biases!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Upgrade to Teams', onPress: () => navigation.navigate('Subscription') }
                  ]
                );
              }
            }}
            style={[
              styles.segmentBtn,
              activeTab === 'org' && { backgroundColor: '#fbbf24' }
            ]}
          >
            <Text style={[
              styles.segmentBtnText,
              { color: activeTab === 'org' ? '#03050d' : theme.colors.textMuted }
            ]}>
              {subTier.tier === 'teams' ? 'Organization Analytics' : '🔒 Org Analytics'}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'personal' ? (
          <>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Total */}
              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: theme.colors.textPrimary }]}>{totalSims}</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>SIMULATIONS RUN</Text>
              </Card>

              {/* Card 2: Bias */}
              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: avgBias > 50 ? theme.colors.riskHigh : theme.colors.accentBlue }]}>{avgBias}%</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>AVG BIAS INDEX</Text>
              </Card>

              {/* Card 3: Emotion */}
              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: theme.colors.accentViolet }]}>{avgEmotion}%</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>AVG EMOTION TOLL</Text>
              </Card>

              {/* Card 4: Journal */}
              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: '#10b981' }]}>{totalJournaled}</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>OUTCOMES LOGGED</Text>
              </Card>
            </View>

            {/* Self-Improvement Alert Banner */}
            <View style={[styles.improvementBanner, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.improvementText, { color: improvementColor }]}>
                {improvementMessage}
              </Text>
            </View>

            {/* Bias Trend Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily }]}>
                📈 COGNITIVE BIAS TREND
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted }]}>
                Stochastic tracing of your bias scores across your last 7 decisions
              </Text>

              <Card style={[styles.chartCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                {points.length > 0 ? (
                  <View style={styles.chartWrapper}>
                    <Svg width={chartWidth} height={chartHeight}>
                      {/* Grid Lines */}
                      {[0, 25, 50, 75, 100].map((val) => {
                        const y = chartHeight - paddingY - (val * (chartHeight - 2 * paddingY)) / 100;
                        return (
                          <G key={val}>
                            <Line 
                              x1={paddingX} 
                              y1={y} 
                              x2={chartWidth - paddingX} 
                              y2={y} 
                              stroke={theme.colors.divider} 
                              strokeWidth="1" 
                              strokeDasharray="4, 4" 
                            />
                            <SvgText 
                              x={paddingX - 8} 
                              y={y + 3} 
                              fill={theme.colors.textMuted} 
                              fontSize="8" 
                              textAnchor="end"
                              fontFamily="IBM Plex Mono"
                            >
                              {val}%
                            </SvgText>
                          </G>
                        );
                      })}

                      {/* Connecting Sparkline */}
                      {svgPath !== '' && (
                        <Path 
                          d={svgPath} 
                          fill="none" 
                          stroke={getThemeDisplayColor(theme.colors.accentBlue)} 
                          strokeWidth="2.5" 
                        />
                      )}

                      {/* Dot Point Indicators */}
                      {points.map((pt, i) => (
                        <G key={i}>
                          <Circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r="4" 
                            fill={theme.colors.background} 
                            stroke={getThemeDisplayColor(theme.colors.accentBlue)} 
                            strokeWidth="2" 
                          />
                          <SvgText 
                            x={pt.x} 
                            y={chartHeight - 4} 
                            fill={theme.colors.textMuted} 
                            fontSize="7" 
                            textAnchor="middle"
                            fontFamily="IBM Plex Mono"
                          >
                            {pt.date}
                          </SvgText>
                          <SvgText 
                            x={pt.x} 
                            y={pt.y - 8} 
                            fill={getThemeDisplayColor(theme.colors.textPrimary)} 
                            fontSize="8" 
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="Orbitron"
                          >
                            {pt.score}%
                          </SvgText>
                        </G>
                      ))}
                    </Svg>
                  </View>
                ) : (
                  <View style={styles.chartEmpty}>
                    <Text style={{ color: theme.colors.textMuted }}>Plotting requires at least 1 saved data record.</Text>
                  </View>
                )}
              </Card>
            </View>

            {/* 60/40 Asymmetric Dashboard Detail Grid */}
            <View style={[styles.detailGrid, { flexDirection: Platform.OS === 'web' ? 'row' : 'column' }]}>
              
              {/* Left Block: Prone Biases (60% width) */}
              <View style={{ flex: 1.5 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily, marginBottom: 8 }]}>
                  🧠 PRONE COGNITIVE FALLACIES
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
                  Your most recurring cognitive biases and default heuristics
                </Text>

                <Card style={[styles.detailCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                  {sortedBiases.length > 0 ? (
                    <View style={styles.progressBarList}>
                      {sortedBiases.map((bias, i) => {
                        const percentOfTotal = Math.round((bias.count / totalSims) * 100);
                        return (
                          <View key={bias.name} style={styles.progressRow}>
                            <View style={styles.progressRowHeader}>
                              <Text style={[styles.progressItemName, { color: theme.colors.textPrimary }]}>
                                ◆ {bias.name}
                              </Text>
                              <Text style={[styles.progressItemVal, { color: theme.colors.accentBlue }]}>
                                {bias.count} time{bias.count > 1 ? 's' : ''} ({percentOfTotal}%)
                              </Text>
                            </View>
                            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.divider }]}>
                              <View 
                                style={[
                                  styles.progressBarFill, 
                                  { 
                                    width: `${percentOfTotal}%`, 
                                    backgroundColor: i === 0 ? theme.colors.accentBlue : i === 1 ? theme.colors.accentViolet : '#f59e0b'
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyDetailCard}>
                      <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>
                        No recurring biases detected. Keep simulating complex decisions to evaluate trigger counts.
                      </Text>
                    </View>
                  )}
                </Card>
              </View>

              {/* Right Block: Trigger Topics (40% width) */}
              <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? SPACING.lg : 0, marginTop: Platform.OS === 'web' ? 0 : SPACING.lg }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily, marginBottom: 8 }]}>
                  🎯 BIAS TRIGGER TOPICS
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
                  Average bias score segmented by decision categories
                </Text>

                <Card style={[styles.detailCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                  {categoryBreakdown.length > 0 ? (
                    <View style={styles.progressBarList}>
                      {categoryBreakdown.map((cat) => {
                        return (
                          <View key={cat.name} style={styles.progressRow}>
                            <View style={styles.progressRowHeader}>
                              <Text style={[styles.progressItemName, { color: theme.colors.textSecondary }]}>
                                ▪ {cat.name.toUpperCase()} ({cat.count})
                              </Text>
                              <Text style={[styles.progressItemVal, { color: theme.colors.textPrimary }]}>
                                {cat.avgScore}% Avg
                              </Text>
                            </View>
                            <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.divider }]}>
                              <View 
                                style={[
                                  styles.progressBarFill, 
                                  { 
                                    width: `${cat.avgScore}%`, 
                                    backgroundColor: cat.avgScore > 50 ? theme.colors.riskHigh : theme.colors.accentBlue
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.emptyDetailCard}>
                      <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>
                        No categorizations generated yet.
                      </Text>
                    </View>
                  )}
                </Card>
              </View>
            </View>
          </>
        ) : (
          // ORGANIZATION ANALYTICS VIEW
          <>
            {/* KPI Grid */}
            <View style={styles.kpiGrid}>
              <Card style={[styles.kpiCard, { borderColor: '#fbbf24' }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: theme.colors.textPrimary }]}>84%</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>TEAM CONSENSUS INDEX</Text>
              </Card>

              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: theme.colors.accentBlue }]}>12</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>ACTIVE COLLAB ROOMS</Text>
              </Card>

              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: theme.colors.accentViolet }]}>14%</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>ROOM SCORE VARIANCE</Text>
              </Card>

              <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.kpiValue, { color: '#10b981' }]}>8</Text>
                <Text style={[styles.kpiLabel, { color: theme.colors.textMuted }]}>ACTIVE ORG MEMBERS</Text>
              </Card>
            </View>

            {/* Segment Breakdown */}
            <View style={[styles.detailGrid, { flexDirection: Platform.OS === 'web' ? 'row' : 'column' }]}>
              {/* Left Column: Bias & Stress levels segmented by categories */}
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily, marginBottom: 8 }]}>
                  👥 TEAM DEPT BIAS & STRESS LEVELS
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
                  Cognitive variances segmented by corporate departments
                </Text>

                <Card style={[styles.detailCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                  <View style={styles.progressBarList}>
                    {[
                      { dept: 'Tech / R&D', bias: 42, stress: 38 },
                      { dept: 'Marketing / Sales', bias: 55, stress: 62 },
                      { dept: 'Product / Operations', bias: 48, stress: 50 },
                      { dept: 'Executive / Strategy', bias: 68, stress: 72 }
                    ].map((item) => (
                      <View key={item.dept} style={{ marginBottom: 12 }}>
                        <Text style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: '750', color: theme.colors.textPrimary, marginBottom: 4 }}>
                          ▪ {item.dept}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: theme.colors.textMuted, width: 70 }}>
                            BIAS: {item.bias}%
                          </Text>
                          <View style={[{ flex: 1, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.divider }, { overflow: 'hidden' }]}>
                            <View style={{ height: '100%', width: `${item.bias}%`, backgroundColor: theme.colors.accentBlue }} />
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 }}>
                          <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: theme.colors.textMuted, width: 70 }}>
                            STRESS: {item.stress}%
                          </Text>
                          <View style={[{ flex: 1, height: 5, borderRadius: 2.5, backgroundColor: theme.colors.divider }, { overflow: 'hidden' }]}>
                            <View style={{ height: '100%', width: `${item.stress}%`, backgroundColor: theme.colors.accentViolet }} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              </View>

              {/* Right Column: Recent Activity Feed */}
              <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? SPACING.lg : 0 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily, marginBottom: 8 }]}>
                  ⚡ RECENT ORG FEED
                </Text>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
                  Real-time events in group rooms
                </Text>

                <Card style={[styles.detailCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                  <View style={{ gap: 10 }}>
                    {[
                      "◆ Bob (Risk-taker) submitted votes for Path 2 in Room ROOM-CD1A2 (Alignment: 120%)",
                      "◆ Alice (Balanced) finalized consensus in Room XT9P0 (92% Consensus)",
                      "◆ Sarah (Analytical) created Room XT9P0",
                      "◆ Dave (Emotional) joined Room ROOM-CD1A2",
                      "◆ System completed Box-Muller simulation of Room ROOM-CD1A2"
                    ].map((log, i) => (
                      <Text key={i} style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: theme.colors.textSecondary, lineHeight: 14 }}>
                        {log}
                      </Text>
                    ))}
                  </View>
                </Card>
              </View>
            </View>

            {/* Room History List */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily, marginBottom: 8 }]}>
              📂 ACTIVE TEAMS SIMULATION ROOMS
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textMuted, marginBottom: 12 }]}>
              Consensus reports of co-simulation decision rooms
            </Text>
            
            <View style={{ gap: SPACING.md, marginBottom: SPACING.lg }}>
              {[
                { code: 'XT9P0', host: 'Sarah', desc: 'Should we hire a dedicated compliance lead?', voters: 5, consensus: 92 },
                { code: 'CD1A2', host: 'Alice', desc: 'Should we migrate our database to serverless?', voters: 4, consensus: 88 },
                { code: 'KF3B1', host: 'Bob', desc: 'Should we pivot marketing budget entirely to video?', voters: 3, consensus: 62 }
              ].map((room) => (
                <Card key={room.code} style={{ padding: SPACING.md, borderColor: theme.colors.border }} outlined shadowed={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontFamily: 'Orbitron', fontSize: 12, fontWeight: '900', color: '#fbbf24' }}>
                      ROOM-{room.code}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: theme.colors.accentBlue }}>
                      <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: theme.colors.accentBlue, fontWeight: 'bold' }}>
                        {room.consensus}% CONSENSUS
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: theme.colors.textPrimary, marginBottom: 8, fontStyle: 'italic' }}>
                    "{room.desc}"
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: theme.colors.divider, paddingTop: 6 }}>
                    <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: theme.colors.textMuted }}>
                      Host: {room.host}
                    </Text>
                    <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: theme.colors.textMuted }}>
                      Voters: {room.voters} participants
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Back navigation buttons */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Home')}
          style={[styles.backBtn, { backgroundColor: theme.colors.accentBlue }]}
        >
          <Text style={[styles.backBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
            RETURN TO SIMULATOR
          </Text>
        </TouchableOpacity>
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
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 400,
  },
  loadingText: {
    fontFamily: 'Orbitron',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontFamily: 'Orbitron',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  simulateBtn: {
    alignSelf: 'stretch',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontFamily: 'Orbitron',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  kpiLabel: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  improvementBanner: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  improvementText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  chartCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmpty: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailGrid: {
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  detailCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 160,
  },
  emptyDetailCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarList: {
    gap: SPACING.md,
  },
  progressRow: {
    gap: SPACING.xs,
  },
  progressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressItemName: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    fontWeight: '700',
  },
  progressItemVal: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  backBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  backBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  segmentControl: {
    flexDirection: 'row',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orgDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
});
