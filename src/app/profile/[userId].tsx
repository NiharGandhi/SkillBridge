import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';

import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Database } from '../../types/supabase';
import { useTheme } from '../../context/ThemeContext';
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
    education?: {
        degree: string;
        field_of_study: string;
        graduation_year: string;
        university: string;
    };
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
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with gradient background */}
                <ImageBackground 
                    source={{ uri: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=2940&auto=format&fit=crop' }}
                    style={styles.headerBackground}
                    imageStyle={styles.headerImageStyle}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent']}
                        style={styles.gradientOverlay}
                    >
                        <View style={styles.headerContent}>
                            <TouchableOpacity 
                                onPress={() => router.back()}
                                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                            >
                                <Feather name="chevron-left" size={20} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Profile</Text>
                            <View style={{ width: 40 }} />
                        </View>
                    </LinearGradient>
                </ImageBackground>

                {/* Profile Content */}
                <View style={styles.profileContent}>
                    {/* Avatar floating over header */}
                    <View style={styles.avatarContainer}>
                        <Avatar
                            uri={profile.avatar_url}
                            initials={`${profile.first_name?.charAt(0)}${profile.last_name?.charAt(0)}`}
                            size={120}
                        />
                    </View>

                    {/* Profile Info Card */}
                    <Card variant="elevated" style={{ ...styles.profileInfoCard, backgroundColor: colors.card }}>
                        <View style={styles.profileHeader}>
                            <View style={styles.nameContainer}>
                                <Text style={[styles.name, { color: colors.text }]}>
                                    {profile.first_name} {profile.last_name}
                                </Text>
                                <Badge
                                    label={profile.role === 'student' ? 'Student' : 'Employer'}
                                    variant={profile.role === 'student' ? 'primary' : 'secondary'}
                                    size="small"
                                />
                            </View>
                            
                            {profile.company && (
                                <View style={styles.companyInfo}>
                                    <Feather name="briefcase" size={16} color={colors.subtext} />
                                    <Text style={[styles.companyText, { color: colors.subtext }]}>
                                        {profile.company.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </Card>

                    {/* Bio Section */}
                    {profile.bio && (
                        <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                            <View style={styles.sectionHeader}>
                                <Feather name="user" size={20} color={colors.primary} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
                            </View>
                            <Text style={[styles.bio, { color: colors.text }]}>
                                {profile.bio}
                            </Text>
                        </Card>
                    )}

                    {/* Skills Section */}
                    {profile.skills && profile.skills.length > 0 && (
                        <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                            <View style={styles.sectionHeader}>
                                <Feather name="award" size={20} color={colors.primary} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills</Text>
                            </View>
                            <View style={styles.skillsContainer}>
                                {profile.skills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        label={skill}
                                        style={{ ...styles.skillBadge, backgroundColor: colors.primary + '20' }}
                                        textStyle={{ color: colors.primary }}
                                        size="small"
                                    />
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Education Section */}
                    {profile.education && (
                        <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                            <View style={styles.sectionHeader}>
                                <Feather name="book" size={20} color={colors.primary} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
                            </View>
                            <View style={styles.educationItem}>
                                <View style={styles.educationDetails}>
                                    <Text style={[styles.educationDegree, { color: colors.text }]}>
                                        {profile.education.degree} in {profile.education.field_of_study}
                                    </Text>
                                    <View style={styles.educationSchoolContainer}>
                                        <Feather name="map-pin" size={14} color={colors.primary} />
                                        <Text style={[styles.educationSchool, { color: colors.primary }]}>
                                            {profile.education.university}
                                        </Text>
                                    </View>
                                    <View style={styles.educationMeta}>
                                        <Feather name="calendar" size={14} color={colors.subtext} />
                                        <Text style={[styles.educationDate, { color: colors.subtext }]}>
                                            Graduation: {profile.education.graduation_year}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Resume Section for Students */}
                    {profile.role === 'student' && (
                        <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                            <View style={styles.sectionHeader}>
                                <Feather name="file-text" size={20} color={colors.primary} />
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Resume</Text>
                            </View>
                            {profile.resume_url ? (
                                <Button
                                    title="View Resume"
                                    onPress={handleViewResume}
                                    icon={<Feather name="download" size={18} color="white" />}
                                    iconPosition="right"
                                    style={styles.resumeButton}
                                />
                            ) : (
                                <View style={styles.noResumeContainer}>
                                    <Feather name="file" size={24} color={colors.subtext} />
                                    <Text style={[styles.noResumeText, { color: colors.subtext }]}>
                                        No resume uploaded
                                    </Text>
                                </View>
                            )}
                        </Card>
                    )}
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
    scrollContent: {
        paddingBottom: 32,
    },
    headerBackground: {
        height: 120,
        width: '100%',
    },
    headerImageStyle: {
        opacity: 0.8,
    },
    gradientOverlay: {
        flex: 1,
        paddingTop: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: 'white',
        textAlign: 'center',
    },
    profileContent: {
        paddingHorizontal: 20,
        marginTop: -60,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    avatar: {
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileInfoCard: {
        marginBottom: 20,
        padding: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileHeader: {
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    name: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 24,
        marginRight: 8,
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    companyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
    },
    sectionCard: {
        marginBottom: 20,
        padding: 20,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
    },
    bio: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        lineHeight: 22,
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    skillBadge: {
        borderWidth: 0,
    },
    noResumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    noResumeText: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        fontStyle: 'italic',
    },
    resumeButton: {
        alignSelf: 'stretch',
    },
    educationItem: {
        flexDirection: 'row',
    },
    educationDetails: {
        flex: 1,
    },
    educationDegree: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        marginBottom: 8,
    },
    educationSchoolContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    educationSchool: {
        fontFamily: 'Inter-Medium',
        fontSize: 15,
    },
    educationMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    educationDate: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },
});