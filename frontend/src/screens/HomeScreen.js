// src/screens/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  Alert,
  Animated,
  TouchableOpacity
} from 'react-native';
import Dropdown from '../components/Dropdown';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { simulateDecision, getSocraticQuestions } from '../services/api';
import { saveSimulation } from '../services/storage';

// Dot-Dash Glowing Separator Line
const DotDashSeparator = () => (
  <View style={styles.dotDashContainer}>
    <View style={styles.dashLine} />
    <View style={styles.dot} />
    <View style={styles.dashLine} />
  </View>
);

// Vector SVG Icon for Simulation History (Amber Folder/Clock)
const HistoryIcon = () => (
  <View style={styles.iconContainer}>
    {Platform.OS === 'web' ? (
      <div dangerouslySetInnerHTML={{__html: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      `}} style={{display: 'flex', alignItems: 'center'}} />
    ) : (
      <View style={[styles.fallbackIcon, { borderColor: '#fbbf24' }]} />
    )}
  </View>
);

// Vector SVG Icon for Compare Scenarios (Magenta Analytics Chart)
const CompareIcon = () => (
  <View style={styles.iconContainer}>
    {Platform.OS === 'web' ? (
      <div dangerouslySetInnerHTML={{__html: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      `}} style={{display: 'flex', alignItems: 'center'}} />
    ) : (
      <View style={[styles.fallbackIcon, { borderColor: '#ec4899' }]} />
    )}
  </View>
);

// Web-only Styles (bypass Hermes static parser validation inside StyleSheet.create)
const WEB_STYLES = {
  formCard: {
    backdropFilter: 'blur(20px)',
    transition: 'all 0.4s ease-in-out',
  },
  formCardActive: {
    boxShadow: '0 0 30px rgba(0, 229, 255, 0.12)',
  },
  textInput: {
    transition: 'all 0.3s ease-in-out',
  },
  textInputFocused: {
    boxShadow: 'inset 0 0 20px rgba(0, 229, 255, 0.08), 0 0 10px rgba(0, 229, 255, 0.05)',
  },
  simulateBtnContainer: {
    transition: 'all 0.3s ease-in-out',
  },
  historyBtn: {
    transition: 'all 0.3s ease',
  },
  compareBtn: {
    transition: 'all 0.3s ease',
  }
};

export default function HomeScreen({ navigation, route }) {
  const [decision, setDecision] = useState('');
  const [risk, setRisk] = useState('medium');
  const [personality, setPersonality] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Socratic Mode States
  const [socraticMode, setSocraticMode] = useState(false);
  const [socraticStep, setSocraticStep] = useState(false);
  const [socraticQuestions, setSocraticQuestions] = useState([]);
  const [socraticAnswers, setSocraticAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Listen for reframed decisions from ResultScreen
    if (route.params?.reframedDecision) {
      setDecision(route.params.reframedDecision);
      // Clear route parameters so they do not stick on subsequent focus
      navigation.setParams({ reframedDecision: undefined });
    }
  }, [route.params?.reframedDecision]);

  useEffect(() => {
    // Trigger smooth mounting entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 35,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
  }, []);

  // Loop scanline sweeping bar while input is focused
  useEffect(() => {
    if (isFocused) {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: false,
        })
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isFocused]);

  const riskOptions = [
    { label: 'Low Risk Tolerance', value: 'low' },
    { label: 'Medium Risk Tolerance', value: 'medium' },
    { label: 'High Risk Tolerance', value: 'high' },
  ];

  const personalityOptions = [
    { label: 'Analytical', value: 'analytical' },
    { label: 'Emotional', value: 'emotional' },
    { label: 'Balanced', value: 'balanced' },
    { label: 'Risk-taker', value: 'risk-taker' },
  ];

  const handleSimulate = async () => {
    if (!decision.trim()) {
      Alert.alert('Required Field', 'Please enter your decision statement first.');
      return;
    }

    if (socraticMode) {
      setLoading(true);
      try {
        const data = await getSocraticQuestions(decision.trim());
        if (data && data.questions && data.questions.length > 0) {
          setSocraticQuestions(data.questions);
          setSocraticAnswers({});
          setCurrentQuestionIndex(0);
          setSocraticStep(true);
        } else {
          await runDirectSimulation(decision.trim());
        }
      } catch (error) {
        Alert.alert('Socratic Probe Error', 'Failed to generate Socratic questions. Proceeding directly...');
        await runDirectSimulation(decision.trim());
      } finally {
        setLoading(false);
      }
    } else {
      await runDirectSimulation(decision.trim());
    }
  };

  const runDirectSimulation = async (queryText) => {
    setLoading(true);
    try {
      const result = await simulateDecision(queryText, risk, personality);
      const savedRecord = await saveSimulation(decision.trim(), result);
      
      navigation.navigate('Result', { 
        simulation: savedRecord.result, 
        decision: savedRecord.decision,
        recordId: savedRecord.id
      });
      
      setDecision('');
      setSocraticStep(false);
      setSocraticQuestions([]);
      setSocraticAnswers({});
    } catch (error) {
      Alert.alert('Simulation Error', 'Failed to generate simulation results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocraticNext = async () => {
    const currentAnswer = socraticAnswers[currentQuestionIndex] || '';
    if (!currentAnswer.trim()) {
      Alert.alert('Response Required', 'Please provide a response before proceeding.');
      return;
    }

    if (currentQuestionIndex < socraticQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let compiledQuery = decision.trim() + "\n\nUser Clarifications:\n";
      socraticQuestions.forEach((q, idx) => {
        compiledQuery += `- Question: ${q}\n  Answer: ${socraticAnswers[idx]}\n`;
      });
      await runDirectSimulation(compiledQuery);
    }
  };

  const handleSocraticBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setSocraticStep(false);
      setSocraticQuestions([]);
      setSocraticAnswers({});
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, Platform.OS === 'web' && { animation: 'bioluminescentPulse 4s infinite ease-in-out' }]}>
                Decision Simulator AI
              </Text>
              <Text style={styles.subtitle}>
                Analyze potential pathways. Contrast probabilities. Map emotional impacts.
              </Text>
              <View style={styles.headerDotDash}>
                <DotDashSeparator />
              </View>
            </View>

            {/* Input Card Container (Glassmorphic Outer Frame) */}
            <Card 
              style={[
                styles.formCard, 
                isFocused && styles.formCardActive,
                Platform.OS === 'web' && WEB_STYLES.formCard,
                Platform.OS === 'web' && isFocused && WEB_STYLES.formCardActive
              ]} 
              outlined 
              shadowed={false}
            >
              
              {/* Animated Laser Scanning Sweep Line */}
              {isFocused && (
                <Animated.View 
                  style={[
                    styles.scanline,
                    {
                      top: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]}
                />
              )}

              {socraticStep ? (
                <View>
                  <Text style={styles.socraticHeader}>🧠 SOCRATIC COGNITIVE CHALLENGE</Text>
                  <Text style={styles.socraticSub}>Refine unstated parameters and cognitive assumptions.</Text>
                  <DotDashSeparator />
                  
                  <Text style={styles.socraticProgress}>
                    QUESTION {currentQuestionIndex + 1} OF {socraticQuestions.length}
                  </Text>
                  
                  <Text style={styles.socraticQuestionText}>
                    {socraticQuestions[currentQuestionIndex]}
                  </Text>
                  
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.socraticInput
                    ]}
                    multiline
                    numberOfLines={3}
                    placeholder="Type your response here..."
                    placeholderTextColor="#587396"
                    value={socraticAnswers[currentQuestionIndex] || ''}
                    onChangeText={(text) => setSocraticAnswers({ ...socraticAnswers, [currentQuestionIndex]: text })}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                  
                  <View style={styles.socraticBtnRow}>
                    <TouchableOpacity
                      style={styles.socraticBackBtn}
                      onPress={handleSocraticBack}
                      disabled={loading}
                    >
                      <Text style={styles.socraticBackBtnText}>BACK</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.socraticNextBtn}
                      onPress={handleSocraticNext}
                      disabled={loading}
                    >
                      <Text style={styles.socraticNextBtnText}>
                        {currentQuestionIndex === socraticQuestions.length - 1 ? (loading ? 'ANALYZING...' : 'SIMULATE FUTURES') : 'NEXT'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Describe Your Decision</Text>
                  <DotDashSeparator />
                  
                  <TextInput
                    style={[
                      styles.textInput, 
                      isFocused && styles.textInputFocused,
                      Platform.OS === 'web' && WEB_STYLES.textInput,
                      Platform.OS === 'web' && isFocused && WEB_STYLES.textInputFocused
                    ]}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g., Should I accept the senior software engineer offer at the startup, or stay in my stable corporate role?"
                    placeholderTextColor="#587396"
                    value={decision}
                    onChangeText={setDecision}
                    textAlignVertical="top"
                    editable={!loading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />

                  {/* Dropdowns */}
                  <Dropdown
                    label="Risk Tolerance"
                    placeholder="Select risk level..."
                    selectedValue={risk}
                    onValueChange={setRisk}
                    options={riskOptions}
                  />

                  <Dropdown
                    label="Personality Focus"
                    placeholder="Select decision style..."
                    selectedValue={personality}
                    onValueChange={setPersonality}
                    options={personalityOptions}
                  />

                  {/* Socratic Toggle Switch */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSocraticMode(!socraticMode)}
                    style={styles.socraticToggle}
                  >
                    <View style={[styles.checkbox, socraticMode && styles.checkboxChecked]}>
                      {socraticMode && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.socraticToggleText}>Activate Socratic Pre-Analysis Mode</Text>
                  </TouchableOpacity>

                  {/* Loop Animated Gradient Simulated Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleSimulate}
                    disabled={loading}
                    style={[
                      styles.simulateBtnContainer,
                      Platform.OS === 'web' && WEB_STYLES.simulateBtnContainer,
                      Platform.OS === 'web' && {
                        background: 'linear-gradient(-45deg, #00e5ff, #a855f7, #00e5ff, #a855f7)',
                        backgroundSize: '400% 400%',
                        animation: 'btnGradientSweep 6s infinite ease',
                      }
                    ]}
                  >
                    <Text style={styles.simulateBtnText}>
                      {loading ? 'ANALYZING THREADS...' : 'SIMULATE FUTURES'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* Bottom Glassmorphism Buttons (Left: Amber, Right: Magenta) */}
            <View style={styles.shortcutRow}>
              {/* History Button (Amber Tinted) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('History')}
                style={[
                  styles.historyBtn,
                  Platform.OS === 'web' && WEB_STYLES.historyBtn
                ]}
              >
                <HistoryIcon />
                <Text style={styles.historyBtnText}>Simulation History</Text>
              </TouchableOpacity>

              {/* Compare Button (Magenta Tinted) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Compare')}
                style={[
                  styles.compareBtn,
                  Platform.OS === 'web' && WEB_STYLES.compareBtn
                ]}
              >
                <CompareIcon />
                <Text style={styles.compareBtnText}>Compare Scenarios</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: '#00e5ff',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: '#94A3B8',
    marginTop: 8,
    lineHeight: 22,
  },
  headerDotDash: {
    marginTop: SPACING.sm,
  },
  formCard: {
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(0, 229, 255, 0.03)', // Frosted glass transparent cyan
    position: 'relative',
    overflow: 'hidden',
  },
  formCardActive: {
    borderColor: 'rgba(0, 229, 255, 0.45)',
  },
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    zIndex: 10,
    pointerEvents: 'none',
  },
  inputLabel: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0, 229, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  textInput: {
    fontFamily: 'IBM Plex Mono',
    minHeight: 115,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    color: '#F8FAFC',
    backgroundColor: 'rgba(3, 5, 13, 0.6)', // Deep inset box
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  textInputFocused: {
    borderColor: '#00e5ff',
  },
  simulateBtnContainer: {
    height: 52,
    backgroundColor: '#00e5ff', // Fallback color
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 6,
  },
  simulateBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 14,
    fontWeight: '900',
    color: '#03050d', // High-contrast cosmic black text
    letterSpacing: 1.5,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  historyBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(251, 191, 36, 0.03)', // Amber translucent
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  historyBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '700',
    color: '#fbbf24',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  compareBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(236, 72, 153, 0.03)', // Magenta translucent
    borderWidth: 1.5,
    borderColor: 'rgba(236, 72, 153, 0.15)',
    borderRadius: BORDER_RADIUS.md,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  compareBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dotDashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  dashLine: {
    height: 1.5,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    width: 25,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00e5ff',
    marginHorizontal: 4,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  socraticToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    backgroundColor: 'rgba(3, 5, 13, 0.6)',
  },
  checkboxChecked: {
    borderColor: '#00e5ff',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 1,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  socraticToggleText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
    letterSpacing: 0.5,
  },
  socraticHeader: {
    fontFamily: 'Orbitron',
    fontSize: 14,
    fontWeight: '900',
    color: '#00e5ff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socraticSub: {
    ...TYPOGRAPHY.body,
    color: '#587396',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  socraticProgress: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    color: '#a855f7',
    letterSpacing: 1.5,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  socraticQuestionText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  socraticInput: {
    minHeight: 80,
    marginBottom: SPACING.lg,
  },
  socraticBtnRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  socraticBackBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    backgroundColor: 'rgba(244, 63, 94, 0.03)',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socraticBackBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '800',
    color: '#f43f5e',
    letterSpacing: 1,
  },
  socraticNextBtn: {
    flex: 2,
    height: 48,
    backgroundColor: '#00e5ff',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  socraticNextBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    color: '#03050d',
    letterSpacing: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});
