import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { BackHandler } from 'react-native';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';


type Chapter = {
  id?: string;
  title: string;
  content: string;
  duration_minutes: number;
  chapter_order: number;
};

type CourseData = {
  title: string;
  description: string;
  category: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  thumbnail_url: string | null;
  chapters: Chapter[];
};

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseData>({
    title: '',
    description: '',
    category: 'General',
    skill_level: 'beginner',
    duration_minutes: 60,
    thumbnail_url: null,
    chapters: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tracking unsaved changes and intial data
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialCourseData = useRef<CourseData | null>(null);

  useEffect(() => {
    ensureBucketExists();
    fetchCourse();
  }, [id]);

  // Navigation blocking for unsaved changes using BackHandler
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (!hasUnsavedChanges) return false;

        Alert.alert(
          'Unsaved changes',
          'You have unsaved changes. Are you sure you want to leave?',
          [
            { text: "Don't leave", style: 'cancel', onPress: () => {} },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: () => router.back(),
            },
          ]
        );
        return true; // Prevent default back behavior
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }, [hasUnsavedChanges])
  );

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;
      if (courseData.instructor_id !== user?.id) {
        Alert.alert('Error', 'You are not authorized to edit this course');
        router.back();
        return;
      }

      // Fetch chapters for this course
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', id)
        .order('chapter_order', { ascending: true });

      if (chaptersError) throw chaptersError;

      const fetchedCourseData = {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category || 'General',
        skill_level: courseData.skill_level || 'beginner',
        duration_minutes: courseData.duration_minutes || 60,
        thumbnail_url: courseData.thumbnail_url,
        chapters: chaptersData || [],
      };

      setCourse(fetchedCourseData);
      initialCourseData.current = JSON.parse(JSON.stringify(fetchedCourseData)); // Deep copy
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error fetching course:', error);
      Alert.alert('Error', 'Failed to load course data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Update all change handlers to track modifications
  const handleChange = (field: keyof CourseData, value: string) => {
    setCourse(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleNumberChange = (field: keyof CourseData, value: string) => {
    const numValue = parseInt(value) || 0;
    setCourse(prev => ({ ...prev, [field]: numValue }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateChapter = (index: number, field: keyof Chapter, value: string | number) => {
    setCourse(prev => {
      const updatedChapters = [...prev.chapters];
      updatedChapters[index] = {
        ...updatedChapters[index],
        [field]: value,
      };
      return { ...prev, chapters: updatedChapters };
    });
    setHasUnsavedChanges(true);
  };

  // Update the handleSelectImage function
  const handleSelectImage = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to upload images');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'We need access to your photos to upload a thumbnail');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (pickerResult.canceled) return;

    setUploading(true);
    try {
      const image = pickerResult.assets[0];
      if (!image.base64) throw new Error('Failed to process image');

      // Delete old thumbnail if exists
      if (course.thumbnail_url) {
        const oldPath = course.thumbnail_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('course-thumbnails')
            .remove([oldPath])
            .catch(console.error);
        }
      }

      // Upload new thumbnail with user-specific path
      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `user-${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, decode(image.base64), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      setCourse(prev => ({ ...prev, thumbnail_url: publicUrl }));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAddChapter = () => {
    setCourse(prev => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          title: '',
          content: '',
          duration_minutes: 15,
          chapter_order: prev.chapters.length + 1,
        },
      ],
    }));
    setHasUnsavedChanges(true);
  };

  const handleDeleteChapter = (index: number) => {
    setCourse(prev => {
      const updatedChapters = [...prev.chapters];
      updatedChapters.splice(index, 1);
      // Update chapter orders
      return {
        ...prev,
        chapters: updatedChapters.map((chap, i) => ({
          ...chap,
          chapter_order: i + 1,
        })),
      };
    });
    setHasUnsavedChanges(true);
  };

  // Enhanced save handler
  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update a course');
      return;
    }

    // Validation
    if (!course.title.trim()) {
      Alert.alert('Error', 'Course title is required');
      return;
    }

    if (!course.description.trim()) {
      Alert.alert('Error', 'Course description is required');
      return;
    }

    if (course.chapters.some(ch => !ch.title.trim())) {
      Alert.alert('Error', 'All chapters must have a title');
      return;
    }

    setLoading(true);
    try {
      // Verify ownership
      const { data: existingCourse, error: fetchError } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (existingCourse.instructor_id !== user.id) {
        throw new Error('You are not authorized to edit this course');
      }

      // Update course
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          title: course.title,
          description: course.description,
          category: course.category,
          skill_level: course.skill_level,
          duration_minutes: course.duration_minutes,
          thumbnail_url: course.thumbnail_url,
        })
        .eq('id', id);

      if (courseError) throw courseError;

      // Get existing chapters for comparison
      const { data: existingChapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', id);

      const existingChapterIds = existingChapters?.map(c => c.id) || [];
      const currentChapterIds = course.chapters.filter(c => c.id).map(c => c.id) as string[];

      // Identify chapters to delete
      const chaptersToDelete = existingChapterIds.filter(
        id => !currentChapterIds.includes(id)
      );

      // Delete removed chapters
      if (chaptersToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('chapters')
          .delete()
          .in('id', chaptersToDelete);

        if (deleteError) throw deleteError;
      }

      // Upsert chapters (both new and existing)
      const chapterUpdates = course.chapters.map(chapter => ({
        ...chapter,
        course_id: id,
      }));

      const { error: chaptersError } = await supabase
        .from('chapters')
        .upsert(chapterUpdates);

      if (chaptersError) throw chaptersError;

      // Update local state with any new IDs from the upsert
      if (course.chapters.some(ch => !ch.id)) {
        const { data: updatedChapters } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', id)
          .order('chapter_order', { ascending: true });

        if (updatedChapters) {
          setCourse(prev => ({ ...prev, chapters: updatedChapters }));
        }
      }

      // Update initial data reference
      initialCourseData.current = JSON.parse(JSON.stringify(course));
      setHasUnsavedChanges(false);

      Alert.alert('Success', 'Course updated successfully');
      router.back();
    } catch (error) {
      console.error('Error updating course:', error);
      Alert.alert('Error', 'Failed to update course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add this utility function somewhere in your code
  const ensureBucketExists = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some(b => b.name === 'course-thumbnails')) {
        await supabase.storage.createBucket('course-thumbnails', {
          public: true,
          allowedMimeTypes: ['image/*'],
        });
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  };

  // Add this function to handle cleanup
  const deleteThumbnail = async (url: string | null) => {
    if (!url) return;

    try {
      const path = url.split('/').pop();
      if (path) {
        await supabase.storage
          .from('course-thumbnails')
          .remove([path]);
      }
    } catch (error) {
      console.error('Error deleting thumbnail:', error);
    }
  };

  // Use this when deleting a course
  const handleDeleteCourse = async () => {
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // First delete all chapters
              const { error: chaptersError } = await supabase
                .from('chapters')
                .delete()
                .eq('course_id', id);

              if (chaptersError) throw chaptersError;

              // Then delete the course
              const { error: courseError } = await supabase
                .from('courses')
                .delete()
                .eq('id', id)
                .eq('instructor_id', user?.id || '');

              if (courseError) throw courseError;

              // Delete thumbnail if exists
              if (course.thumbnail_url) {
                const path = course.thumbnail_url.split('/').pop();
                if (path) {
                  await supabase.storage
                    .from('course-thumbnails')
                    .remove([path])
                    .catch(console.error);
                }
              }

              Alert.alert('Success', 'Course deleted successfully');
              router.replace('/created-courses');
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Course</Text>

        {/* Thumbnail */}
        <View style={styles.thumbnailSection}>
          {course.thumbnail_url ? (
            <Image
              source={{ uri: course.thumbnail_url }}
              style={[styles.thumbnail, { borderColor: colors.border }]}
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { borderColor: colors.border }]}>
              <EvilIcons name="image" size={48} color={colors.subtext} />
            </View>
          )}
          <Button
            title={uploading ? "Uploading..." : "Change Thumbnail"}
            onPress={handleSelectImage}
            variant="outline"
            disabled={uploading}
            style={styles.thumbnailButton}
          />
        </View>

        {/* Course Details */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={course.title}
            onChangeText={text => handleChange('title', text)}
            placeholder="Course title"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                height: 120,
                textAlignVertical: 'top',
              }
            ]}
            value={course.description}
            onChangeText={text => handleChange('description', text)}
            placeholder="Course description"
            placeholderTextColor={colors.subtext}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={course.category}
            onChangeText={text => handleChange('category', text)}
            placeholder="General"
            placeholderTextColor={colors.subtext}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Skill Level</Text>
          <View style={styles.radioGroup}>
            {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.radioButton,
                  {
                    backgroundColor: course.skill_level === level ? colors.primary : colors.card,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => handleChange('skill_level', level)}
              >
                <Text
                  style={{
                    color: course.skill_level === level ? 'white' : colors.text,
                    textTransform: 'capitalize',
                  }}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Duration (minutes)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            value={course.duration_minutes.toString()}
            onChangeText={text => handleNumberChange('duration_minutes', text)}
            placeholder="60"
            placeholderTextColor={colors.subtext}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapters</Text>
            <Button
              title="Add Chapter"
              onPress={handleAddChapter}
              variant="outline"
              size="small"
            />
          </View>

          {course.chapters.map((chapter, index) => (
            <View key={index} style={[styles.chapterCard, { backgroundColor: colors.card }]}>
              <View style={styles.chapterHeader}>
                <Text style={[styles.chapterNumber, { color: colors.primary }]}>
                  {chapter.chapter_order}.
                </Text>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.card, color: colors.text }]}
                  value={chapter.title}
                  onChangeText={text => handleUpdateChapter(index, 'title', text)}
                  placeholder="Chapter title"
                  placeholderTextColor={colors.subtext}
                />
                <TouchableOpacity
                  onPress={() => handleDeleteChapter(index)}
                  style={styles.deleteButton}
                >
                  <EvilIcons name="trash" size={24} color={colors.warning} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    height: 100,
                    textAlignVertical: 'top',
                    marginTop: 8,
                  }
                ]}
                value={chapter.content}
                onChangeText={text => handleUpdateChapter(index, 'content', text)}
                placeholder="Chapter content"
                placeholderTextColor={colors.subtext}
                multiline
              />

              <View style={styles.durationContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Duration (minutes):</Text>
                <TextInput
                  style={[
                    styles.input,
                    { width: 80, marginLeft: 8, backgroundColor: colors.card, color: colors.text }
                  ]}
                  value={chapter.duration_minutes.toString()}
                  onChangeText={text => handleUpdateChapter(index, 'duration_minutes', parseInt(text) || 0)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <View style={styles.destructiveActions}>
            <Button
              title="Delete Course"
              onPress={handleDeleteCourse}
              variant="outline"
              style={{ ...styles.deleteButton, borderColor: colors.warning }}
              textStyle={{ color: colors.warning }}
            />
          </View>
          <View style={styles.navigationActions}>
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading || !hasUnsavedChanges}
              style={{
                ...styles.saveButton,
                opacity: hasUnsavedChanges ? 1 : 0.7
              }}
            />
          </View>
        </View>
      </ScrollView>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  thumbnailSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  thumbnailButton: {
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
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
    justifyContent: 'space-between',
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonGroup: {
    marginTop: 24,
    gap: 12,
  },
  destructiveActions: {
    flexDirection: 'row',
  },
  navigationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    borderColor: 'red',
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chapterCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});