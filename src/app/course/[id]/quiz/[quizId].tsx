import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Database } from '../../../../types/supabase';
import { useTheme } from '../../../../context/ThemeContext';
import { supabase } from '../../../../lib/supabase';

type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];

export default function QuizScreen() {
  const { colors } = useTheme();
  const { id, quizId } = useLocalSearchParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('question_order', { ascending: true });

        if (error) throw error;
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();

    // Timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    // Calculate score
    const correctAnswers = questions.filter(q =>
      selectedAnswers[q.id] === q.correct_answer
    ).length;
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);

    // Update progress if score is passing (80%)
    if (finalScore >= 80) {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        // Get current progress
        const { data: currentProgress } = await supabase
          .from('progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .single();

        // Only update if not already completed
        if (currentProgress && currentProgress.status !== 'completed') {
          await supabase
            .from('progress')
            .update({
              progress_percentage: 100,
              status: 'completed',
            })
            .eq('user_id', user.id)
            .eq('course_id', id);
        }
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.timer, { color: colors.text }]}>
            Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        {score !== null ? (
          <View style={styles.resultContainer}>
            <Text style={[styles.scoreText, { color: colors.text }]}>
              Your Score: {score}%
            </Text>
            <Text style={[styles.resultText, { color: colors.text }]}>
              {score >= 80 ?
                "Congratulations! You've passed the quiz!" :
                "Try again to pass the quiz (minimum 80% required)"}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.replace(`/course/${id}`)}
            >
              <Text style={styles.retryButtonText}>
                {score >= 80 ? "Back to Course" : "Retry Quiz"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          questions.map((question, index) => (
            <View key={question.id} style={styles.questionContainer}>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {index + 1}. {question.question}
              </Text>
              {question.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.optionButton,
                    selectedAnswers[question.id] === option && {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary,
                    }
                  ]}
                  onPress={() => handleAnswerSelect(question.id, option)}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {score === null && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit Quiz</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: 20,
  },
  timer: {
    fontSize: 16,
    fontWeight: '500',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    padding: 20,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});