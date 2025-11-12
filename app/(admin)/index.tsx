
import { useRouter } from 'expo-router';
import { commonStyles, colors } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, Order } from '@/types';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, users(*)')
        .eq('date', today)
        .order('time', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        setAppointments(appointmentsData || []);
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, users(*)')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      const { data: birthdaysData, error: birthdaysError } = await supabase
        .rpc('get_upcoming_birthdays', { days_ahead: 30 });

      if (birthdaysError) {
        console.error('Error fetching birthdays:', birthdaysError);
      } else {
        setUpcomingBirthdays(birthdaysData || []);
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top', 'bottom']}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Admin Dashboard</Text>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 20 : 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 24 }]}>
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
            Welcome back, {user?.name}!
          </Text>
          <Text style={commonStyles.textSecondary}>
            Here&apos;s your business overview
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 24 }}>
          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={() => router.push('/(admin)/appointments')}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="calendar" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Appointments
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={() => router.push('/(admin)/products')}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="bag.fill" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Products
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={() => router.push('/(admin)/birthdays' as any)}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="gift.fill" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Birthdays
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={() => router.push('/(admin)/coupons' as any)}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="ticket" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Coupons
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={() => router.push('/(admin)/notifications' as any)}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="bell.fill" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Notifications
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '50%', padding: 6 }}
            onPress={handleSignOut}
          >
            <View style={[commonStyles.card, { alignItems: 'center', padding: 16 }]}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={32} color={colors.error} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Today&apos;s Appointments ({appointments.length})
        </Text>
        {appointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>No appointments today</Text>
          </View>
        ) : (
          appointments.slice(0, 3).map((appointment) => (
            <View key={appointment.id} style={[commonStyles.card, { marginBottom: 12 }]}>
              <View style={commonStyles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                    {appointment.user?.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {appointment.service} • {appointment.time}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12 }]}>
                    {appointment.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {upcomingBirthdays.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Upcoming Birthdays ({upcomingBirthdays.length})
            </Text>
            {upcomingBirthdays.slice(0, 3).map((birthday, index) => (
              <View key={`birthday-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
                <View style={commonStyles.row}>
                  <IconSymbol name="gift.fill" size={24} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                      {birthday.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {new Date(birthday.birthday).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {orders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Pending Orders ({orders.length})
            </Text>
            {orders.map((order) => (
              <View key={order.id} style={[commonStyles.card, { marginBottom: 12 }]}>
                <View style={commonStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                      {order.user?.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      ${order.total_price.toFixed(2)} • {order.payment_mode}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
