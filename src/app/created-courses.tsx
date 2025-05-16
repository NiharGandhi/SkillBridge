import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
};

export default function CreatedCoursesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, category, skill_level, duration_minutes')
        .eq('instructor_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCourses();
  };

  const handleEditCourse = (courseId: string) => {
    router.push(`/edit-course/${courseId}`);
  };

  const handleCreateCourse = () => {
    router.push('/create-course');
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <Card variant="elevated" style={{ ...styles.courseCard, backgroundColor: colors.card }}>
      <View style={styles.courseHeader}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="book" size={32} color={colors.primary} />
          </View>
        )}
        <View style={styles.courseInfo}>
          <Text style={[styles.courseTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.courseDesc, { color: colors.subtext }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.courseMeta}>
            <Text style={[styles.metaText, { color: colors.primary }]}>{item.category}</Text>
            <Text style={[styles.metaText, { color: colors.text }]}>
              {item.duration_minutes} min • {item.skill_level}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Edit" variant="outline" onPress={() => handleEditCourse(item.id)} style={styles.editButton} />
        <Button title="View" onPress={() => router.push(`/course/${item.id}`)} style={styles.viewButton} />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>My Created Courses</Text>
          <Button
            title="Create"
            onPress={handleCreateCourse}
            icon={<Ionicons name="add" size={20} color="white" />}
            iconPosition="left"
            style={styles.createBtn}
          />
        </View>

        {courses.length > 0 ? (
          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="sparkles" size={48} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Courses Yet</Text>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              Start your journey by sharing your knowledge with the world. Your first course could inspire someone!
            </Text>
            <Button
              title="Create Your First Course"
              onPress={handleCreateCourse}
              style={styles.createButton}
              icon={<Ionicons name="create-outline" size={20} color="white" />}
              iconPosition="left"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  createBtn: {
    marginLeft: 8,
  },
  courseCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseDesc: {
    fontSize: 14,
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  viewButton: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    opacity: 0.9,
  },
  createButton: {
    marginTop: 8,
  },
});
