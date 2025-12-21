
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { commonStyles, colors } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const quickActions = [
    {
      id: 'book-appointment',
      title: 'Prenota',
      icon: 'calendar.badge.plus',
      color: colors.primary,
      route: '/(customer)/book-appointment',
    },
    {
      id: 'fidelity',
      title: 'Fedeltà',
      icon: 'star.fill',
      color: colors.primary,
      route: '/(customer)/fidelity',
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
    {
      id: 'my-orders',
      title: 'Ordini',
      icon: 'shippingbox.fill',
      color: colors.secondary,
      route: '/(customer)/order-history',
    },
  ];

  // Calculate responsive sizes
  const cardPadding = 8;
  const cardWidth = (width - 32 - cardPadding * 2) / 2; // 32 = horizontal padding, 8*2 = card padding

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 24, marginTop: Platform.OS === 'android' ? 20 : 10 }}>
          <Text style={[commonStyles.title, { fontSize: 22 }]}>
            Bentornato/a da Pelo Loco,
          </Text>
          <Text style={[commonStyles.title, { fontSize: 26, color: colors.primary }]}>
            {user?.name?.split(' ')[0] || 'Ospite'}!
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 6, fontSize: 13 }]}>
            Pronto/a per il tuo prossimo taglio?
          </Text>
        </View>

        {/* Fidelity Credits Card */}
        {user && user.fidelity_credits !== undefined && (
          <TouchableOpacity
            style={[
              commonStyles.card,
              {
                backgroundColor: colors.primary,
                padding: 16,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
            onPress={() => router.push('/(customer)/fidelity')}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <IconSymbol name="star.fill" size={26} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 28, fontWeight: 'bold' }]}>
                {user.fidelity_credits || 0}
              </Text>
              <Text style={[commonStyles.text, { fontSize: 13 }]}>
                Crediti Fedeltà
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 11, marginTop: 2 }]}>
                Tocca per vedere le ricompense
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <Text style={[commonStyles.subtitle, { marginBottom: 12, fontSize: 17 }]}>
          Azioni Rapide
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -cardPadding / 2 }}>
          {quickActions.map((action, actionIndex) => (
            <TouchableOpacity
              key={`action-${action.id}-${actionIndex}`}
              style={{
                width: cardWidth,
                padding: cardPadding / 2,
              }}
              onPress={() => {
                console.log('Quick action pressed:', action.title);
                router.push(action.route as any);
              }}
            >
              <View style={[commonStyles.card, { alignItems: 'center', padding: 14, minHeight: 120 }]}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: action.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <IconSymbol name={action.icon as any} size={24} color={colors.text} />
                </View>
                <Text 
                  style={[commonStyles.text, { textAlign: 'center', fontSize: 13, fontWeight: '600' }]}
                  numberOfLines={2}
                >
                  {action.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
