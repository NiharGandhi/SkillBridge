import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Entypo from '@expo/vector-icons/Entypo';
import { Database } from '../../types/supabase';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CourseCard } from '../../components/screens/CourseCard';
import { Button } from '../../components/ui/Button';

type Course = Database['public']['Tables']['courses']['Row'] & {
  progress?: {
    progress_percentage: number;
    status: string;
  } | null;
};

const CATEGORIES = [
  'All',
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Data Science',
  'Personal Development'
];

const SKILL_LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export default function LearnScreen() {
  const { colors } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
    if (searchQuery.trim() !== '') {
      setHasSearched(true);
    } else {
      setHasSearched(false);
    }
  }, [searchQuery, selectedCategory, selectedLevel, courses]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          progress!fk_course_id (
          progress_percentage,
          last_module_completed,
          status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(course =>
        course.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by skill level
    if (selectedLevel !== 'All Levels') {
      filtered = filtered.filter(course =>
        course.skill_level.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
  };

  const handleCoursePress = (id: string) => {
    router.push(`/course/${id}`);
  };

  const handleCreateCourse = () => {
    router.push('/create-course');
  };

  const handleCreateAICourse = () => {
    router.push({
      pathname: '/create-ai-course',
      params: { topic: searchQuery }
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All Levels');
    await fetchCourses();
    setRefreshing(false);
  };

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        {
          borderColor: colors.border,
          backgroundColor: colors.card
        },
        selectedCategory === item && {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        }
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryText,
          { color: colors.text },
          selectedCategory === item && {
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSkillLevelItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.skillLevelItem,
        {
          borderColor: colors.border,
          backgroundColor: colors.card
        },
        selectedLevel === item && {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        }
      ]}
      onPress={() => setSelectedLevel(item)}
    >
      <Text
        style={[
          styles.skillLevelText,
          { color: colors.text },
          selectedLevel === item && {
            color: colors.primary,
            fontFamily: 'Inter-SemiBold'
          }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSkeletonItem = () => (
    <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonThumbnail, { backgroundColor: colors.border }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonMeta, { backgroundColor: colors.border }]} />
        <View style={[styles.skeletonMeta, { width: '40%', backgroundColor: colors.border }]} />
      </View>
    </View>
  );

  const renderEmptyList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          {[1, 2, 3, 4].map((item) => (
            <React.Fragment key={item}>
              {renderSkeletonItem()}
            </React.Fragment>
          ))}
        </View>
      );
    }
    
    if (hasSearched && filteredCourses.length === 0) {
      // Show "No courses found" with AI suggestion
      return (
        <View style={styles.emptySearchContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="search" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No courses found for "{searchQuery}"
          </Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Why not create this course yourself or let AI help you build it?
          </Text>
          <View style={styles.emptyActions}>
            <Button
              title="Reset Search"
              variant="outline"
              onPress={onRefresh}
              style={{ ...styles.emptyButton, borderColor: colors.border }}
              textStyle={{ color: colors.text }}
            />
            <Button
              title="Create with AI"
              onPress={handleCreateAICourse}
              icon={<Ionicons name="flash" size={18} color="white" />}
              iconPosition="left"
              style={styles.emptyButton}
            />
          </View>
        </View>
      );
    }

    if (courses.length === 0) {
      // Show "No courses available" encouragement
      return (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="compass" size={50} color={colors.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            Start Your Learning Journey
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.subtext }]}>
            Discover exciting courses that will expand your knowledge and skills. New content is being added regularly!
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Entypo name="open-book" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Learn New Skills
          </Text>
        </View>
        <TouchableOpacity>
          <AntDesign name="filter" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          }
        ]}
      >
        <AntDesign name="search1" size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search courses..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
        <FlatList
          horizontal
          data={SKILL_LEVELS}
          renderItem={renderSkillLevelItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.skillLevelList}
        />
      </View>

      {filteredCourses.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyList}
        />
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={({ item }) => (
            <CourseCard
              id={item.id}
              title={item.title}
              category={item.category}
              skillLevel={item.skill_level}
              duration={item.duration_minutes}
              thumbnail={item.thumbnail_url}
              progress={item.progress?.progress_percentage}
              onPress={handleCoursePress}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.courseList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  filters: {
    marginBottom: 16,
    gap: 2,
  },
  categoryList: {
    paddingBottom: 12,
  },
  skillLevelList: {
    paddingBottom: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  skillLevelItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  skillLevelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  courseList: {
    paddingBottom: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
  },
  // Enhanced empty state when no courses available
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    fontFamily: 'Inter-Medium',
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
  },
  // Empty search state with AI suggestion
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
    paddingHorizontal: 16,
  },
  emptyButton: {
    flex: 1,
  },
  // Skeleton loading
  loadingContainer: {
    flex: 1,
    paddingTop: 8,
  },
  skeletonCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
  },
  skeletonThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  skeletonTitle: {
    height: 18,
    borderRadius: 4,
    width: '80%',
  },
  skeletonMeta: {
    height: 12,
    borderRadius: 4,
    width: '60%',
  },
});