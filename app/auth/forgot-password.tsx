
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Errore', 'Inserisci la tua email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending password reset email to:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pelolococlub://reset-password',
      });

      if (error) {
        console.error('Error sending reset email:', error);
        Alert.alert('Errore', error.message || 'Impossibile inviare l\'email di reset');
        return;
      }

      Alert.alert(
        'Email Inviata',
        'Controlla la tua email per il link di reset della password. Il link scadrà tra 24 ore.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error in handleResetPassword:', error);
      Alert.alert('Errore', 'Si è verificato un errore. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={commonStyles.content}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }}
        >
          <View style={{ marginBottom: 32 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Text style={[commonStyles.title, { marginBottom: 8 }]}>
              Reset Password
            </Text>
            <Text style={[commonStyles.textSecondary, { fontSize: 16 }]}>
              Inserisci la tua email per ricevere il link di reset
            </Text>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Email
            </Text>
            <TextInput
              style={commonStyles.input}
              placeholder="email@esempio.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, { marginBottom: 16 }]}
            onPress={handleResetPassword}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={buttonStyles.text}>Invia Link di Reset</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.primary, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[buttonStyles.text, { color: colors.text }]}>
              Torna al Login
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
