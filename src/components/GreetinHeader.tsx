import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Avatar } from './ui/Avatar';
import { router } from 'expo-router';


type Profile = {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
};

export const GreetingHeader = () => {
    const { colors } = useTheme();
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, avatar_url')
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

        fetchProfile();
    }, [user]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getInitials = () => {
        if (!profile) return 'US';
        return `${profile?.first_name?.charAt(0) || ''}${profile?.last_name?.charAt(0) || ''}`;
    };


    const getRandomEmoji = () => {
        const emojis = ['👋', '😊', '🙌', '🎉', '🌟', '🚀'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    };

    if (loading) {
        return (
            <View>
                <View style={[styles.skeletonGreeting, { backgroundColor: colors.skeleton }]} />
                <View style={[styles.skeletonSubtitle, { backgroundColor: colors.skeleton }]} />
            </View>
        );
    }

    return (
        <View style={styles.header}>
            <View>
                <Text style={[styles.greeting, { color: colors.text }]}>
                    {getGreeting()}, {profile?.first_name || 'User'} {getRandomEmoji()}
                </Text>
                <Text style={[styles.subtitle, { color: colors.subtext }]}>
                    Welcome back to SkillBridge
                </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')}>
                <Avatar
                    size={40}
                    uri={null} // Will update this next
                    initials={getInitials()}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 24,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    skeletonGreeting: {
        height: 28,
        width: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    skeletonSubtitle: {
        height: 16,
        width: 150,
        borderRadius: 8,
    },
});