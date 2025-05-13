import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Database } from '../../types/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui/Avatar';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { CourseCard } from '../../components/screens/CourseCard';
import { Card } from '../../components/ui/Card';
import { OpportunityCard } from '../../components/screens/OpportunityCard';

// Types
type Course = Database['public']['Tables']['courses']['Row'] & {
  progress?: {
    progress_percentage: number;
    status: string;
    last_module_completed: number;
  } | null;
};

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  company: {
    name: string;
    logo_url: string | null;
  } | null;
};

// Constants
const COURSE_LIMIT = 2;
const OPPORTUNITY_LIMIT = 5;

export default function HomeScreen() {
  // Hooks and state
  const { colors } = useTheme();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Data fetching functions
  const fetchCourses = async (userId: string) => {
    const { data, error } = await supabase
      .from('progress')
      .select(`
        progress_percentage,
        status,
        last_module_completed,
        courses!inner(
          id,
          created_at,
          title,
          description,
          category,
          skill_level,
          duration_minutes,
          thumbnail_url,
          is_ai_generated,
          instructor_id
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .limit(COURSE_LIMIT);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item.courses,
      progress: {
        progress_percentage: item.progress_percentage,
        status: item.status,
        last_module_completed: item.last_module_completed
      }
    }));
  };

  const fetchStudentOpportunities = async (userId: string) => {
    // Get student skills
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const studentSkills = profileData?.skills || [];

    // If no skills, return default opportunities
    if (studentSkills.length === 0) {
      return fetchDefaultOpportunities();
    }

    const { data, error } = await supabase
    .from('opportunities')
    .select('*, company:companies(name, logo_url)')
    .eq('status', 'active')
    .overlaps('skills_required', studentSkills)
    .limit(OPPORTUNITY_LIMIT);

  if (error) throw error;

  // Deduplicate opportunities by ID
  const uniqueOpportunities = Array.from(
    new Map(data?.map(opp => [opp.id, opp])).values()
  );

  // If not enough matches, supplement with default opportunities
  if (uniqueOpportunities && uniqueOpportunities.length < 2) {
    const defaultOpps = await fetchDefaultOpportunities();
    const allOpps = [...uniqueOpportunities, ...defaultOpps];
    // Deduplicate again after combining
    return Array.from(new Map(allOpps.map(opp => [opp.id, opp])).values())
      .slice(0, OPPORTUNITY_LIMIT);
  }

  return uniqueOpportunities || [];

  };

  const fetchEmployerOpportunities = async (userId: string) => {
    // Get company ID
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const companyId = profileData?.company_id;
    if (!companyId) return [];

    // Get company opportunities
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company:companies(name, logo_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(OPPORTUNITY_LIMIT);

    if (error) throw error;
    return data || [];
  };

  const fetchDefaultOpportunities = async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, company:companies(name, logo_url)')
      .eq('status', 'active')
      .limit(OPPORTUNITY_LIMIT);

    if (error) throw error;
    return data || [];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const [fetchedCourses, fetchedOpportunities] = await Promise.all([
        fetchCourses(user.id),
        user.role === 'student'
          ? fetchStudentOpportunities(user.id)
          : fetchEmployerOpportunities(user.id)
      ]);

      setCourses(fetchedCourses);
      setOpportunities(fetchedOpportunities);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hello, {user?.role === 'student' ? 'Student' : 'Employer'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Welcome back to SkillBridge
        </Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/profile')}>
        <Avatar size={40} uri={null} initials="JD" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <TouchableOpacity
      style={[
        styles.searchBar,
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
      onPress={() => router.push('/(tabs)/search')}
    >
      <AntDesign name="search1" size={20} color={colors.subtext} />
      <Text style={[styles.searchText, { color: colors.subtext }]}>
        Search for courses, opportunities, or skills
      </Text>
    </TouchableOpacity>
  );

  const renderCoursesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Entypo name="open-book" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Continue Learning
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/learn')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {courses.length > 0 ? (
        courses.map((course) => (
          <CourseCard
            key={course.id}
            id={course.id}
            title={course.title}
            category={course.category}
            skillLevel={course.skill_level}
            duration={course.duration_minutes}
            thumbnail={course.thumbnail_url}
            progress={course.progress?.progress_percentage || 0}
            onPress={() => router.push(`/course/${course.id}`)}
          />
        ))
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No courses in progress. Explore our courses to start learning!
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/learn')}
          >
            <Text style={styles.exploreButtonText}>Explore Courses</Text>
          </TouchableOpacity>
        </Card>
      )}
    </View>
  );

  const renderOpportunitiesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Entypo name="briefcase" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recommended For You
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/explore')}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {opportunities.length > 0 ? (
        opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            id={opportunity.id}
            title={opportunity.title}
            companyName={opportunity.company?.name || 'Unknown Company'}
            companyLogo={opportunity.company?.logo_url || null}
            location={opportunity.location}
            type={opportunity.type}
            deadline={opportunity.application_deadline}
            skillsRequired={opportunity.skills_required}
            remote={opportunity.remote}
            onPress={() => router.push(`/opportunity/${opportunity.id}`)}
          />
        ))
      ) : (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No opportunities available at the moment. Check back later!
          </Text>
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderCoursesSection()}
        {renderOpportunitiesSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  searchText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 8,
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginLeft: 8,
  },
  seeAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
  },
});