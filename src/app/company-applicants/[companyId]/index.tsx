import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Database } from '../../../types/supabase';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';

type ApplicationStatus = 'all' | 'pending' | 'reviewing' | 'accepted' | 'rejected';

type Application = Database['public']['Tables']['applications']['Row'] & {
    opportunity: {
        id: string;
        title: string;
        company_id: string;
    };
    student?: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    } | null;
};

const CompanyApplicantsScreen = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const { companyId } = useLocalSearchParams();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<ApplicationStatus>('all');
    const [profileError, setProfileError] = useState<string | null>(null);

    // Fetch applications data
    useEffect(() => {
        fetchApplications();
    }, [companyId, filter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setProfileError(null);

            const companyId = await getCompanyId();
            if (!companyId) return;

            const opportunityIds = await getCompanyOpportunityIds(companyId);
            if (!opportunityIds.length) {
                setApplications([]);
                return;
            }

            const applicationsData = await getApplicationsForOpportunities(opportunityIds);
            setApplications(applicationsData || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setProfileError('Error loading applicant data. Please check permissions.');
            setFilter('all'); // Reset filter on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getCompanyId = async () => {
        const { data: companyData, error: companyError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user?.id)
            .single();

        if (companyError || !companyData) {
            throw companyError || new Error('Company not found');
        }

        return companyData.company_id;
    };

    const getCompanyOpportunityIds = async (companyId: string) => {
        const { data: opportunities, error: opportunitiesError } = await supabase
            .from('opportunities')
            .select('id')
            .eq('company_id', companyId);

        if (opportunitiesError) throw opportunitiesError;
        return opportunities?.map(opp => opp.id) || [];
    };

    const getApplicationsForOpportunities = async (opportunityIds: string[]) => {
        if (!opportunityIds.length) return [];

        // First get the user's company_id
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('company_id, resume_url')
            .eq('id', user?.id)
            .single();

        if (profileError || !profile) throw profileError || new Error('Profile not found');

        let query = supabase
            .from('applications')
            .select(`
            *,
            opportunity:opportunities(id, title, company_id),
            student:profiles!student_id(first_name, last_name, avatar_url)
        `)
            .in('opportunity_id', opportunityIds)
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false });

        // Add status filter if not 'all'
        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data: applicationsData, error } = await query;

        if (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }

        return applicationsData;
    };

    const handleViewResume = async (resumeUrl: string | null) => {
        if (!resumeUrl) {
            Alert.alert('No Resume', 'This applicant has not uploaded a resume yet.');
            return;
        }

        try {
            // Extract the file path from the public URL
            const url = new URL(resumeUrl);
            const filePath = url.pathname.replace('/storage/v1/object/public/resumes/', '');

            // Create a signed URL that's valid for 1 hour
            const { data: signedUrl } = await supabase.storage
                .from('resumes')
                .createSignedUrl(filePath, 3600);

            if (!signedUrl) throw new Error('Failed to generate resume URL');

            router.push({
                pathname: '/pdf-viewer',
                params: {
                    url: signedUrl.signedUrl,
                    title: 'Applicant Resume'
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

    const handleRefresh = () => {
        setRefreshing(true);
        fetchApplications();
    };

    const handleViewApplication = (profileId: string) => {
        router.push(`/profile/${profileId}`);
    };

    const handleUpdateStatus = async (applicationId: string, status: string) => {
        try {
            setLoading(true);

            const companyId = await getCompanyId();
            if (!companyId) {
                throw new Error('Company not found');
            }

            await verifyApplicationOwnership(applicationId, companyId);

            const { error } = await supabase
                .from('applications')
                .update({ status })
                .eq('id', applicationId);

            await fetchApplications();

            if (error) {
                throw error
            };

        } catch (error) {
            console.error('Error updating application status:', error);
            Alert.alert(
                'Update Failed',
                error instanceof Error ? error.message : 'Failed to update application status'
            );
        } finally {
            setLoading(false);
        }
    };


    const verifyApplicationOwnership = async (applicationId: string, companyId: string) => {
        const { data: application, error: verifyError } = await supabase
            .from('applications')
            .select('opportunity_id')
            .eq('id', applicationId)
            .single();

        if (verifyError || !application) {
            throw verifyError || new Error('Application not found');
        }

        const { data: opportunity, error: opportunityError } = await supabase
            .from('opportunities')
            .select('company_id')
            .eq('id', application.opportunity_id)
            .single();

        if (opportunityError || !opportunity) {
            throw opportunityError || new Error('Opportunity not found');
        }

        if (opportunity.company_id !== companyId) {
            throw new Error('Not authorized to update this application');
        }
    };

    const getStatusColor = (status: string) => {
        const statusColors = {
            pending: colors.warning,
            reviewing: colors.notification,
            accepted: colors.success,
            rejected: colors.error,
        };

        return statusColors[status as keyof typeof statusColors] || colors.subtext;
    };

    const renderApplication = ({ item }: { item: Application }) => {
        const studentName = item.student
            ? `${item.student.first_name || ''} ${item.student.last_name || ''}`.trim() ||
            `User ${item.student_id.substring(0, 6)}`
            : `User ${item.student_id.substring(0, 6)}`;

        const studentInitials = item.student
            ? `${item.student.first_name?.charAt(0) || ''}${item.student.last_name?.charAt(0) || ''}` ||
            item.student_id.substring(0, 2).toUpperCase()
            : item.student_id.substring(0, 2).toUpperCase();

        return (
            <ApplicationCard
                item={item}
                studentName={studentName}
                studentInitials={studentInitials}
                colors={colors}
                loading={loading}
                onViewApplication={handleViewApplication}
                onUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                handleViewResume={handleViewResume}
            />
        );
    };

    const renderFilterButton = (status: ApplicationStatus, label: string) => {
        const isActive = filter === status;
        const activeColor = {
            all: colors.primary,
            pending: colors.warning,
            reviewing: colors.notification,
            accepted: colors.success,
            rejected: colors.error,
        }[status];

        return (
            <TouchableOpacity
                style={[
                    styles.filterButton,
                    isActive && {
                        backgroundColor: activeColor + '20',
                        borderColor: activeColor,
                        borderWidth: 1,
                    }
                ]}
                onPress={() => {
                    setFilter(status);
                    setRefreshing(true);
                    fetchApplications();
                }}
            >
                <Text style={[
                    styles.filterText,
                    { color: isActive ? activeColor : colors.text },
                    isActive && { fontFamily: 'Inter-SemiBold' }
                ]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return <LoadingScreen colors={colors} />;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>Applicants</Text>
                <View style={{ width: 24 }} />
            </View>

            {profileError && (
                <ErrorBanner message={profileError} colors={colors} />
            )}

            <FilterBar colors={colors}>
                {renderFilterButton('all', 'All')}
                {renderFilterButton('pending', 'Pending')}
                {renderFilterButton('accepted', 'Accepted')}
                {renderFilterButton('rejected', 'Rejected')}
            </FilterBar>

            <ApplicationsList
                applications={applications}
                renderItem={renderApplication}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                filter={filter}
                colors={colors}
            />
        </SafeAreaView>
    );
};

// Extracted Components
const LoadingScreen = ({ colors }: { colors: any }) => (
    <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
    </SafeAreaView>
);

const ErrorBanner = ({ message, colors }: { message: string; colors: any }) => (
    <View style={[styles.errorBanner, { backgroundColor: colors.warning + '20' }]}>
        <Text style={[styles.errorText, { color: colors.warning }]}>
            {message}
        </Text>
    </View>
);

const FilterBar = ({ children, colors }: { children: React.ReactNode; colors: any }) => (
    <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
        >
            {children}
        </ScrollView>
    </View>
);

const ApplicationsList = ({
    applications,
    renderItem,
    refreshing,
    onRefresh,
    filter,
    colors
}: {
    applications: Application[];
    renderItem: any;
    refreshing: boolean;
    onRefresh: () => void;
    filter: ApplicationStatus;
    colors: any
}) => (
    <FlatList
        data={applications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <EmptyList filter={filter} colors={colors} />
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
    />
);

const EmptyList = ({ filter, colors }: { filter: ApplicationStatus; colors: any }) => (
    <View style={styles.emptyContainer}>
        <Ionicons name="people" size={48} color={colors.subtext} style={{ opacity: 0.5 }} />
        <Text style={[styles.emptyText, { color: colors.subtext }]}>
            {filter === 'all'
                ? 'No applicants found'
                : `No ${filter} applications`}
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.subtext }]}>
            {filter === 'all'
                ? 'No one has applied to your opportunities yet'
                : 'Try changing your filters or check back later'}
        </Text>
    </View>
);

const ApplicationCard = ({
    item,
    studentName,
    studentInitials,
    colors,
    loading,
    onViewApplication,
    onUpdateStatus,
    getStatusColor,
    handleViewResume
}: {
    item: Application;
    studentName: string;
    studentInitials: string;
    colors: any;
    loading: boolean;
    onViewApplication: (id: string) => void;
    onUpdateStatus: (id: string, status: string) => void
    getStatusColor: any;
    handleViewResume: (resumeUrl: string | null) => void;
}) => {

    const statusColor = getStatusColor(item.status);
    const showAccept = item.status !== 'accepted';
    const showReject = item.status !== 'rejected';

    return (
        <Card variant="default" style={{ ...styles.applicationCard, backgroundColor: colors.card }}>
            <View style={styles.applicationHeader}>
                <TouchableOpacity
                    style={styles.studentInfo}
                    onPress={() => onViewApplication(item.student_id)}
                >
                    <Avatar
                        uri={item.student?.avatar_url || null}
                        initials={studentInitials}
                        size={48}
                    />
                    <View style={styles.studentDetails}>
                        <Text style={[styles.studentName, { color: colors.text }]}>
                            {studentName}
                        </Text>
                        <Text style={[styles.opportunityTitle, { color: colors.primary }]}>
                            {item.opportunity.title}
                        </Text>
                        {!item.student && (
                            <Text style={[styles.missingProfileText, { color: colors.warning }]}>
                                Profile incomplete
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
                <Badge
                    label={item.status}
                    variant="outline"
                    textStyle={{ color: statusColor }}
                    style={{ borderColor: statusColor }}
                />
            </View>


            <View style={[styles.applicationMeta, { borderTopColor: colors.border }]}>
                <View style={styles.metaItem}>
                    <Feather name="calendar" size={14} color={colors.subtext} />
                    <Text style={[styles.metaText, { color: colors.subtext }]}>
                        Applied {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </Text>
                </View>
            </View>

            <View style={styles.applicationActions}>
                {/* First row */}
                {showAccept ? (
                    <Button
                        title="Accept"
                        size="small"
                        onPress={() => onUpdateStatus(item.id, 'accepted')}
                        style={{
                            ...styles.actionButton,
                            backgroundColor: colors.success
                        }
                        }
                        loading={loading}
                    />
                ) : (
                    <Button
                        title="Accepted"
                        size="small"
                        style={{
                            ...styles.actionButton,
                            backgroundColor: colors.success
                        }
                        }
                        loading={loading}
                        disabled
                        onPress={() => { }}
                    />
                )}

                {showReject ? (
                    <Button
                        title="Reject"
                        size="small"
                        onPress={() => onUpdateStatus(item.id, 'rejected')}
                        style={{
                            ...styles.actionButton,
                            backgroundColor: colors.error
                        }
                        }
                        loading={loading}
                    />
                ) : (
                    <Button
                        title="Rejected"
                        size="small"
                        style={{
                            ...styles.actionButton,
                            backgroundColor: colors.error
                        }
                        }
                        loading={loading}
                        disabled
                        onPress={() => { }}
                    />
                )}

                {/* Second row */}
                <Button
                    title="View Resume"
                    variant="outline"
                    size="small"
                    onPress={() => handleViewResume(item.resume_url)}
                    style={styles.actionButton}
                />

                <Button
                    title="AI Analysis"
                    variant="outline"
                    size="small"
                    onPress={() => router.push(`/ai-analysis/${item.id}`)}
                    icon={<Ionicons name="sparkles" size={16} color={colors.primary} />}
                    style={styles.actionButton}
                />
            </View>

        </Card>
    );
};

// Styles remain the same as in your original code
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    title: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 20,
    },
    filterContainer: {
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    applicationCard: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
    },
    applicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    studentDetails: {
        marginLeft: 12,
        flex: 1,
    },
    studentName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        marginBottom: 2,
    },
    opportunityTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    applicationMeta: {
        flexDirection: 'row',
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
    },
    applicationActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 8,
    },
    actionButton: {
        width: '48%', // Allows for 2 buttons per row with gap
        minHeight: 40, // Consistent button height
    },
    statusButton: {
        minWidth: 80,
    },
    viewButton: {
        minWidth: 80,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        opacity: 0.7,
    },
    emptySubtext: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
        opacity: 0.5,
    },
    errorBanner: {
        padding: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    errorText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        textAlign: 'center',
    },
    missingProfileText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        marginTop: 4,
    },
});

export default CompanyApplicantsScreen;