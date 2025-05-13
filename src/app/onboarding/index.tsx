import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../../context/AuthContext';

export default function OnboardingRouter() {
  const { colors } = useTheme();
  const { user } = useAuth();
  

  useEffect(() => {
    if (user?.role === 'student') {
      router.replace('/onboarding/student');
    } else if (user?.role === 'employer') {
      router.replace('/onboarding/employer');
    }
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>Loading your personalized onboarding...</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});