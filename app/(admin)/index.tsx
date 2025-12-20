
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { commonStyles, colors } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  todayAppointments: number;
  pendingOrders: number;
  upcomingAppointments: number;
  totalCustomers: number;
  totalFidelityCredits: number;
  pendingRedemptions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    pendingOrders: 0,
    upcomingAppointments: 0,
    totalCustomers: 0,
    totalFidelityCredits: 0,
    pendingRedemptions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      const today = new Date().toISOString().split('T')[0];

      // Today's appointments
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'booked');

      // Pending orders
      const { count: pendingOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

      // Upcoming appointments
      const { count: upcomingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('date', today)
        .eq('status', 'booked');

      // Total customers
      const { count: customersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Total fidelity credits across all users
      const { data: creditsData } = await supabase
        .from('users')
        .select('fidelity_credits')
        .eq('role', 'customer');

      const totalCredits = creditsData?.reduce((sum, user) => sum + (user.fidelity_credits || 0), 0) || 0;

      // Pending redemptions
      const { count: pendingRedemptionsCount } = await supabase
        .from('fidelity_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        todayAppointments: todayCount || 0,
        pendingOrders: pendingOrdersCount || 0,
        upcomingAppointments: upcomingCount || 0,
        totalCustomers: customersCount || 0,
        totalFidelityCredits: totalCredits,
        pendingRedemptions: pendingRedemptionsCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      Alert.alert('Errore', 'Impossibile caricare le statistiche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
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
        <Text style={commonStyles.headerTitle}>Dashboard Admin</Text>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.text, { marginBottom: 16, fontSize: 18 }]}>
          Benvenuto, {user?.name}!
        </Text>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6, marginBottom: 24 }}>
          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.todayAppointments}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Appuntamenti Oggi
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.upcomingAppointments}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Prossimi Appuntamenti
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.pendingOrders}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Ordini in Attesa
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.totalCustomers}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Clienti Totali
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.totalFidelityCredits}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Crediti Fedeltà Totali
              </Text>
            </View>
          </View>

          <View style={{ width: '50%', padding: 6 }}>
            <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 20, alignItems: 'center' }]}>
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {stats.pendingRedemptions}
              </Text>
              <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
                Riscatti in Attesa
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Azioni Rapide
        </Text>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/appointments')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="calendar" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Gestisci Appuntamenti
            </Text>
            <Text style={commonStyles.textSecondary}>
              Visualizza e gestisci gli appuntamenti
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/orders')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="bag.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Gestisci Ordini
            </Text>
            <Text style={commonStyles.textSecondary}>
              Visualizza e gestisci gli ordini
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/products')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="cube.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Gestisci Prodotti
            </Text>
            <Text style={commonStyles.textSecondary}>
              Aggiungi, modifica o elimina prodotti
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/fidelity-config')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="star.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Configurazione Fedeltà
            </Text>
            <Text style={commonStyles.textSecondary}>
              Gestisci ricompense fedeltà
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/fidelity-users')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="person.3.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Crediti Utenti
            </Text>
            <Text style={commonStyles.textSecondary}>
              Visualizza crediti e cronologia utenti
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/services')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="scissors" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Gestisci Servizi
            </Text>
            <Text style={commonStyles.textSecondary}>
              Configura servizi e prezzi
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/notifications')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="bell.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Invia Notifiche
            </Text>
            <Text style={commonStyles.textSecondary}>
              Invia notifiche personalizzate ai clienti
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(admin)/birthdays')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}
          >
            <IconSymbol name="gift.fill" size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              Compleanni
            </Text>
            <Text style={commonStyles.textSecondary}>
              Visualizza compleanni dei clienti
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
