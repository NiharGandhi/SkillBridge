import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export default function EditCompanyScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [company, setCompany] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
    size: '',
    location: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.company_id) throw profileError || new Error('No company');

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profileData.company_id)
        .single();

      if (companyError) throw companyError;
      if (companyData) {
        setCompany({
          name: companyData.name || '',
          description: companyData.description || '',
          website: companyData.website || '',
          industry: companyData.industry || '',
          size: companyData.size || '',
          location: companyData.location || '',
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.company_id) throw profileError || new Error('No company');

      const { error } = await supabase
        .from('companies')
        .update({
          name: company.name,
          description: company.description,
          website: company.website,
          industry: company.industry,
          size: company.size,
          location: company.location,
        })
        .eq('id', profileData.company_id);

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error updating company:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Company</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Company Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={company.name}
            onChangeText={(text) => setCompany({ ...company, name: text })}
            placeholder="Company name"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              height: 100,
              textAlignVertical: 'top',
            }]}
            value={company.description}
            onChangeText={(text) => setCompany({ ...company, description: text })}
            placeholder="What does your company do?"
            placeholderTextColor={colors.subtext}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Website</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={company.website}
            onChangeText={(text) => setCompany({ ...company, website: text })}
            placeholder="https://example.com"
            placeholderTextColor={colors.subtext}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={company.industry}
            onChangeText={(text) => setCompany({ ...company, industry: text })}
            placeholder="e.g. Technology, Healthcare"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Company Size</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={company.size}
            onChangeText={(text) => setCompany({ ...company, size: text })}
            placeholder="e.g. 1-10, 11-50"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={company.location}
            onChangeText={(text) => setCompany({ ...company, location: text })}
            placeholder="e.g. San Francisco, CA"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleUpdateCompany}
          loading={loading}
          disabled={!company.name}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 24,
  },
});