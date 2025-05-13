import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Feather from '@expo/vector-icons/Feather';
import Markdown from 'react-native-markdown-display';
import { Database } from '../../types/supabase';

type Course = Database['public']['Tables']['courses']['Row'];
type Chapter = Database['public']['Tables']['chapters']['Row'];
type Quiz = {
  id: string;
  course_id: string;
  title: string;
  duration_minutes: number;
};
type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];

export default function CourseDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [lastCompletedChapter, setLastCompletedChapter] = useState(0);

  // Add this at the top of your file
  const logData = (label: string, data: any) => {
    console.log(`=== ${label} ===`);
    console.log(JSON.stringify(data, null, 2));
  };

  // Then modify your useEffect like this:
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);

        // First check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log('Auth error or no user:', authError);
          router.push('/login');
          return;
        }

        // logData('User', user);

        // Fetch course data in parallel
        const fetchPromises = [
          supabase.from('courses').select('*').eq('id', id).single(),
          supabase.from('chapters').select('*').eq('course_id', id).order('chapter_order'),
          supabase.from('progress').select('progress_percentage, last_module_completed')
            .eq('course_id', id)
            .eq('user_id', user.id)
            .maybeSingle()
        ];

        // Add quiz fetch only if you expect a quiz
        fetchPromises.push(
          supabase.from('quizzes').select('*').eq('course_id', id).maybeSingle()
        );

        const [
          { data: courseData, error: courseError },
          { data: chaptersData, error: chaptersError },
          { data: progressData, error: progressError },
          { data: quizData, error: quizError }
        ] = await Promise.all(fetchPromises);

        // Log all responses
        // logData('Course Data', courseData);
        // logData('Chapters Data', chaptersData);
        // logData('Progress Data', progressData);
        // logData('Quiz Data', quizData);

        if (courseError) throw courseError;
        if (chaptersError) throw chaptersError;

        setCourse(courseData);
        setChapters(chaptersData || []);

        // Handle progress
        if (progressData) {
          setProgress(progressData.progress_percentage);
          setLastCompletedChapter(progressData.last_module_completed);
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }

        // Handle quiz
        if (quizData && !quizError) {
          setQuiz(quizData);
          const { data: questionsData, error: questionsError } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quizData.id)
            .order('question_order');

          if (!questionsError) {
            setQuizQuestions(questionsData || []);
            // logData('Quiz Questions', questionsData);
          }
        }

      } catch (error) {
        console.error('Error fetching course data:', error);
        Alert.alert('Error', 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const handleStartCourse = () => {
    if (chapters.length > 0) {
      router.push(`/course/${id}/chapter/${chapters[0].id}`);
    }
  };

  const handleTakeQuiz = () => {
    if (quiz) {
      router.push(`/course/${id}/quiz/${quiz.id}`);
    }
  };

  const toggleChapter = (index: number) => {
    setExpandedChapter(expandedChapter === index ? null : index);
  };

  const handleEnrollAndStart = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        router.push('/login');
        return;
      }

      // Create progress entry if not enrolled
      if (!isEnrolled) {
        const { error } = await supabase
          .from('progress')
          .insert([{
            user_id: user.id,
            course_id: id,
            progress_percentage: 0,
            last_module_completed: 0,
            status: 'in_progress'
          }]);

        if (error) throw error;
        setIsEnrolled(true);
        setProgress(0);
        setLastCompletedChapter(0);
      }

      // Find the next chapter to navigate to
      const nextChapter = chapters.find(ch =>
        ch.chapter_order > lastCompletedChapter
      ) || chapters[0];

      router.push(`/course/${id}/chapter/${nextChapter.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to start course. Please try again.');
      console.log(error);
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Course not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Back button and header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/learn")}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {course.title}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Course thumbnail */}
        {course.thumbnail_url && (
          <Image
            source={{ uri: course.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {/* Course meta info */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Feather name="book" size={16} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {course.category}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={16} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {course.duration_minutes} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="bar-chart-2" size={16} color={colors.subtext} />
            <Text style={[styles.metaText, { color: colors.subtext }]}>
              {course.skill_level}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: colors.primary
                  }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {progress}% complete
            </Text>
          </View>
        )}

        {/* Course description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Course</Text>
          <Markdown style={{
            body: { color: colors.text, fontSize: 16, lineHeight: 24 },
            paragraph: { marginBottom: 16 }
          }}>
            {course.description}
          </Markdown>
        </View>

        {/* Chapters list */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Course Content ({chapters.length} chapters)
          </Text>

          {chapters.map((chapter, index) => (
            <View key={chapter.id} style={[styles.chapterContainer, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.chapterHeader}
                onPress={() => toggleChapter(index)}
              >
                <View style={[styles.chapterNumber, { backgroundColor: colors.card }]}>
                  <Text style={[styles.chapterNumberText, { color: colors.text }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.chapterTitle, { color: colors.text }]}>
                  {chapter.title}
                </Text>
                <Feather
                  name={expandedChapter === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              {expandedChapter === index && (
                <View style={styles.chapterContent}>
                  {isEnrolled ? (
                    <>
                      <Markdown style={{
                        body: { color: colors.text, fontSize: 15, lineHeight: 22 },
                        paragraph: { marginBottom: 12 }
                      }}>
                        {chapter.content}
                      </Markdown>
                      <Text style={[styles.chapterDuration, { color: colors.subtext }]}>
                        Duration: {chapter.duration_minutes} minutes
                      </Text>
                      <TouchableOpacity
                        style={[styles.chapterButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.push(`/course/${id}/chapter/${chapter.id}`)}
                      >
                        <Text style={styles.chapterButtonText}>
                          {chapter.chapter_order > lastCompletedChapter ?
                            "Start Chapter" : "Review Chapter"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={{ color: colors.subtext, textAlign: 'center' }}>
                      Enroll in the course to view chapter content
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Quiz section */}
        {quiz && isEnrolled && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Final Quiz</Text>
            <View style={[styles.quizCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.quizTitle, { color: colors.text }]}>
                {quiz.title}
              </Text>
              <Text style={[styles.quizMeta, { color: colors.subtext }]}>
                {quizQuestions.length} questions • {quiz.duration_minutes} minutes
              </Text>
              <TouchableOpacity
                style={[styles.quizButton, { backgroundColor: colors.primary }]}
                onPress={handleTakeQuiz}
              >
                <Feather name="edit-3" size={16} color="white" />
                <Text style={styles.quizButtonText}>
                  {progress === 100 ? "Retake Quiz" : "Take Quiz"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleEnrollAndStart}
          >
            {!isEnrolled ? (
              <>
                <Feather name="play" size={16} color="white" />
                <Text style={styles.actionButtonText}>Start Course</Text>
              </>
            ) : progress === 100 ? (
              <>
                <Feather name="rotate-cw" size={16} color="white" />
                <Text style={styles.actionButtonText}>Review Course</Text>
              </>
            ) : (
              <>
                <Feather name="rotate-cw" size={16} color="white" />
                <Text style={styles.actionButtonText}>
                  Continue Learning ({progress}%)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chapterContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  chapterNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  chapterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chapterContent: {
    padding: 16,
    paddingTop: 0,
  },
  chapterDuration: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  chapterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chapterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  quizCard: {
    padding: 16,
    borderRadius: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quizMeta: {
    fontSize: 14,
    marginBottom: 16,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  quizButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actions: {
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});