import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Database } from '../../types/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { CoursesCarousel } from '../../components/screens/CoursesCarousel';
import { ProfileSkeleton } from '../../components/skeletons/ProfileSkeleton';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    verified: boolean;
  } | null;
};

type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  progress_percentage?: number;
  is_instructor?: boolean;
};

type CourseFromProgress = {
  course_id: string;
  progress_percentage: number;
  courses: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    instructor_id: string;
  };
};

type CourseFromQuery = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  instructor_id?: string;
};

type Education = {
  degree: string;
  university: string;
  field_of_study: string;
  graduation_year: string;
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState(0);
  const [postedJobs, setPostedJobs] = useState(0);
  const [hiredCount, setHiredCount] = useState(0);
  const [applicantsCount, setApplicantsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Update your useEffect hooks at the top of the component
  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchStats();
      fetchCourses();
    }
  }, [profile]);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      // Fetch all courses user is enrolled in (for both students and companies)
      const { data: enrolledData, error: enrolledError } = await supabase
        .from('progress')
        .select(`
          course_id,
          progress_percentage,
          courses:course_id (
            id,
            title,
            description,
            thumbnail_url,
            instructor_id
          )
        `)
        .eq('user_id', user?.id) as { data: CourseFromProgress[] | null, error: any };;

      if (enrolledError) throw enrolledError;

      const enrolledCoursesData = (enrolledData || []).map(item => ({
        id: item.courses.id,
        title: item.courses.title,
        description: item.courses.description,
        thumbnail_url: item.courses.thumbnail_url,
        progress_percentage: item.progress_percentage,
        is_instructor: item.courses.instructor_id === user?.id
      }));

      setEnrolledCourses(enrolledCoursesData);

      // Fetch all courses created by user (for both students and companies)
      const { data: createdData, error: createdError } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url')
        .eq('instructor_id', user?.id) as { data: CourseFromQuery[] | null, error: any };

      if (createdError) throw createdError;

      const createdCoursesData = (createdData || []).map(course => ({
        ...course,
        is_instructor: true
      }));

      setCreatedCourses(createdCoursesData);

      // Combine all courses (for "View All" functionality)
      setAllCourses([
        ...enrolledCoursesData,
        ...(createdCoursesData || []).filter(
          created => !enrolledCoursesData.some(e => e.id === created.id)
        )
      ]);

    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          company:companies(
            id,
            name,
            logo_url,
            industry,
            verified
          )
        `)
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      if (user.role === 'student') {
        // Count completed courses
        const { count: courseCount } = await supabase
          .from('progress')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        setCompletedCourses(courseCount || 0);

        // Count applied jobs
        const { count: jobCount } = await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .eq('student_id', user.id);

        setAppliedJobs(jobCount || 0);
      } else {

        if (!profile?.company?.id) {
          return;
        }

        // Count posted jobs
        const { count: jobsCount } = await supabase
          .from('opportunities')
          .select('id', { count: 'exact' })
          .eq('company_id', profile?.company?.id);

        setPostedJobs(jobsCount || 0);

        const { count: applicantsCount } = await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .eq('company_id', profile.company.id);

        setApplicantsCount(applicantsCount || 0);

        // Count hired applicants
        const { count: hired } = await supabase
          .from('applications')
          .select('id', { count: 'exact' })
          .eq('company_id', profile?.company?.id)
          .eq('status', 'accepted')

        setHiredCount(hired || 0);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleManageCompany = () => {
    if (profile?.company?.id) {
      router.push(`/company/${profile.company.id}`);
    }
  };

  const handleViewPostedJobs = () => {
    if (profile?.company?.id) {
      router.push(`/company-jobs/${profile.company.id}`);
    }
  };

  const handleViewApplicants = () => {
    if (profile?.company?.id) {
      router.push(`/company-applicants/${profile.company.id}`);
    }
  };

  const handleCreateOpportunity = () => {
    router.push('company/create-opportunity');
  };

  const handleCreateCourse = () => {
    router.push('/create-course');
  };

  const handleUploadResume = async () => {
    if (!user) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];

      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      setLoading(true);

      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileExt = file.name.split('.').pop() || 'pdf';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const byteArray = new Uint8Array(
        atob(fileContent)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, byteArray, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ resume_url: publicUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      Alert.alert('Success', 'Resume uploaded successfully!');
      fetchProfile();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to upload resume'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async () => {
    if (!profile?.resume_url) return;

    try {
      const url = new URL(profile.resume_url);
      const filePath = url.pathname.replace('/storage/v1/object/public/resumes/', '');

      const { data: signedUrl } = await supabase.storage
        .from('resumes')
        .createSignedUrl(filePath, 3600);

      if (!signedUrl) throw new Error('No URL generated');

      router.push({
        pathname: '/pdf-viewer',
        params: { url: signedUrl.signedUrl }
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Error',
        'Failed to open resume. Please try again or re-upload the file.'
      );
    }
  };

  const handleAvatarUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload a profile picture');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      if (!image.base64) return;

      const fileExt = image.uri.split('.').pop()?.toLowerCase();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Upload image to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(image.base64), {
          contentType: image.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Could not upload image'
      );
    }
  };

  const handleCompanyLogoUpload = async () => {
    if (!profile?.company?.id) return;

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need access to your photos to upload a logo');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;
      const image = result.assets[0];
      if (!image.base64) return;

      const fileExt = image.uri.split('.').pop()?.toLowerCase();
      const fileName = `${profile.company.id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.company.id}/${fileName}`;

      // Upload to company-logos bucket
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, decode(image.base64), {
          contentType: image.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', profile.company.id);

      if (updateError) throw updateError;

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Logo upload error:', error);
      Alert.alert(
        'Upload failed',
        error instanceof Error ? error.message : 'Could not upload logo'
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditEducation = () => {
    router.push({
      pathname: '/edit-education',
      params: {
        education: profile?.education ? JSON.stringify(profile.education) : ''
      }
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setProfile(null);
      setCompletedCourses(0);
      setAppliedJobs(0);
      setPostedJobs(0);
      setHiredCount(0);
      setApplicantsCount(0);
      setAllCourses([]);
      setEnrolledCourses([]);
      setCreatedCourses([]);

      // Then fetch fresh data
      await fetchProfile();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]} // Customize the loading indicator color
            tintColor={colors.primary} // iOS only
            progressBackgroundColor={colors.background} // iOS only
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>My Profile</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <MaterialCommunityIcons name="logout" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <Card variant="elevated" style={{ ...styles.profileCard, backgroundColor: colors.card }}>
            <View style={styles.profileHeader}>
              {/* Replace the existing Avatar component with this */}
              <TouchableOpacity onPress={handleAvatarUpload}>
                <Avatar
                  uri={profile?.avatar_url}
                  initials={`${profile?.first_name?.charAt(0) || ''}${profile?.last_name?.charAt(0) || ''}`}
                  size={90}
                />
                <View style={styles.uploadOverlay}>
                  <MaterialIcons name="camera-alt" size={24} color="white" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {profile?.first_name} {profile?.last_name}
                </Text>
                <Text style={[styles.email, { color: colors.subtext }]}>
                  {user?.email}
                </Text>
                <View style={styles.roleBadgeContainer}>
                  <Badge
                    label={user?.role === 'student' ? 'Student' : 'Employer'}
                    variant={user?.role === 'student' ? 'primary' : 'secondary'}
                    size="small"
                  />
                  {user?.role === 'employer' && profile?.company?.verified && (
                    <Badge
                      label="Verified"
                      variant="success"
                      size="small"
                    />
                  )}
                </View>
              </View>
            </View>

            {profile?.bio && (
              <Text style={[styles.bio, { color: colors.text }]}>
                {profile.bio}
              </Text>
            )}

            <Button
              title="Edit Profile"
              variant="outline"
              onPress={handleEditProfile}
              icon={<Feather name="edit" size={16} color={colors.primary} />}
              iconPosition="left"
              style={styles.editButton}
            />

            {/* Stats Section */}
            <View style={[styles.statsContainer, { borderTopColor: colors.border }]}>
              {user?.role === 'student' ? (
                <>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="school" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{completedCourses}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Courses</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '10' }]}>
                      <Feather name="send" size={20} color={colors.accent} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{appliedJobs}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Applications</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.secondary + '10' }]}>
                      <Ionicons name="ribbon" size={20} color={colors.secondary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{profile?.skills?.length || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Skills</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '10' }]}>
                      <Feather name="briefcase" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{postedJobs}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Posted Jobs</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.success + '10' }]}>
                      <Ionicons name="people" size={20} color={colors.success} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{applicantsCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Applicants</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '10' }]}>
                      <Ionicons name="checkmark-done" size={20} color={colors.accent} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{hiredCount}</Text>
                    <Text style={[styles.statLabel, { color: colors.subtext }]}>Hired</Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Student Sections */}
          {user?.role === 'student' && (
            <>
              {/* Skills Section */}
              <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills & Expertise</Text>
                  <TouchableOpacity>
                    <AntDesign name="pluscircle" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.skillsContainer}>
                  {profile?.skills && profile.skills.length > 0 ? (
                    <View style={styles.skills}>
                      {profile.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          label={skill}
                          variant="outline"
                          style={styles.skill}
                          textStyle={{ color: colors.text }}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptySection}>
                      <Ionicons name="construct" size={32} color={colors.subtext} style={{ opacity: 0.5 }} />
                      <Text style={[styles.emptyText, { color: colors.subtext }]}>
                        Add your skills to showcase your expertise
                      </Text>
                    </View>
                  )}
                </View>
              </Card>

              {/* Resume Section */}
              <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Professional Documents</Text>
                </View>

                {loading ? (
                  <View style={styles.resumeLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : profile?.resume_url ? (
                  <View style={styles.resumeContainer}>
                    <View style={styles.resumeInfo}>
                      <Ionicons name="document-text" size={24} color={colors.primary} />
                      <Text
                        style={[styles.resumeText, { color: colors.text }]}
                        numberOfLines={1}
                        ellipsizeMode="middle"
                      >
                        {profile.resume_url.split('/').pop() || 'Resume.pdf'}
                      </Text>
                    </View>
                    <View style={styles.resumeActions}>
                      <Button
                        title="View"
                        variant="outline"
                        size="small"
                        onPress={handleViewResume}
                        icon={<Feather name="eye" size={16} color={colors.primary} />}
                        style={styles.resumeButton}
                      />
                      <Button
                        title="Replace"
                        variant="outline"
                        size="small"
                        onPress={handleUploadResume}
                        icon={<Feather name="refresh-cw" size={16} color={colors.warning} />}
                        textStyle={{ color: colors.warning }}
                        style={{ ...styles.resumeButton, borderColor: colors.warning }}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySection}>
                    <Ionicons name="document-attach" size={32} color={colors.subtext} style={{ opacity: 0.5 }} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                      Upload your resume to apply for opportunities
                    </Text>
                    <Button
                      title="Upload Resume"
                      variant="primary"
                      onPress={handleUploadResume}
                      icon={<Feather name="upload" size={16} color="white" />}
                      iconPosition="left"
                      style={styles.uploadButton}
                    />
                  </View>
                )}
              </Card>

              {/* Education Section */}
              <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
                  <TouchableOpacity onPress={handleEditEducation}>
                    <AntDesign name={profile?.education ? "edit" : "pluscircle"} size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {profile?.education ? (
                  <View style={styles.educationContainer}>
                    {Object.entries(JSON.parse(JSON.stringify(profile.education))).filter(([key, value]) => value).map(([key, value]) => (
                      <View key={key} style={styles.educationItem}>
                        <Text style={[styles.educationLabel, { color: colors.subtext }]}>
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                        </Text>
                        <Text style={[styles.educationValue, { color: colors.text }]}>{value}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptySection}>
                    <Ionicons name="school" size={32} color={colors.subtext} style={{ opacity: 0.5 }} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                      Add your education details to enhance your profile
                    </Text>
                  </View>
                )}
              </Card>
            </>
          )}

          {/* Employer Sections */}
          {user?.role === 'employer' && (
            <>
              {/* Company Section */}
              <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Company Profile</Text>
                  <TouchableOpacity onPress={handleManageCompany}>
                    <Feather name="edit" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {profile?.company ? (
                  <View style={styles.companyContainer}>
                    <View style={styles.companyHeader}>
                      <TouchableOpacity onPress={handleCompanyLogoUpload}>
                        <Avatar
                          uri={profile.company.logo_url || null}
                          initials={profile.company.name.charAt(0)}
                          size={70}
                        />
                        <View style={styles.uploadOverlay}>
                          <MaterialIcons name="camera-alt" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
                      <View style={styles.companyInfo}>
                        <Text style={[styles.companyName, { color: colors.text }]}>
                          {profile.company.name}
                        </Text>
                        {profile.company.industry && (
                          <Text style={[styles.companyIndustry, { color: colors.subtext }]}>
                            {profile.company.industry}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.companyActions}>
                      <Button
                        title="View Posted Jobs"
                        variant="outline"
                        onPress={handleViewPostedJobs}
                        icon={<Feather name="briefcase" size={16} color={colors.primary} />}
                        iconPosition="left"
                        style={styles.companyActionButton}
                      />
                      <Button
                        title="View Applicants"
                        variant="outline"
                        onPress={handleViewApplicants}
                        icon={<Feather name="users" size={16} color={colors.primary} />}
                        iconPosition="left"
                        style={styles.companyActionButton}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySection}>
                    <Ionicons name="business" size={32} color={colors.subtext} style={{ opacity: 0.5 }} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>
                      Create your company profile to post opportunities
                    </Text>
                    <Button
                      title="Create Company Profile"
                      variant="primary"
                      onPress={() => router.push('/create-company')}
                      icon={<Feather name="plus" size={16} color="white" />}
                      iconPosition="left"
                      style={styles.createCompanyButton}
                    />
                  </View>
                )}
              </Card>

              {/* Quick Actions Section */}
              <Card variant="default" style={{ ...styles.sectionCard, backgroundColor: colors.card }}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                </View>
                <View style={styles.quickActions}>
                  <Button
                    title="Post New Opportunity"
                    variant="primary"
                    onPress={handleCreateOpportunity}
                    icon={<Feather name="plus" size={16} color="white" />}
                    iconPosition="left"
                    style={styles.quickActionButton}
                  />
                </View>
              </Card>
            </>
          )}

          {/* Enrolled Courses */}
          {user?.role === "student" &&
            <>
              <Button
                title="Create Training Course"
                variant="outline"
                onPress={handleCreateCourse}
                icon={<Feather name="book" size={16} color={colors.primary} />}
                iconPosition="left"
                style={styles.quickActionButton}
              />
              <CoursesCarousel
                title="My Courses"
                courses={enrolledCourses}
                loading={coursesLoading}
                onViewAll={() => router.push('/learn')}
                showProgress={true}
              />
              {/* Created Courses - only show if user has created courses */}
              {createdCourses.length > 0 && (
                <CoursesCarousel
                  title="Created Courses"
                  courses={createdCourses}
                  loading={coursesLoading}
                  onViewAll={() => router.push('/created-courses')}
                />
              )}
            </>

          }
        </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  logoutButton: {
    padding: 8,
  },
  profileCard: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    marginBottom: 2,
    lineHeight: 28,
  },
  email: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  bio: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    marginBottom: 20,
    lineHeight: 22,
    opacity: 0.9,
  },
  editButton: {
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    opacity: 0.7,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
  },
  skillsContainer: {
    marginTop: 4,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skill: {
    marginBottom: 8,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.7,
    lineHeight: 20,
    maxWidth: '80%',
  },
  companyContainer: {
    marginTop: 4,
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  companyInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 4,
    lineHeight: 24,
  },
  companyIndustry: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    opacity: 0.7,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  companyStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  companyStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  companyStatLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  companyActions: {
    marginTop: 8,
  },
  companyActionButton: {
    marginBottom: 12,
  },

  quickActions: {
    marginTop: 8,
  },
  quickActionButton: {
    marginBottom: 12,
  },
  resumeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  resumeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 12,
    flexShrink: 1,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resumeButton: {
    minWidth: 80,
  },
  resumeLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: 16,
  },
  createCompanyButton: {
    marginTop: 12,
  },
  coursesScroll: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  courseCard: {
    width: 220,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  courseThumbnail: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    padding: 12,
  },
  courseTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginBottom: 4,
  },
  courseDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginBottom: 12,
    opacity: 0.8,
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
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textAlign: 'right',
  },
  instructorBadge: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationContainer: {
    marginTop: 8,
  },
  educationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
  },
  educationLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    opacity: 0.7,
  },
  educationValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});