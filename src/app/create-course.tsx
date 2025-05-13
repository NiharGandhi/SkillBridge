import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { GoogleGenAI } from '@google/genai';

interface AICourseResponse {
    title: string;
    description: string;
    category?: string;
    skill_level?: 'beginner' | 'intermediate' | 'advanced';
    duration_minutes?: number;
    chapters: {
        title: string;
        content: string;
        duration_minutes?: number;
    }[];
    quiz?: {
        questions: {
            question: string;
            options: string[];
            answer: string;
        }[];
    };
}

export default function CreateCourseScreen() {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: '',
        skill_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        duration_minutes: 60,
        aiGeneratedContent: null as AICourseResponse | null
    });
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    const google_api_key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const genAI = new GoogleGenAI({ apiKey: google_api_key });

    const generateCourseWithAI = async (): Promise<AICourseResponse | null> => {
        if (!aiPrompt.trim()) {
            Alert.alert('Error', 'Please describe what you want to learn');
            return null;
        }

        setAiGenerating(true);

        try {
            const prompt = ` You are an expert course creator. Generate a comprehensive course based on: "${aiPrompt}". Respond with a JSON object containing: - title: Course title - description: Detailed description (3-5 sentences) - category: Main category - skill_level: beginner/intermediate/advanced - duration_minutes: Estimated total duration - chapters: Array of 5-7 chapters, each with: * title: Chapter title * content: Detailed content (3-5 paragraphs) * duration_minutes: Estimated duration - quiz: Object with: * questions: Array of 5 questions, each with: - question: The question text - options: Array of 4 options - answer: Correct answer Respond ONLY with the JSON object, no additional text or markdown. `;

            const response = await genAI.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });

            let completeText = response.text;
            let jsonString = completeText;

            try {
                const jsonMatch = completeText?.match(/```json([\s\S]*?)```/);
                if (jsonMatch) jsonString = jsonMatch[1];

                if (!jsonString) {
                    Alert.alert('Error', "Something went wrong, please try again later.");
                    return null;
                }

                const aiCourse = JSON.parse(jsonString) as AICourseResponse;

                console.log("ai:", aiCourse)

                if (!aiCourse.title || !aiCourse.description || !aiCourse.chapters?.length) {
                    throw new Error("Invalid AI response structure");
                }

                return {
                    ...aiCourse,
                    category: aiCourse.category || 'General',
                    skill_level: aiCourse.skill_level || 'beginner',
                    duration_minutes: aiCourse.duration_minutes || 60,
                    chapters: aiCourse.chapters.map(ch => ({
                        ...ch,
                        duration_minutes: ch.duration_minutes || 15
                    }))
                };
            } catch (parseError) {
                console.error('Parsing failed:', parseError, 'Response:', completeText);
                throw new Error("Failed to process AI response");
            }
        } catch (error) {
            Alert.alert('Generation Error', 'Failed to generate content');
            console.error(error)
            return null;
        } finally {
            setAiGenerating(false);
        }
    };

    const handleCreateCourse = async (aiContent: AICourseResponse) => {
        if (!user) {
            Alert.alert('Error', 'Authentication required');
            return;
        }

        setLoading(true);

        try {
            // Create course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .insert({
                    title: aiContent.title,
                    description: aiContent.description,
                    category: aiContent.category || 'General',
                    skill_level: aiContent.skill_level || 'beginner',
                    duration_minutes: aiContent.duration_minutes || 60,
                    is_ai_generated: true,
                    instructor_id: user.id
                })
                .select()
                .single();

            if (courseError || !courseData) throw courseError || new Error('Course creation failed');

            // Auto-enroll the creator
            await supabase
                .from('progress')
                .insert([{
                    user_id: user.id,
                    course_id: courseData.id,
                    progress_percentage: 0,
                    last_module_completed: 0,
                    status: 'in_progress'
                }]);

            // Create chapters
            if (aiContent.chapters?.length) {
                await supabase.from('chapters').insert(
                    aiContent.chapters.map((chapter, index) => ({
                        course_id: courseData.id,
                        title: chapter.title,
                        content: chapter.content,
                        duration_minutes: chapter.duration_minutes || 15,
                        chapter_order: index + 1
                    }))
                );
            }

            // Create quiz
            if (aiContent.quiz?.questions?.length) {
                const { data: quizData } = await supabase
                    .from('quizzes')
                    .insert({
                        course_id: courseData.id,
                        title: `${aiContent.title} Quiz`,
                        duration_minutes: 10
                    })
                    .select()
                    .single();

                if (quizData) {
                    await supabase.from('quiz_questions').insert(
                        aiContent.quiz.questions.map((question, index) => ({
                            quiz_id: quizData.id,
                            question: question.question,
                            options: question.options,
                            correct_answer: question.answer,
                            question_order: index + 1
                        }))
                    );
                }
            }

            Alert.alert('Success', 'Course created!', [{
                text: 'OK',
                onPress: () => {
                    setCourse({
                        title: '',
                        description: '',
                        category: '',
                        skill_level: 'beginner',
                        duration_minutes: 60,
                        aiGeneratedContent: null
                    });
                    router.push(`/course/${courseData.id}`);
                }
            }]);

        } catch (error) {
            Alert.alert('Error', 'Failed to save course');
            console.error(error)
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAndCreate = async () => {
        const aiContent = await generateCourseWithAI();
        if (aiContent) {
            // Update UI state
            setCourse(prev => ({
                ...prev,
                title: aiContent.title,
                description: aiContent.description,
                category: aiContent.category || 'General',
                skill_level: aiContent.skill_level || 'beginner',
                duration_minutes: aiContent.duration_minutes || 60,
                aiGeneratedContent: aiContent
            }));

            // Create course with fresh AI content
            await handleCreateCourse(aiContent);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Create Course with AI</Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Course Topic *</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            height: 100,
                            textAlignVertical: 'top',
                        }]}
                        value={aiPrompt}
                        onChangeText={setAiPrompt}
                        placeholder="Describe your course..."
                        placeholderTextColor={colors.subtext}
                        multiline
                    />
                </View>

                <Button
                    title={aiGenerating || loading ? "Processing..." : "Create Course with AI"}
                    onPress={handleGenerateAndCreate}
                    loading={aiGenerating || loading}
                    disabled={!aiPrompt.trim()}
                />

                {course.aiGeneratedContent && (
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.label, { color: colors.text }]}>Generated Course:</Text>
                        <Text style={{ color: colors.text }}>{course.title}</Text>
                        <Text style={{ color: colors.subtext }}>{course.description}</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// Keep the same styles as before
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
});