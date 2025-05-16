import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import Feather from '@expo/vector-icons/Feather';
import { format } from 'date-fns';
import { Database } from '../../types/supabase';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Picker } from '@react-native-picker/picker';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];

const OPPORTUNITY_TYPES = ['Project', 'Internship', 'Job'];
const SKILLS = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'UI/UX', 'Project Management'];

// Custom Picker Component
const CustomPicker = ({ label, selectedValue, onValueChange, items, style }: {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: { label: string; value: string }[];
  style?: any;
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[pickerStyles.container, style]}>
      <Text style={[pickerStyles.label, { color: colors.text }]}>{label}</Text>
      <View style={[pickerStyles.pickerContainer, { borderColor: colors.border }]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={[pickerStyles.picker, { color: colors.text }]}
          dropdownIconColor={colors.text}
        >
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

// Custom Toggle Component
const CustomToggle = ({ label, value, onValueChange, style }: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: any;
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[toggleStyles.container, style]}>
      <Text style={[toggleStyles.label, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? colors.primary : colors.border}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
      />
    </View>
  );
};

// Custom DatePicker Component
const CustomDatePicker = ({ label, date, onDateChange, style }: {
  label: string;
  date: Date;
  onDateChange: (date: Date) => void;
  style?: any;
}) => {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  return (
    <View style={[datePickerStyles.container, style]}>
      <Text style={[datePickerStyles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity 
        onPress={() => setShowDatePicker(true)}
        style={[datePickerStyles.dateContainer, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.text }}>
          {format(date, 'MMMM d, yyyy')}
        </Text>
        <Feather name="calendar" size={20} color={colors.text} />
      </TouchableOpacity>
      
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              onDateChange(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

export default function EditOpportunityScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [opportunity, setOpportunity] = useState<Partial<Opportunity>>({
    title: '',
    description: '',
    type: 'internship',
    location: '',
    skills_required: [],
    remote: false,
    application_deadline: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('id', id)
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

    if (id) fetchOpportunity();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('opportunities')
        .update(opportunity)
        .eq('id', id);

      if (error) throw error;
      Alert.alert('Success', 'Opportunity updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating opportunity:', error);
      Alert.alert('Error', 'Failed to update opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this opportunity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const { error } = await supabase
                .from('opportunities')
                .delete()
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Success', 'Opportunity deleted successfully');
              router.replace('/company-jobs');
            } catch (error) {
              console.error('Error deleting opportunity:', error);
              Alert.alert('Error', 'Failed to delete opportunity');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const toggleSkill = (skill: string) => {
    setOpportunity(prev => {
      const skills = prev.skills_required || [];
      return {
        ...prev,
        skills_required: skills.includes(skill)
          ? skills.filter(s => s !== skill)
          : [...skills, skill],
      };
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading opportunity...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Edit Opportunity</Text>
        </View>

        <Input
          label="Job Title"
          value={opportunity.title || ''}
          onChangeText={(text) => setOpportunity({ ...opportunity, title: text })}
          placeholder="Enter job title"
          style={styles.input}
        />

        <Input
          label="Description"
          value={opportunity.description || ''}
          onChangeText={(text) => setOpportunity({ ...opportunity, description: text })}
          placeholder="Enter job description"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <CustomPicker
          label="Job Type"
          selectedValue={opportunity.type || 'Internship'}
          onValueChange={(value) => setOpportunity({ ...opportunity, type: value })}
          items={OPPORTUNITY_TYPES.map(type => ({ label: type, value: type.toLowerCase() }))}
          style={styles.input}
        />

        <Input
          label="Location"
          value={opportunity.location || ''}
          onChangeText={(text) => setOpportunity({ ...opportunity, location: text })}
          placeholder="Enter location"
          style={styles.input}
        />

        <CustomToggle
          label="Remote Position"
          value={opportunity.remote || false}
          onValueChange={(value) => setOpportunity({ ...opportunity, remote: value })}
          style={styles.input}
        />

        <CustomDatePicker
          label="Application Deadline"
          date={new Date(opportunity.application_deadline || new Date())}
          onDateChange={(date) => setOpportunity({ ...opportunity, application_deadline: date.toISOString() })}
          style={styles.input}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Skills</Text>
          <View style={styles.skillsContainer}>
            {SKILLS.map(skill => (
              <TouchableOpacity
                key={skill}
                onPress={() => toggleSkill(skill)}
                style={[
                  styles.skill,
                  {
                    backgroundColor: opportunity.skills_required?.includes(skill)
                      ? colors.primary + '20'
                      : colors.card,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Text
                  style={[
                    styles.skillText,
                    {
                      color: opportunity.skills_required?.includes(skill)
                        ? colors.primary
                        : colors.text,
                    }
                  ]}
                >
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Button
            title="Save Changes"
            variant="primary"
            onPress={handleSave}
            loading={loading}
            style={styles.button}
          />
          <Button
            title="Delete Opportunity"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            icon={<Feather name="trash-2" size={16} color="white" />}
            iconPosition="left"
            style={styles.button}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for the custom components
const pickerStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
});

const toggleStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});

const datePickerStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
  },
  input: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  skillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  buttonGroup: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});