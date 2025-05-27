import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import AntDesign from '@expo/vector-icons/AntDesign';
import { Database } from '../../types/supabase';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { CourseCard } from '../../components/screens/CourseCard';
import { Avatar } from '../../components/ui/Avatar';
import { OpportunityCard } from '../../components/screens/OpportunityCard';

type SearchResultItem =
  | Database['public']['Tables']['courses']['Row']
  | Database['public']['Tables']['opportunities']['Row']
  | Database['public']['Tables']['profiles']['Row']
  | Database['public']['Tables']['companies']['Row'];

type SearchResult =
  | { type: 'course'; data: Database['public']['Tables']['courses']['Row'] }
  | { type: 'opportunity'; data: Database['public']['Tables']['opportunities']['Row'] & { company: { name: string; logo_url: string | null } } }
  | { type: 'profile'; data: Database['public']['Tables']['profiles']['Row'] }
  | { type: 'company'; data: Database['public']['Tables']['companies']['Row'] };

type ActiveTab = 'all' | 'courses' | 'opportunities' | 'profiles' | 'companies';

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingFromSuggestion, setIsSearchingFromSuggestion] = useState(false);

  // Core search functions
  const searchAll = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Enhanced profile search that handles full names better
      const profileSearchTerms = query.trim().split(' ');
      let profileQuery = '';

      if (profileSearchTerms.length === 1) {
        // Single term - search in both first and last name
        profileQuery = `first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
      } else if (profileSearchTerms.length >= 2) {
        // Multiple terms - try to match first and last name combinations
        const [firstName, ...lastNameParts] = profileSearchTerms;
        const lastName = lastNameParts.join(' ');
        profileQuery = `first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
      }

      const [
        { data: courses },
        { data: opportunities },
        { data: companies },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('courses').select('*').or(`title.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
        supabase.from('opportunities').select('*, company:companies(name, logo_url)').or(`title.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
        supabase.from('companies').select('*').or(`name.ilike.%${query}%,description.ilike.%${query}%`).limit(5),
        supabase.from('profiles').select('*').or(profileQuery).limit(5)
      ]);

      const combinedResults: SearchResult[] = [
        ...(courses?.map(c => ({ type: 'course' as const, data: c })) || []),
        ...(opportunities?.map(o => ({ type: 'opportunity' as const, data: o })) || []),
        ...(companies?.map(c => ({ type: 'company' as const, data: c })) || []),
        ...(profiles?.map(p => ({ type: 'profile' as const, data: p })) || [])
      ];

      setResults(combinedResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByType = async (query: string, type: Exclude<ActiveTab, 'all'>) => {
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
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(10);
          results = courses?.map(c => ({ type: 'course' as const, data: c })) || [];
          break;

        case 'opportunities':
          const { data: opportunities } = await supabase
            .from('opportunities')
            .select('*, company:companies(name, logo_url)')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(10);
          results = opportunities?.map(o => ({ type: 'opportunity' as const, data: o })) || [];
          break;

        case 'profiles':
          // Enhanced profile search for better name matching
          const profileSearchTerms = query.trim().split(' ');
          let profileQuery = '';

          if (profileSearchTerms.length === 1) {
            // Single term - search in both first and last name
            profileQuery = `first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
          } else if (profileSearchTerms.length >= 2) {
            // Multiple terms - try to match first and last name combinations
            const [firstName, ...lastNameParts] = profileSearchTerms;
            const lastName = lastNameParts.join(' ');
            profileQuery = `first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`;
          }

          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .or(profileQuery)
            .limit(10);

          results = profiles?.map(p => ({ type: 'profile' as const, data: p })) || [];
          break;

        case 'companies':
          const { data: companies } = await supabase
            .from('companies')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(10);
          results = companies?.map(c => ({ type: 'company' as const, data: c })) || [];
          break;
      }

      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Perform search based on current tab and query
  const performSearch = useCallback((query: string, tab: ActiveTab) => {
    if (tab === 'all') {
      searchAll(query);
    } else {
      searchByType(query, tab);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, tab: ActiveTab) => {
      // Don't run debounced search if we're searching from suggestion
      if (!isSearchingFromSuggestion) {
        performSearch(query, tab);
      }
    }, 300),
    [performSearch, isSearchingFromSuggestion]
  );

  // Debounced suggestions function
  const debouncedSuggestions = useCallback(
    debounce((query: string) => {
      if (query.trim() && showSuggestions && !isSearchingFromSuggestion) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        if (!isSearchingFromSuggestion) {
          setShowSuggestions(false);
        }
      }
    }, 200),
    [showSuggestions, isSearchingFromSuggestion]
  );

  useEffect(() => {
    debouncedSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab, debouncedSearch]);

  useEffect(() => {
    debouncedSuggestions(searchQuery);
  }, [searchQuery, debouncedSuggestions]);

  const fetchSuggestions = async (query: string) => {
    try {
      const [
        { data: courses },
        { data: opportunities },
        { data: profiles },
        { data: companies }
      ] = await Promise.all([
        supabase
          .from('courses')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(2),
        supabase
          .from('opportunities')
          .select('title')
          .ilike('title', `%${query}%`)
          .limit(2),
        supabase
          .from('profiles')
          .select('first_name,last_name')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .limit(2),
        supabase
          .from('companies')
          .select('name')
          .ilike('name', `%${query}%`)
          .limit(2)
      ]);

      const courseTitles = courses?.map(c => c.title) || [];
      const opportunityTitles = opportunities?.map(o => o.title) || [];
      const profileNames = profiles?.map(p => `${p.first_name} ${p.last_name}`.trim()) || [];
      const companyNames = companies?.map(c => c.name) || [];

      const allSuggestions = [
        ...courseTitles,
        ...opportunityTitles,
        ...profileNames,
        ...companyNames
      ].filter(Boolean).slice(0, 5);

      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
    } catch (error) {
      console.error('Suggestions error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Set flag to prevent debounced search interference
    setIsSearchingFromSuggestion(true);

    // Update search query
    setSearchQuery(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);

    // Immediately perform search with the selected suggestion
    setTimeout(() => {
      performSearch(suggestion, activeTab);
      setIsSearchingFromSuggestion(false);
    }, 100);
  };

  const handleSearchInputChange = (text: string) => {
    setIsSearchingFromSuggestion(false);
    setSearchQuery(text);
    if (!text.trim()) {
      setResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleSearchSubmit = () => {
    setIsSearchingFromSuggestion(false);
    setShowSuggestions(false);
    setSuggestions([]);
    // Force a search immediately on submit
    if (searchQuery.trim()) {
      if (activeTab === 'all') {
        searchAll(searchQuery);
      } else {
        searchByType(searchQuery, activeTab);
      }
    }
  };

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsSearchingFromSuggestion(false);
    // Hide suggestions when changing tabs
    setShowSuggestions(false);
    setSuggestions([]);
    // If there's a search query, immediately search with new tab
    if (searchQuery.trim()) {
      performSearch(searchQuery, tab);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case 'course':
        return (
          <CourseCard
            id={item.data.id}
            title={item.data.title}
            category={item.data.category}
            skillLevel={item.data.skill_level}
            duration={item.data.duration_minutes}
            thumbnail={item.data.thumbnail_url}
            onPress={() => router.push(`/course/${item.data.id}`)}
          />
        );

      case 'opportunity':
        return (
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
        );

      case 'profile':
        return (
          <TouchableOpacity
            style={[styles.profileCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/profile/${item.data.id}`)}
          >
            <Avatar
              uri={item.data.avatar_url}
              initials={`${item.data.first_name?.charAt(0) || ''}${item.data.last_name?.charAt(0) || ''}`}
              size={56}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {item.data.first_name} {item.data.last_name}
              </Text>
              <Text style={[styles.profileTitle, { color: colors.subtext }]}>
                {item.data.bio || 'SkillBridge User'}
              </Text>
              {item.data.skills && item.data.skills?.length > 0 && (
                <View style={styles.skillsContainer}>
                  {(item.data.skills as string[]).slice(0, 3).map((skill: string, index: number) => (
                    <View key={index} style={[styles.skillTag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                    </View>
                  ))}
                  {item.data.skills && item.data.skills.length > 3 && (
                    <View style={[styles.skillTag, { backgroundColor: colors.border }]}>
                      <Text style={[styles.skillText, { color: colors.subtext }]}>
                        +{(item.data.skills as string[]).length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        );

      case 'company':
        return (
          <TouchableOpacity
            style={[styles.companyCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/company/${item.data.id}`)}
          >
            <Avatar
              uri={item.data.logo_url}
              initials={item.data.name ? item.data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'CO'}
              size={56}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {item.data.name}
              </Text>
              <Text style={[styles.profileTitle, { color: colors.subtext }]}>
                {item.data.industry || 'Company'}
              </Text>
              {item.data.location && (
                <Text style={[styles.profileLocation, { color: colors.subtext }]}>
                  📍 {item.data.location}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case 'all': return 'All';
      case 'profiles': return 'People';
      case 'courses': return 'Courses';
      case 'opportunities': return 'Jobs';
      case 'companies': return 'Companies';
      default: return;
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

          <View style={styles.searchWrapper}>
            <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
              <AntDesign name="search1" size={20} color={colors.subtext} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search courses, opportunities, or people..."
                placeholderTextColor={colors.subtext}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                onFocus={() => setShowSuggestions(suggestions.length > 0 && searchQuery.trim().length > 0)}
                onBlur={() => {
                  // Delay hiding suggestions to allow for suggestion tap
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearchInputChange('')}
                  style={styles.clearButton}
                >
                  <AntDesign name="close" size={16} color={colors.subtext} />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.card }]}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.suggestionItem,
                      index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <AntDesign name="search1" size={16} color={colors.subtext} style={styles.suggestionIcon} />
                    <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {(['all', 'courses', 'opportunities', 'profiles', 'companies'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab ? colors.primary : colors.card,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[
                styles.tabText,
                {
                  color: activeTab === tab ? '#FFFFFF' : colors.text,
                  fontFamily: activeTab === tab ? 'Inter-SemiBold' : 'Inter-Medium'
                }
              ]}>
                {getTabLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>Searching...</Text>
        </View>
      ) : searchQuery.trim() ? (
        results.length > 0 ? (
          <FlatList
            data={results.filter(item => {
              if (activeTab === 'all') return true;
              return item.type === activeTab.slice(0, -1)
            })}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
            contentContainerStyle={styles.resultsContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <AntDesign name="search1" size={32} color={colors.subtext} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
              Try different keywords or check your spelling
            </Text>
          </View>
        )
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
            <AntDesign name="search1" size={32} color={colors.subtext} />
          </View>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Search SkillBridge
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
            Find courses, opportunities, people, and companies
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
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
  searchWrapper: {
    flex: 1,
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  resultsContainer: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    marginBottom: 4,
  },
  profileLocation: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
  },
});