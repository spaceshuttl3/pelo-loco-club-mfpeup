
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Appointment, Order } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function AdminDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*, user:users(*)')
        .eq('date', today)
        .order('time', { ascending: true });

      if (aptError) throw aptError;
      setTodayAppointments(appointments || []);

      // Fetch pending orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, user:users(*)')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setPendingOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const adminActions = [
    {
      title: 'Appointments',
      icon: 'calendar',
      color: colors.primary,
      route: '/(admin)/appointments',
      count: todayAppointments.length,
    },
    {
      title: 'Products',
      icon: 'bag.fill',
      color: colors.secondary,
      route: '/(admin)/products',
    },
    {
      title: 'Notifications',
      icon: 'bell.fill',
      color: colors.accent,
      route: '/(admin)/notifications',
    },
  ];

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ marginBottom: 30 }}>
          <Text style={[commonStyles.title, { fontSize: 32 }]}>
            Admin Dashboard
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
            Welcome back, {user?.name}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 30 }}>
          {adminActions.map((action, index) => (
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
                <Text style={[commonStyles.text, { textAlign: 'center', fontSize: 14, marginBottom: 4 }]}>
                  {action.title}
                </Text>
                {action.count !== undefined && (
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    {action.count} today
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Today&apos;s Appointments ({todayAppointments.length})
        </Text>

        {todayAppointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 30 }]}>
            <IconSymbol name="calendar" size={40} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 12 }]}>
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
                Status: {appointment.status} • Payment: {appointment.payment_status}
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
              <View key={order.id} style={commonStyles.card}>
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    Order #{order.id.slice(0, 8)}
                  </Text>
                  <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                    ${order.total_price.toFixed(2)}
                  </Text>
                </View>
                <Text style={commonStyles.textSecondary}>
                  Customer: {order.user?.name || 'Unknown'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Items: {order.items.length}
                </Text>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity
          style={{
            backgroundColor: colors.error,
            paddingVertical: 14,
            paddingHorizontal: 24,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 40,
          }}
          onPress={signOut}
        >
          <Text style={[commonStyles.text, { fontWeight: '600' }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
