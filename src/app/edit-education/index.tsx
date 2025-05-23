import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Education = {
  degree?: string;
  university?: string;
  field_of_study?: string;
  graduation_year?: string;
};

export default function EditEducation() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Initialize state with parsed education data
  const [education, setEducation] = useState<Education>(() => {
    try {
      return params.education ? JSON.parse(params.education as string) : {};
    } catch (e) {
      return {};
    }
  });

  const handleSave = async () => {
    if (!user) return;
    
    // Basic validation
    if (education.graduation_year && !/^\d{4}$/.test(education.graduation_year)) {
      Alert.alert('Invalid Year', 'Please enter a valid 4-digit graduation year');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ education })
        .eq('id', user.id);

      if (error) throw error;
      
      router.back();
    } catch (error) {
      console.error('Error saving education:', error);
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Could not save education details'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>Edit Education</Text>

      <Input
        label="Degree"
        value={education.degree || ''}
        onChangeText={(text) => setEducation(prev => ({ ...prev, degree: text }))}
        placeholder="Bachelor of Science"
        icon={<MaterialIcons name="school" size={20} color={colors.text} />}
      />

      <Input
        label="University"
        value={education.university || ''}
        onChangeText={(text) => setEducation(prev => ({ ...prev, university: text }))}
        placeholder="University Name"
        icon={<MaterialIcons name="location-city" size={20} color={colors.text} />}
      />

      <Input
        label="Field of Study"
        value={education.field_of_study || ''}
        onChangeText={(text) => setEducation(prev => ({ ...prev, field_of_study: text }))}
        placeholder="Computer Science"
        icon={<Feather name="book" size={20} color={colors.text} />}
      />

      <Input
        label="Graduation Year"
        value={education.graduation_year || ''}
        onChangeText={(text) => setEducation(prev => ({ ...prev, graduation_year: text }))}
        placeholder="2024"
        keyboardType="number-pad"
        maxLength={4}
        icon={<MaterialIcons name="calendar-today" size={20} color={colors.text} />}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => router.back()}
          style={styles.button}
        />
        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          icon={saving ? undefined : <Feather name="save" size={20} color="white" />}
          disabled={saving}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
});