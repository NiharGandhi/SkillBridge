import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const CourseSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.thumbnail, { backgroundColor: colors.skeleton }]} />
      <View style={styles.info}>
        <View style={[styles.title, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.description, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.progressBar, { backgroundColor: colors.skeleton }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.skeleton, opacity: 0.5 }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  info: {
    padding: 12,
  },
  title: {
    height: 20,
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  description: {
    height: 36,
    width: '100%',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    width: '50%',
    borderRadius: 3,
  },
});