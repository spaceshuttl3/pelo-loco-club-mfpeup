
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorTitle = 'Accesso Fallito';
      let errorMessage = 'Credenziali non valide';
      
      if (error.message) {
        if (error.message.includes('Email not confirmed')) {
          errorTitle = 'Email Non Verificata';
          errorMessage = 'Controlla la tua email e clicca sul link di verifica prima di accedere.\n\nSe non vedi l\'email, controlla la cartella spam.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o password non validi. Riprova.';
        } else if (error.message.includes('Email link is invalid or has expired')) {
          errorTitle = 'Link di Verifica Scaduto';
          errorMessage = 'Il tuo link di verifica è scaduto. Registrati di nuovo per ricevere una nuova email di verifica.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password' as any);
  };

  return (
    <SafeAreaView style={[commonStyles.container, { flex: 1 }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[commonStyles.content, commonStyles.centerContent, { paddingTop: 60 }]}>
            <View style={{ width: '100%', maxWidth: 400 }}>
              <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 24 }]}>
                Pelo Loco BarberShop
              </Text>
              
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Image
                  source={require('@/assets/images/02b10c40-cfdb-4f40-9909-b11442c57fab.jpeg')}
                  style={{ width: 120, height: 120, borderRadius: 60 }}
                  resizeMode="cover"
                />
              </View>

              <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 40 }]}>
                Bentornato/a
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
                style={{ marginTop: 8, marginBottom: 16, alignItems: 'flex-end' }}
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <Text style={{ color: colors.primary, fontSize: 14 }}>
                  Password dimenticata?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={buttonStyles.primary}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={buttonStyles.text}>
                  {loading ? 'Accesso...' : 'Accedi'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={() => router.push('/auth/signup')}
                disabled={loading}
              >
                <Text style={commonStyles.textSecondary}>
                  Non hai un account?{' '}
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>
                    Registrati
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
