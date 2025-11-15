
import { Appointment, Order } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayAppointmentsCount: 0,
    todayRevenue: 0,
    pendingOrdersCount: 0,
    upcomingAppointments: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          user:users!appointments_user_id_fkey(name, email, phone)
        `)
        .eq('date', today)
        .order('time', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        console.log('Today appointments fetched:', appointmentsData?.length || 0);
        setTodayAppointments(appointmentsData || []);
      }

      // Fetch pending orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          user:users!orders_user_id_fkey(name, email, phone)
        `)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        console.log('Pending orders fetched:', ordersData?.length || 0);
        setPendingOrders(ordersData || []);
      }

      // Calculate stats
      const todayRevenue = appointmentsData
        ?.filter(apt => apt.status === 'completed' && apt.payment_status === 'paid')
        .reduce((sum, apt) => {
          // Fetch service price from services table
          return sum + 0; // We'll need to join with services table for accurate pricing
        }, 0) || 0;

      // Count upcoming appointments (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const { count: upcomingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('date', today)
        .lte('date', nextWeekStr)
        .eq('status', 'booked');

      setStats({
        todayAppointmentsCount: appointmentsData?.length || 0,
        todayRevenue,
        pendingOrdersCount: ordersData?.length || 0,
        upcomingAppointments: upcomingCount || 0,
      });
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati della dashboard');
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
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
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
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Dashboard Admin</Text>
        <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 }}>
          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16 }]}>
              <IconSymbol name="calendar" size={32} color={colors.text} />
              <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold', marginTop: 8 }]}>
                {stats.todayAppointmentsCount}
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                Appuntamenti Oggi
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.accent, padding: 16 }]}>
              <IconSymbol name="bag" size={32} color={colors.text} />
              <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold', marginTop: 8 }]}>
                {stats.pendingOrdersCount}
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                Ordini Pendenti
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { padding: 16 }]}>
              <IconSymbol name="clock" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold', marginTop: 8 }]}>
                {stats.upcomingAppointments}
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                Prossimi 7 Giorni
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { padding: 16 }]}>
              <IconSymbol name="eurosign.circle" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold', marginTop: 8 }]}>
                €{stats.todayRevenue.toFixed(2)}
              </Text>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                Incasso Oggi
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Azioni Rapide
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 20 }}>
          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/appointments')}
              activeOpacity={0.7}
            >
              <IconSymbol name="calendar" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Appuntamenti
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/orders')}
              activeOpacity={0.7}
            >
              <IconSymbol name="bag" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Ordini
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/products')}
              activeOpacity={0.7}
            >
              <IconSymbol name="cube.box" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Prodotti
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/services')}
              activeOpacity={0.7}
            >
              <IconSymbol name="scissors" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Servizi
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/rewards-config')}
              activeOpacity={0.7}
            >
              <IconSymbol name="star.fill" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Premi & Traguardi
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/birthdays')}
              activeOpacity={0.7}
            >
              <IconSymbol name="gift" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Compleanni
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/notifications')}
              activeOpacity={0.7}
            >
              <IconSymbol name="bell" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Notifiche
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <TouchableOpacity
              style={[commonStyles.card, { padding: 16, alignItems: 'center' }]}
              onPress={() => router.push('/(admin)/reports')}
              activeOpacity={0.7}
            >
              <IconSymbol name="chart.bar" size={32} color={colors.primary} />
              <Text style={[commonStyles.text, { marginTop: 8, textAlign: 'center' }]}>
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Appointments */}
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Appuntamenti di Oggi ({todayAppointments.length})
        </Text>

        {todayAppointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun appuntamento oggi
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {todayAppointments.map((appointment, index) => (
              <View key={`appointment-${appointment.id}-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {appointment.time} - {appointment.service}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor:
                        appointment.status === 'completed'
                          ? colors.primary
                          : appointment.status === 'cancelled'
                          ? colors.error
                          : colors.accent,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      {appointment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={commonStyles.textSecondary}>
                  Cliente: {appointment.user?.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Pagamento: {appointment.payment_status === 'paid' ? 'Pagato' : 'Pendente'}
                </Text>
              </View>
            ))}
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
