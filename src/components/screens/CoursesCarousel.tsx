import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { router } from 'expo-router';

type Course = {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    progress_percentage?: number;
    is_instructor?: boolean;
};

interface CoursesCarouselProps {
    title: string;
    courses: Course[];
    loading?: boolean;
    onViewAll?: () => void;
    onAddCourse?: () => void;
    showProgress?: boolean;
}

export const CoursesCarousel: React.FC<CoursesCarouselProps> = ({
    title,
    courses,
    loading = false,
    onViewAll,
    onAddCourse,
    showProgress = false,
}) => {
    const { colors } = useTheme();

    const renderCourseCard = (course: Course) => (
        <View key={course.id} style={styles.courseCardShadow}>
            <TouchableOpacity
                key={course.id}
                style={[styles.courseCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/course/${course.id}`)}
            >
                {course.thumbnail_url ? (
                    <Image
                        source={{ uri: course.thumbnail_url }}
                        style={styles.courseThumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.courseThumbnail, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="book" size={32} color={colors.primary} />
                    </View>
                )}
                <View style={styles.courseInfo}>
                    <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                        {course.title}
                    </Text>
                    <Text style={[styles.courseDesc, { color: colors.subtext }]} numberOfLines={2}>
                        {course.description}
                    </Text>
                    {showProgress && course.progress_percentage !== undefined && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { backgroundColor: colors.primary + '30' }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${course.progress_percentage}%`, backgroundColor: colors.primary }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.progressText, { color: colors.primary }]}>
                                {Math.round(course.progress_percentage)}% complete
                            </Text>
                        </View>
                    )}
                    {course.is_instructor && (
                        <Text style={[styles.instructorBadge, { color: colors.primary }]}>
                            Your Course
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <Card variant="default" style={{ ...styles.container, backgroundColor: colors.card }}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll}>
                        <Text style={{ color: colors.primary }}>View All</Text>
                    </TouchableOpacity>
                )}
                {onAddCourse && (
                    <TouchableOpacity onPress={onAddCourse}>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : courses.length > 0 ? (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {courses.map(renderCourseCard)}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={32} color={colors.subtext} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                        No courses found
                    </Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        paddingVertical: 8,
        paddingRight: 16,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    courseDesc: {
        fontSize: 13,
        opacity: 0.8,
        marginBottom: 12,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        textAlign: 'right',
    },
    instructorBadge: {
        fontSize: 12,
        marginTop: 8,
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        opacity: 0.7,
    },
    courseCardShadow: {
        width: 220,
        height: 280, // Fixed height
        borderRadius: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    courseCard: {
        width: '100%',
        height: '100%', // Take full height of parent
        borderRadius: 12,
        overflow: 'hidden',
    },
    courseThumbnail: {
        width: '100%',
        height: 120, // Keep thumbnail height fixed
        justifyContent: 'center',
        alignItems: 'center',
    },
    courseInfo: {
        padding: 12,
        flex: 1, // Take remaining space
    },
});