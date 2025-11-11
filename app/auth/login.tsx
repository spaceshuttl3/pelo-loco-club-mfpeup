
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      console.log('Login successful');
      // Navigation will be handled automatically by the auth state change
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      let errorTitle = 'Login Failed';
      let errorMessage = 'Invalid credentials';
      
      if (error.message) {
        // Check for specific error messages
        if (error.message.includes('Email not confirmed')) {
          errorTitle = 'Email Not Verified';
          errorMessage = 'Please check your email and click the verification link before signing in.\n\nIf you don\'t see the email, check your spam folder.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email link is invalid or has expired')) {
          errorTitle = 'Verification Link Expired';
          errorMessage = 'Your verification link has expired. Please sign up again to receive a new verification email.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[commonStyles.content, commonStyles.centerContent]}>
          <View style={{ width: '100%', maxWidth: 400 }}>
            <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
              Pelo Loco Club
            </Text>
            <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginBottom: 40 }]}>
              Premium Barbershop Experience
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 8 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={buttonStyles.text}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => router.push('/auth/signup')}
              disabled={loading}
            >
              <Text style={commonStyles.textSecondary}>
                Don&apos;t have an account?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
