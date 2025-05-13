import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import Feather from '@expo/vector-icons/Feather';

export default function CreateOpportunityScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState({
    title: '',
    description: '',
    location: '',
    type: 'job',
    skills_required: [] as string[],
    application_deadline: new Date(),
    remote: false,
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const addSkill = () => {
    if (newSkill.trim() && !opportunity.skills_required.includes(newSkill.trim())) {
      setOpportunity({
        ...opportunity,
        skills_required: [...opportunity.skills_required, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setOpportunity({
      ...opportunity,
      skills_required: opportunity.skills_required.filter(skill => skill !== skillToRemove),
    });
  };

  const handleCreateOpportunity = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Get company ID from user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.company_id) throw profileError || new Error('No company');

      const { error } = await supabase
        .from('opportunities')
        .insert({
          company_id: profileData.company_id,
          title: opportunity.title,
          description: opportunity.description,
          location: opportunity.location,
          type: opportunity.type,
          skills_required: opportunity.skills_required,
          application_deadline: opportunity.application_deadline.toISOString(),
          remote: opportunity.remote,
          status: 'active',
        });

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error creating opportunity:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Create Opportunity</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={opportunity.title}
            onChangeText={(text) => setOpportunity({ ...opportunity, title: text })}
            placeholder="Job Title"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              height: 120,
              textAlignVertical: 'top',
            }]}
            value={opportunity.description}
            onChangeText={(text) => setOpportunity({ ...opportunity, description: text })}
            placeholder="Detailed description of the opportunity"
            placeholderTextColor={colors.subtext}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={opportunity.location}
            onChangeText={(text) => setOpportunity({ ...opportunity, location: text })}
            placeholder="e.g. New York, NY or Remote"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
          <View style={styles.radioGroup}>
            {['job', 'internship', 'project'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.radioButton,
                  opportunity.type === type && { backgroundColor: colors.primary },
                ]}
                onPress={() => setOpportunity({ ...opportunity, type })}
              >
                <Text style={[
                  styles.radioText,
                  opportunity.type === type && { color: 'white' },
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Skills Required</Text>
          <View style={styles.skillInputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text,
                flex: 1,
              }]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add required skill"
              placeholderTextColor={colors.subtext}
              onSubmitEditing={addSkill}
            />
            <Button 
              title="Add" 
              onPress={addSkill} 
              size="small" 
              style={styles.addButton}
            />
          </View>
          <View style={styles.skillsContainer}>
            {opportunity.skills_required.map((skill, index) => (
              <View key={index} style={[styles.skillItem, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text }}>{skill}</Text>
                <Button 
                  title="×" 
                  onPress={() => removeSkill(skill)} 
                  size="small"
                  style={styles.removeButton}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Application Deadline</Text>
          <TouchableOpacity
            style={[styles.input, { 
              backgroundColor: colors.card, 
              justifyContent: 'center',
            }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {opportunity.application_deadline.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={opportunity.application_deadline}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setOpportunity({ ...opportunity, application_deadline: date });
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                opportunity.remote && { backgroundColor: colors.primary },
              ]}
              onPress={() => setOpportunity({ ...opportunity, remote: !opportunity.remote })}
            >
              {opportunity.remote && (
                <Feather name="check" size={16} color="white" />
              )}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Remote position
            </Text>
          </View>
        </View>

        <Button
          title="Create Opportunity"
          onPress={handleCreateOpportunity}
          loading={loading}
          disabled={!opportunity.title || !opportunity.description}
          style={styles.createButton}
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
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  radioText: {
    fontSize: 14,
  },
  skillInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addButton: {
    width: 80,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    marginLeft: 8,
    padding: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  createButton: {
    marginTop: 24,
  },
});