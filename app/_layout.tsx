
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../styles/commonStyles';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();

    // Handle deep links for password reset and email confirmation
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      try {
        // Parse the URL
        const url = Linking.parse(event.url);
        console.log('Parsed URL:', JSON.stringify(url, null, 2));

        // Extract path from the URL - handle both path and hostname
        const path = url.path || url.hostname || '';
        console.log('Extracted path:', path);

        // Check if this is a password reset or confirmation link
        const isResetPassword = path.includes('reset-password') || path === 'reset-password';
        const isConfirm = path.includes('confirm') || path === 'confirm';
        
        if (isResetPassword || isConfirm) {
          console.log('Auth link detected:', isResetPassword ? 'reset-password' : 'confirm');
          setIsProcessingDeepLink(true);
          
          // Supabase sends tokens in the URL fragment (after #), not as query params
          // We need to extract them from the raw URL
          const rawUrl = event.url;
          
          // Check if there's a hash fragment
          let accessToken: string | null = null;
          let refreshToken: string | null = null;
          let type: string | null = null;
          
          if (rawUrl.includes('#')) {
            // Extract the fragment part (everything after #)
            const fragmentPart = rawUrl.split('#')[1];
            console.log('Fragment part:', fragmentPart);
            
            // Parse the fragment as query parameters
            const fragmentParams = new URLSearchParams(fragmentPart);
            accessToken = fragmentParams.get('access_token');
            refreshToken = fragmentParams.get('refresh_token');
            type = fragmentParams.get('type');
          } else {
            // Fallback: try to get from query params (older format)
            const params = url.queryParams;
            if (params && typeof params === 'object') {
              accessToken = params.access_token as string;
              refreshToken = params.refresh_token as string;
              type = params.type as string;
            }
          }
          
          console.log('Token type:', type);
          console.log('Has access token:', !!accessToken);
          console.log('Has refresh token:', !!refreshToken);
          
          if (accessToken && refreshToken) {
            console.log('Setting session from deep link');
            
            // Set the session using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
              setIsProcessingDeepLink(false);
              return;
            }
            
            console.log('Session set successfully');
            
            // Handle different types of auth events
            if (type === 'recovery' || isResetPassword) {
              console.log('Navigating to reset password screen');
              // Small delay to ensure session is fully set
              setTimeout(() => {
                setIsProcessingDeepLink(false);
                router.replace('/auth/reset-password');
              }, 100);
            } else if (type === 'signup' || isConfirm) {
              console.log('Email confirmed successfully');
              // Navigate to login with success message
              setTimeout(() => {
                setIsProcessingDeepLink(false);
                router.replace('/auth/login');
              }, 100);
            }
          } else {
            console.error('Missing tokens in URL');
            console.log('Full URL for debugging:', rawUrl);
            setIsProcessingDeepLink(false);
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
        setIsProcessingDeepLink(false);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Show loading screen while processing deep link
  if (isProcessingDeepLink) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}
