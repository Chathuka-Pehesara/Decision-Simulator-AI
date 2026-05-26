// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView,
  Alert
} from 'react-native';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';
import Card from '../components/Card';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { simulateDecision } from '../services/api';
import { saveSimulation } from '../services/storage';

export default function HomeScreen({ navigation }) {
  const [decision, setDecision] = useState('');
  const [risk, setRisk] = useState('medium');
  const [personality, setPersonality] = useState('balanced');
  const [loading, setLoading] = useState(false);

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
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="e.g., Should I accept the senior software engineer offer at the startup, or stay in my stable corporate role?"
              placeholderTextColor={COLORS.textMuted}
              value={decision}
              onChangeText={setDecision}
              textAlignVertical="top"
              editable={!loading}
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
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  decoratorLine: {
    width: 48,
    height: 3,
    backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.md,
  },
  formCard: {
    padding: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  textInput: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  simulateBtn: {
    marginTop: SPACING.sm,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  shortcutBtn: {
    flex: 1,
    height: 44,
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
