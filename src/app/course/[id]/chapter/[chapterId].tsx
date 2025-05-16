import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { Database } from '../../../../types/supabase';
import { supabase } from '../../../../lib/supabase';
import { useTheme } from '../../../../context/ThemeContext';
import Feather from '@expo/vector-icons/Feather';

type Chapter = Database['public']['Tables']['chapters']['Row'];
type Progress = Database['public']['Tables']['progress']['Row'];

export default function ChapterScreen() {
  const { colors } = useTheme();
  const { id, chapterId } = useLocalSearchParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch all data in parallel
      const [
        { data: progressData },
        { data: chaptersData },
        { data: chapterData }
      ] = await Promise.all([
        supabase
          .from('progress')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('chapters')
          .select('*')
          .eq('course_id', id)
          .order('chapter_order', { ascending: true }),
        supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single()
      ]);

      if (!chapterData) {
        throw new Error('Chapter not found');
      }

      setIsEnrolled(!!progressData);
      setProgress(progressData || null);
      setChapters(chaptersData || []);
      setChapter(chapterData);

      // Find current chapter index
      const index = chaptersData?.findIndex(ch => ch.id === chapterId) ?? -1;
      setCurrentIndex(index);

      // Update progress if enrolled and chapter is found
      if (progressData && chapterData) {
        await updateProgress(user.id, progressData, chapterData, chaptersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load chapter');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, chapterId]);

  const updateProgress = useCallback(async (
    userId: string,
    currentProgress: Progress,
    currentChapter: Chapter,
    chaptersData: Chapter[]
  ) => {
    try {
      setLoadingProgress(true);

      const totalChapters = chaptersData.length;
      const completedChapters = currentChapter.chapter_order;
      const newProgressPercentage = Math.min(
        Math.round((completedChapters / totalChapters) * 100),
        100
      );

      // Only update if progress increased
      if (newProgressPercentage > currentProgress.progress_percentage) {
        const updateData: Partial<Database['public']['Tables']['progress']['Update']> = {
          last_module_completed: completedChapters,
          progress_percentage: newProgressPercentage,
          status: newProgressPercentage === 100 ? 'completed' : 'in_progress',
        };

        const { data: updatedProgress, error } = await supabase
          .from('progress')
          .update(updateData)
          .eq('course_id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && updatedProgress) {
          setProgress(updatedProgress);
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigateToChapter = useCallback((index: number) => {
    if (index >= 0 && index < chapters.length) {
      router.push(`/course/${id}/chapter/${chapters[index].id}`);
    }
  }, [chapters, id]);

  const handlePrevious = useCallback(() => {
    navigateToChapter(currentIndex - 1);
  }, [currentIndex, navigateToChapter]);

  const handleNext = useCallback(async () => {
    if (currentIndex < chapters.length - 1) {
      navigateToChapter(currentIndex + 1);
    }
  }, [currentIndex, chapters, navigateToChapter]);

  const handleFinish = useCallback(() => {
    router.push(`/course/${id}`);
  }, [id]);

  if (!colors) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!isEnrolled) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          You need to enroll in the course to view this chapter
        </Text>
        <TouchableOpacity
          style={[styles.enrollButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/course/${id}`)}
        >
          <Text style={styles.buttonText}>Go to Course</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!chapter) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Chapter not found
        </Text>
        <TouchableOpacity
          style={[styles.enrollButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/course/${id}`)}
        >
          <Text style={styles.buttonText}>Back to Course</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.push(`/course/${id}`)} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Chapter {currentIndex + 1} of {chapters.length}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress indicator */}
      {progress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.progress_percentage}%`,
                  backgroundColor: colors.primary
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.subtext }]}>
            {progress.progress_percentage}% complete
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{chapter.title}</Text>
        <Markdown style={{
          body: { color: colors.text, fontSize: 16, lineHeight: 24 },
          paragraph: { marginBottom: 16 }
        }}>
          {chapter.content}
        </Markdown>
        {loadingProgress && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.progressLoader} />
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={[styles.navigationContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            {
              backgroundColor: colors.card,
              opacity: currentIndex > 0 ? 1 : 0.5,
              borderColor: colors.border
            }
          ]}
          onPress={handlePrevious}
          disabled={currentIndex <= 0}
        >
          <Feather name="chevron-left" size={20} color={colors.text} />
          <Text style={[styles.navButtonText, { color: colors.text }]}>Previous</Text>
        </TouchableOpacity>

        {currentIndex < chapters.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, { color: colors.background }]}>Next</Text>
            <Feather name="chevron-right" size={20} color={colors.background} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: colors.primary }]}
            onPress={handleFinish}
          >
            <Text style={[styles.navButtonText, { color: colors.background }]}>Finish</Text>
            <Feather name="check" size={20} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 16,
  },
  enrollButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    borderWidth: 1,
  },
  navButtonText: {
    fontWeight: '500',
    marginHorizontal: 4,
  },
  progressLoader: {
    marginVertical: 16,
  }
});