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
import ScenarioCard from '../components/ScenarioCard';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

// Animated Glowing Section Header Chip
const SectionHeaderChip = ({ title, svgIconHtml }) => (
  <View style={styles.chipContainer}>
    <View style={styles.chipGlowBorder} />
    {Platform.OS === 'web' && svgIconHtml ? (
      <div dangerouslySetInnerHTML={{ __html: svgIconHtml }} style={styles.chipIconWeb} />
    ) : (
      <View style={styles.chipIconMobile} />
    )}
    <Text style={styles.chipText}>{title}</Text>
  </View>
);

// SVG Glyphs for Section Headers
const brainSvg = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" style="animation: bioluminescentPulse 2s infinite ease-in-out;">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z"/>
  </svg>
`;

const crystalBallSvg = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" style="animation: liquidWaveAnim 12s infinite linear;">
    <circle cx="12" cy="10" r="8"/>
    <path d="M8 21h8"/>
    <path d="M12 18v3"/>
  </svg>
`;

const factorsSvg = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2" style="animation: bioluminescentPulse 1.5s infinite ease-in-out;">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
`;

// Animated Glowing Svg Blinking Face indicator for Moods
const BlinkFaceIcon = ({ score }) => {
  const isHealthy = score < 50;
  const strokeColor = isHealthy ? '#00e5ff' : '#ec4899';
  const faceSvgHtml = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" style="filter: drop-shadow(0 0 4px ${strokeColor});">
      <circle cx="12" cy="12" r="10"/>
      <!-- Eyes with blink animation -->
      <style>
        @keyframes eyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .blinking-eye {
          animation: eyeBlink 4s infinite ease-in-out;
          transform-origin: center;
        }
      </style>
      <line x1="9" y1="9" x2="9" y2="9.01" class="blinking-eye" stroke-linecap="round" stroke-width="3"/>
      <line x1="15" y1="9" x2="15" y2="9.01" class="blinking-eye" stroke-linecap="round" stroke-width="3"/>
      <!-- Mouth -->
      <path d="${isHealthy ? 'M8 15 Q12 18 16 15' : 'M8 16 Q12 13 16 16'}" stroke-linecap="round"/>
    </svg>
  `;
  
  return (
    <View style={styles.faceIconContainer}>
      {Platform.OS === 'web' ? (
        <div dangerouslySetInnerHTML={{ __html: faceSvgHtml }} />
      ) : (
        <Text style={{ fontSize: 20 }}>😊</Text>
      )}
    </View>
  );
};

// Custom SVG Semicircle Arc Gauge
const ArcGauge = ({ score }) => {
  return (
    <View style={styles.gaugeContainer}>
      {Platform.OS === 'web' ? (
        <div dangerouslySetInnerHTML={{ __html: `
          <svg width="180" height="96" viewBox="0 0 180 96" style="display: block; margin: auto; overflow: visible;">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00e5ff" />
                <stop offset="100%" stop-color="#a855f7" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <!-- Base track -->
            <path d="M15,90 A75,75 0 0,1 165,90" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="12" stroke-linecap="round" />
            <!-- Glowing active progress track -->
            <path d="M15,90 A75,75 0 0,1 165,90" fill="none" stroke="url(#gaugeGradient)" stroke-width="12" stroke-linecap="round"
                  filter="url(#glow)"
                  stroke-dasharray="235.6" stroke-dashoffset="${235.6 - (235.6 * score) / 100}" 
                  style="transition: stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1);" />
            <!-- Needle pointer -->
            <g transform="translate(90,90) rotate(${((score / 100) * 180) - 90})">
              <line x1="0" y1="0" x2="0" y2="-72" stroke="#00e5ff" stroke-width="3" stroke-linecap="round" filter="url(#glow)" />
              <circle cx="0" cy="0" r="6" fill="#03050d" stroke="#00e5ff" stroke-width="3" />
            </g>
          </svg>
        `}} />
      ) : (
        <View style={styles.nativeGaugeTrack}>
          <View style={[styles.nativeGaugeProgress, { width: `${score}%` }]} />
        </View>
      )}
    </View>
  );
};

// Liquid Fill Probability Bar
const LiquidProbabilityGauge = ({ percentage }) => {
  const isHigh = percentage >= 60;
  const activeColor = isHigh ? '#00e5ff' : '#fbbf24';
  
  const [animatedPct, setAnimatedPct] = useState(0);
  
  useEffect(() => {
    // Staggered trigger to count up smoothly
    let current = 0;
    const step = Math.ceil(percentage / 30);
    const timer = setInterval(() => {
      current += step;
      if (current >= percentage) {
        setAnimatedPct(percentage);
        clearInterval(timer);
      } else {
        setAnimatedPct(current);
      }
    }, 40);
    
    return () => clearInterval(timer);
  }, [percentage]);

  return (
    <View style={styles.liquidContainer}>
      <Text style={[styles.liquidNum, { color: activeColor }]}>{animatedPct}%</Text>
      <Text style={styles.liquidLabel}>PROBABILITY</Text>
      
      {/* Dynamic Wave flask container */}
      <View style={styles.flaskBorder}>
        <View 
          style={[
            styles.flaskLiquid, 
            { 
              backgroundColor: isHigh ? 'rgba(0, 229, 255, 0.15)' : 'rgba(251, 191, 36, 0.15)',
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

// Timeline Film Strip Chip
const TimelineFilmStrip = ({ timeline }) => {
  return (
    <View style={styles.timelineContainer}>
      <Text style={styles.timelineLabel}>TIME HORIZON</Text>
      <View style={styles.stripCard}>
        {/* Top sprocket holes */}
        <View style={styles.sprocketRow}>
          {[1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={styles.sprocket} />)}
        </View>
        
        {/* Core display */}
        <View style={styles.stripDisplay}>
          <Text style={styles.stripText}>{timeline || 'IMMEDIATE'}</Text>
        </View>

        {/* Bottom sprocket holes */}
        <View style={styles.sprocketRow}>
          {[1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={styles.sprocket} />)}
        </View>
      </View>
    </View>
  );
};

// Web-only Styles (bypass Hermes static parser validation inside StyleSheet.create)
const WEB_STYLES = {
  banner: {
    backdropFilter: 'blur(10px)',
  },
  biasCard: {
    backdropFilter: 'blur(20px)',
  },
  typewriterActive: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    animation: 'typewriterAnim 1.5s steps(28, end) forwards',
  },
  outcomeCard: {
    backdropFilter: 'blur(24px)',
  },
  tealPulse: {
    animation: 'tealBreathing 2s infinite ease-in-out',
  },
  amberPulse: {
    animation: 'amberBreathing 2s infinite ease-in-out',
  },
  factorItem: {
    transition: 'all 0.3s ease',
  },
  disclaimerCard: {
    transition: 'all 0.3s ease',
  }
};

export default function ResultScreen({ route, navigation }) {
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

  const { 
    scenarios = [], 
    key_factors_to_consider = [], 
    cognitive_analysis = {}, 
    boardroom_debate = {}, 
    final_note = '' 
  } = simulation;

  const detectedBiases = cognitive_analysis.detected_biases || [];
  const biasScore = cognitive_analysis.bias_score || 0;

  // Staggered Mounting Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const biasFade = useRef(new Animated.Value(0)).current;
  const cardsFade = useRef(scenarios.map(() => new Animated.Value(0))).current;
  const cardsSlide = useRef(scenarios.map(() => new Animated.Value(30))).current;
  const factorsFade = useRef(new Animated.Value(0)).current;
  const disclaimerFade = useRef(new Animated.Value(0)).current;

  const [ typewriterTrigger, setTypewriterTrigger ] = useState(false);

  useEffect(() => {
    // Trigger Entry Sequences
    Animated.sequence([
      // 1. Header fade down
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // 2. Bias Card fades in + typewriter triggers
      Animated.timing(biasFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setTypewriterTrigger(true));

    // 3. Staggered outcome cards slide-in
    if (scenarios.length > 0) {
      const cardAnimations = scenarios.map((_, i) => {
        return Animated.parallel([
          Animated.timing(cardsFade[i], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(cardsSlide[i], {
            toValue: 0,
            friction: 7,
            tension: 30,
            useNativeDriver: true,
          })
        ]);
      });
      Animated.stagger(150, cardAnimations).start();
    }

    // 4. Critical factors & disclaimer fade
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(factorsFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(disclaimerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scenarios]);

  const handleShare = async () => {
    try {
      let shareText = `🔮 Decision Simulator AI Report\n`;
      shareText += `Decision: "${decision}"\n\n`;
      shareText += `🧠 Cognitive Bias Score: ${biasScore}/100\n`;
      shareText += `💡 Objective Reframe: "${cognitive_analysis.reframed_decision || 'N/A'}"\n\n`;

      scenarios.forEach((sc, i) => {
        shareText += `${i + 1}. [${sc.probability}%] ${sc.title}\n`;
        shareText += `   Timeline: ${sc.timeline || 'N/A'}\n`;
        shareText += `   Risk: ${sc.risk_level?.toUpperCase()}\n`;
        shareText += `   Outcome: ${sc.description}\n\n`;
      });

      shareText += `⚠️ disclaimer:\n${final_note}\n`;

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

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dynamic header banner */}
        <Animated.View style={[styles.banner, { opacity: headerFade }, Platform.OS === 'web' && WEB_STYLES.banner]}>
          <Text style={styles.bannerLabel}>SIMULATION REPORT ENGINE</Text>
          <Text style={styles.bannerTitle}>"{decision}"</Text>
        </Animated.View>

        {/* SECTION 1: COGNITIVE BIAS ANALYZER (FULL WIDTH PANEL) */}
        <Animated.View style={{ opacity: biasFade }}>
          <SectionHeaderChip title="🧠 Cognitive Bias Analyzer" svgIconHtml={brainSvg} />
          
          <Card style={[styles.biasCard, Platform.OS === 'web' && WEB_STYLES.biasCard]} outlined shadowed={false}>
            <View style={styles.biasDashboardGrid}>
              
              {/* Left Column: Arc Gauge */}
              <View style={styles.biasColumnLeft}>
                <ArcGauge score={biasScore} />
                <View style={styles.scoreTextContainer}>
                  <Text style={styles.biasPercentageText}>{biasScore}%</Text>
                  <Text style={styles.biasIndexSubLabel}>DISTORTION RATING</Text>
                </View>
              </View>

              {/* Right Column: Descriptions & Reframing */}
              <View style={styles.biasColumnRight}>
                <View style={styles.typewriterContainer}>
                  <Text style={[
                    styles.biasStatusTitle, 
                    Platform.OS === 'web' && typewriterTrigger && WEB_STYLES.typewriterActive
                  ]}>
                    {getBiasLabel(biasScore)}
                  </Text>
                </View>

                {/* Biases list */}
                {detectedBiases.length > 0 ? (
                  <View style={styles.distortionBox}>
                    {detectedBiases.map((bias, i) => (
                      <View key={i.toString()} style={styles.distortionItem}>
                        <Text style={styles.distortionItemName}>◆ {bias.name.toUpperCase()}</Text>
                        <Text style={styles.distortionItemDesc}>{bias.explanation}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.objectivePulseBox}>
                    <Text style={styles.objectivePulseText}>
                      🎉 OPTIMAL COGNITIVE FREQUENCY SECURED. DECISION COMPLIES WITH ALL STRICT RATIONAL CRITERIA.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Inset Reframing card */}
            {cognitive_analysis.reframed_decision && (
              <View style={styles.reframeCard}>
                <View style={styles.reframeHeader}>
                  <Text style={styles.reframeIcon}>💡</Text>
                  <Text style={styles.reframeTitle}>OBJECTIVE COGNITIVE REFRAME</Text>
                </View>
                <Text style={styles.reframeText}>"{cognitive_analysis.reframed_decision}"</Text>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.reframeBtn}
                  onPress={() => {
                    navigation.navigate('Home', { reframedDecision: cognitive_analysis.reframed_decision });
                  }}
                >
                  <Text style={styles.reframeBtnText}>RE-INITIALIZE WITH SYSTEM REFRAME</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* 60/40 ASYMMETRIC GRID WRAPPER */}
        <View style={styles.gridContainer}>
          
          {/* LEFT 60% COLUMN: FUTURE OUTCOME CARDS */}
          <View style={styles.columnLeft}>
            <SectionHeaderChip title="🔮 Projected Future Outcomes" svgIconHtml={crystalBallSvg} />
            
            {scenarios.map((scenario, index) => {
              const isFirst = index === 0;
              const accentColor = isFirst ? '#00e5ff' : '#fbbf24';
              const riskColor = scenario.risk_level === 'high' ? '#f43f5e' : scenario.risk_level === 'medium' ? '#fbbf24' : '#00e5ff';
              const isWeb = Platform.OS === 'web';
              
              return (
                <Animated.View 
                  key={index.toString()} 
                  style={{ 
                    opacity: cardsFade[index] || 1, 
                    transform: [{ translateY: cardsSlide[index] || 0 }] 
                  }}
                >
                  <Card 
                    style={[
                      styles.outcomeCard, 
                      { borderLeftWidth: 3, borderLeftColor: accentColor },
                      Platform.OS === 'web' && WEB_STYLES.outcomeCard
                    ]}
                    outlined
                    shadowed={false}
                  >
                    <View style={styles.outcomeHeader}>
                      <View>
                        <Text style={styles.outcomeScenarioNum}>PATH 0{index + 1}</Text>
                        <Text style={styles.outcomeTitle}>{scenario.title}</Text>
                      </View>
                      
                      {/* Risk Badge with ripple pulse */}
                      <View style={[
                        styles.riskBadge, 
                        { borderColor: riskColor },
                        isWeb && (scenario.risk_level === 'high' ? WEB_STYLES.amberPulse : WEB_STYLES.tealPulse)
                      ]}>
                        <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                          {scenario.risk_level?.toUpperCase()} RISK
                        </Text>
                      </View>
                    </View>

                    {/* Mid row: Liquid probability + timeline + mood */}
                    <View style={styles.metricsRow}>
                      <LiquidProbabilityGauge percentage={scenario.probability} />
                      <TimelineFilmStrip timeline={scenario.timeline} />
                      
                      {/* Blinking Mood Face */}
                      <View style={styles.moodBox}>
                        <Text style={styles.moodLabel}>EMOTIONAL BIAS</Text>
                        <BlinkFaceIcon score={biasScore} />
                        <Text style={styles.moodText}>{scenario.emotional_impact?.toUpperCase()}</Text>
                      </View>
                    </View>

                    {/* Outcome description block */}
                    <View style={styles.descBlock}>
                      <Text style={styles.descText}>{scenario.description}</Text>
                      
                      {/* Technical reasoning block */}
                      <View style={styles.reasoningCard}>
                        <Text style={styles.reasoningLabel}>AI LOGICAL DEBATE ANALYSIS</Text>
                        <Text style={styles.reasoningText}>{scenario.reasoning}</Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>

          {/* RIGHT 40% COLUMN: CRITICAL FACTORS + DISCLAIMER */}
          <View style={styles.columnRight}>
            
            {/* Sticky/Fixed-like wrapper */}
            <View style={styles.stickyPanel}>
              
              {/* Critical Factors panel */}
              <Animated.View style={{ opacity: factorsFade }}>
                <SectionHeaderChip title="📌 Critical Factors" svgIconHtml={factorsSvg} />
                
                <Card style={styles.factorsCard} outlined shadowed={false}>
                  <Text style={styles.factorsSub}>CRITICAL PARAMETERS TO TRACK:</Text>
                  
                  <View style={styles.factorsList}>
                    {key_factors_to_consider.map((factor, i) => (
                      <View 
                        key={i.toString()} 
                        style={[styles.factorItem, Platform.OS === 'web' && WEB_STYLES.factorItem]}
                      >
                        <Text style={styles.factorDiamond}>◆</Text>
                        <Text style={styles.factorText}>{factor}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </Animated.View>

              {/* Disclaimer "Classified document" card */}
              <Animated.View style={{ opacity: disclaimerFade }}>
                <Card 
                  style={[
                    styles.disclaimerCard, 
                    Platform.OS === 'web' && WEB_STYLES.disclaimerCard,
                    Platform.OS === 'web' && styles.classifiedClass
                  ]} 
                  outlined 
                  shadowed={false}
                >
                  <View style={styles.disclaimerHeader}>
                    <Text style={styles.disclaimerWarningIcon}>⚠️</Text>
                    <Text style={styles.disclaimerLabel}>CLASSIFIED NEURAL DISCLAIMER</Text>
                  </View>
                  <Text style={styles.disclaimerText}>
                    {final_note || 'This outcome simulation utilizes high-frequency behavioral filters. It acts as an analytical decision modeling instrument and is strictly not to be interpreted as direct legal, financial, or personal advice. Exercise primary caution.'}
                  </Text>
                </Card>
              </Animated.View>
            </View>

          </View>
        </View>

        {/* Action Panel Footer */}
        <View style={styles.footerRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShare}
            style={styles.shareBtn}
          >
            <Text style={styles.shareBtnText}>📤 TRANSMIT SIMULATION DATALOG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>CLOSE HUD</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#020408',
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
    color: '#94A3B8',
    marginBottom: SPACING.md,
  },
  banner: {
    backgroundColor: 'rgba(0, 229, 255, 0.02)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    marginBottom: SPACING.lg,
  },
  bannerLabel: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    color: '#a855f7',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '700',
    color: '#00e5ff',
    fontStyle: 'italic',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#00e5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  chipIconWeb: {
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconMobile: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00e5ff',
    marginRight: 8,
  },
  chipText: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    color: '#00e5ff',
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  biasCard: {
    backgroundColor: 'rgba(8, 12, 28, 0.75)',
    borderColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
  },
  biasDashboardGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: SPACING.lg,
  },
  biasColumnLeft: {
    width: Platform.OS === 'web' ? '30%' : '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biasColumnRight: {
    flex: 1,
    justifyContent: 'center',
  },
  scoreTextContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  biasPercentageText: {
    fontFamily: 'Orbitron',
    fontSize: 28,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: -1,
  },
  biasIndexSubLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    color: '#587396',
    letterSpacing: 1,
  },
  typewriterContainer: {
    height: 28,
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  biasStatusTitle: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '800',
    color: '#a855f7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  distortionBox: {
    marginTop: SPACING.sm,
  },
  distortionItem: {
    backgroundColor: 'rgba(3, 5, 13, 0.4)',
    borderColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  distortionItemName: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  distortionItemDesc: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  objectivePulseBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  objectivePulseText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    color: '#10B981',
    lineHeight: 18,
    fontWeight: '700',
  },
  reframeCard: {
    backgroundColor: 'rgba(0, 229, 255, 0.02)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  reframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reframeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  reframeTitle: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 1,
  },
  reframeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    color: '#F8FAFC',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  reframeBtn: {
    height: 38,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reframeBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: SPACING.lg,
  },
  columnLeft: {
    width: Platform.OS === 'web' ? '60%' : '100%',
  },
  columnRight: {
    width: Platform.OS === 'web' ? '40%' : '100%',
  },
  stickyPanel: {
    // In standard CSS, sticky behaves on web. In RN we align structurally.
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: Platform.OS === 'web' ? 20 : 0,
  },
  outcomeCard: {
    backgroundColor: 'rgba(8, 12, 28, 0.7)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  outcomeScenarioNum: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    color: '#587396',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  outcomeTitle: {
    fontFamily: 'Orbitron',
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  riskBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  riskBadgeText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(3, 5, 13, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  liquidContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liquidNum: {
    fontFamily: 'Orbitron',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  liquidLabel: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    color: '#587396',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 6,
  },
  flaskBorder: {
    width: 50,
    height: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(3, 5, 13, 0.8)',
    overflow: 'hidden',
    position: 'relative',
  },
  flaskLiquid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  timelineContainer: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    color: '#587396',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stripCard: {
    width: '100%',
    backgroundColor: 'rgba(3, 5, 13, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 2,
  },
  sprocketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sprocket: {
    width: 3,
    height: 3,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderRadius: 1,
  },
  stripDisplay: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(0, 229, 255, 0.1)',
    borderBottomColor: 'rgba(0, 229, 255, 0.1)',
  },
  stripText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 0.8,
  },
  moodBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    color: '#587396',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  faceIconContainer: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodText: {
    fontFamily: 'Orbitron',
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 4,
  },
  descBlock: {
    marginTop: SPACING.md,
  },
  descText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  reasoningCard: {
    backgroundColor: 'rgba(0, 229, 255, 0.01)',
    borderColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  reasoningLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    color: '#a855f7',
    letterSpacing: 1,
    marginBottom: 4,
  },
  reasoningText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    color: '#587396',
    lineHeight: 18,
  },
  factorsCard: {
    backgroundColor: 'rgba(8, 12, 28, 0.7)',
    borderColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  factorsSub: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    color: '#a855f7',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  factorsList: {
    gap: SPACING.sm,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(3, 5, 13, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  factorDiamond: {
    fontSize: 10,
    color: '#00e5ff',
    marginRight: 8,
    marginTop: 2,
  },
  factorText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.02)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    opacity: 0.65,
  },
  classifiedClass: {
    // Attaches custom styling rules from App.css
    backgroundColor: 'rgba(245, 158, 11, 0.01)',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  disclaimerWarningIcon: {
    fontSize: 14,
    color: '#f59e0b',
    marginRight: 6,
  },
  disclaimerLabel: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  disclaimerText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    color: '#fbbf24',
    lineHeight: 16,
    opacity: 0.75,
  },
  footerRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  shareBtn: {
    flex: 1.5,
    height: 52,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: '#00e5ff',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  shareBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '800',
    color: '#00e5ff',
    letterSpacing: 1,
  },
  doneBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#00e5ff',
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  doneBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    color: '#03050d',
    letterSpacing: 1.5,
  },
  nativeGaugeTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.full,
    width: 150,
  },
  nativeGaugeProgress: {
    height: '100%',
    backgroundColor: '#00e5ff',
    borderRadius: BORDER_RADIUS.full,
  },
});
