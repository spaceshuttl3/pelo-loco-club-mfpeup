
import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CouponsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to rewards configuration
    Alert.alert(
      'Nuova Sezione Premi',
      'La gestione dei coupon è stata sostituita con il nuovo sistema di Premi e Traguardi. Verrai reindirizzato alla nuova sezione.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(admin)/rewards-config'),
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
