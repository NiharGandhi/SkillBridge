import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';



export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      role?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleSignUp = async () => {
    if (!validate() || !role) return;

    setLoading(true);
    try {
      await signUp(email, password, role);
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please check your email for verification.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Join SkillBridge and start your journey
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              I am a:
            </Text>

            <View style={styles.roleSelection}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'student' && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setRole('student')}
                activeOpacity={0.7}
              >
                <Card variant={role === 'student' ? 'elevated' : 'default'} style={styles.roleCardInner}>
                  <AntDesign name="user" size={40} color={colors.primary} />
                  <Text style={[styles.roleText, { color: colors.text }]}>
                    Student
                  </Text>
                  <Text style={[styles.roleDescription, { color: colors.subtext }]}>
                    Looking to learn and find opportunities
                  </Text>
                </Card>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === 'employer' && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                onPress={() => setRole('employer')}
                activeOpacity={0.7}
              >
                <Card variant={role === 'employer' ? 'elevated' : 'default'} style={styles.roleCardInner}>
                  <Entypo name="briefcase" size={40} color={colors.primary} />
                  <Text style={[styles.roleText, { color: colors.text }]}>
                    Employer
                  </Text>
                  <Text style={[styles.roleDescription, { color: colors.subtext }]}>
                    Looking to post jobs and hire talent
                  </Text>
                </Card>
              </TouchableOpacity>
            </View>

            {errors.role && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.role}
              </Text>
            )}

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="******"
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="******"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.subtext }]}>
                Already have an account?
              </Text>
              <Link href="/login" asChild>
                <Text style={[styles.link, { color: colors.primary }]}>
                  Sign In
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    marginBottom: 16,
  },
  roleSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleCard: {
    width: '48%',
    borderRadius: 16,
  },
  roleCardInner: {
    alignItems: 'center',
    padding: 16,
  },
  roleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginRight: 4,
  },
  link: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});