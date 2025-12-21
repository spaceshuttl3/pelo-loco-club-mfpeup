
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
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

  // Calculate responsive sizing
  const titleFontSize = Math.min(width * 0.06, 22);
  const nameFontSize = Math.min(width * 0.07, 26);

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ marginBottom: 24, marginTop: Platform.OS === 'android' ? 16 : 8 }}>
          <Text style={[commonStyles.title, { fontSize: titleFontSize }]}>
            Bentornato/a da Pelo Loco,
          </Text>
          <Text style={[commonStyles.title, { fontSize: nameFontSize, color: colors.primary }]}>
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
                padding: 18,
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
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14,
              }}
            >
              <IconSymbol name="star.fill" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 28, fontWeight: 'bold' }]}>
                {user.fidelity_credits || 0}
              </Text>
              <Text style={[commonStyles.text, { fontSize: 13 }]}>
                Crediti Fedeltà
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 11, marginTop: 3 }]}>
                Tocca per vedere le ricompense
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={22} color={colors.text} />
          </TouchableOpacity>
        )}

        <Text style={[commonStyles.subtitle, { marginBottom: 14, fontSize: 17 }]}>
          Azioni Rapide
        </Text>

        <View style={{ gap: 10 }}>
          {quickActions.map((action, actionIndex) => (
            <TouchableOpacity
              key={`action-${action.id}-${actionIndex}`}
              onPress={() => {
                console.log('Quick action pressed:', action.title);
                router.push(action.route as any);
              }}
            >
              <View style={[commonStyles.card, { flexDirection: 'row', alignItems: 'center', padding: 16 }]}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: action.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}
                >
                  <IconSymbol name={action.icon as any} size={24} color={colors.text} />
                </View>
                <Text 
                  style={[commonStyles.text, { fontSize: 15, fontWeight: '600', flex: 1 }]}
                  numberOfLines={1}
                >
                  {action.title}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
