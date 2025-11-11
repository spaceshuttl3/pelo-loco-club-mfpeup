
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

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, phone);
      
      // Show success message with email confirmation reminder
      Alert.alert(
        'Check Your Email! 📧',
        `We've sent a verification email to:\n\n${email}\n\nPlease click the link in the email to verify your account before signing in.\n\nIf you don't see it, check your spam folder.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      let errorTitle = 'Signup Failed';
      let errorMessage = 'Could not create account';
      
      if (error.message) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          errorTitle = 'Email Already Registered';
          errorMessage = 'This email is already registered. Please sign in instead or use a different email.';
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
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
        <View style={[commonStyles.content, { paddingTop: 40 }]}>
          <View style={{ width: '100%', maxWidth: 400 }}>
            <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
              Create Account
            </Text>
            <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginBottom: 30 }]}>
              Join Pelo Loco Club
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

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
              placeholder="Phone Number"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Password (min. 6 characters)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 8 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={buttonStyles.text}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={commonStyles.textSecondary}>
                Already have an account?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
