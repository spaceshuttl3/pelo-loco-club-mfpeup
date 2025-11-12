
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
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*, user:users!appointments_user_id_fkey(*)')
        .eq('date', today)
        .order('time', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        setTodayAppointments(appointmentsData || []);
      }

      // Fetch pending orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, user:users!orders_user_id_fkey(*)')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setPendingOrders(ordersData || []);
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('Signed out successfully');
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      id: 'appointments',
      title: 'Appointments',
      icon: 'calendar',
      color: colors.primary,
      route: '/(admin)/appointments',
      count: todayAppointments.length,
    },
    {
      id: 'orders',
      title: 'Orders',
      icon: 'bag.fill',
      color: colors.accent,
      route: '/(admin)/orders',
      count: pendingOrders.length,
    },
    {
      id: 'products',
      title: 'Products',
      icon: 'cube.fill',
      color: colors.secondary,
      route: '/(admin)/products',
    },
    {
      id: 'coupons',
      title: 'Coupons',
      icon: 'ticket',
      color: colors.accent,
      route: '/(admin)/coupons',
    },
    {
      id: 'birthdays',
      title: 'Birthdays',
      icon: 'gift.fill',
      color: colors.primary,
      route: '/(admin)/birthdays',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bell.fill',
      color: colors.secondary,
      route: '/(admin)/notifications',
    },
  ];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 24 }]}>
          <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>
            Welcome, Admin!
          </Text>
          <Text style={commonStyles.textSecondary}>
            Manage your barbershop from here
          </Text>
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
              onPress={() => router.push(action.route as any)}
            >
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20, position: 'relative' }]}>
                {action.count !== undefined && action.count > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
                      {action.count}
                    </Text>
                  </View>
                )}
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
          Today&apos;s Appointments ({todayAppointments.length})
        </Text>

        {todayAppointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No appointments today
            </Text>
          </View>
        ) : (
          todayAppointments.map((appointment) => (
            <View key={appointment.id} style={commonStyles.card}>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                  {appointment.service}
                </Text>
                <Text style={[commonStyles.text, { color: colors.primary }]}>
                  {appointment.time}
                </Text>
              </View>
              <Text style={commonStyles.textSecondary}>
                Customer: {appointment.user?.name || 'Unknown'}
              </Text>
              <Text style={commonStyles.textSecondary}>
                Phone: {appointment.user?.phone || 'N/A'}
              </Text>
            </View>
          ))
        )}

        {pendingOrders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Pending Orders ({pendingOrders.length})
            </Text>

            {pendingOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={commonStyles.card}
                onPress={() => router.push('/(admin)/orders' as any)}
              >
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    Order #{order.id.substring(0, 8)}
                  </Text>
                  <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                    ${order.total_price}
                  </Text>
                </View>
                <Text style={commonStyles.textSecondary}>
                  Customer: {order.user?.name || 'Unknown'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Status: Pending Payment
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
