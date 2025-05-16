import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getRandomEmoji = () => {
  const emojis = ['👋', '😊', '🙌', '🎉', '🌟', '🚀'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export const GreetingHeader = ({ firstName }: { firstName: string | null | undefined }) => {
  const { colors } = useTheme();

  if (!firstName) return null;

  return (
    <Text style={[styles.greeting, { color: colors.text }]}>
      {getGreeting()}, {firstName} {getRandomEmoji()}
    </Text>
  );
};

const styles = {
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 4,
    opacity: 0.8,
  },
};