// src/context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { THEMES } from '../styles/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('sci-fi');

  useEffect(() => {
    // Load persisted theme
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme_name');
        if (saved && THEMES[saved]) {
          setThemeName(saved);
        }
      } catch (err) {
        console.warn('Failed to load theme:', err.message);
      }
    };
    loadTheme();
  }, []);

  const changeTheme = async (name) => {
    if (THEMES[name]) {
      setThemeName(name);
      try {
        await AsyncStorage.setItem('theme_name', name);
      } catch (err) {
        console.warn('Failed to save theme:', err.message);
      }
    }
  };

  const activeTheme = THEMES[themeName] || THEMES['sci-fi'];

  return (
    <ThemeContext.Provider value={{ themeName, theme: activeTheme, setThemeName: changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
