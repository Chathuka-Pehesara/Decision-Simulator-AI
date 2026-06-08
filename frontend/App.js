// App.js
import React, { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CompareScreen from './src/screens/CompareScreen';

// Theme Spacing & Colors
import { COLORS } from './src/styles/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Orbitron': Orbitron_700Bold,
    'IBM Plex Mono': IBMPlexMono_400Regular,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      // 1. Inject Sci-Fi Google Fonts Link
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@400;500;700&display=swap';
      document.head.appendChild(fontLink);

      // 2. Inject CSS animations, custom fonts declarations, starfields, and grid designs
      const customStyle = document.createElement('style');
      customStyle.type = 'text/css';
      customStyle.appendChild(document.createTextNode(`
        /* Font assignments */
        input, textarea, select, button, .mono-font, div, span, p, a {
          font-family: 'IBM Plex Mono', monospace !important;
        }
        h1, h2, h3, label, .orbitron-font {
          font-family: 'Orbitron', sans-serif !important;
          letter-spacing: 0.12em !important;
        }

        /* Starfield / Radial cosmic matter / Grid pattern + Noise Grain */
        body {
          background-color: #020408 !important;
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.07) 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
            linear-gradient(rgba(0, 229, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.015) 1px, transparent 1px),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          background-size: 100% 100%, 100% 100%, 25px 25px, 25px 25px, auto;
          background-attachment: fixed;
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* 1px diagonal sweeping radar line */
        @keyframes radarSweep {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { top: 120%; opacity: 0; }
        }
        .radar-active::after {
          content: "";
          position: fixed;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.35), transparent);
          box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
          animation: radarSweep 4s infinite linear;
          pointer-events: none;
          z-index: 999;
        }

        /* Glowing text elements pulse */
        @keyframes bioluminescentPulse {
          0% { text-shadow: 0 0 5px rgba(0, 229, 255, 0.3); }
          50% { text-shadow: 0 0 15px rgba(0, 229, 255, 0.7), 0 0 2px #00e5ff; }
          100% { text-shadow: 0 0 5px rgba(0, 229, 255, 0.3); }
        }

        .sci-fi-pulse {
          animation: bioluminescentPulse 3s infinite ease-in-out;
        }

        /* Typewriter typing animation */
        @keyframes typewriterAnim {
          from { width: 0; }
          to { width: 100%; }
        }
        .typewriter-active {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #00e5ff;
          animation: typewriterAnim 1.2s steps(22, end) forwards, blinkCaret 0.75s step-end infinite;
        }
        @keyframes blinkCaret {
          from, to { border-color: transparent }
          50% { border-color: #00e5ff; }
        }

        /* Teal and Amber ripple breathe pulses */
        @keyframes tealBreathing {
          0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.3); }
          70% { box-shadow: 0 0 0 8px rgba(0, 229, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
        }
        @keyframes amberBreathing {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.3); }
          70% { box-shadow: 0 0 0 8px rgba(251, 191, 36, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        .teal-pulse { animation: tealBreathing 2s infinite ease-in-out; }
        .amber-pulse { animation: amberBreathing 2s infinite ease-in-out; }

        /* Liquid Wave Probability Fill */
        @keyframes liquidWaveAnim {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .liquid-wave {
          position: absolute;
          left: -50%;
          width: 200%;
          height: 200%;
          background: rgba(3, 5, 13, 0.9);
          border-radius: 40%;
          animation: liquidWaveAnim 8s infinite linear;
          transition: bottom 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Classified Diagonal Striped Frame */
        .classified-stripes {
          background: 
            repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.03) 0px, rgba(245, 158, 11, 0.03) 4px, transparent 4px, transparent 8px),
            rgba(245, 158, 11, 0.01) !important;
        }

        /* Gradient sweeps keyframes */
        @keyframes btnGradientSweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Scanning sweep element on input cards */
        @keyframes scannerLine {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }

        .scanning-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00e5ff, transparent);
          box-shadow: 0 0 8px #00e5ff;
          animation: scannerLine 3s infinite linear;
          pointer-events: none;
          z-index: 10;
        }
      `));
      document.head.appendChild(customStyle);
      document.body.classList.add('radar-active');
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#03050d', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerShadowVisible: false, // Standard premium border instead of heavy shadow
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 16,
            color: COLORS.textPrimary,
          },
          headerTintColor: COLORS.accentBlue, // Tint color for back buttons
          headerBackTitleVisible: false,      // Clean back arrow only
          contentStyle: {
            backgroundColor: COLORS.background, // Maintain consistent background across all screens
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false, // Custom elegant branding header inside screen itself
          }} 
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen} 
          options={{ 
            title: 'Simulation Report',
          }} 
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen} 
          options={{ 
            title: 'Simulation History',
          }} 
        />
        <Stack.Screen 
          name="Compare" 
          component={CompareScreen} 
          options={{ 
            title: 'Decision Comparer',
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
