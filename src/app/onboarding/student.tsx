import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { TouchableOpacity } from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Machine Learning',
  'UI/UX Design', 'Graphic Design', 'Content Writing', 'Marketing',
  'Data Analysis', 'Project Management', 'Communication', 'Leadership'
];

export default function StudentOnboarding() {
  const { colors } = useTheme();
  const { user, completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');

  // Education
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!firstName) newErrors.firstName = 'First name is required';
      if (!lastName) newErrors.lastName = 'Last name is required';
    }
    else if (step === 2) {
      if (!university) newErrors.university = 'University is required';
      if (!degree) newErrors.degree = 'Degree is required';
      if (!fieldOfStudy) newErrors.fieldOfStudy = 'Field of study is required';
      if (!graduationYear) newErrors.graduationYear = 'Graduation year is required';
      else if (!/^\d{4}$/.test(graduationYear)) {
        newErrors.graduationYear = 'Please enter a valid year (e.g., 2024)';
      }
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

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          bio,
          education: {
            university,
            degree,
            field_of_study: fieldOfStudy,
            graduation_year: graduationYear
          },
          skills: selectedSkills,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Complete onboarding in auth context
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
              Tell us a bit about yourself so we can personalize your experience.
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
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself, your interests and goals..."
              multiline
              numberOfLines={4}
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
              Education
            </Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Add your educational background to help us find relevant opportunities.
            </Text>
            
            <Input
              label="University/Institution"
              value={university}
              onChangeText={setUniversity}
              placeholder="Harvard University"
              error={errors.university}
            />
            
            <Input
              label="Degree"
              value={degree}
              onChangeText={setDegree}
              placeholder="Bachelor's"
              error={errors.degree}
            />
            
            <Input
              label="Field of Study"
              value={fieldOfStudy}
              onChangeText={setFieldOfStudy}
              placeholder="Computer Science"
              error={errors.fieldOfStudy}
            />
            
            <Input
              label="Graduation Year"
              value={graduationYear}
              onChangeText={setGraduationYear}
              placeholder="2024"
              keyboardType="numeric"
              error={errors.graduationYear}
            />
            
            <View style={styles.buttons}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
              <Button
                title="Next"
                onPress={handleNext}
              />
            </View>
          </View>
        );
        
      case 3:
        return (
          <View style={styles.step}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Skills
            </Text>
            <Text style={[styles.stepDescription, { color: colors.subtext }]}>
              Select skills that you have to help match you with relevant courses and opportunities.
            </Text>
            
            <Card variant="default" style={styles.skillsCard}>
              <Text style={[styles.skillsSubtitle, { color: colors.text }]}>
                Your Skills ({selectedSkills.length} selected)
              </Text>
              
              <View style={styles.skillsGrid}>
                {SKILLS.map((skill, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleSkill(skill)}
                    activeOpacity={0.7}
                  >
                    <Badge
                      label={skill}
                      variant={selectedSkills.includes(skill) ? 'primary' : 'outline'}
                      style={styles.skillBadge}
                    />
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
            Student Onboarding
          </Text>
        </View>
        
        <View style={styles.progress}>
          {[1, 2, 3].map((step) => (
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
    width: 60,
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
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    marginRight: 12,
  },
  skillsCard: {
    marginTop: 8,
  },
  skillsSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    marginBottom: 8,
  },
});