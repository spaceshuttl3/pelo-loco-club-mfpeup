
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const quickActions = [
    {
      id: 'book-appointment',
      title: 'Prenota',
      icon: 'calendar.badge.plus',
      color: colors.primary,
      route: '/(customer)/book-appointment',
    },
    {
      id: 'redeem-coupon',
      title: 'Coupon',
      icon: 'gift.fill',
      color: colors.accent,
      route: '/(customer)/spin-wheel',
    },
    {
      id: 'shop-products',
      title: 'Prodotti',
      icon: 'bag.fill',
      color: colors.secondary,
      route: '/(customer)/products',
    },
    {
      id: 'my-bookings',
      title: 'Prenotazioni',
      icon: 'list.bullet',
      color: colors.primary,
      route: '/(customer)/bookings',
    },
  ];

  const instagramProfiles = [
    {
      id: 'barbershop',
      name: 'Pelo Loco Barbershop',
      handle: '@pelo_loco_barbershop',
      url: 'https://www.instagram.com/pelo_loco_barbershop/',
      color: colors.primary,
    },
    {
      id: 'luca',
      name: 'Luca',
      handle: '@luca__peloloco',
      url: 'https://www.instagram.com/luca__peloloco/',
      color: colors.accent,
    },
    {
      id: 'tony',
      name: 'Tony Scala',
      handle: '@tony_scalaa_',
      url: 'https://www.instagram.com/tony_scalaa_/',
      color: colors.secondary,
    },
  ];

  const handleInstagramPress = async (url: string, handle: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Errore', `Impossibile aprire ${handle}`);
      }
    } catch (error) {
      console.error('Error opening Instagram:', error);
      Alert.alert('Errore', 'Impossibile aprire Instagram');
    }
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 30, marginTop: 20 }}>
          <Text style={[commonStyles.title, { fontSize: 28 }]}>
            Bentornato/a da Pelo Loco,
          </Text>
          <Text style={[commonStyles.title, { fontSize: 32, color: colors.primary }]}>
            {user?.name?.split(' ')[0] || 'Ospite'}!
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
            Pronto/a per il tuo prossimo taglio?
          </Text>
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Azioni Rapide
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={{
                width: '50%',
                padding: 6,
              }}
              onPress={() => {
                console.log('Quick action pressed:', action.title);
                router.push(action.route as any);
              }}
            >
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: action.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <IconSymbol name={action.icon as any} size={28} color={colors.text} />
                </View>
                <Text style={[commonStyles.text, { textAlign: 'center', fontSize: 14 }]}>
                  {action.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
          Seguici su Instagram
        </Text>

        {instagramProfiles.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={[commonStyles.card, { marginBottom: 12 }]}
            onPress={() => handleInstagramPress(profile.url, profile.handle)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: profile.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}
              >
                <IconSymbol name="camera.fill" size={24} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {profile.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  {profile.handle}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
