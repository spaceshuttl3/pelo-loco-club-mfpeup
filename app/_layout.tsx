
import { Stack, useRouter } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    // Handle deep links for password reset and email confirmation
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      try {
        // Parse the URL
        const url = Linking.parse(event.url);
        console.log('Parsed URL:', JSON.stringify(url, null, 2));

        // Check if this is a password reset or confirmation link
        const isResetPassword = url.path === 'reset-password' || url.hostname === 'reset-password';
        const isConfirm = url.path === 'confirm' || url.hostname === 'confirm';
        
        if (isResetPassword || isConfirm) {
          console.log('Auth link detected:', isResetPassword ? 'reset-password' : 'confirm');
          
          // Extract the access_token and refresh_token from the URL
          const params = url.queryParams;
          if (params && typeof params === 'object') {
            const accessToken = params.access_token as string;
            const refreshToken = params.refresh_token as string;
            const type = params.type as string;
            
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
                return;
              }
              
              console.log('Session set successfully');
              
              // Handle different types of auth events
              if (type === 'recovery' || isResetPassword) {
                console.log('Navigating to reset password screen');
                // Small delay to ensure session is fully set
                setTimeout(() => {
                  // Use replace to avoid back navigation issues
                  const router = require('expo-router').router;
                  router.replace('/auth/reset-password');
                }, 100);
              } else if (type === 'signup' || isConfirm) {
                console.log('Email confirmed successfully');
                // Navigate to login with success message
                setTimeout(() => {
                  const router = require('expo-router').router;
                  router.replace('/auth/login');
                }, 100);
              }
            } else {
              console.error('Missing tokens in URL');
            }
          } else {
            console.error('No query params found in URL');
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
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
  }, []);

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
