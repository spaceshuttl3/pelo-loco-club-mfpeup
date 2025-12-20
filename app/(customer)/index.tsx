
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { commonStyles, colors } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

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

  // Calculate card width based on screen size
  const cardWidth = width < 400 ? '100%' : '50%';

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 30, marginTop: 20 }}>
          <Text style={[commonStyles.title, { fontSize: Math.min(width * 0.07, 28) }]}>
            Bentornato/a da Pelo Loco,
          </Text>
          <Text style={[commonStyles.title, { fontSize: Math.min(width * 0.08, 32), color: colors.primary }]}>
            {user?.name?.split(' ')[0] || 'Ospite'}!
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
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
                padding: 20,
                marginBottom: 30,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
            onPress={() => router.push('/(customer)/fidelity')}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <IconSymbol name="star.fill" size={32} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {user.fidelity_credits || 0}
              </Text>
              <Text style={[commonStyles.text, { fontSize: 14 }]}>
                Crediti Fedeltà
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                Tocca per vedere le ricompense
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.text} />
          </TouchableOpacity>
        )}

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Azioni Rapide
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {quickActions.map((action, actionIndex) => (
            <TouchableOpacity
              key={`action-${action.id}-${actionIndex}`}
              style={{
                width: cardWidth,
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
      </ScrollView>
    </SafeAreaView>
  );
}
