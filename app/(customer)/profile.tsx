
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Esci',
      'Sei sicuro di voler uscire?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Errore', 'Impossibile uscire. Riprova.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Profilo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[commonStyles.card, { alignItems: 'center', padding: 24 }]}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold', marginBottom: 4 }]}>
            {user?.name}
          </Text>
          <Text style={commonStyles.textSecondary}>{user?.email}</Text>
          {user?.phone && (
            <Text style={commonStyles.textSecondary}>{user.phone}</Text>
          )}
        </View>

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
          Account
        </Text>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => router.push('/(customer)/bookings')}
          activeOpacity={0.7}
        >
          <IconSymbol name="calendar" size={24} color={colors.primary} />
          <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
            Le Mie Prenotazioni
          </Text>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => router.push('/(customer)/order-history')}
          activeOpacity={0.7}
        >
          <IconSymbol name="bag" size={24} color={colors.primary} />
          <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
            I Miei Ordini
          </Text>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => router.push('/(customer)/spin-wheel')}
          activeOpacity={0.7}
        >
          <IconSymbol name="gift" size={24} color={colors.primary} />
          <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
            I Miei Coupon
          </Text>
          <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: 32, backgroundColor: colors.error }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={buttonStyles.text}>Esci</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
