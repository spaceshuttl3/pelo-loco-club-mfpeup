
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
import { supabase } from '@/lib/supabase';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
    const phoneRegex = /^[0-9]{10,}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  };

  const checkDuplicates = async (email: string, phone: string) => {
    try {
      const { data: emailCheck, error: emailError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error checking email:', emailError);
        throw emailError;
      }

      if (emailCheck) {
        return { duplicate: true, field: 'email' };
      }

      const cleanPhone = phone.replace(/[\s-]/g, '');
      const { data: phoneCheck, error: phoneError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (phoneError && phoneError.code !== 'PGRST116') {
        console.error('Error checking phone:', phoneError);
        throw phoneError;
      }

      if (phoneCheck) {
        return { duplicate: true, field: 'phone' };
      }

      return { duplicate: false };
    } catch (error) {
      console.error('Error in checkDuplicates:', error);
      throw error;
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Errore', 'Inserisci un numero di telefono valido (almeno 10 cifre)');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      const duplicateCheck = await checkDuplicates(email, phone);
      if (duplicateCheck.duplicate) {
        Alert.alert(
          'Account Già Esistente',
          duplicateCheck.field === 'email'
            ? 'Questa email è già registrata. Prova ad accedere o usa un\'altra email.'
            : 'Questo numero di telefono è già registrato. Prova ad accedere o usa un altro numero.'
        );
        setLoading(false);
        return;
      }

      await signUp(email, password, name, phone.replace(/[\s-]/g, ''), birthday.toISOString().split('T')[0], 'customer');
      
      Alert.alert(
        'Registrazione Riuscita!',
        'Controlla la tua email per verificare il tuo account prima di accedere.\n\nSe non vedi l\'email, controlla la cartella spam.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Impossibile creare l\'account. Riprova.';
      
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        errorMessage = 'Questa email o numero di telefono è già registrato.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Errore', errorMessage);
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
            <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 16 }]}>
              Pelo Loco Club
            </Text>

            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 40 }]}>
              Crea il tuo account
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Nome Completo"
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
              placeholder="Telefono (es. 3331234567)"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Password (minimo 6 caratteri)"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Text style={commonStyles.text}>Data di Nascita</Text>
              <Text style={[commonStyles.text, { color: colors.primary }]}>
                {birthday.toLocaleDateString('it-IT')}
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

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 8 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={buttonStyles.text}>
                {loading ? 'Registrazione...' : 'Registrati'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={commonStyles.textSecondary}>
                Hai già un account?{' '}
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
