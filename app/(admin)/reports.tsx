
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';

interface ReportData {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  appointmentRevenue: number;
  productRevenue: number;
  pendingPayments: number;
}

export default function ReportsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState<ReportData>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    totalRevenue: 0,
    appointmentRevenue: 0,
    productRevenue: 0,
    pendingPayments: 0,
  });
  
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [filterType, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      console.log('Fetching report data...');
      
      let dateFilter = '';
      const today = new Date().toISOString().split('T')[0];
      
      if (filterType === 'today') {
        dateFilter = today;
      } else if (filterType === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString().split('T')[0];
      } else if (filterType === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString().split('T')[0];
      }

      // Fetch appointments data
      let appointmentsQuery = supabase
        .from('appointments')
        .select('*');

      if (filterType === 'today') {
        appointmentsQuery = appointmentsQuery.eq('date', dateFilter);
      } else if (filterType === 'week' || filterType === 'month') {
        appointmentsQuery = appointmentsQuery.gte('date', dateFilter);
      } else if (filterType === 'custom') {
        appointmentsQuery = appointmentsQuery
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data: appointments, error: aptError } = await appointmentsQuery;

      if (aptError) {
        console.error('Error fetching appointments:', aptError);
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
      services?.forEach(service => {
        servicePriceMap[service.name] = parseFloat(service.price) || 0;
      });

      // Fetch orders data
      let ordersQuery = supabase
        .from('orders')
        .select('*');

      if (filterType === 'today') {
        ordersQuery = ordersQuery.gte('created_at', `${dateFilter}T00:00:00`).lte('created_at', `${dateFilter}T23:59:59`);
      } else if (filterType === 'week' || filterType === 'month') {
        ordersQuery = ordersQuery.gte('created_at', `${dateFilter}T00:00:00`);
      } else if (filterType === 'custom') {
        ordersQuery = ordersQuery
          .gte('created_at', `${startDate.toISOString().split('T')[0]}T00:00:00`)
          .lte('created_at', `${endDate.toISOString().split('T')[0]}T23:59:59`);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      }

      // Calculate statistics
      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;

      // Calculate appointment revenue (completed appointments only - confirmed haircuts)
      const appointmentRevenue = appointments
        ?.filter(a => a.status === 'completed')
        .reduce((sum, a) => {
          const servicePrice = servicePriceMap[a.service] || 0;
          return sum + servicePrice;
        }, 0) || 0;

      // Calculate product revenue (paid orders only)
      const productRevenue = orders
        ?.filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) || 0;

      // Calculate pending payments (pending appointments and orders)
      const pendingAppointments = appointments
        ?.filter(a => a.payment_status === 'pending' && a.status === 'booked')
        .reduce((sum, a) => {
          const servicePrice = servicePriceMap[a.service] || 0;
          return sum + servicePrice;
        }, 0) || 0;

      const pendingOrders = orders
        ?.filter(o => o.payment_status === 'pending')
        .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) || 0;

      const totalRevenue = appointmentRevenue + productRevenue;
      const pendingPayments = pendingAppointments + pendingOrders;

      setReportData({
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        appointmentRevenue,
        productRevenue,
        pendingPayments,
      });
    } catch (error) {
      console.error('Error in fetchReportData:', error);
      Alert.alert('Errore', 'Impossibile caricare i dati del report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'today':
        return 'Oggi';
      case 'week':
        return 'Ultimi 7 Giorni';
      case 'month':
        return 'Ultimo Mese';
      case 'custom':
        return `${startDate.toLocaleDateString('it-IT')} - ${endDate.toLocaleDateString('it-IT')}`;
      default:
        return 'Oggi';
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
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Report</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 20 }]}>
          <Text style={[commonStyles.text, { marginBottom: 8 }]}>
            Periodo: {getFilterLabel()}
          </Text>
          <Text style={[commonStyles.title, { fontSize: 36 }]}>
            €{reportData.totalRevenue.toFixed(2)}
          </Text>
          <Text style={commonStyles.textSecondary}>
            Ricavi Totali (Confermati)
          </Text>
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Appuntamenti
        </Text>

        <View style={[commonStyles.card, { marginBottom: 16 }]}>
          <View style={[commonStyles.row, { marginBottom: 12 }]}>
            <Text style={commonStyles.text}>Totale Appuntamenti</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18 }]}>
              {reportData.totalAppointments}
            </Text>
          </View>
          <View style={[commonStyles.row, { marginBottom: 12 }]}>
            <Text style={commonStyles.text}>Completati</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.primary }]}>
              {reportData.completedAppointments}
            </Text>
          </View>
          <View style={commonStyles.row}>
            <Text style={commonStyles.text}>Annullati</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.error }]}>
              {reportData.cancelledAppointments}
            </Text>
          </View>
        </View>

        <Text style={[commonStyles.subtitle, { marginTop: 20, marginBottom: 16 }]}>
          Ricavi
        </Text>

        <View style={[commonStyles.card, { marginBottom: 16 }]}>
          <View style={[commonStyles.row, { marginBottom: 12 }]}>
            <Text style={commonStyles.text}>Ricavi Appuntamenti</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.primary }]}>
              €{reportData.appointmentRevenue.toFixed(2)}
            </Text>
          </View>
          <View style={[commonStyles.row, { marginBottom: 12 }]}>
            <Text style={commonStyles.text}>Ricavi Prodotti</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.secondary }]}>
              €{reportData.productRevenue.toFixed(2)}
            </Text>
          </View>
          <View style={[commonStyles.row, { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[commonStyles.text, { fontWeight: '600' }]}>Pagamenti in Attesa</Text>
            <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.accent }]}>
              €{reportData.pendingPayments.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[commonStyles.card, { backgroundColor: colors.accent, padding: 20 }]}>
          <Text style={[commonStyles.text, { marginBottom: 8 }]}>
            💡 Nota
          </Text>
          <Text style={commonStyles.textSecondary}>
            I ricavi mostrati includono solo gli appuntamenti completati/confermati e gli ordini pagati. I pagamenti in attesa non sono conteggiati nei ricavi totali.
          </Text>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Seleziona Periodo
            </Text>

            <TouchableOpacity
              style={[
                commonStyles.card,
                commonStyles.row,
                { marginBottom: 12 },
                filterType === 'today' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => {
                setFilterType('today');
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Oggi</Text>
              {filterType === 'today' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                commonStyles.card,
                commonStyles.row,
                { marginBottom: 12 },
                filterType === 'week' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => {
                setFilterType('week');
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Ultimi 7 Giorni</Text>
              {filterType === 'week' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                commonStyles.card,
                commonStyles.row,
                { marginBottom: 12 },
                filterType === 'month' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => {
                setFilterType('month');
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Ultimo Mese</Text>
              {filterType === 'month' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                commonStyles.card,
                commonStyles.row,
                { marginBottom: 16 },
                filterType === 'custom' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setFilterType('custom')}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Periodo Personalizzato</Text>
              {filterType === 'custom' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {filterType === 'custom' && (
              <>
                <TouchableOpacity
                  style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={commonStyles.text}>Data Inizio</Text>
                  <Text style={[commonStyles.text, { color: colors.primary }]}>
                    {startDate.toLocaleDateString('it-IT')}
                  </Text>
                </TouchableOpacity>

                {showStartDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        setStartDate(selectedDate);
                      }
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
                  onPress={() => setShowEndDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={commonStyles.text}>Data Fine</Text>
                  <Text style={[commonStyles.text, { color: colors.primary }]}>
                    {endDate.toLocaleDateString('it-IT')}
                  </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        setEndDate(selectedDate);
                      }
                    }}
                    minimumDate={startDate}
                  />
                )}
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>Applica</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
