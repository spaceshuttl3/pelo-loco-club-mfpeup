
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
      'Esci',
      'Sei sicuro di voler uscire?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('Signed out successfully');
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Errore', 'Impossibile uscire. Riprova.');
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

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Dashboard</Text>
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
        {/* Today's Summary Card */}
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 24, marginBottom: 24 }]}>
          <Text style={[commonStyles.title, { fontSize: 28, marginBottom: 8 }]}>
            Ciao! 👋
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 16 }]}>
            Ecco il riepilogo di oggi
          </Text>
          
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {todayAppointments.length}
              </Text>
              <Text style={commonStyles.textSecondary}>
                Appuntamenti
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {pendingOrders.length}
              </Text>
              <Text style={commonStyles.textSecondary}>
                Ordini
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions - Simplified for Barber */}
        <Text style={[commonStyles.subtitle, { marginBottom: 16, fontSize: 20 }]}>
          Funzioni Principali
        </Text>

        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: 12, padding: 20 }]}
          onPress={() => router.push('/(admin)/appointments' as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <IconSymbol name="calendar" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 4 }]}>
                Appuntamenti
              </Text>
              <Text style={commonStyles.textSecondary}>
                Visualizza e gestisci prenotazioni
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: 12, padding: 20 }]}
          onPress={() => router.push('/(admin)/orders' as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <IconSymbol name="bag.fill" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 4 }]}>
                Ordini
              </Text>
              <Text style={commonStyles.textSecondary}>
                Gestisci ordini prodotti
              </Text>
            </View>
            {pendingOrders.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: 'bold' }}>
                  {pendingOrders.length}
                </Text>
              </View>
            )}
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: 12, padding: 20 }]}
          onPress={() => router.push('/(admin)/products' as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <IconSymbol name="cube.fill" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 4 }]}>
                Prodotti
              </Text>
              <Text style={commonStyles.textSecondary}>
                Gestisci inventario
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, { marginBottom: 12, padding: 20 }]}
          onPress={() => router.push('/(admin)/coupons' as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <IconSymbol name="ticket" size={28} color={colors.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontSize: 18, fontWeight: '600', marginBottom: 4 }]}>
                Coupon
              </Text>
              <Text style={commonStyles.textSecondary}>
                Crea e invia sconti
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* Today's Appointments */}
        {todayAppointments.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16, fontSize: 20 }]}>
              Appuntamenti di Oggi
            </Text>

            {todayAppointments.map((appointment) => (
              <View key={appointment.id} style={[commonStyles.card, { marginBottom: 12 }]}>
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {appointment.service}
                  </Text>
                  <Text style={[commonStyles.text, { color: colors.primary, fontSize: 18, fontWeight: 'bold' }]}>
                    {appointment.time}
                  </Text>
                </View>
                <Text style={commonStyles.textSecondary}>
                  Cliente: {appointment.user?.name || 'Sconosciuto'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Telefono: {appointment.user?.phone || 'N/D'}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
