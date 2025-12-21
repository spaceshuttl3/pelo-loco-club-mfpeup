
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
import { supabase } from '../../lib/supabase';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '../../components/IconSymbol';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Errore', 'Inserisci il tuo indirizzo email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending password reset email to:', email);
      
      // Use the app's custom scheme for deep linking
      // Supabase will automatically append the tokens as query parameters
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pelolocobarbershop://reset-password',
      });

      if (error) {
        console.error('Password reset error:', error);
        Alert.alert('Errore', 'Impossibile inviare l\'email di reset. Riprova.');
        return;
      }

      console.log('Password reset email sent successfully');
      Alert.alert(
        'Email Inviata!',
        'Controlla la tua email per il link di reset della password.\n\nSe non vedi l\'email, controlla la cartella spam.\n\nIl link scadrà tra 1 ora.',
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
    <SafeAreaView style={[commonStyles.container, { flex: 1 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[commonStyles.content, { paddingTop: 40 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginBottom: 24 }}
              disabled={loading}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.text} />
            </TouchableOpacity>

            <Text style={[commonStyles.title, { marginBottom: 16 }]}>
              Reimposta Password
            </Text>

            <Text style={[commonStyles.textSecondary, { marginBottom: 32, fontSize: 16 }]}>
              Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la tua password.
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

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 8 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={buttonStyles.text}>
                {loading ? 'Invio...' : 'Invia Link di Reset'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={commonStyles.textSecondary}>
                Ricordi la password?{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  Accedi
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
