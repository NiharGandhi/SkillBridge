import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define theme colors
const lightTheme = {
  background: '#FFFFFF',
  card: '#F2F2F7',
  primary: '#0000FF',
  secondary: '#5E5CE6',
  accent: '#30D158',
  text: '#000000',
  subtext: '#3C3C43',
  border: '#C6C6C8',
  notification: '#FF9500',
  success: '#34C759',
  warning: '#FF453A',
  error: '#FF3B30',
  highlight: '#007AFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  filter: '#30D158',
  skeleton: '#e1e1e1', // light gray for light mode
};

const darkTheme = {
  background: '#121212', // Darker background for better contrast
  card: '#1E1E1E',
  primary: '#BB86FC', // More visible primary color in dark mode
  secondary: '#03DAC6',
  accent: '#CF6679',
  text: '#E1E1E1', // Brighter text
  subtext: '#A0A0A0',
  border: '#383838',
  notification: '#FFAB00',
  success: '#00C853',
  warning: '#FF6D00',
  error: '#D32F2F',
  highlight: '#3700B3',
  shadow: 'rgba(0, 0, 0, 0.8)',
  filter: '#BB86FC', // Using primary color for filters,
  skeleton: '#333333', // dark gray for dark mode
};

// Create theme context
type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightTheme,
  toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get device color scheme
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  // Update theme if device color scheme changes
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  // Toggle theme manually
  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Get current theme colors
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};