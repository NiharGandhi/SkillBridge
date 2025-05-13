import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AntDesign from '@expo/vector-icons/AntDesign';
import { Database } from '../../types/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { CourseCard } from '../../components/screens/CourseCard';
import { Avatar } from '../../components/ui/Avatar';
import { OpportunityCard } from '../../components/screens/OpportunityCard';


type SearchResultItem =
  | Database['public']['Tables']['courses']['Row']
  | Database['public']['Tables']['opportunities']['Row']
  | Database['public']['Tables']['profiles']['Row'];

type SearchResult = {
  type: 'course' | 'opportunity' | 'profile';
  data: any;
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'opportunities' | 'profiles'>('all');

  const searchAll = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .textSearch('title_description', `${query}`, {
          type: 'plain',
          config: 'english'
        })
        .limit(5);

      // Search opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*, company:companies(name, logo_url)')
        .textSearch('title_description', `${query}`, {
          type: 'plain',
          config: 'english'
        })
        .limit(5);

      // Search profiles (students)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .textSearch('name_skills', `${query}`, {
          type: 'plain',
          config: 'english'
        })
        .eq('role', 'student')
        .limit(5);

      const combinedResults: SearchResult[] = [
        ...(courses?.map(c => ({ type: 'course' as const, data: c })) || []),
        ...(opportunities?.map(o => ({ type: 'opportunity' as const, data: o })) || []),
        ...(profiles?.map(p => ({ type: 'profile' as const, data: p })) || [])
      ];

      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByType = async (query: string, type: 'courses' | 'opportunities' | 'profiles') => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      let results: SearchResult[] = [];

      switch (type) {
        case 'courses':
          const { data: courses } = await supabase
            .from('courses')
            .select('*')
            .textSearch('title_description', `${query}`, {
              type: 'plain',
              config: 'english'
            })
            .limit(10);
          results = courses?.map(c => ({ type: 'course' as const, data: c })) || [];
          break;

        case 'opportunities':
          const { data: opportunities } = await supabase
            .from('opportunities')
            .select('*, company:companies(name, logo_url)')
            .textSearch('title_description', `${query}`, {
              type: 'plain',
              config: 'english'
            })
            .limit(10);
          results = opportunities?.map(o => ({ type: 'opportunity' as const, data: o })) || [];
          break;

        case 'profiles':
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .textSearch('name_skills', `${query}`, {
              type: 'plain',
              config: 'english'
            })
            .eq('role', 'student')
            .limit(10);
          results = profiles?.map(p => ({ type: 'profile' as const, data: p })) || [];
          break;
      }

      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'all') {
        searchAll(searchQuery);
      } else {
        searchByType(searchQuery, activeTab);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  const renderItem = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case 'course':
        return (
          <View style={styles.cardContainer}>
            <CourseCard
              id={item.data.id}
              title={item.data.title}
              category={item.data.category}
              skillLevel={item.data.skill_level}
              duration={item.data.duration_minutes}
              thumbnail={item.data.thumbnail_url}
              onPress={() => router.push(`/course/${item.data.id}`)}
            />
          </View>
        );
      case 'opportunity':
        return (
          <View style={styles.cardContainer}>
            <OpportunityCard
              id={item.data.id}
              title={item.data.title}
              companyName={item.data.company?.name || 'Unknown Company'}
              companyLogo={item.data.company?.logo_url || null}
              location={item.data.location}
              type={item.data.type}
              deadline={item.data.application_deadline}
              skillsRequired={item.data.skills_required}
              remote={item.data.remote}
              onPress={() => router.push(`/opportunity/${item.data.id}`)}
            />
          </View>
        );
      case 'profile':
        return (
          <TouchableOpacity
            style={[styles.profileCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/profile/${item.data.id}`)}
          >
            <Avatar
              uri={item.data.avatar_url}
              initials={`${item.data.first_name?.charAt(0)}${item.data.last_name?.charAt(0)}`}
              size={56}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {item.data.first_name} {item.data.last_name}
              </Text>
              <Text style={[styles.profileTitle, { color: colors.subtext }]}>
                {item.data.title || 'SkillBridge User'}
              </Text>
              {item.data.skills?.length > 0 && (
                <View style={styles.skillsContainer}>
                  {item.data.skills.slice(0, 3).map((skill: string, index: number) => (
                    <View key={index} style={[styles.skillTag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                    </View>
                  ))}
                  {item.data.skills.length > 3 && (
                    <View style={[styles.skillTag, { backgroundColor: colors.border }]}>
                      <Text style={[styles.skillText, { color: colors.subtext }]}>
                        +{item.data.skills.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign name="arrowleft" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
            <AntDesign name="search1" size={20} color={colors.subtext} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search courses, opportunities, or people..."
              placeholderTextColor={colors.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          {(['all', 'courses', 'opportunities', 'profiles'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: colors.text },
                activeTab === tab && {
                  color: colors.primary,
                  fontFamily: 'Inter-SemiBold'
                }
              ]}>
                {tab === 'all' ? 'All' :
                  tab === 'profiles' ? 'People' :
                    tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
          contentContainerStyle={styles.resultsContainer}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          showsVerticalScrollIndicator={false}
        />
      ) : searchQuery ? (
        <View style={styles.emptyContainer}>
          <AntDesign name="search1" size={48} color={colors.subtext} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
            Try different keywords or check your spelling
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <AntDesign name="search1" size={48} color={colors.subtext} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Search for courses, opportunities, or people
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
            Find exactly what you're looking for
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 2,
  },
  profileTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  skillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  resultsContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
});
