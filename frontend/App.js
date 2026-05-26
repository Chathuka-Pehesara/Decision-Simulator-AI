// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CompareScreen from './src/screens/CompareScreen';

// Theme Spacing & Colors
import { COLORS } from './src/styles/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
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
