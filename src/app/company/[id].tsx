import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Database } from '../../types/supabase';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui/Avatar';

export default function CompanyPage() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [company, setCompany] = useState<Database['public']['Tables']['companies']['Row'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Company not found');

        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !company) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AntDesign name="warning" size={48} color={colors.warning} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error || 'Company not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <AntDesign name="arrowleft" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Avatar
            uri={company.logo_url}
            initials={company.name.split(' ').map(n => n[0]).join('')}
            size={80}
          />
          
          <View style={styles.titleContainer}>
            <Text style={[styles.companyName, { color: colors.text }]}>
              {company.name}
              {company.verified && (
                <AntDesign 
                  name="checkcircle" 
                  size={16} 
                  color={colors.success} 
                  style={styles.verifiedIcon}
                />
              )}
            </Text>
            <Text style={[styles.industry, { color: colors.subtext }]}>
              {company.industry}
            </Text>
            {company.location && (
              <Text style={[styles.location, { color: colors.subtext }]}>
                <AntDesign name="enviroment" size={14} /> {company.location}
              </Text>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailsContainer, { backgroundColor: colors.card }]}>
          {company.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(company.website!)}
              style={styles.websiteLink}
            >
              <Text style={[styles.websiteText, { color: colors.primary }]}>
                {company.website.replace(/https?:\/\//, '')}
              </Text>
              <AntDesign name="link" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}

          {company.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                About Us
              </Text>
              <Text style={[styles.description, { color: colors.text }]}>
                {company.description}
              </Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {company.size || 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subtext }]}>
                Company Size
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    borderRadius: 12,
    padding: 8,
    zIndex: 10,
  },
  logo: {
    marginTop: 32,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companyName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  industry: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    gap: 24,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  websiteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});