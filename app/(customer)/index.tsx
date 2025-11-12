
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

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const quickActions = [
    {
      id: 'book-appointment',
      title: 'Book Appointment',
      icon: 'calendar.badge.plus',
      color: colors.primary,
      route: '/(customer)/book-appointment',
    },
    {
      id: 'redeem-coupon',
      title: 'Redeem Coupon',
      icon: 'gift.fill',
      color: colors.accent,
      route: '/(customer)/spin-wheel',
    },
    {
      id: 'shop-products',
      title: 'Shop Products',
      icon: 'bag.fill',
      color: colors.secondary,
      route: '/(customer)/products',
    },
    {
      id: 'my-bookings',
      title: 'My Bookings',
      icon: 'list.bullet',
      color: colors.primary,
      route: '/(customer)/bookings',
    },
  ];

  const services = [
    { id: 'service-1', name: 'Haircut', price: '$25', duration: '30 min' },
    { id: 'service-2', name: 'Beard Trim', price: '$15', duration: '20 min' },
    { id: 'service-3', name: 'Haircut + Beard', price: '$35', duration: '45 min' },
    { id: 'service-4', name: 'Hot Towel Shave', price: '$30', duration: '30 min' },
  ];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 30, marginTop: 20 }}>
          <Text style={[commonStyles.title, { fontSize: 32 }]}>
            Welcome back,
          </Text>
          <Text style={[commonStyles.title, { fontSize: 32, color: colors.primary }]}>
            {user?.name?.split(' ')[0] || 'Guest'}!
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
            Ready for your next fresh cut?
          </Text>
        </View>

        <View style={{ marginBottom: 30 }}>
          <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20 }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
              Premium Barbershop
            </Text>
            <Text style={commonStyles.textSecondary}>
              Expert cuts, classic style, modern vibes
            </Text>
          </View>
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Quick Actions
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

        <View style={{ marginTop: 30 }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
            Our Services
          </Text>
          {services.map((service) => (
            <View key={service.id} style={[commonStyles.card, commonStyles.row]}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                  {service.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  {service.duration}
                </Text>
              </View>
              <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                {service.price}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
