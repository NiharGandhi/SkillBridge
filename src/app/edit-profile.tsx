import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    skills: [] as string[],
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          skills: data.skills || [],
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          skills: profile.skills,
        })
        .eq('id', user.id);

      if (error) throw error;
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove),
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={profile.first_name}
            onChangeText={(text) => setProfile({ ...profile, first_name: text })}
            placeholder="First name"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={profile.last_name}
            onChangeText={(text) => setProfile({ ...profile, last_name: text })}
            placeholder="Last name"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.card, 
              color: colors.text,
              height: 100,
              textAlignVertical: 'top',
            }]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.subtext}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Skills</Text>
          <View style={styles.skillInputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text,
                flex: 1,
              }]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add a skill"
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
            {profile.skills.map((skill, index) => (
              <View key={index} style={[styles.skillItem, { backgroundColor: colors.card }]}>
                <Text style={{ color: colors.text }}>{skill}</Text>
                <Button 
                  title="x" 
                  onPress={() => removeSkill(skill)} 
                  size="small"
                  style={styles.removeButton}
                />
              </View>
            ))}
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
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
  saveButton: {
    marginTop: 24,
  },
});