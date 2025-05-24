import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { COMPANY_SIZES, INDUSTRIES } from '../../constants/companyOptions';
import { router } from 'expo-router';

export default function CreateCompany() {
  const { colors } = useTheme();
  const [formState, setFormState] = useState({
    name: '',
    website: '',
    location: '',
    industry: '',
    size: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.name) newErrors.name = 'Company name is required';
    if (formState.website && !/^https?:\/\/.+\..+/.test(formState.website))
      newErrors.website = 'Invalid website URL';
    if (!formState.industry) newErrors.industry = 'Industry is required';
    if (!formState.size) newErrors.size = 'Company size is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create company
      const { data: company, error } = await supabase
        .from('companies')
        .insert({
          ...formState,
          verified: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Link company to user
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Reset form
      setFormState({
        name: '',
        website: '',
        location: '',
        industry: '',
        size: '',
      });
      setErrors({});
      alert('Company created successfully!');
      router.push('/(tabs)/profile')
    } catch (error) {
      console.error('Create company failed:', error);
      alert('Failed to create company');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.header, { color: colors.primary, paddingTop: 16 }]}>
          Create Company
        </Text>
        <Card variant="default" style={styles.card}>
          <Input
            label="Company Name"
            value={formState.name}
            onChangeText={(v) => handleChange('name', v)}
            placeholder="Acme Corp"
            error={errors.name}
          />
          <Input
            label="Website"
            value={formState.website}
            onChangeText={(v) => handleChange('website', v)}
            placeholder="https://example.com"
            keyboardType="url"
            error={errors.website}
          />
          <Input
            label="Location"
            value={formState.location}
            onChangeText={(v) => handleChange('location', v)}
            placeholder="City, Country"
          />

          {/* Industry */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Industry</Text>
          {errors.industry && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.industry}
            </Text>
          )}
          <View style={styles.badgeContainer}>
            {INDUSTRIES.map((item) => (
              <TouchableOpacity 
                key={item} 
                onPress={() => handleChange('industry', item)}
              >
                <Badge
                  label={item}
                  variant={formState.industry === item ? 'primary' : 'outline'}
                  style={styles.badge}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Size */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Company Size</Text>
          {errors.size && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.size}
            </Text>
          )}
          <View style={styles.badgeContainer}>
            {COMPANY_SIZES.map((item) => (
              <TouchableOpacity 
                key={item} 
                onPress={() => handleChange('size', item)}
              >
                <Badge
                  label={item}
                  variant={formState.size === item ? 'primary' : 'outline'}
                  style={styles.badge}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Create Company"
            onPress={handleSubmit}
            loading={loading}
            fullWidth
            style={styles.button}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  header: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    marginRight: 8,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
});