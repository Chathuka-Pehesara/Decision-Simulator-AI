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
  Animated
} from 'react-native';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { simulateDecision } from '../services/api';
import { saveSimulation } from '../services/storage';

export default function HomeScreen({ navigation, route }) {
  const [decision, setDecision] = useState('');
  const [risk, setRisk] = useState('medium');
  const [personality, setPersonality] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

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

    setLoading(true);
    try {
      // Call standard simulation API (with fallback)
      const result = await simulateDecision(decision.trim(), risk, personality);
      
      // Save result to AsyncStorage history automatically
      const savedRecord = await saveSimulation(decision.trim(), result);
      
      // Navigate to results screen with results and record ID
      navigation.navigate('Result', { 
        simulation: savedRecord.result, 
        decision: savedRecord.decision,
        recordId: savedRecord.id
      });
      
      // Reset input on success
      setDecision('');
    } catch (error) {
      Alert.alert('Simulation Error', 'Failed to generate simulation results. Please try again.');
    } finally {
      setLoading(false);
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
              <Text style={styles.title}>Decision Simulator AI</Text>
              <Text style={styles.subtitle}>
                Analyze potential pathways. Contrast probabilities. Map emotional impacts.
              </Text>
              <View style={styles.decoratorLine} />
            </View>

            {/* Form Card */}
            <Card style={styles.formCard}>
              <Text style={styles.inputLabel}>Describe Your Decision</Text>
              <TextInput
                style={[styles.textInput, isFocused && styles.textInputFocused]}
                multiline
                numberOfLines={4}
                placeholder="e.g., Should I accept the senior software engineer offer at the startup, or stay in my stable corporate role?"
                placeholderTextColor={COLORS.textMuted}
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

              {/* Simulate Button */}
              <Button
                title="Simulate Futures"
                onPress={handleSimulate}
                loading={loading}
                style={styles.simulateBtn}
              />
            </Card>

            {/* Navigation Shortcuts */}
            <View style={styles.shortcutRow}>
              <Button
                title="📜 Simulation History"
                onPress={() => navigation.navigate('History')}
                variant="light"
                style={styles.shortcutBtn}
                textStyle={styles.shortcutText}
              />
              <Button
                title="📊 Compare Scenarios"
                onPress={() => navigation.navigate('Compare')}
                variant="light"
                style={styles.shortcutBtn}
                textStyle={styles.shortcutText}
              />
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
    color: COLORS.textPrimary,
    fontWeight: '900',
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #3B82F6 0%, #A855F7 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }
    })
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  decoratorLine: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  formCard: {
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
  },
  inputLabel: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface, // Obsidian dark inset layer
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  textInputFocused: {
    borderColor: COLORS.accentBlue,
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  simulateBtn: {
    marginTop: SPACING.sm,
    height: 52,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shortcutBtn: {
    flex: 1,
    height: 48,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
