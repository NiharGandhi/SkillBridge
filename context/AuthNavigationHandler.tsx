import { useRouter, useSegments } from "expo-router";
import { useAuth } from "./AuthContext";
import { useEffect } from "react";

export function AuthNavigationHandler() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user) {
      if (!user.onboardingCompleted && !inOnboarding) {
        router.replace('/onboarding');
      } else if (user.onboardingCompleted && (inAuthGroup || inOnboarding)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  return null;
}