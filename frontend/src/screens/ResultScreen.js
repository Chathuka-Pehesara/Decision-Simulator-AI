// src/screens/ResultScreen.js
import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Share, 
  Alert,
  Animated,
  Platform
} from 'react-native';
import ScenarioCard from '../components/ScenarioCard';
import Button from '../components/Button';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../styles/theme';

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

  const { 
    scenarios = [], 
    key_factors_to_consider = [], 
    cognitive_analysis = {}, 
    boardroom_debate = {}, 
    final_note = '' 
  } = simulation;

  const debateTranscript = boardroom_debate.debate_transcript || [];
  const detectedBiases = cognitive_analysis.detected_biases || [];
  const biasScore = cognitive_analysis.bias_score || 0;

  // Animation values
  const biasWidth = useRef(new Animated.Value(0)).current;
  const biasScoreFade = useRef(new Animated.Value(0)).current;
  const reframeSlide = useRef(new Animated.Value(30)).current;
  const reframeFade = useRef(new Animated.Value(0)).current;

  // Staggered debate entry animations
  const fadeAnims = useRef(debateTranscript.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(debateTranscript.map(() => new Animated.Value(20))).current;

  useEffect(() => {
    // 1. Animate Bias Meter Progress Bar
    Animated.parallel([
      Animated.timing(biasWidth, {
        toValue: biasScore,
        duration: 1200,
        useNativeDriver: false, // width cannot use native driver
      }),
      Animated.timing(biasScoreFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();

    // 2. Animate Cognitive Reframe Entry
    Animated.parallel([
      Animated.timing(reframeFade, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(reframeSlide, {
        toValue: 0,
        friction: 6,
        tension: 30,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();

    // 3. Staggered sequential fade-in and slide-up for debate transcript bubbles
    if (debateTranscript.length > 0) {
      const debateAnimations = debateTranscript.map((_, index) => {
        return Animated.parallel([
          Animated.timing(fadeAnims[index], {
            toValue: 1,
            duration: 500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(slideAnims[index], {
            toValue: 0,
            friction: 7,
            tension: 35,
            useNativeDriver: Platform.OS !== 'web',
          })
        ]);
      });

      Animated.stagger(250, debateAnimations).start();
    }
  }, [debateTranscript, biasScore]);

  const handleShare = async () => {
    try {
      let shareText = `🔮 Decision Simulator AI report\n`;
      shareText += `Decision: "${decision}"\n\n`;
      
      shareText += `🧠 Cognitive Bias Score: ${biasScore}/100\n`;
      if (cognitive_analysis.reframed_decision) {
        shareText += `💡 Objective Reframe: "${cognitive_analysis.reframed_decision}"\n\n`;
      }

      shareText += `👥 Boardroom Debate Summary:\n${boardroom_debate.consensus_summary || 'N/A'}\n\n`;

      shareText += ` Possible Future Scenarios:\n`;
      scenarios.forEach((sc, i) => {
        shareText += `${i + 1}. [${sc.probability}%] ${sc.title}\n`;
        shareText += `   Timeline: ${sc.timeline || 'N/A'}\n`;
        shareText += `   Risk: ${sc.risk_level?.toUpperCase()}\n`;
        shareText += `   Outcome: ${sc.description}\n\n`;
      });

      shareText += `⚠️ Disclaimer Note:\n${final_note}\n`;

      await Share.share({
        message: shareText,
        title: 'Decision Simulation Outcome',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share simulation results.');
    }
  };

  const getBiasColor = (score) => {
    if (score < 30) return COLORS.accentGreen;
    if (score < 60) return COLORS.accentBlue;
    return '#E11D48'; // Premium High-End Crimson Red
  };

  const getBiasLabel = (score) => {
    if (score < 30) return 'Highly Objective';
    if (score < 60) return 'Moderate Cognitive Bias';
    return 'Critical Bias / Highly Loaded';
  };

  const getAdvisorAvatar = (name) => {
    if (name.includes('Visionary')) return '🚀';
    if (name.includes('Advocate') || name.includes('Critic')) return '🛡️';
    return '⚙️';
  };

  const getAdvisorBg = (name) => {
    if (name.includes('Visionary')) return COLORS.accentBlueLight;
    if (name.includes('Advocate') || name.includes('Critic')) return COLORS.riskHighBg;
    return COLORS.accentGreenLight;
  };

  const getAdvisorColor = (name) => {
    if (name.includes('Visionary')) return COLORS.accentBlue;
    if (name.includes('Advocate') || name.includes('Critic')) return COLORS.textSecondary;
    return COLORS.accentGreen;
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Decision Summary Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>Simulated Decision</Text>
          <Text style={styles.bannerTitle}>"{decision}"</Text>
        </View>

        {/* SECTION 1: COGNITIVE BIAS & BLIND SPOT ANALYZER */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🧠 Cognitive Bias Analyzer</Text>
          
          <Card style={styles.biasCard} shadowed={true}>
            {/* Score header */}
            <View style={styles.biasScoreRow}>
              <View>
                <Text style={styles.biasScoreSubText}>Cognitive Distortion Index</Text>
                <Text style={[styles.biasScoreLabel, { color: getBiasColor(biasScore) }]}>
                  {getBiasLabel(biasScore)}
                </Text>
              </View>
              <Animated.Text style={[styles.biasScoreNum, { opacity: biasScoreFade, color: getBiasColor(biasScore) }]}>
                {biasScore}%
              </Animated.Text>
            </View>

            {/* Gauge */}
            <View style={styles.gaugeContainer}>
              <Animated.View 
                style={[
                  styles.gaugeBar, 
                  { 
                    backgroundColor: getBiasColor(biasScore),
                    width: biasWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    })
                  }
                ]} 
              />
            </View>

            {/* Detected Biases */}
            {detectedBiases.length > 0 ? (
              <View style={styles.biasesList}>
                <Text style={styles.biasListTitle}>Detected Behavioral Fallacies:</Text>
                {detectedBiases.map((bias, index) => (
                  <View key={index.toString()} style={styles.biasItem}>
                    <View style={styles.biasItemHeader}>
                      <Text style={styles.biasItemBullet}>⚠️</Text>
                      <Text style={styles.biasItemName}>{bias.name}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: bias.severity === 'high' ? '#FFEBEB' : '#FFF7E6' }]}>
                        <Text style={[styles.severityBadgeText, { color: bias.severity === 'high' ? '#E11D48' : '#F59E0B' }]}>
                          {bias.severity}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.biasExplanation}>{bias.explanation}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noBiasesText}>🎉 Elite-level objectivity. No logical fallacies detected in this formulation.</Text>
            )}

            {/* Reframed suggestion box */}
            {cognitive_analysis.reframed_decision ? (
              <Animated.View style={{ opacity: reframeFade, transform: [{ translateY: reframeSlide }] }}>
                <View style={styles.reframeContainer}>
                  <View style={styles.reframeHeader}>
                    <Text style={styles.reframeEmoji}>💡</Text>
                    <Text style={styles.reframeTitle}>AI Objective Reframe</Text>
                  </View>
                  <Text style={styles.reframeText}>"{cognitive_analysis.reframed_decision}"</Text>
                  
                  <Button
                    title="🔄 Re-simulate with Objective Formulation"
                    onPress={() => {
                      navigation.navigate('Home', { reframedDecision: cognitive_analysis.reframed_decision });
                    }}
                    variant="primary"
                    style={styles.reframeBtn}
                    textStyle={styles.reframeBtnText}
                  />
                </View>
              </Animated.View>
            ) : null}
          </Card>
        </View>

        {/* SECTION 2: AI BOARDROOM DEBATE CHAMBER */}
        {debateTranscript.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>👥 Multi-Agent Boardroom Debate</Text>
            
            <Card style={styles.debateCard} shadowed={true}>
              <Text style={styles.debateIntro}>
                Three virtual advisors were assembled to stress-test your decision with contrasting paradigms:
              </Text>

              {/* Advisors List */}
              <View style={styles.advisorsGrid}>
                {boardroom_debate.advisors?.map((adv, i) => (
                  <View key={i.toString()} style={styles.advisorPill}>
                    <Text style={styles.advisorPillEmoji}>{getAdvisorAvatar(adv.name)}</Text>
                    <View>
                      <Text style={styles.advisorPillName}>{adv.name.replace("The ", "")}</Text>
                      <Text style={styles.advisorPillRole} numberOfLines={1}>{adv.role.split("Focuses")[0] || adv.role}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              {/* Sequential Chat bubbles */}
              <Text style={styles.chamberTitle}>Debate Chamber Transcript:</Text>
              
              <View style={styles.bubbleList}>
                {debateTranscript.map((msg, index) => {
                  const avatar = getAdvisorAvatar(msg.speaker);
                  const isVisionary = msg.speaker.includes('Visionary');
                  const isCritic = msg.speaker.includes('Advocate') || msg.speaker.includes('Critic');
                  const labelColor = getAdvisorColor(msg.speaker);
                  const bubbleBg = isVisionary 
                    ? '#F0F6FF' 
                    : isCritic 
                      ? '#F9FAFB' 
                      : '#F0FDF4';

                  return (
                    <Animated.View 
                      key={index.toString()} 
                      style={[
                        styles.bubbleWrapper,
                        {
                          opacity: fadeAnims[index] || 1,
                          transform: [{ translateY: slideAnims[index] || 0 }]
                        }
                      ]}
                    >
                      <View style={styles.bubbleRow}>
                        <View style={[styles.bubbleAvatar, { backgroundColor: getAdvisorBg(msg.speaker) }]}>
                          <Text style={styles.bubbleAvatarText}>{avatar}</Text>
                        </View>
                        <View style={[styles.bubbleCard, { backgroundColor: bubbleBg }]}>
                          <Text style={[styles.bubbleSpeaker, { color: labelColor }]}>{msg.speaker}</Text>
                          <Text style={styles.bubbleMessage}>{msg.message}</Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Consensus Summary */}
              {boardroom_debate.consensus_summary && (
                <View style={styles.consensusBox}>
                  <Text style={styles.consensusTitle}>⚖️ Consensus Agreement:</Text>
                  <Text style={styles.consensusText}>{boardroom_debate.consensus_summary}</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* SECTION 3: POSSIBLE FUTURE SCENARIOS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔮 Projected Future Outcomes</Text>
          {scenarios.map((scenario, index) => (
            <ScenarioCard key={index.toString()} scenario={scenario} />
          ))}
        </View>

        {/* SECTION 4: KEY FACTORS */}
        {key_factors_to_consider.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📌 Critical Factors to Track</Text>
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

        {/* SECTION 5: STRICT NEUTRAL AI DISCLAIMER */}
        {final_note ? (
          <View style={styles.sectionContainer}>
            <Card outlined={true} shadowed={false} style={styles.calloutCard}>
              <Text style={styles.calloutEmoji}>ℹ️</Text>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>Neutral Simulator Disclaimer</Text>
                <Text style={styles.calloutText}>{final_note}</Text>
              </View>
            </Card>
          </View>
        ) : null}

        {/* Actions Footer */}
        <View style={styles.footerRow}>
          <Button
            title="📤 Share Simulation Report"
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
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...Platform.select({
      ios: SHADOWS.light,
      android: SHADOWS.light
    })
  },
  bannerLabel: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.accentBlue,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bannerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
  },
  biasCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
  },
  biasScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  biasScoreSubText: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  biasScoreLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  biasScoreNum: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  gaugeContainer: {
    height: 10,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  gaugeBar: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  biasListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  biasesList: {
    marginBottom: SPACING.md,
  },
  biasItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.borderDark,
  },
  biasItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  biasItemBullet: {
    fontSize: 14,
    marginRight: 6,
  },
  biasItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  biasExplanation: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textSecondary,
    lineHeight: 18,
    paddingLeft: 20,
  },
  noBiasesText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accentGreen,
    fontWeight: '600',
    lineHeight: 20,
    backgroundColor: COLORS.accentGreenLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  reframeContainer: {
    backgroundColor: '#F0F6FF', // Light blue panel
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1.5,
    borderColor: '#D0E2FF',
  },
  reframeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reframeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  reframeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  reframeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  reframeBtn: {
    height: 40,
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reframeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  debateCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  debateIntro: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  advisorsGrid: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  advisorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  advisorPillEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  advisorPillName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  advisorPillRole: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1.5,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.lg,
  },
  chamberTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  bubbleList: {
    flexDirection: 'column',
    gap: SPACING.md,
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleAvatarText: {
    fontSize: 16,
  },
  bubbleCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleSpeaker: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bubbleMessage: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  consensusBox: {
    backgroundColor: COLORS.accentGreenLight,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#C2F0D8',
    marginTop: SPACING.lg,
  },
  consensusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentGreen,
    marginBottom: 4,
  },
  consensusText: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
