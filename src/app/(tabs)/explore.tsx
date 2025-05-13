import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Database } from '../../types/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { OpportunityCard } from '../../components/screens/OpportunityCard';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  company: {
    name: string;
    logo_url: string | null;
  } | null;
};

const OPPORTUNITY_TYPES = ['All Types', 'Internship', 'Project', 'Job'];
const LOCATIONS = ['All Locations', 'Remote', 'On-site'];

export default function ExploreScreen() {
  const { colors } = useTheme();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    filterOpportunities();
  }, [searchQuery, selectedType, selectedLocation, opportunities]);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          company:companies(name, logo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
      setFilteredOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOpportunities = () => {
    let filtered = [...opportunities];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(opportunity =>
        opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opportunity.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opportunity.location && opportunity.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'All Types') {
      filtered = filtered.filter(opportunity =>
        opportunity.type.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // Filter by location
    if (selectedLocation !== 'All Locations') {
      if (selectedLocation === 'Remote') {
        filtered = filtered.filter(opportunity => opportunity.remote);
      } else if (selectedLocation === 'On-site') {
        filtered = filtered.filter(opportunity => !opportunity.remote);
      }
    }

    setFilteredOpportunities(filtered);
  };

  const handleOpportunityPress = (id: string) => {
    router.push(`/opportunity/${id}`);
  };

  const renderTypeItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.typeItem,
        {
          borderColor: colors.border,
          backgroundColor: colors.card
        },
        selectedType === item && {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        }
      ]}
      onPress={() => setSelectedType(item)}
    >
      <Text
        style={[
          styles.typeText,
          { color: colors.text },
          selectedType === item && { color: colors.primary }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderLocationItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.locationItem,
        {
          borderColor: colors.border,
          backgroundColor: colors.card
        },
        selectedLocation === item && {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary,
        }
      ]}
      onPress={() => setSelectedLocation(item)}
    >
      <Text
        style={[
          styles.locationText,
          { color: colors.text },
          selectedLocation === item && { color: colors.primary }
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
          <Entypo name="compass" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Explore Opportunities
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
        <AntDesign name='search1' size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search opportunities..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          data={OPPORTUNITY_TYPES}
          renderItem={renderTypeItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typesList}
        />
        <FlatList
          horizontal
          data={LOCATIONS}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locationsList}
        />
      </View>

      {filteredOpportunities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No opportunities found matching your criteria.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOpportunities}
          renderItem={({ item }) => (
            <OpportunityCard
              id={item.id}
              title={item.title}
              companyName={item.company?.name || 'Unknown Company'}
              companyLogo={item.company?.logo_url || null}
              location={item.location}
              type={item.type}
              deadline={item.application_deadline}
              skillsRequired={item.skills_required}
              remote={item.remote}
              onPress={handleOpportunityPress}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.opportunityList}
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
  },
  typesList: {
    paddingBottom: 12,
  },
  locationsList: {
    paddingBottom: 8,
  },
  typeItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  locationItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  locationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    padding: 12,
    marginBottom: 16,
  },
  infoIconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  infoDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  infoButton: {
    minWidth: 80,
  },
  opportunityList: {
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