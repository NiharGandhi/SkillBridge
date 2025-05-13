import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';


const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Media', 'Consulting', 'Nonprofit', 'Government',
  'Real Estate', 'Transportation', 'Energy', 'Hospitality', 'Agriculture'
];

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001+ employees'
];

export default function EmployerOnboarding() {
  const { colors } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Company Info
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
      if (!jobTitle) newErrors.jobTitle = 'Job title is required';
    }
    else if (step === 2) {
      if (!companyName) newErrors.companyName = 'Company name is required';
      if (companyWebsite && !/^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(companyWebsite)) {
        newErrors.companyWebsite = 'Please enter a valid website URL';
      }
      if (!selectedIndustry) newErrors.industry = 'Industry is required';
      if (!selectedSize) newErrors.size = 'Company size is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const selectIndustry = (industry: string) => {
    setSelectedIndustry(industry);
  };

  const selectSize = (size: string) => {
    setSelectedSize(size);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // First update profile with personal info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bio: jobTitle
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Then create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          website: companyWebsite,
          location: companyLocation,
          industry: selectedIndustry,
          size: selectedSize,
          verified: false
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Finally link company to profile
      const { error: linkError } = await supabase
        .from('profiles')
        .update({
          company_id: companyData.id,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (linkError) throw linkError;

      await completeOnboarding();

    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.step}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Personal Information
            </Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Tell us about yourself as a recruiter or employer.
            </Text>

            <Input
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              error={errors.firstName}
            />

            <Input
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              error={errors.lastName}
            />

            <Input
              label="Job Title"
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="HR Manager"
              error={errors.jobTitle}
            />

            <View style={styles.buttons}>
              <Button
                title="Next"
                onPress={handleNext}
                fullWidth
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.step}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Company Information
            </Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Tell us about your company so students can learn more about your opportunities.
            </Text>

            <Input
              label="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Acme Inc."
              error={errors.companyName}
            />

            <Input
              label="Company Website"
              value={companyWebsite}
              onChangeText={setCompanyWebsite}
              placeholder="https://example.com"
              keyboardType="url"
              error={errors.companyWebsite}
            />

            <Input
              label="Location"
              value={companyLocation}
              onChangeText={setCompanyLocation}
              placeholder="San Francisco, CA"
            />

            <Card variant="default" style={styles.selectCard}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>
                Industry
              </Text>
              {errors.industry && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.industry}
                </Text>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectItems}
              >
                {INDUSTRIES.map((industry, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => selectIndustry(industry)}
                    activeOpacity={0.7}
                  >
                    <Badge
                      label={industry}
                      variant={selectedIndustry === industry ? 'primary' : 'outline'}
                      style={styles.selectBadge}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Card>

            <Card variant="default" style={styles.selectCard}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>
                Company Size
              </Text>
              {errors.size && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.size}
                </Text>
              )}
              <View style={styles.sizeOptions}>
                {COMPANY_SIZES.map((size, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sizeOption,
                      selectedSize === size && {
                        backgroundColor: colors.primary + '20',
                        borderColor: colors.primary,
                      }
                    ]}
                    onPress={() => selectSize(size)}
                  >
                    <Text
                      style={[
                        styles.sizeText,
                        selectedSize === size && { color: colors.primary }
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <View style={styles.buttons}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
              <Button
                title="Complete"
                onPress={handleComplete}
                loading={loading}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.primary }]}>
            SkillBridge
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Employer Onboarding
          </Text>
        </View>

        <View style={styles.progress}>
          {[1, 2].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep ?
                  { backgroundColor: colors.primary } :
                  { backgroundColor: colors.border }
              ]}
            />
          ))}
        </View>

        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Need to import TouchableOpacity
import { TouchableOpacity } from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressStep: {
    width: 90,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  step: {

  },
  stepTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    marginBottom: 8,
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  selectCard: {
    marginBottom: 20,
  },
  selectLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  selectItems: {
    paddingVertical: 8,
  },
  selectBadge: {
    marginRight: 8,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 8,
  },
  sizeOptions: {
    marginTop: 8,
  },
  sizeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    marginBottom: 8,
  },
  sizeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    marginRight: 12,
  },
});