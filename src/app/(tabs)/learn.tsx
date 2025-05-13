import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Entypo from '@expo/vector-icons/Entypo';
import { Database } from '../../types/supabase';
import AntDesign from '@expo/vector-icons/AntDesign';
import { CourseCard } from '../../components/screens/CourseCard';


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

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
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
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No courses found matching your criteria.
          </Text>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
});