
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
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
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
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
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
            >
              <Text style={commonStyles.textSecondary}>
                Don&apos;t have an account?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Sign Up
                </Text>
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 40, padding: 16, backgroundColor: colors.card, borderRadius: 8 }}>
              <Text style={[commonStyles.textSecondary, { fontSize: 12, textAlign: 'center' }]}>
                ⚠️ To use this app, you need to enable Supabase by pressing the Supabase button
                and connecting to a project. Update the credentials in lib/supabase.ts
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
