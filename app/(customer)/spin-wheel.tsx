
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect } from 'react';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';

export default function SpinWheelScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to rewards page
    Alert.alert(
      'Nuova Sezione Premi',
      'La ruota della fortuna è stata sostituita con il nuovo sistema di Premi e Traguardi. Verrai reindirizzato alla nuova sezione.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(customer)/rewards'),
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[commonStyles.text, { marginTop: 16 }]}>
        Reindirizzamento...
      </Text>
    </SafeAreaView>
  );
}
