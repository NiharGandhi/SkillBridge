import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Database } from '../../../types/supabase';
import { useTheme } from '../../../../context/ThemeContext';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { format } from 'date-fns';

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  applications: { id: string }[];
};

export default function CompanyJobsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { companyId } = useLocalSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, [companyId]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          applications:applications(id)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const handleCreateOpportunity = () => {
    router.push('/company/create-opportunity');
  };

  const handleViewApplicants = (opportunityId: string) => {
    router.push(`/company-jobs/${companyId}/${opportunityId}`);
  };

  const handleEditOpportunity = (opportunityId: string) => {
    router.push(`/edit-opportunity/${opportunityId}`);
  };

  const renderOpportunity = ({ item }: { item: Opportunity }) => (
    <Card variant="default" style={{...styles.opportunityCard, backgroundColor: colors.card }}>
      <View style={styles.opportunityHeader}>
        <Text style={[styles.opportunityTitle, { color: colors.text }]}>{item.title}</Text>
        <Badge
          label={item.type}
          variant="outline"
          size="small"
          textStyle={{ color: colors.primary }}
        />
      </View>
      
      <View style={styles.opportunityMeta}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={14} color={colors.subtext} />
          <Text style={[styles.metaText, { color: colors.subtext }]}>{item.location || 'Remote'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="clock" size={14} color={colors.subtext} />
          <Text style={[styles.metaText, { color: colors.subtext }]}>
            Posted {format(new Date(item.created_at), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>
      
      <Text style={[styles.opportunityDescription, { color: colors.text }]} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.opportunityFooter}>
        <TouchableOpacity 
          style={[styles.applicantsButton, { backgroundColor: colors.primary + '10' }]}
          onPress={() => handleViewApplicants(item.id)}
        >
          <Feather name="users" size={16} color={colors.primary} />
          <Text style={[styles.applicantsText, { color: colors.primary }]}>
            {item.applications.length} applicant{item.applications.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.opportunityActions}>
          <Button
            title="Edit"
            variant="outline"
            size="small"
            onPress={() => handleEditOpportunity(item.id)}
            style={styles.actionButton}
          />
          <Button
            title="View"
            variant="primary"
            size="small"
            onPress={() => handleViewApplicants(item.id)}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Posted Jobs</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={opportunities}
        renderItem={renderOpportunity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase" size={48} color={colors.subtext} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              No jobs posted yet
            </Text>
            <Button
              title="Create Opportunity"
              variant="primary"
              onPress={handleCreateOpportunity}
              icon={<Feather name="plus" size={16} color="white" />}
              iconPosition="left"
              style={styles.createButton}
            />
          </View>
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {opportunities.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Button
            title="Create New Opportunity"
            variant="primary"
            onPress={handleCreateOpportunity}
            icon={<Feather name="plus" size={16} color="white" />}
            iconPosition="left"
            style={styles.createButton}
          />
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  opportunityCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  opportunityTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    flex: 1,
    marginRight: 12,
  },
  opportunityMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  opportunityDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.9,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  applicantsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  opportunityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  createButton: {
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});