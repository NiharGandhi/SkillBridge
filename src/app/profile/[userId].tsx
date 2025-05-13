import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Database } from '../../types/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
    company?: {
        name: string;
        logo_url: string | null;
    } | null;
};

export default function UserProfileScreen() {
    const { colors } = useTheme();
    const { userId } = useLocalSearchParams();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *,
                    company:companies(
                        name,
                        logo_url
                    )
                `)
                .eq('id', userId as string)
                .single();

            if (profileError) throw profileError;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewResume = async () => {
        if (!profile?.resume_url) {
            Alert.alert('No Resume', 'This user has not uploaded a resume.');
            return;
        }

        try {
            const url = new URL(profile.resume_url);
            const filePath = url.pathname.replace('/storage/v1/object/public/resumes/', '');

            const { data: signedUrl } = await supabase.storage
                .from('resumes')
                .createSignedUrl(filePath, 3600);

            if (!signedUrl) throw new Error('Failed to generate resume URL');

            router.push({
                pathname: '/pdf-viewer',
                params: { 
                    url: signedUrl.signedUrl,
                    title: `${profile.first_name}'s Resume`
                }
            });
        } catch (error) {
            console.error('Error viewing resume:', error);
            Alert.alert(
                'Error',
                'Failed to open resume. Please try again later.'
            );
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (error || !profile) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Profile not found'}</Text>
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="chevron-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Card */}
                <Card variant="elevated" style={{ ...styles.profileCard, backgroundColor: colors.card }}>
                    <View style={styles.profileHeader}>
                        <Avatar
                            uri={profile.avatar_url}
                            initials={`${profile.first_name?.charAt(0)}${profile.last_name?.charAt(0)}`}
                            size={90}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={[styles.name, { color: colors.text }]}>
                                {profile.first_name} {profile.last_name}
                            </Text>
                            <Badge
                                label={profile.role === 'student' ? 'Student' : 'Employer'}
                                variant={profile.role === 'student' ? 'primary' : 'secondary'}
                            />
                            {profile.company && (
                                <View style={styles.companyInfo}>
                                    <Text style={[styles.companyText, { color: colors.subtext }]}>
                                        {profile.company.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {profile.bio && (
                        <Text style={[styles.bio, { color: colors.text }]}>
                            {profile.bio}
                        </Text>
                    )}

                    {/* Skills Section */}
                    {profile.skills && profile.skills.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills</Text>
                            <View style={styles.skillsContainer}>
                                {profile.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        label={skill}
                                        variant="outline"
                                        style={styles.skillBadge}
                                        textStyle={{ color: colors.text }}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Resume Section for Students */}
                    {profile.role === 'student' && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resume</Text>
                            {profile.resume_url ? (
                                <Button
                                    title="View Resume"
                                    variant="outline"
                                    onPress={handleViewResume}
                                    icon={<Feather name="file-text" size={16} color={colors.primary} />}
                                    iconPosition="left"
                                />
                            ) : (
                                <Text style={[styles.noResumeText, { color: colors.subtext }]}>
                                    No resume uploaded
                                </Text>
                            )}
                        </View>
                    )}
                </Card>

                {/* Education Section */}
                {profile.education && (
                    <Card variant="default" style={{ ...styles.educationCard, backgroundColor: colors.card }}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
                        {/* Render education items here */}
                        <Text style={[styles.educationText, { color: colors.text }]}>
                            {JSON.stringify(profile.education, null, 2)}
                        </Text>
                    </Card>
                )}

                {/* Experience Section */}
                {profile.experience && (
                    <Card variant="default" style={{ ...styles.experienceCard, backgroundColor: colors.card }}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
                        {/* Render experience items here */}
                        <Text style={[styles.experienceText, { color: colors.text }]}>
                            {JSON.stringify(profile.experience, null, 2)}
                        </Text>
                    </Card>
                )}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        marginVertical: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
    },
    profileCard: {
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
    },
    profileHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 22,
        marginBottom: 8,
    },
    companyInfo: {
        marginTop: 8,
    },
    companyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    bio: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        marginBottom: 20,
        lineHeight: 22,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        marginBottom: 12,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillBadge: {
        marginBottom: 8,
    },
    noResumeText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        fontStyle: 'italic',
    },
    educationCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    educationText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    experienceCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    experienceText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
});