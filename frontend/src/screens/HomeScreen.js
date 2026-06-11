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
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { simulateDecision, getSocraticQuestions, transcribeAudio } from '../services/api';
import { saveSimulation } from '../services/storage';
import { useTheme } from '../context/ThemeContext';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Dot-Dash Glowing Separator Line
const DotDashSeparator = ({ theme }) => (
  <View style={styles.dotDashContainer}>
    <View style={[styles.dashLine, { backgroundColor: theme.colors.border }]} />
    <View style={[styles.dot, { backgroundColor: theme.colors.accentBlue, shadowColor: theme.colors.accentBlue }]} />
    <View style={[styles.dashLine, { backgroundColor: theme.colors.border }]} />
  </View>
);

// Vector SVG Icon for Simulation History (Amber Folder/Clock)
const HistoryIcon = ({ theme }) => (
  <View style={styles.iconContainer}>
    {Platform.OS === 'web' ? (
      <div dangerouslySetInnerHTML={{__html: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${theme.colors.riskMedium}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      `}} style={{display: 'flex', alignItems: 'center'}} />
    ) : (
      <View style={[styles.fallbackIcon, { borderColor: theme.colors.riskMedium }]} />
    )}
  </View>
);

// Vector SVG Icon for Compare Scenarios (Magenta Analytics Chart)
const CompareIcon = ({ theme }) => (
  <View style={styles.iconContainer}>
    {Platform.OS === 'web' ? (
      <div dangerouslySetInnerHTML={{__html: `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${theme.colors.riskHigh}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      `}} style={{display: 'flex', alignItems: 'center'}} />
    ) : (
      <View style={[styles.fallbackIcon, { borderColor: theme.colors.riskHigh }]} />
    )}
  </View>
);

export default function HomeScreen({ navigation, route }) {
  const { theme, themeName, setThemeName } = useTheme();
  
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

  // Voice Input Mode States
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Web recording refs
  const webMediaRecorderRef = useRef(null);
  const webAudioChunksRef = useRef([]);
  const webStreamRef = useRef(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      // Clean up web stream tracks if unmounting while listening
      if (Platform.OS === 'web' && webStreamRef.current) {
        webStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          Alert.alert(
            'Not Supported',
            'Your browser does not support audio recording. Please use a modern browser or a mobile device.'
          );
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        webStreamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        webMediaRecorderRef.current = mediaRecorder;
        webAudioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            webAudioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
          const uri = URL.createObjectURL(audioBlob);
          await processAndTranscribe(uri);
        };

        mediaRecorder.start();
        setIsListening(true);
        setRecordTime(0);

        recordingTimerRef.current = setInterval(() => {
          setRecordTime(prev => prev + 1);
        }, 1000);
        return;
      }

      // Mobile recording path
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Microphone permission is required to record your voice.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // We use built-in HIGH_QUALITY preset which abstracts configuration differences
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      setIsListening(true);
      setRecordTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn('[AUDIO RECORD ERROR]', err);
      Alert.alert(
        'Recording Error',
        'Could not start audio recording. Please verify your permissions.'
      );
    }
  };

  const stopRecording = async () => {
    if (Platform.OS === 'web') {
      setIsListening(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
        webMediaRecorderRef.current.stop();
      }

      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach(track => track.stop());
        webStreamRef.current = null;
      }
      return;
    }

    if (!recordingRef.current) return;

    setIsListening(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await processAndTranscribe(uri);
      }
    } catch (err) {
      console.warn('[STOP RECORD ERROR]', err);
      Alert.alert('Recording Error', 'Failed to stop and process audio recording.');
    }
  };

  const toggleSpeech = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const processAndTranscribe = async (uri) => {
    setIsTranscribing(true);
    setDecision('⚡ Transcribing voice using AI (Whisper)...');

    try {
      let base64Audio = '';

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();

        base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Mobile outputs m4a/aac by default
        base64Audio = `data:audio/m4a;base64,${base64}`;
      }

      if (base64Audio) {
        const res = await transcribeAudio(base64Audio);
        if (res && res.text) {
          setDecision(res.text);
        } else {
          setDecision('');
          Alert.alert('Transcription Failed', 'No text was returned from the transcription service.');
        }
      }
    } catch (err) {
      console.error('[TRANSCRIBE ERROR]', err);
      setDecision('');
      Alert.alert('Transcription Failed', 'Encountered an issue communicating with Whisper API.');
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    // Listen for reframed decisions from ResultScreen
    if (route.params?.reframedDecision) {
      setDecision(route.params.reframedDecision);
      navigation.setParams({ reframedDecision: undefined });
    }
  }, [route.params?.reframedDecision]);

  useEffect(() => {
    // Mount animations
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
    { label: 'Analytical Focus', value: 'analytical' },
    { label: 'Emotional Focus', value: 'emotional' },
    { label: 'Balanced Lens', value: 'balanced' },
    { label: 'Risk-taker Lens', value: 'risk-taker' },
  ];

  const themeOptions = [
    { label: 'Sci-Fi Simulation (Default)', value: 'sci-fi' },
    { label: 'Minimal Clean White', value: 'minimal' },
    { label: 'Zinc Focus Mode', value: 'focus' },
    { label: 'High Contrast Access', value: 'accessibility' },
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
      const savedRecord = await saveSimulation(queryText, result);
      
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

  // Dynamic WEB styles
  const WEB_STYLES = {
    formCard: {
      backdropFilter: 'blur(20px)',
      transition: 'all 0.4s ease-in-out',
    },
    formCardActive: {
      boxShadow: `0 0 30px ${theme.colors.accentBlue}1e`,
    },
    textInput: {
      transition: 'all 0.3s ease-in-out',
    },
    textInputFocused: {
      boxShadow: `inset 0 0 20px ${theme.colors.accentBlue}14, 0 0 10px ${theme.colors.accentBlue}0d`,
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

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
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
              <Text style={[
                styles.title, 
                theme.typography.h1,
                Platform.OS === 'web' && themeName === 'sci-fi' && { animation: 'bioluminescentPulse 4s infinite ease-in-out' }
              ]}>
                Decision Simulator AI
              </Text>
              <Text style={[styles.subtitle, theme.typography.body]}>
                Analyze potential pathways. Contrast probabilities. Map emotional impacts.
              </Text>
              <View style={styles.headerDotDash}>
                <DotDashSeparator theme={theme} />
              </View>
            </View>

            {/* Input Card Container */}
            <Card 
              style={[
                styles.formCard, 
                isFocused && styles.formCardActive,
                Platform.OS === 'web' && WEB_STYLES.formCard,
                Platform.OS === 'web' && isFocused && WEB_STYLES.formCardActive,
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: themeName === 'accessibility' ? '#000000' : themeName === 'minimal' ? '#ffffff' : 'rgba(0, 229, 255, 0.03)'
                }
              ]} 
              outlined 
              shadowed={false}
            >
              
              {/* Laser Scanning Sweep Line */}
              {isFocused && themeName === 'sci-fi' && (
                <Animated.View 
                  style={[
                    styles.scanline,
                    {
                      backgroundColor: theme.colors.accentBlue,
                      shadowColor: theme.colors.accentBlue,
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
                  <Text style={[styles.socraticHeader, { color: theme.colors.accentBlue, fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron' }]}>
                    🧠 SOCRATIC COGNITIVE CHALLENGE
                  </Text>
                  <Text style={[styles.socraticSub, { color: theme.colors.textMuted }]}>
                    Refine unstated parameters and cognitive assumptions.
                  </Text>
                  <DotDashSeparator theme={theme} />
                  
                  <Text style={[styles.socraticProgress, { color: theme.colors.accentViolet, fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron' }]}>
                    QUESTION {currentQuestionIndex + 1} OF {socraticQuestions.length}
                  </Text>
                  
                  <Text style={[styles.socraticQuestionText, { color: theme.colors.textPrimary }]}>
                    {socraticQuestions[currentQuestionIndex]}
                  </Text>
                  
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.socraticInput,
                      {
                        borderColor: theme.colors.border,
                        backgroundColor: themeName === 'accessibility' ? '#000000' : 'rgba(3, 5, 13, 0.6)',
                        color: theme.colors.textPrimary,
                        fontSize: themeName === 'accessibility' ? 16 : 14,
                        borderWidth: themeName === 'accessibility' ? 2 : 1,
                      }
                    ]}
                    multiline
                    numberOfLines={3}
                    placeholder="Type your response here..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={socraticAnswers[currentQuestionIndex] || ''}
                    onChangeText={(text) => setSocraticAnswers({ ...socraticAnswers, [currentQuestionIndex]: text })}
                    textAlignVertical="top"
                    editable={!loading}
                  />
                  
                  <View style={styles.socraticBtnRow}>
                    <TouchableOpacity
                      style={[styles.socraticBackBtn, { borderColor: theme.colors.riskHigh, backgroundColor: theme.colors.riskHighBg }]}
                      onPress={handleSocraticBack}
                      disabled={loading}
                    >
                      <Text style={[styles.socraticBackBtnText, { color: theme.colors.riskHigh }]}>BACK</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.socraticNextBtn, { backgroundColor: theme.colors.accentBlue, shadowColor: theme.colors.accentBlue }]}
                      onPress={handleSocraticNext}
                      disabled={loading}
                    >
                      <Text style={[styles.socraticNextBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
                        {currentQuestionIndex === socraticQuestions.length - 1 ? (loading ? 'ANALYZING...' : 'SIMULATE FUTURES') : 'NEXT'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs }}>
                    <Text style={[
                      styles.inputLabel,
                      {
                        color: theme.colors.textSecondary,
                        fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
                        fontWeight: themeName === 'accessibility' ? '900' : '800',
                      }
                    ]}>
                      Describe Your Decision
                    </Text>
                    
                    {/* Voice Input Trigger Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={toggleSpeech}
                      disabled={isTranscribing}
                      style={[
                        styles.voiceBtn,
                        {
                          borderColor: isListening ? theme.colors.riskHigh : isTranscribing ? theme.colors.accentViolet : theme.colors.border,
                          backgroundColor: isListening ? theme.colors.riskHighBg : isTranscribing ? theme.colors.surface : theme.colors.surface,
                          borderWidth: themeName === 'accessibility' ? 2 : 1,
                        }
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {isListening && <View style={[styles.pulseCircle, { backgroundColor: theme.colors.riskHigh }]} />}
                        {isTranscribing && <View style={[styles.pulseCircle, { backgroundColor: theme.colors.accentViolet }]} />}
                        <Text style={[
                          styles.voiceBtnText,
                          {
                            color: isListening ? theme.colors.riskHigh : isTranscribing ? theme.colors.accentViolet : theme.colors.textPrimary,
                            fontWeight: themeName === 'accessibility' ? 'bold' : '600',
                          }
                        ]}>
                          {isListening ? `🔴 STOP (${formatTime(recordTime)})` : isTranscribing ? '⏳ TRANSCRIBING...' : '🎙️ SPEAK DILEMMA'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <DotDashSeparator theme={theme} />
                  
                  <TextInput
                    style={[
                      styles.textInput, 
                      isFocused && styles.textInputFocused,
                      Platform.OS === 'web' && WEB_STYLES.textInput,
                      Platform.OS === 'web' && isFocused && WEB_STYLES.textInputFocused,
                      {
                        borderColor: isFocused ? theme.colors.accentBlue : theme.colors.border,
                        backgroundColor: themeName === 'accessibility' ? '#000000' : 'rgba(3, 5, 13, 0.6)',
                        color: theme.colors.textPrimary,
                        fontSize: themeName === 'accessibility' ? 16 : 14,
                        borderWidth: themeName === 'accessibility' ? 2 : 1,
                      }
                    ]}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g., Should I accept the senior software engineer offer at the startup, or stay in my stable corporate role?"
                    placeholderTextColor={theme.colors.textMuted}
                    value={decision}
                    onChangeText={setDecision}
                    textAlignVertical="top"
                    editable={!loading && !isListening && !isTranscribing}
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

                  {/* Adaptive Theme Picker */}
                  <Dropdown
                    label="Visual Theme"
                    placeholder="Select theme..."
                    selectedValue={themeName}
                    onValueChange={setThemeName}
                    options={themeOptions}
                  />

                  {/* Socratic Toggle Switch */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSocraticMode(!socraticMode)}
                    style={styles.socraticToggle}
                  >
                    <View style={[
                      styles.checkbox, 
                      { 
                        borderColor: socraticMode ? theme.colors.accentBlue : theme.colors.border,
                        backgroundColor: themeName === 'accessibility' ? '#000000' : 'rgba(3, 5, 13, 0.6)',
                        borderWidth: themeName === 'accessibility' ? 2 : 1.5,
                      },
                      socraticMode && styles.checkboxChecked && { backgroundColor: theme.colors.accentBlueLight }
                    ]}>
                      {socraticMode && (
                        <View style={[
                          styles.checkboxInner, 
                          { 
                            backgroundColor: theme.colors.accentBlue,
                            shadowColor: theme.colors.accentBlue,
                          }
                        ]} />
                      )}
                    </View>
                    <Text style={[
                      styles.socraticToggleText, 
                      { 
                        color: theme.colors.accentBlue,
                        fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
                        fontWeight: themeName === 'accessibility' ? 'bold' : '700',
                      }
                    ]}>
                      Activate Socratic Pre-Analysis Mode
                    </Text>
                  </TouchableOpacity>

                  {/* Simulated Button */}
                  <TouchableOpacity
                    activeOpacity={0.855}
                    onPress={handleSimulate}
                    disabled={loading || isListening || isTranscribing}
                    style={[
                      styles.simulateBtnContainer,
                      Platform.OS === 'web' && WEB_STYLES.simulateBtnContainer,
                      Platform.OS === 'web' && themeName === 'sci-fi' && {
                        background: 'linear-gradient(-45deg, #00e5ff, #a855f7, #00e5ff, #a855f7)',
                        backgroundSize: '400% 400%',
                        animation: 'btnGradientSweep 6s infinite ease',
                      },
                      {
                        backgroundColor: theme.colors.accentBlue,
                        shadowColor: theme.colors.accentBlue,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.simulateBtnText,
                      { 
                        color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF',
                        fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
                        fontWeight: themeName === 'accessibility' ? '900' : '700',
                      }
                    ]}>
                      {loading ? 'ANALYZING THREADS...' : 'SIMULATE FUTURES'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>

            {/* Bottom Navigation Buttons */}
            <View style={styles.shortcutRow}>
              {/* History Button (Amber Tinted) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('History')}
                style={[
                  styles.historyBtn,
                  Platform.OS === 'web' && WEB_STYLES.historyBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: themeName === 'accessibility' ? 2 : 1.5,
                  }
                ]}
              >
                <HistoryIcon theme={theme} />
                <Text style={[styles.historyBtnText, { color: theme.colors.riskMedium, fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron' }]}>
                  Simulation History
                </Text>
              </TouchableOpacity>

              {/* Compare Button (Magenta/Risk High Tinted) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Compare')}
                style={[
                  styles.compareBtn,
                  Platform.OS === 'web' && WEB_STYLES.compareBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: themeName === 'accessibility' ? 2 : 1.5,
                  }
                ]}
              >
                <CompareIcon theme={theme} />
                <Text style={[styles.compareBtnText, { color: theme.colors.riskHigh, fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron' }]}>
                  Compare Scenarios
                </Text>
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
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: 8,
    lineHeight: 22,
  },
  headerDotDash: {
    marginTop: SPACING.sm,
  },
  formCard: {
    padding: SPACING.lg,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  formCardActive: {},
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    zIndex: 10,
    pointerEvents: 'none',
  },
  inputLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  voiceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voiceBtnText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
  },
  textInput: {
    fontFamily: 'IBM Plex Mono',
    minHeight: 115,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: '#F8FAFC',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  textInputFocused: {},
  simulateBtnContainer: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 15,
    elevation: 6,
  },
  simulateBtnText: {
    fontSize: 14,
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
    borderRadius: BORDER_RADIUS.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    borderRadius: BORDER_RADIUS.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  compareBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    width: 25,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
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
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {},
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 1,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  socraticToggleText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  socraticHeader: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socraticSub: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  socraticProgress: {
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  socraticQuestionText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socraticBackBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  socraticNextBtn: {
    flex: 2,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  socraticNextBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
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
