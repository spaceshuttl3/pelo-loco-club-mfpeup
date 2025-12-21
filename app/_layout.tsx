
import { Stack } from 'expo-router';
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
      
      // Parse the URL
      const url = Linking.parse(event.url);
      console.log('Parsed URL:', url);

      // Check if this is a password reset or confirmation link
      if (url.path === 'reset-password' || url.hostname === 'reset-password' || 
          url.path === 'confirm' || url.hostname === 'confirm') {
        console.log('Auth link detected:', url.path || url.hostname);
        
        // Extract the access_token and refresh_token from the URL
        const params = url.queryParams;
        if (params && typeof params === 'object') {
          const accessToken = params.access_token as string;
          const refreshToken = params.refresh_token as string;
          const type = params.type as string;
          
          console.log('Token type:', type);
          
          if (accessToken && refreshToken) {
            console.log('Setting session from deep link');
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else {
              console.log('Session set successfully');
              
              // Handle different types of auth events
              if (type === 'recovery' || url.path === 'reset-password' || url.hostname === 'reset-password') {
                console.log('Redirecting to reset password screen');
                // The reset-password screen will handle the password update
              } else if (type === 'signup' || url.path === 'confirm' || url.hostname === 'confirm') {
                console.log('Email confirmed successfully');
                // User can now log in
              }
            }
          }
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
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
