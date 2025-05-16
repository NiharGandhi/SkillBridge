import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

interface CourseCardProps {
  id: string;
  title: string;
  category: string;
  skillLevel: string;
  duration: number;
  thumbnail?: string | null;
  progress?: number;
  onPress?: (id: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  category,
  skillLevel,
  duration,
  thumbnail,
  progress,
  onPress,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    } else {
      router.push(`/course/${id}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
    >
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={[styles.category, { color: colors.primary }]}>
          {category}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={[styles.metaText, { color: colors.subtext }]}>
            {skillLevel}
          </Text>
          <Text style={[styles.metaText, { color: colors.subtext }]}>
            {duration} min
          </Text>
        </View>
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress}%`, backgroundColor: colors.primary },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {progress}% complete
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
  },
});