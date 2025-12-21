
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
      console.log('Checking session for password reset...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Session check result:', {
        hasSession: !!session,
        error: error?.message,
        userId: session?.user?.id,
      });
      
      if (error) {
        console.error('Session error:', error);
        Alert.alert(
          'Errore',
          'Si è verificato un errore. Riprova.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/forgot-password'),
            },
          ]
        );
        return;
      }
      
      if (!session) {
        console.log('No session found, redirecting to forgot password');
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
      
      console.log('Valid session found, showing reset form');
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
    // Add a delay to ensure session is set from deep link
    const timer = setTimeout(() => {
      checkSession();
    }, 800);

    return () => clearTimeout(timer);
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
      console.log('Updating password...');
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        Alert.alert('Errore', 'Impossibile aggiornare la password. Riprova.');
        return;
      }

      console.log('Password updated successfully');
      Alert.alert(
        'Password Aggiornata!',
        'La tua password è stata aggiornata con successo. Ora puoi accedere con la nuova password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Sign out to clear the session and force fresh login
              supabase.auth.signOut().then(() => {
                router.replace('/auth/login');
              });
            },
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
          <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
            Verifica in corso...
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center', fontSize: 14 }]}>
            Attendere prego
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
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Conferma Password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
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

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => router.replace('/auth/login')}
              disabled={loading}
            >
              <Text style={commonStyles.textSecondary}>
                Torna al login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
