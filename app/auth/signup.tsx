
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation - at least 10 digits
    const phoneRegex = /^\d{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const checkDuplicates = async (email: string, phone: string) => {
    // Check for duplicate email
    const { data: emailData, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (emailData) {
      throw new Error('An account with this email already exists');
    }

    // Check for duplicate phone
    const { data: phoneData, error: phoneError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (phoneData) {
      throw new Error('An account with this phone number already exists');
    }
  };

  const handleSignup = async () => {
    // Validate all fields are filled
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are mandatory. Please fill in all fields.');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicates
      await checkDuplicates(email, phone);

      // Format birthday as YYYY-MM-DD
      const birthdayStr = birthday.toISOString().split('T')[0];

      // Sign up with birthday in metadata
      await signUp(email, password, name, phone, birthdayStr);
      
      Alert.alert(
        'Success!',
        'Account created successfully!\n\nPlease check your email and click the verification link to activate your account.\n\nAfter verification, you can sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = error.message || 'Could not create account';
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = error.message;
      }
      
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[commonStyles.container, { flex: 1 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[commonStyles.content, { paddingTop: 40 }]}>
            <View style={{ width: '100%', maxWidth: 400 }}>
              <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 8 }]}>
                Join Pelo Loco Club
              </Text>
              <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginBottom: 30 }]}>
                Create your account
              </Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Full Name *"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Email *"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Phone Number *"
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <TouchableOpacity
                style={[commonStyles.input, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Text style={{ color: birthday ? colors.text : colors.textSecondary }}>
                  {birthday ? `Birthday: ${birthday.toLocaleDateString()}` : 'Date of Birth *'}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={birthday}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setBirthday(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}

              <TextInput
                style={commonStyles.input}
                placeholder="Password *"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Confirm Password *"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />

              <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 16 }]}>
                * All fields are mandatory
              </Text>

              <TouchableOpacity
                style={buttonStyles.primary}
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
    </SafeAreaView>
  );
}
