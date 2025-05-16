import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const HomeSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View>
          <View style={[styles.greeting, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.subtitle, { backgroundColor: colors.skeleton }]} />
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
      </View>

      {/* Search Bar Skeleton */}
      <View style={[styles.searchBar, { backgroundColor: colors.skeleton }]} />

      {/* Courses Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionTitle, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.seeAll, { backgroundColor: colors.skeleton }]} />
        </View>
        <View style={[styles.courseCard, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.courseCard, { backgroundColor: colors.skeleton }]} />
      </View>

      {/* Opportunities Section Skeleton */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionTitle, { backgroundColor: colors.skeleton }]} />
          <View style={[styles.seeAll, { backgroundColor: colors.skeleton }]} />
        </View>
        <View style={[styles.opportunityCard, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.opportunityCard, { backgroundColor: colors.skeleton }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    height: 32,
    width: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  subtitle: {
    height: 16,
    width: 150,
    borderRadius: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  searchBar: {
    height: 48,
    borderRadius: 12,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    height: 24,
    width: 150,
    borderRadius: 8,
  },
  seeAll: {
    height: 20,
    width: 60,
    borderRadius: 8,
  },
  courseCard: {
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  opportunityCard: {
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
});