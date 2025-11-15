
import { commonStyles, colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { Appointment, Order } from '@/types';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { signOut } = useAuth();
  const { width } = useWindowDimensions();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's appointments
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', today)
        .eq('status', 'booked')
        .order('time', { ascending: true });

      if (aptError) {
        console.error('Error fetching appointments:', aptError);
      } else {
        setTodayAppointments(appointments || []);
      }

      // Fetch pending orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else {
        setPendingOrders(orders || []);
      }

      // Fetch services to get pricing information
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('name, price');

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      // Create a map of service names to prices
      const servicePriceMap: { [key: string]: number } = {};
      if (services) {
        services.forEach(service => {
          servicePriceMap[service.name] = parseFloat(service.price.toString()) || 0;
        });
      }

      // Calculate today's earnings (completed appointments + paid orders)
      const { data: completedAppointments, error: completedAptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('date', today)
        .eq('status', 'completed');

      const { data: paidOrders, error: paidOrdersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('payment_status', 'paid');

      let earnings = 0;
      
      if (!completedAptError && completedAppointments) {
        earnings += completedAppointments.reduce((sum, apt) => {
          const servicePrice = servicePriceMap[apt.service] || 0;
          return sum + servicePrice;
        }, 0);
      }

      if (!paidOrdersError && paidOrders) {
        earnings += paidOrders.reduce((sum, order) => {
          return sum + (parseFloat(order.total_price.toString()) || 0);
        }, 0);
      }

      setTodayEarnings(earnings);
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
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Errore', 'Impossibile uscire');
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
      title: 'Appuntamenti',
      icon: 'calendar',
      color: colors.primary,
      route: '/(admin)/appointments',
      badge: todayAppointments.length,
    },
    {
      id: 'orders',
      title: 'Ordini',
      icon: 'bag.fill',
      color: colors.secondary,
      route: '/(admin)/orders',
      badge: pendingOrders.length,
    },
    {
      id: 'products',
      title: 'Prodotti',
      icon: 'cube.fill',
      color: colors.primary,
      route: '/(admin)/products',
    },
    {
      id: 'services',
      title: 'Servizi',
      icon: 'scissors',
      color: colors.primary,
      route: '/(admin)/services',
    },
    {
      id: 'coupons',
      title: 'Coupon',
      icon: 'gift.fill',
      color: colors.secondary,
      route: '/(admin)/coupons',
    },
    {
      id: 'birthdays',
      title: 'Compleanni',
      icon: 'birthday.cake.fill',
      color: colors.primary,
      route: '/(admin)/birthdays',
    },
    {
      id: 'reports',
      title: 'Report',
      icon: 'chart.bar.fill',
      color: colors.primary,
      route: '/(admin)/reports',
    },
    {
      id: 'notifications',
      title: 'Notifiche',
      icon: 'bell.fill',
      color: colors.secondary,
      route: '/(admin)/notifications',
    },
  ];

  // Calculate card width based on screen size
  const cardWidth = width < 400 ? '100%' : '50%';

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ marginBottom: 30, marginTop: 20 }}>
          <View style={[commonStyles.row, { marginBottom: 8 }]}>
            <Text style={[commonStyles.title, { fontSize: Math.min(width * 0.08, 32), flex: 1 }]}>
              Dashboard Admin
            </Text>
            <TouchableOpacity onPress={handleSignOut}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={28} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={commonStyles.textSecondary}>
            Gestisci il tuo barbershop
          </Text>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 30 }]}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
            Oggi
          </Text>
          <View style={[commonStyles.row, { marginBottom: 8 }]}>
            <Text style={commonStyles.text}>Appuntamenti:</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18 }]}>
              {todayAppointments.length}
            </Text>
          </View>
          <View style={[commonStyles.row, { marginBottom: 8 }]}>
            <Text style={commonStyles.text}>Ordini in Attesa:</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18 }]}>
              {pendingOrders.length}
            </Text>
          </View>
          <View style={[commonStyles.row, { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[commonStyles.text, { fontWeight: '600' }]}>Ricavi Giornalieri:</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 20, color: colors.black }]}>
              €{todayEarnings.toFixed(2)}
            </Text>
          </View>
        </View>

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
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20, position: 'relative' }]}>
                {action.badge !== undefined && action.badge > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: colors.error,
                      borderRadius: 12,
                      minWidth: 24,
                      height: 24,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 6,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12, fontWeight: 'bold' }]}>
                      {action.badge}
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
      </ScrollView>
    </SafeAreaView>
  );
}
