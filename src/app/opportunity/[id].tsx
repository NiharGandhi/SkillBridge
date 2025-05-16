import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Database } from '../../types/supabase';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  company: {
    name: string;
    logo_url: string | null;
    description: string | null;
    website: string | null;
  } | null;
};

export default function OpportunityDetails() {
  // Fix: Use a cast instead of TypeScript generics to avoid JSX confusion
  const params = useLocalSearchParams();
  const id = params.id as string;
  const opportunityId = Array.isArray(id) ? id[0] : id;
  const { colors } = useTheme();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applicationLoading, setApplicationLoading] = useState(false);

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity();
      checkApplicationStatus();
    }
  }, [opportunityId]);

  const fetchOpportunity = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          company:companies(name, logo_url, description, website)
        `)
        .eq('id', opportunityId)
        .single();

      if (error) throw error;
      setOpportunity(data);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      Alert.alert('Error', 'Failed to load opportunity details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', user.id)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (error) throw error;
      setApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!user || !user.id) {
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }

    setApplicationLoading(true);
    try {
      // First check if user has a resume uploaded
      const { data: profile } = await supabase
        .from('profiles')
        .select('resume_url')
        .eq('id', user.id)
        .single();
        
      if (!profile?.resume_url) {
        Alert.alert(
          'Resume Required',
          'Please upload your resume in your profile before applying',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => router.push('/profile') }
          ]
        );
        return;
      }

      const { error } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          opportunity_id: id,
          status: 'pending',
          resume_url: profile.resume_url
        });

      if (error) throw error;
      
      setApplied(true);
      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error) {
      console.error('Error applying:', error);
      Alert.alert('Error', 'Failed to submit application');
    } finally {
      setApplicationLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!opportunity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Opportunity not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{opportunity.title}</Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>

        {/* Company Info - Visible to all users */}
        <Card variant="outlined" style={styles.companyCard}>
          <View style={styles.companyHeader}>
            {opportunity.company?.logo_url ? (
              <Avatar size={48} uri={opportunity.company.logo_url} />
            ) : (
              <Avatar size={48} initials={opportunity.company?.name?.charAt(0) || 'C'} />
            )}
            <View style={styles.companyInfo}>
              <Text style={[styles.companyName, { color: colors.text }]}>
                {opportunity.company?.name || 'Unknown Company'}
              </Text>
              {opportunity.company?.website && (
                <Text style={[styles.website, { color: colors.primary }]}>
                  {opportunity.company.website}
                </Text>
              )}
            </View>
          </View>
          {opportunity.company?.description && (
            <Text style={[styles.description, { color: colors.subtext }]}>
              {opportunity.company.description}
            </Text>
          )}
        </Card>

        {/* Opportunity Details */}
        <Card variant="outlined" style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialIcons name="work" size={20} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={20} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {opportunity.remote ? 'Remote' : opportunity.location || 'Location not specified'}
            </Text>
          </View>

          {opportunity.application_deadline && (
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Apply by: {new Date(opportunity.application_deadline).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Description */}
        <Card variant="outlined" style={styles.descriptionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {opportunity.description}
          </Text>
        </Card>

        {/* Skills Required */}
        {opportunity.skills_required?.length > 0 && (
          <Card variant="outlined" style={styles.skillsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills Required</Text>
            <View style={styles.skillsContainer}>
              {opportunity.skills_required.map((skill, index) => (
                <View key={index} style={[styles.skillTag, { backgroundColor: colors.card }]}>
                  <Text style={[styles.skillText, { color: colors.text }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Apply Button - Only for students */}
      {user?.role === 'student' && (
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          {applied ? (
            <Card variant="outlined" style={styles.appliedCard}>
              <Text style={[styles.appliedText, { color: colors.primary }]}>
                Application Submitted
              </Text>
            </Card>
          ) : (
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              disabled={applicationLoading}
            >
              <Text style={styles.applyButtonText}>
                {applicationLoading ? 'Applying...' : 'Apply Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    textAlign: 'center',
    flex: 1,
  },
  companyCard: {
    padding: 16,
    marginBottom: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyInfo: {
    marginLeft: 12,
  },
  companyName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  website: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  detailsCard: {
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginLeft: 12,
  },
  descriptionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  skillsCard: {
    padding: 16,
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillTag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  appliedCard: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  appliedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});