// src/screens/ResultScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Share, 
  Alert,
  Animated,
  Platform,
  TouchableOpacity
} from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../styles/theme';

// Dynamic Haptic Feedback Helper
const triggerHaptic = async (riskLevel) => {
  try {
    if (Platform.OS === 'web') {
      if (navigator.vibrate) {
        if (riskLevel === 'high') {
          navigator.vibrate([100, 50, 100]); // Sharp buzz
        } else if (riskLevel === 'medium') {
          navigator.vibrate(50); // Moderate pulse
        } else {
          navigator.vibrate(20); // Gentle pulse
        }
      }
      return;
    }
    // Native Expo Haptics
    if (riskLevel === 'high') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (riskLevel === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.log('Haptics not supported on this platform:', error.message);
  }
};

// Concentric Circular / Hexagonal Arc Gauge
const ArcGauge = ({ score, theme }) => {
  return (
    <View style={styles.gaugeContainer}>
      {Platform.OS === 'web' ? (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="180" height="96" viewBox="0 0 180 96" style="display: block; margin: auto; overflow: visible;">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="${theme.colors.accentBlue}" />
                <stop offset="100%" stop-color="${theme.colors.accentViolet}" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d="M15,90 A75,75 0 0,1 165,90" fill="none" stroke="${theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}" stroke-width="12" stroke-linecap="round" />
            <path d="M15,90 A75,75 0 0,1 165,90" fill="none" stroke="url(#gaugeGradient)" stroke-width="12" stroke-linecap="round"
                  filter="url(#glow)"
                  stroke-dasharray="235.6" stroke-dashoffset="${235.6 - (235.6 * score) / 100}" 
                  style="transition: stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1);" />
            <g transform="translate(90,90) rotate(${((score / 100) * 180) - 90})">
              <line x1="0" y1="0" x2="0" y2="-72" stroke="${theme.colors.accentBlue}" stroke-width="3" stroke-linecap="round" filter="url(#glow)" />
              <circle cx="0" cy="0" r="6" fill="${theme.colors.background}" stroke="${theme.colors.accentBlue}" stroke-width="3" />
            </g>
          </svg>
        `}} style={{ height: 96, display: 'flex', alignItems: 'center' }} />
      ) : (
        <View style={[styles.nativeGaugeTrack, { backgroundColor: theme.colors.divider }]}>
          <View style={[styles.nativeGaugeProgress, { width: `${score}%`, backgroundColor: theme.colors.accentBlue }]} />
        </View>
      )}
    </View>
  );
};

// Custom Monte Carlo Probability Histogram
const MonteCarloChart = ({ distribution, accentColor, theme }) => {
  if (!distribution || !Array.isArray(distribution) || distribution.length === 0) {
    return null;
  }

  const maxVal = Math.max(...distribution, 1);
  
  return (
    <View style={styles.monteCarloContainer}>
      <Text style={[styles.monteCarloTitle, { color: theme.colors.textSecondary }]}>
        MONTE CARLO PROBABILITY DISTRIBUTION (10,000 TRIALS)
      </Text>
      
      <View style={styles.histogramWrapper}>
        {distribution.map((val, idx) => {
          const barHeight = (val / maxVal) * 80;
          return (
            <View key={idx.toString()} style={styles.histogramColumn}>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.histogramBar, 
                    { 
                      height: Math.max(barHeight, 2), 
                      backgroundColor: accentColor,
                      shadowColor: accentColor,
                    }
                  ]} 
                />
              </View>
              {/* Show only even decile labels to prevent layout overlaps on narrow viewports */}
              <Text style={[styles.histogramLabel, { color: theme.colors.textMuted }]}>
                {idx % 2 === 0 ? `${idx * 10}%` : ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Liquid Fill Probability Bar
const LiquidProbabilityGauge = ({ percentage, accentColor, theme }) => {
  const [animatedPct, setAnimatedPct] = useState(0);
  
  useEffect(() => {
    let current = 0;
    const step = Math.ceil(percentage / 20) || 1;
    const timer = setInterval(() => {
      current += step;
      if (current >= percentage) {
        setAnimatedPct(percentage);
        clearInterval(timer);
      } else {
        setAnimatedPct(current);
      }
    }, 45);
    
    return () => clearInterval(timer);
  }, [percentage]);

  return (
    <View style={styles.liquidContainer}>
      <Text style={[styles.liquidNum, { color: accentColor }]}>{animatedPct}%</Text>
      <Text style={[styles.liquidLabel, { color: theme.colors.textMuted }]}>PROBABILITY</Text>
      
      <View style={[styles.flaskBorder, { borderColor: theme.colors.border }]}>
        <View 
          style={[
            styles.flaskLiquid, 
            { 
              backgroundColor: accentColor + '2b',
              height: `${percentage}%`,
            }
          ]} 
        >
          {Platform.OS === 'web' && (
            <div className="liquid-wave" style={{ bottom: '90%' }} />
          )}
        </View>
      </View>
    </View>
  );
};

// Animated Glowing Section Header Chip
const SectionHeaderChip = ({ title, theme }) => (
  <View style={[
    styles.chipContainer, 
    { 
      backgroundColor: theme.colors.surface, 
      borderLeftColor: theme.colors.accentBlue,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }
  ]}>
    <View style={[styles.chipIconMobile, { backgroundColor: theme.colors.accentBlue }]} />
    <Text style={[styles.chipText, { color: theme.colors.accentBlue, fontFamily: theme.typography.h3.fontFamily }]}>
      {title}
    </Text>
  </View>
);

export default function ResultScreen({ route, navigation }) {
  const { theme, themeName } = useTheme();
  const { simulation, decision } = route.params || {};

  const [activeTimeline, setActiveTimeline] = useState("1"); // Horizons: 1, 3, 5, 10 years
  const [expandedNodes, setExpandedNodes] = useState({});
  const [zoomScale, setZoomScale] = useState(1.0);
  
  // Dynamic layout-based zoom calculations to prevent card scaling overlaps
  const scaledSize = (baseSize) => Math.max(4, Math.round(baseSize * zoomScale));

  if (!simulation) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>No simulation data available.</Text>
          <Button title="Go Home" onPress={() => navigation.navigate('Home')} />
        </View>
      </SafeAreaView>
    );
  }

  const { 
    scenarios = [], 
    key_factors_to_consider = [], 
    cognitive_analysis = {}, 
    boardroom_debate = {}, 
    final_note = '' 
  } = simulation;

  const detectedBiases = cognitive_analysis.detected_biases || [];
  const biasScore = cognitive_analysis.bias_score || 0;

  // Initial trigger for risk reveal haptic sounds
  useEffect(() => {
    const playRevealHaptics = async () => {
      // Play a quick reveal vibration on screen load
      triggerHaptic('low');
      if (scenarios.length > 0) {
        const primaryOutcome = scenarios[0].temporal_outcomes?.[activeTimeline];
        if (primaryOutcome) {
          await new Promise(r => setTimeout(r, 600));
          triggerHaptic(primaryOutcome.risk_level);
        }
      }
    };
    playRevealHaptics();
  }, []);

  const handleScrubChange = (year) => {
    setActiveTimeline(year);
    // Play light tactile click on timeline scrubbing
    triggerHaptic('low');
  };

  const handleShare = async () => {
    try {
      let shareText = `📊 Decision Simulation Report (${activeTimeline} Year Horizon)\n`;
      shareText += `Decision: "${decision}"\n\n`;
      shareText += `🧠 Cognitive Bias Score: ${biasScore}/100\n`;
      shareText += `💡 Objective Reframe: "${cognitive_analysis.reframed_decision || 'N/A'}"\n\n`;

      scenarios.forEach((sc, i) => {
        const outcome = sc.temporal_outcomes?.[activeTimeline] || sc;
        shareText += `${i + 1}. [${outcome.probability}%] ${sc.title}\n`;
        shareText += `   Risk: ${outcome.risk_level?.toUpperCase()}\n`;
        shareText += `   Outcome: ${outcome.description}\n\n`;
      });

      shareText += `⚠️ Disclaimer:\n${final_note}\n`;

      await Share.share({
        message: shareText,
        title: 'Decision Simulation Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share simulation results.');
    }
  };

  const getBiasLabel = (score) => {
    if (score < 30) return 'Highly Objective Formulation';
    if (score < 60) return 'Moderate Cognitive Fallacies Detected';
    return 'Critical Bias / Unbalanced Cognitive Distortions';
  };

  // Helper to translate axis values to 5-axis coordinates
  const getCoord = (value, axisIndex) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / 5;
    const r = (value / 100) * 58; // Max radius 58px (fitting cleanly in 150x150 Svg canvas)
    const x = 75 + r * Math.cos(angle);
    const y = 75 + r * Math.sin(angle);
    return { x, y };
  };

  const getLabelCoord = (axisIndex) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / 5;
    const r = 66; // Placement radius slightly outside outer hex path
    const x = 75 + r * Math.cos(angle);
    const y = 75 + r * Math.sin(angle);
    return { x, y };
  };

  const radarLabels = ["RISK", "REWD", "TIME", "EMOT", "REVR"];

  // Toggle node expansion in Decision Tree Explorer
  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
    triggerHaptic('low');
  };

  // Render a single branch of the consequence map recursively, using layout scaling
  const renderTreeNode = (node, pathId, depth = 0) => {
    if (!node) return null;
    const isExpanded = !!expandedNodes[pathId] || depth === 0;
    const hasChildren = node.branches && node.branches.length > 0;

    return (
      <View key={pathId} style={styles.treeBranchWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => hasChildren && toggleNode(pathId)}
          style={[
            styles.treeNodeCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: hasChildren ? theme.colors.accentBlue : theme.colors.border,
              borderWidth: themeName === 'accessibility' ? 2 : 1.5,
              minWidth: scaledSize(150),
              maxWidth: scaledSize(210),
              padding: scaledSize(8),
            }
          ]}
        >
          <View style={styles.treeNodeHeader}>
            <Text style={[
              styles.treeNodeProb, 
              { 
                color: theme.colors.accentViolet,
                fontSize: scaledSize(8)
              }
            ]}>
              {node.probability}% Prob
            </Text>
            {hasChildren && (
              <Text style={{ color: theme.colors.accentBlue, fontSize: scaledSize(8) }}>
                {isExpanded ? '[-]' : '[+]'}
              </Text>
            )}
          </View>
          <Text style={[
            styles.treeNodeTitle, 
            { 
              color: theme.colors.textPrimary,
              fontSize: scaledSize(10),
              lineHeight: scaledSize(14),
            }
          ]}>
            {node.title}
          </Text>
        </TouchableOpacity>

        {isExpanded && hasChildren && (
          <View style={styles.treeChildrenRow}>
            {/* Draw connecting lines vertically with layout scale */}
            <View style={[
              styles.treeVerticalLine, 
              { 
                backgroundColor: theme.colors.border,
                height: scaledSize(16),
                width: 1.5,
              }
            ]} />
            
            <View style={[
              styles.treeChildrenContainer,
              {
                gap: scaledSize(24),
              }
            ]}>
              {node.branches.map((child, idx) => 
                renderTreeNode(child, `${pathId}-${idx}`, depth + 1)
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Report Summary */}
        <View style={[
          styles.banner, 
          { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border,
            borderWidth: themeName === 'accessibility' ? 2 : 1,
          }
        ]}>
          <Text style={[styles.bannerLabel, { color: theme.colors.accentViolet, fontFamily: theme.typography.subtext.fontFamily }]}>
            DECISION SIMULATION REPORT
          </Text>
          <Text style={[styles.bannerTitle, { color: theme.colors.accentBlue }]}>
            "{decision}"
          </Text>
        </View>

        {/* Temporal Memory Recall Warning Card */}
        {simulation.temporal_memory_recall && (
          <Card style={[styles.memoryRecallCard, { borderColor: theme.colors.riskMedium, borderLeftWidth: 4 }]} outlined shadowed={false}>
            <View style={styles.memoryRecallHeader}>
              <Text style={styles.memoryRecallIcon}>⏳</Text>
              <Text style={[styles.memoryRecallTitle, { color: theme.colors.riskMedium, fontFamily: theme.typography.subtext.fontFamily }]}>
                TEMPORAL LINK DETECTED ({simulation.temporal_memory_recall.similarity}% MATCH)
              </Text>
            </View>
            <Text style={[styles.memoryRecallText, { color: theme.colors.textPrimary }]}>
              You faced a similar decision query in the past:
            </Text>
            <Text style={[styles.memoryRecallQuery, { color: theme.colors.accentBlue }]}>
              "{simulation.temporal_memory_recall.decision}"
            </Text>
            <Text style={[styles.memoryRecallMeta, { color: theme.colors.textMuted }]}>
              Simulated on {simulation.temporal_memory_recall.timestamp}. Expected summary: "{simulation.temporal_memory_recall.result_summary || 'N/A'}"
            </Text>
          </Card>
        )}

        {/* Timeline Scrubber Component */}
        <View style={styles.scrubberSection}>
          <Text style={[styles.scrubberHeader, { color: theme.colors.textPrimary, fontFamily: theme.typography.h3.fontFamily }]}>
            Timeline Scrubber Horizon
          </Text>
          <Text style={[styles.scrubberSubtitle, { color: theme.colors.textMuted }]}>
            Drag or tap to animate outcome scenarios across Year horizons
          </Text>
          
          <View style={[styles.timelineTrack, { backgroundColor: theme.colors.divider }]}>
            {["1", "3", "5", "10"].map((year) => {
              const isActive = activeTimeline === year;
              return (
                <TouchableOpacity
                  key={year}
                  activeOpacity={0.8}
                  onPress={() => handleScrubChange(year)}
                  style={[
                    styles.timelineStop,
                    {
                      backgroundColor: isActive ? theme.colors.accentBlue : theme.colors.card,
                      borderColor: isActive ? theme.colors.accentBlue : theme.colors.border,
                      borderWidth: 1.5,
                    }
                  ]}
                >
                  <Text style={[
                    styles.timelineStopText,
                    { 
                      color: isActive ? (themeName === 'sci-fi' ? '#03050d' : '#FFFFFF') : theme.colors.textPrimary,
                      fontWeight: 'bold' 
                    }
                  ]}>
                    {year}Y
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Interactive Radar Trade-off Chart (Hexagonal Concentric Web) */}
        <View style={{ marginBottom: SPACING.xl }}>
          <SectionHeaderChip title="📊 Radar Scenario Comparisons" theme={theme} />
          
          <Card style={styles.radarCard} outlined shadowed={false}>
            <View style={styles.radarLayout}>
              <View style={styles.radarSvgWrapper}>
                <Svg width="150" height="150" viewBox="0 0 150 150">
                  {/* Outer Concentric Hexagons */}
                  {[20, 40, 60, 80, 100].map((level) => {
                    const c0 = getCoord(level, 0);
                    const c1 = getCoord(level, 1);
                    const c2 = getCoord(level, 2);
                    const c3 = getCoord(level, 3);
                    const c4 = getCoord(level, 4);
                    return (
                      <Polygon
                        key={level}
                        points={`${c0.x},${c0.y} ${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y} ${c4.x},${c4.y}`}
                        fill="none"
                        stroke={theme.colors.divider}
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* Radiating Axis Lines */}
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const coord = getCoord(100, idx);
                    return (
                      <Line
                        key={idx}
                        x1="75"
                        y1="75"
                        x2={coord.x}
                        y2={coord.y}
                        stroke={theme.colors.divider}
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* Overlay Filled Polygon Shapes for each Scenario */}
                  {scenarios.map((sc, scIdx) => {
                    const outcome = sc.temporal_outcomes?.[activeTimeline];
                    if (!outcome || !outcome.radar_metrics) return null;
                    const metrics = outcome.radar_metrics;

                    const scColor = scIdx === 0 ? '#00e5ff' : scIdx === 1 ? '#a855f7' : '#ec4899';
                    const pt0 = getCoord(metrics.risk || 0, 0);
                    const pt1 = getCoord(metrics.reward || 0, 1);
                    const pt2 = getCoord(metrics.time_cost || 0, 2);
                    const pt3 = getCoord(metrics.emotional_toll || 0, 3);
                    const pt4 = getCoord(metrics.reversibility || 0, 4);
                    
                    return (
                      <Polygon
                        key={scIdx}
                        points={`${pt0.x},${pt0.y} ${pt1.x},${pt1.y} ${pt2.x},${pt2.y} ${pt3.x},${pt3.y} ${pt4.x},${pt4.y}`}
                        fill={scColor + '20'}
                        stroke={scColor}
                        strokeWidth="1.8"
                      />
                    );
                  })}
                  
                  {/* Axis Text Labels directly on vertices */}
                  {radarLabels.map((label, idx) => {
                    const coord = getLabelCoord(idx);
                    let textAnchor = "middle";
                    if (idx === 1 || idx === 2) textAnchor = "start";
                    if (idx === 4) textAnchor = "end";
                    
                    let dy = 3;
                    if (idx === 0) dy = -5;
                    if (idx === 2 || idx === 3) dy = 9;

                    return (
                      <SvgText
                        key={idx}
                        x={coord.x}
                        y={coord.y + dy}
                        fill={theme.colors.textSecondary}
                        fontSize="7"
                        fontWeight="900"
                        fontFamily={themeName === 'minimal' ? 'sans-serif' : 'Orbitron'}
                        textAnchor={textAnchor}
                      >
                        {label}
                      </SvgText>
                    );
                  })}

                  {/* Central Node Dot */}
                  <Circle cx="75" cy="75" r="2.5" fill={theme.colors.accentBlue} />
                </Svg>
              </View>

              {/* Spider Chart Legend & Metrics Labels */}
              <View style={styles.radarLegend}>
                {/* Scenarios Key */}
                <Text style={[styles.legendLabelText, { color: theme.colors.textMuted, marginBottom: 8 }]}>SCENARIOS KEY</Text>
                <View style={styles.scenarioKeysRow}>
                  {scenarios.map((sc, scIdx) => {
                    const scColor = scIdx === 0 ? '#00e5ff' : scIdx === 1 ? '#a855f7' : '#ec4899';
                    return (
                      <View key={scIdx} style={styles.keyIndicatorGroup}>
                        <View style={[styles.legendIndicator, { backgroundColor: scColor }]} />
                        <Text style={[styles.legendText, { color: scColor }]}>
                          Path 0{scIdx + 1}: {sc.title.length > 22 ? sc.title.slice(0, 22) + '...' : sc.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Divider Line */}
                <View style={[styles.legendDivider, { backgroundColor: theme.colors.divider }]} />

                {/* Axes Guide */}
                <Text style={[styles.legendLabelText, { color: theme.colors.textMuted, marginBottom: 8 }]}>AXES GUIDE</Text>
                <View style={styles.axesGuideContainer}>
                  <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>◆ 1. RISK: Higher is more risk exposure</Text>
                  <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>◆ 2. REWD (Reward): Yield and benefits value</Text>
                  <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>◆ 3. TIME: Cost, duration and effort load</Text>
                  <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>◆ 4. EMOT (Emotion): Stress or anxiety toll</Text>
                  <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>◆ 5. REVR (Reversibility): Ease of undoing decision</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* SECTION 1: COGNITIVE BIAS ANALYZER (FULL WIDTH PANEL) */}
        <View style={{ marginBottom: SPACING.xl }}>
          <SectionHeaderChip title="🧠 Cognitive Bias Analyzer" theme={theme} />
          
          <Card style={styles.biasCard} outlined shadowed={false}>
            <View style={[styles.biasDashboardGrid, { flexDirection: Platform.OS === 'web' ? 'row' : 'column' }]}>
              
              {/* Left Column: Arc Gauge */}
              <View style={styles.biasColumnLeft}>
                <ArcGauge score={biasScore} theme={theme} />
                <View style={styles.scoreTextContainer}>
                  <Text style={[styles.biasPercentageText, { color: theme.colors.accentBlue }]}>{biasScore}%</Text>
                  <Text style={[styles.biasIndexSubLabel, { color: theme.colors.textMuted }]}>DISTORTION RATING</Text>
                </View>
              </View>

              {/* Right Column: Descriptions & Reframing */}
              <View style={styles.biasColumnRight}>
                <View style={styles.typewriterContainer}>
                  <Text style={[styles.biasStatusTitle, { color: theme.colors.textPrimary }]}>
                    {getBiasLabel(biasScore)}
                  </Text>
                </View>

                {detectedBiases.length > 0 ? (
                  <View style={styles.distortionBox}>
                    {detectedBiases.map((bias, i) => (
                      <View key={i.toString()} style={styles.distortionItem}>
                        <Text style={[styles.distortionItemName, { color: theme.colors.accentViolet }]}>◆ {bias.name.toUpperCase()}</Text>
                        <Text style={[styles.distortionItemDesc, { color: theme.colors.textMuted }]}>{bias.explanation}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.objectivePulseBox}>
                    <Text style={[styles.objectivePulseText, { color: theme.colors.accentBlue }]}>
                      No cognitive distortions detected. The formulation complies with objective analytical criteria.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Inset Reframing card */}
            {cognitive_analysis.reframed_decision && (
              <View style={[styles.reframeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.reframeHeader}>
                  <Text style={styles.reframeIcon}>💡</Text>
                  <Text style={[styles.reframeTitle, { color: theme.colors.accentBlue, fontFamily: theme.typography.subtext.fontFamily }]}>
                    OBJECTIVE REFRAME
                  </Text>
                </View>
                <Text style={[styles.reframeText, { color: theme.colors.textPrimary }]}>"{cognitive_analysis.reframed_decision}"</Text>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.reframeBtn, { backgroundColor: theme.colors.accentBlue }]}
                  onPress={() => {
                    navigation.navigate('Home', { reframedDecision: cognitive_analysis.reframed_decision });
                  }}
                >
                  <Text style={[styles.reframeBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
                    RE-INITIALIZE WITH REFRAMED DECISION
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* SECTION 2: MULTI-MODEL CONSENSUS (FULL WIDTH PANEL) */}
        {simulation.multi_model_comparison && (
          <View style={{ marginBottom: SPACING.xl }}>
            <SectionHeaderChip title="🤖 Multi-Model Consensus" theme={theme} />
            <Card style={styles.consensusCard} outlined shadowed={false}>
              <View style={styles.consensusHeader}>
                <View style={styles.consensusMainRow}>
                  <Text style={[styles.consensusScoreLabel, { color: theme.colors.textPrimary }]}>CONSENSUS INDEX: </Text>
                  <Text style={[
                    styles.consensusScoreValue, 
                    { color: simulation.multi_model_comparison.consensus_score >= 80 ? theme.colors.accentBlue : theme.colors.riskMedium }
                  ]}>
                    {simulation.multi_model_comparison.consensus_score}%
                  </Text>
                  <View style={[
                    styles.consensusLevelBadge, 
                    { borderColor: simulation.multi_model_comparison.consensus_score >= 80 ? theme.colors.accentBlue : theme.colors.riskMedium }
                  ]}>
                    <Text style={[
                      styles.consensusLevelText, 
                      { color: simulation.multi_model_comparison.consensus_score >= 80 ? theme.colors.accentBlue : theme.colors.riskMedium }
                    ]}>
                      {simulation.multi_model_comparison.consensus_level?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={[styles.consensusProgressBarContainer, { backgroundColor: theme.colors.divider }]}>
                  <View style={[styles.consensusProgressBarFill, { 
                    width: `${simulation.multi_model_comparison.consensus_score}%`,
                    backgroundColor: simulation.multi_model_comparison.consensus_score >= 80 ? theme.colors.accentBlue : theme.colors.riskMedium
                  }]} />
                </View>
              </View>

              {/* Model Comparison Table */}
              <View style={styles.comparisonTable}>
                <View style={[styles.tableHeaderRow, { borderBottomColor: theme.colors.border }]}>
                  <Text style={[styles.tableCellHeader, { flex: 1.0, color: theme.colors.textMuted }]}>MODEL</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1.0, textAlign: 'center', color: theme.colors.textMuted }]}>BIAS</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1.0, textAlign: 'center', color: theme.colors.textMuted }]}>EMOTION</Text>
                  <Text style={[styles.tableCellHeader, { flex: 1.4, textAlign: 'right', color: theme.colors.textMuted }]}>DRIVER</Text>
                </View>
                {simulation.multi_model_comparison.details?.map((detail, idx) => (
                  <View key={idx.toString()} style={[styles.tableRow, { borderBottomColor: theme.colors.divider }]}>
                    <Text style={[styles.tableCellModel, { flex: 1.0, color: theme.colors.textPrimary }]}>◆ {detail.model.toUpperCase()}</Text>
                    <Text style={[styles.tableCellVal, { flex: 1.0, textAlign: 'center', color: detail.bias_score > 50 ? theme.colors.riskHigh : theme.colors.accentBlue }]}>{detail.bias_score}%</Text>
                    <Text style={[styles.tableCellVal, { flex: 1.0, textAlign: 'center', color: detail.intensity_score > 50 ? theme.colors.riskHigh : theme.colors.accentBlue }]}>{detail.intensity_score}%</Text>
                    <Text style={[styles.tableCellEmotion, { flex: 1.4, textAlign: 'right', color: theme.colors.textSecondary }]}>{detail.primary_emotion.toUpperCase()}</Text>
                  </View>
                ))}
              </View>

              {/* Dynamic Consensus Variances */}
              {simulation.multi_model_comparison.variances?.length > 0 && (
                <View style={[styles.variancesBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <Text style={[styles.variancesTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.subtext.fontFamily }]}>
                    CONSENSUS DEBATE NOTES & DEVIATIONS
                  </Text>
                  {simulation.multi_model_comparison.variances.map((variance, idx) => (
                    <Text key={idx.toString()} style={[styles.varianceText, { color: theme.colors.textPrimary }]}>▪ {variance}</Text>
                  ))}
                </View>
              )}
            </Card>
          </View>
        )}

        {/* 60/40 ASYMMETRIC GRID WRAPPER */}
        <View style={[styles.gridContainer, { flexDirection: Platform.OS === 'web' ? 'row' : 'column' }]}>
          
          {/* LEFT 60% COLUMN: FUTURE OUTCOME CARDS */}
          <View style={{ flex: 1.5 }}>
            <SectionHeaderChip title="🔮 Projected Future Outcomes" theme={theme} />
            
            {scenarios.map((scenario, index) => {
              const activeOutcome = scenario.temporal_outcomes?.[activeTimeline] || scenario;
              
              const isFirst = index === 0;
              const accentColor = index === 0 ? '#00e5ff' : index === 1 ? '#a855f7' : '#ec4899';
              const riskColor = activeOutcome.risk_level === 'high' ? theme.colors.riskHigh : activeOutcome.risk_level === 'medium' ? theme.colors.riskMedium : theme.colors.riskLow;
              
              return (
                <Card 
                  key={index.toString()}
                  style={[
                    styles.outcomeCard, 
                    { 
                      borderLeftWidth: 4, 
                      borderLeftColor: accentColor,
                      marginBottom: SPACING.md,
                    }
                  ]}
                  outlined
                  shadowed={false}
                >
                  <View style={styles.outcomeHeader}>
                    <View>
                      <Text style={[styles.outcomeScenarioNum, { color: theme.colors.textMuted }]}>PATH 0{index + 1}</Text>
                      <Text style={[styles.outcomeTitle, { color: theme.colors.textPrimary }]}>{scenario.title}</Text>
                    </View>
                    
                    {/* Risk Badge */}
                    <View style={[
                      styles.riskBadge, 
                      { borderColor: riskColor, backgroundColor: riskColor + '14' },
                    ]}>
                      <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                        {activeOutcome.risk_level?.toUpperCase()} RISK
                      </Text>
                    </View>
                  </View>

                  {/* Mid row: Liquid probability + timeline + mood */}
                  <View style={styles.metricsRow}>
                    <LiquidProbabilityGauge percentage={activeOutcome.probability} accentColor={accentColor} theme={theme} />
                    
                    {/* Time Horizon display */}
                    <View style={styles.horizonChip}>
                      <Text style={[styles.horizonLabel, { color: theme.colors.textMuted }]}>TIME HORIZON</Text>
                      <View style={[styles.horizonDisplayBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <Text style={[styles.horizonText, { color: theme.colors.accentBlue }]}>{activeTimeline}Y HORIZON</Text>
                      </View>
                    </View>
                    
                    <View style={styles.moodBox}>
                      <Text style={[styles.moodLabel, { color: theme.colors.textMuted }]}>EMOTIONAL BIAS</Text>
                      <Text style={[styles.moodText, { color: theme.colors.textSecondary }]}>{activeOutcome.emotional_impact?.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Outcome description block */}
                  <View style={styles.descBlock}>
                    <Text style={[styles.descText, { color: theme.colors.textPrimary }]}>{activeOutcome.description}</Text>
                    
                    {/* Technical reasoning block */}
                    <View style={[styles.reasoningCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                      <Text style={[styles.reasoningLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.subtext.fontFamily }]}>
                        COGNITIVE AND PERSPECTIVE ANALYSIS
                      </Text>
                      <Text style={[styles.reasoningText, { color: theme.colors.textPrimary }]}>{scenario.reasoning}</Text>
                    </View>

                    {/* Monte Carlo Distribution */}
                    {activeOutcome.monte_carlo_distribution && (
                      <MonteCarloChart 
                        distribution={activeOutcome.monte_carlo_distribution} 
                        accentColor={accentColor} 
                        theme={theme}
                      />
                    )}
                  </View>
                </Card>
              );
            })}
          </View>

          {/* RIGHT 40% COLUMN: CRITICAL FACTORS + DISCLAIMER */}
          <View style={{ flex: 1, marginLeft: Platform.OS === 'web' ? SPACING.lg : 0 }}>
            
            {/* Critical Factors panel */}
            <View style={{ marginBottom: SPACING.lg }}>
              <SectionHeaderChip title="📌 Critical Factors" theme={theme} />
              
              <Card style={styles.factorsCard} outlined shadowed={false}>
                <Text style={[styles.factorsSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.subtext.fontFamily }]}>
                  CRITICAL PARAMETERS TO TRACK:
                </Text>
                
                <View style={styles.factorsList}>
                  {key_factors_to_consider.map((factor, i) => (
                    <View key={i.toString()} style={styles.factorItem}>
                      <Text style={[styles.factorDiamond, { color: theme.colors.accentBlue }]}>◆</Text>
                      <Text style={[styles.factorText, { color: theme.colors.textPrimary }]}>{factor}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>

            {/* Disclaimer "Classified document" card */}
            <Card style={[styles.disclaimerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} outlined shadowed={false}>
              <View style={styles.disclaimerHeader}>
                <Text style={styles.disclaimerWarningIcon}>⚠️</Text>
                <Text style={[styles.disclaimerLabel, { color: theme.colors.riskHigh, fontFamily: theme.typography.subtext.fontFamily }]}>
                  ANALYTICAL SIMULATION DISCLAIMER
                </Text>
              </View>
              <Text style={[styles.disclaimerText, { color: theme.colors.textMuted }]}>
                {final_note || 'This outcome simulation utilizes high-frequency behavioral filters. It acts as an analytical decision modeling instrument and is strictly not to be interpreted as direct legal, financial, or personal advice. Exercise primary caution.'}
              </Text>
            </Card>

          </View>
        </View>

        {/* DECISION TREE EXPLORER (FULL WIDTH INTERACTIVE MAP) */}
        <View style={{ marginVertical: SPACING.xl }}>
          <SectionHeaderChip title="🌳 Consequence Decision Tree Explorer" theme={theme} />
          
          <Card style={[styles.treeCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
            <View style={styles.treeControlsRow}>
              <Text style={[styles.treeControlsLabel, { color: theme.colors.textMuted }]}>
                ZOOM CANVAS CONTROL
              </Text>
              <View style={styles.zoomButtonsContainer}>
                <TouchableOpacity
                  onPress={() => setZoomScale(prev => Math.min(1.6, prev + 0.15))}
                  style={[styles.zoomButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>[+] ZOOM IN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setZoomScale(prev => Math.max(0.6, prev - 0.15))}
                  style={[styles.zoomButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>[-] ZOOM OUT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setZoomScale(1.0)}
                  style={[styles.zoomButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>[RESET]</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingVertical: SPACING.lg }}
            >
              <ScrollView 
                showsVerticalScrollIndicator={true}
                style={{ maxHeight: 500 }}
              >
                <View style={styles.treeCanvas}>
                  {/* Root dilemma node */}
                  <View style={styles.treeRootRow}>
                    <View style={[
                      styles.treeRootNode,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.accentBlue,
                        borderWidth: 2,
                        padding: scaledSize(12),
                        minWidth: scaledSize(180),
                        maxWidth: scaledSize(250),
                      }
                    ]}>
                      <Text style={[
                        styles.treeRootNodeLabel, 
                        { 
                          color: theme.colors.accentViolet,
                          fontSize: scaledSize(9),
                        }
                      ]}>
                        CENTRAL DECISION DILEMMA
                      </Text>
                      <Text style={[
                        styles.treeRootNodeText, 
                        { 
                          color: theme.colors.textPrimary,
                          fontSize: scaledSize(12),
                          lineHeight: scaledSize(16),
                        }
                      ]}>
                        {decision}
                      </Text>
                    </View>
                    <View style={[
                      styles.treeVerticalLine, 
                      { 
                        backgroundColor: theme.colors.border,
                        height: scaledSize(16),
                        width: 1.5,
                      }
                    ]} />
                  </View>

                  {/* Root children: Scenarios and branches */}
                  <View style={[
                    styles.treeChildrenContainer,
                    {
                      gap: scaledSize(24),
                    }
                  ]}>
                    {scenarios.map((sc, scIdx) => {
                      if (!sc.consequence_tree) return null;
                      return renderTreeNode(sc.consequence_tree, `sc-${scIdx}`, 0);
                    })}
                  </View>
                </View>
              </ScrollView>
            </ScrollView>
          </Card>
        </View>

        {/* Action Panel Footer */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={[styles.shareBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <Text style={[styles.shareBtnText, { color: theme.colors.textPrimary }]}>📤 EXPORT SIMULATION REPORT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
            style={[styles.doneBtn, { backgroundColor: theme.colors.accentBlue }]}
          >
            <Text style={[styles.doneBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
              CLOSE REPORT
            </Text>
          </TouchableOpacity>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontFamily: 'IBM Plex Mono',
    marginBottom: SPACING.md,
  },
  banner: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  chipIconMobile: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  biasCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  biasDashboardGrid: {
    gap: SPACING.lg,
  },
  biasColumnLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeGaugeTrack: {
    height: 8,
    width: 140,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nativeGaugeProgress: {
    height: '100%',
  },
  scoreTextContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  biasPercentageText: {
    fontFamily: 'Orbitron',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  biasIndexSubLabel: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  biasColumnRight: {
    flex: 1.6,
    justifyContent: 'center',
  },
  typewriterContainer: {
    marginBottom: SPACING.sm,
  },
  biasStatusTitle: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: 18,
  },
  distortionBox: {
    gap: SPACING.sm,
  },
  distortionItem: {
    paddingVertical: SPACING.xs,
  },
  distortionItemName: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  distortionItemDesc: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  objectivePulseBox: {
    paddingVertical: SPACING.xs,
  },
  objectivePulseText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    lineHeight: 20,
  },
  reframeCard: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  reframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 6,
  },
  reframeIcon: {
    fontSize: 14,
  },
  reframeTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  reframeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  reframeBtn: {
    height: 38,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reframeBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  consensusCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  consensusHeader: {
    marginBottom: SPACING.md,
  },
  consensusMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  consensusScoreLabel: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  consensusScoreValue: {
    fontFamily: 'Orbitron',
    fontSize: 16,
    fontWeight: '900',
  },
  consensusLevelBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: 6,
  },
  consensusLevelText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  consensusProgressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  consensusProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  comparisonTable: {
    marginVertical: SPACING.md,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1.5,
  },
  tableCellHeader: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCellModel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableCellVal: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '900',
  },
  tableCellEmotion: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    fontStyle: 'italic',
  },
  variancesBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  variancesTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  varianceText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    lineHeight: 18,
  },
  gridContainer: {
    gap: SPACING.lg,
  },
  outcomeCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  outcomeScenarioNum: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  outcomeTitle: {
    fontFamily: 'Orbitron',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  riskBadge: {
    borderWidth: 1.2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  riskBadgeText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  liquidContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  liquidNum: {
    fontFamily: 'Orbitron',
    fontSize: 15,
    fontWeight: '900',
  },
  liquidLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 4,
  },
  flaskBorder: {
    width: 44,
    height: 14,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  flaskLiquid: {
    width: '100%',
  },
  horizonChip: {
    alignItems: 'center',
  },
  horizonLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  horizonDisplayBox: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  horizonText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontWeight: '700',
  },
  moodBox: {
    alignItems: 'center',
    minWidth: 85,
    paddingHorizontal: 4,
  },
  moodLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  moodText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  descBlock: {
    gap: SPACING.md,
  },
  descText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    lineHeight: 22,
  },
  reasoningCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  reasoningLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  reasoningText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    lineHeight: 18,
  },
  monteCarloContainer: {
    marginTop: SPACING.sm,
  },
  monteCarloTitle: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  histogramWrapper: {
    flexDirection: 'row',
    height: 100, // increased height to prevent label overlaps
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  histogramColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    width: '70%',
  },
  histogramBar: {
    width: '100%',
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  histogramLabel: {
    fontSize: 8,
    marginTop: 4,
    height: 12,
  },
  factorsCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  factorsSub: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: SPACING.md,
  },
  factorsList: {
    gap: SPACING.sm,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  factorDiamond: {
    fontSize: 10,
  },
  factorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
  },
  disclaimerCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  disclaimerWarningIcon: {
    fontSize: 14,
  },
  disclaimerLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disclaimerText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    lineHeight: 16,
  },
  memoryRecallCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  memoryRecallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  memoryRecallIcon: {
    fontSize: 14,
  },
  memoryRecallTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  memoryRecallText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    marginBottom: 4,
  },
  memoryRecallQuery: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  memoryRecallMeta: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
  },
  scrubberSection: {
    marginBottom: SPACING.xl,
    paddingHorizontal: 4,
  },
  scrubberHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scrubberSubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  timelineTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 6,
    borderRadius: 24,
    height: 48,
  },
  timelineStop: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  timelineStopText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
  },
  radarCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  radarLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  radarSvgWrapper: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarLegend: {
    flex: 1,
    minWidth: 260,
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  legendLabelText: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
  },
  legendText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    lineHeight: 14,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  scenarioKeysRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 4,
  },
  keyIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDivider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  axesGuideContainer: {
    gap: 4,
  },
  treeCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden',
  },
  treeControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.md,
  },
  treeControlsLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  zoomButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomButton: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  treeCanvas: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    originX: 0.5,
    originY: 0,
  },
  treeRootRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  treeRootNode: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 280,
  },
  treeRootNodeLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  treeRootNodeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  treeVerticalLine: {
    width: 1.5,
    height: SPACING.lg,
  },
  treeChildrenContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: SPACING.xl,
  },
  treeBranchWrapper: {
    alignItems: 'center',
  },
  treeNodeCard: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  treeNodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  treeNodeProb: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    fontWeight: '700',
  },
  treeNodeTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    lineHeight: 16,
  },
  treeChildrenRow: {
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: SPACING.md,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
  shareBtn: {
    flex: 1,
    height: 52,
    borderWidth: 1.8,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  doneBtn: {
    flex: 1.2,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
