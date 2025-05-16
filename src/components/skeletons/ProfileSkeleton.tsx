import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export const ProfileSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={[styles.title, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.icon, { backgroundColor: colors.skeleton }]} />
      </View>

      {/* Profile Card Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
          <View style={styles.profileInfo}>
            <View style={[styles.textLg, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.textSm, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.badge, { backgroundColor: colors.skeleton }]} />
          </View>
        </View>
        <View style={[styles.bio, { backgroundColor: colors.skeleton }]} />
        <View style={[styles.button, { backgroundColor: colors.skeleton }]} />

        {/* Stats Skeleton */}
        <View style={styles.stats}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.skeleton }]} />
              <View style={[styles.statValue, { backgroundColor: colors.skeleton }]} />
              <View style={[styles.statLabel, { backgroundColor: colors.skeleton }]} />
            </View>
          ))}
        </View>
      </View>

      {/* Section Skeletons */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionTitle, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.sectionIcon, { backgroundColor: colors.skeleton }]} />
          </View>
          <View style={styles.sectionContent}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.emptyText, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.emptyButton, { backgroundColor: colors.skeleton }]} />
          </View>
        </View>
      ))}
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
  title: {
    height: 32,
    width: 180,
    borderRadius: 8,
  },
  icon: {
    height: 24,
    width: 24,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  textLg: {
    height: 28,
    width: '70%',
    borderRadius: 4,
    marginBottom: 8,
  },
  textSm: {
    height: 16,
    width: '50%',
    borderRadius: 4,
    marginBottom: 12,
  },
  badge: {
    height: 24,
    width: 80,
    borderRadius: 12,
  },
  bio: {
    height: 66,
    width: '100%',
    borderRadius: 4,
    marginBottom: 20,
  },
  button: {
    height: 44,
    width: '100%',
    borderRadius: 8,
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 8,
  },
  statValue: {
    height: 20,
    width: 30,
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabel: {
    height: 12,
    width: 60,
    borderRadius: 4,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    height: 24,
    width: 150,
    borderRadius: 4,
  },
  sectionIcon: {
    height: 20,
    width: 20,
    borderRadius: 10,
  },
  sectionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyText: {
    height: 40,
    width: '80%',
    borderRadius: 4,
    marginBottom: 16,
  },
  emptyButton: {
    height: 44,
    width: 200,
    borderRadius: 8,
  },
});