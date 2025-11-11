
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const quickActions = [
    {
      title: 'Book Appointment',
      icon: 'calendar.badge.plus',
      color: colors.primary,
      route: '/(customer)/book-appointment',
    },
    {
      title: 'Spin The Wheel',
      icon: 'gift.fill',
      color: colors.accent,
      route: '/(customer)/spin-wheel',
    },
    {
      title: 'Shop Products',
      icon: 'bag.fill',
      color: colors.secondary,
      route: '/(customer)/products',
    },
    {
      title: 'My Bookings',
      icon: 'list.bullet',
      color: colors.primary,
      route: '/(customer)/bookings',
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ marginBottom: 30 }}>
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
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={{
                width: '50%',
                padding: 6,
              }}
              onPress={() => router.push(action.route as any)}
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
          {[
            { name: 'Haircut', price: '$25', duration: '30 min' },
            { name: 'Beard Trim', price: '$15', duration: '20 min' },
            { name: 'Haircut + Beard', price: '$35', duration: '45 min' },
            { name: 'Hot Towel Shave', price: '$30', duration: '30 min' },
          ].map((service, index) => (
            <View key={index} style={[commonStyles.card, commonStyles.row]}>
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
    </View>
  );
}
