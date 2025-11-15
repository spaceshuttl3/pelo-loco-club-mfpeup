
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';

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
      id: 'rewards',
      title: 'Premi',
      icon: 'star.fill',
      color: colors.primary,
      route: '/(customer)/rewards',
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

        {/* Loyalty Points Card */}
        {user?.loyalty_points !== undefined && (
          <GlassView
            style={[
              commonStyles.card,
              {
                backgroundColor: colors.primary,
                padding: 20,
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
              },
            ]}
            intensity={80}
          >
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 16, marginBottom: 4 }]}>
                I Tuoi Punti Fedeltà
              </Text>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {user.loyalty_points}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(customer)/rewards')}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.card,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconSymbol name="star.fill" size={28} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </GlassView>
        )}

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Azioni Rapide
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={`action-${action.id}-${index}`}
              style={{
                width: '50%',
                padding: 6,
              }}
              onPress={() => {
                console.log('Quick action pressed:', action.title);
                router.push(action.route as any);
              }}
              activeOpacity={0.7}
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
