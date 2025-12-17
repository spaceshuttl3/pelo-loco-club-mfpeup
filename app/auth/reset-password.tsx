
import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../../lib/supabase';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();

  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        Alert.alert(
          'Link Non Valido',
          'Il link di reset della password è scaduto o non valido. Richiedi un nuovo link.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/forgot-password'),
            },
          ]
        );
        return;
      }
      
      setVerifying(false);
    } catch (error) {
      console.error('Error checking session:', error);
      Alert.alert(
        'Errore',
        'Si è verificato un errore. Riprova.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    }
  }, [router]);

  useEffect(() => {
    // Check if user has a valid session from the reset link
    checkSession();
  }, [checkSession]);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Errore', 'Le password non corrispondono');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        Alert.alert('Errore', 'Impossibile aggiornare la password. Riprova.');
        return;
      }

      Alert.alert(
        'Password Aggiornata!',
        'La tua password è stata aggiornata con successo. Ora puoi accedere con la nuova password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
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

  if (verifying) {
    return (
      <SafeAreaView style={[commonStyles.container, { flex: 1 }]} edges={['top']}>
        <View style={[commonStyles.content, commonStyles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[commonStyles.text, { marginTop: 16 }]}>
            Verifica in corso...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[commonStyles.container, { flex: 1 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[commonStyles.content, { paddingTop: 40 }]}>
            <Text style={[commonStyles.title, { marginBottom: 16, textAlign: 'center' }]}>
              Nuova Password
            </Text>

            <Text style={[commonStyles.textSecondary, { marginBottom: 32, fontSize: 16, textAlign: 'center' }]}>
              Inserisci la tua nuova password
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Nuova Password (minimo 6 caratteri)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Conferma Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 8 }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={buttonStyles.text}>
                {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
