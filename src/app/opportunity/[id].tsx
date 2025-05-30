import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
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
import Feather from '@expo/vector-icons/Feather';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  company: {
    name: string;
    logo_url: string | null;
    description: string | null;
    website: string | null;
  } | null;
};

export default function OpportunityDetails() {
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
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={24} color={colors.primary} style={styles.loadingIcon} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading opportunity details</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!opportunity) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Feather name="frown" size={32} color={colors.text} style={styles.notFoundIcon} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>Opportunity not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: '#fff' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LinkedIn-style Header */}
        <View
          style={[styles.headerGradient, { backgroundColor: colors.primary }]}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <AntDesign name="arrowleft" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Job Header Card */}
        <View style={[ styles.jobHeaderCard, { backgroundColor: colors.background } ]}>
          <View style={styles.jobHeaderContent}>
            <View style={styles.companyHeader}>
              <View style={styles.logoContainer}>
                {opportunity.company?.logo_url ? (
                  <Image 
                    source={{ uri: opportunity.company.logo_url }} 
                    style={styles.companyLogo}
                  />
                ) : (
                  <View style={[styles.logoPlaceholder, { backgroundColor: colors.card }]}>
                    <Text style={[styles.logoInitials, { color: colors.text }]}>
                      {opportunity.company?.name?.charAt(0) || 'C'}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.jobInfo}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>{opportunity.title}</Text>
                <Text style={[styles.companyName, { color: colors.subtext }]}>
                  {opportunity.company?.name || 'Unknown Company'}
                </Text>
                <Text style={styles.jobLocation}>
                  {opportunity.remote ? 'Remote' : opportunity.location || 'Location not specified'}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <MaterialIcons name="work" size={18} color={colors.subtext} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                </Text>
              </View>
              
              {opportunity.application_deadline && (
                <View style={styles.metaItem}>
                  <MaterialIcons name="event" size={18} color={colors.subtext} />
                  <Text style={[styles.metaText, { color: colors.text }]}>
                    Apply by: {format(new Date(opportunity.application_deadline), 'MMM dd, yyyy')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* About the Job */}
        <Card style={{ ...styles.sectionCard, backgroundColor: colors.background }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About the job</Text>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {opportunity.description}
          </Text>
        </Card>

        {/* Job Details */}
        <Card style={{ ...styles.sectionCard, backgroundColor: colors.background }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Job details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Job type</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.subtext }]}>Location</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {opportunity.remote ? 'Remote' : opportunity.location || 'Not specified'}
            </Text>
          </View>
          
          {opportunity.application_deadline && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.subtext }]}>Application deadline</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {format(new Date(opportunity.application_deadline), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
        </Card>

        {/* Skills */}
        {opportunity.skills_required?.length > 0 && (
          <Card style={{ ...styles.sectionCard, backgroundColor: colors.background }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills required</Text>
            <View style={styles.skillsContainer}>
              {opportunity.skills_required.map((skill, index) => (
                <View 
                  key={index} 
                  style={[styles.skillTag, { 
                    backgroundColor: `${colors.primary}15`, 
                    borderColor: colors.primary 
                  }]}
                >
                  <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* About the Company */}
        {opportunity.company?.description && (
          <Card style={{ ...styles.sectionCard, backgroundColor: colors.background }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About the company</Text>
            <View style={styles.companyAboutHeader}>
              {opportunity.company?.logo_url ? (
                <Image 
                  source={{ uri: opportunity.company.logo_url }} 
                  style={styles.companyAboutLogo}
                />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.card }]}>
                  <Text style={[styles.logoInitials, { color: colors.text }]}>
                    {opportunity.company?.name?.charAt(0) || 'C'}
                  </Text>
                </View>
              )}
              <Text style={[styles.companyAboutName, { color: colors.text }]}>
                {opportunity.company?.name || 'Unknown Company'}
              </Text>
            </View>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              {opportunity.company.description}
            </Text>
            {opportunity.company?.website && (
              <TouchableOpacity style={styles.websiteLink}>
                <Text style={[styles.websiteText, { color: colors.primary }]}>
                  {opportunity.company.website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Apply Button */}
      {user?.role === 'student' && (
        <View style={[styles.footer, { 
          backgroundColor: colors.background,
          borderTopColor: colors.border 
        }]}>
          {applied ? (
            <View style={[styles.appliedContainer, { backgroundColor: '#f0fdf4' }]}>
              <Feather name="check-circle" size={20} color="#16a34a" />
              <Text style={[styles.appliedText, { color: '#16a34a' }]}>
                Application Submitted
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.applyButton, { 
                backgroundColor: '#0a66c2',
                opacity: applicationLoading ? 0.8 : 1
              }]}
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
    paddingBottom: 100,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  jobHeaderCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -56,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  jobHeaderContent: {
    marginTop: 8,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoContainer: {
    marginRight: 16,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitials: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: '#1c1c1e',
    marginBottom: 4,
  },
  companyName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#3a3a3c',
    marginBottom: 4,
  },
  jobLocation: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b6b6e',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 12,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
    color: '#1c1c1e',
  },
  descriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#3a3a3c',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6b6b6e',
  },
  detailValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1c1c1e',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  skillTag: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  skillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  companyAboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyAboutLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  companyAboutName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  websiteLink: {
    marginTop: 12,
  },
  websiteText: {
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
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  appliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  appliedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundIcon: {
    marginBottom: 16,
  },
  notFoundText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});