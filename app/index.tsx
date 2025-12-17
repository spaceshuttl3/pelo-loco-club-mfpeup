
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles, colors } from '../styles/commonStyles';

export default function IndexScreen() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (isAdmin) {
        router.replace('/(admin)');
      } else {
        router.replace('/(customer)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isAdmin]);

  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[commonStyles.text, { marginTop: 20 }]}>
        Caricamento Pelo Loco Barbershop...
      </Text>
    </View>
  );
}
