
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
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments...');
      
      // Fetch appointments with user details and barber details
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user:users!appointments_user_id_fkey(id, name, email, phone),
          barber:barbers!appointments_barber_id_fkey(id, name)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        throw error;
      }

      console.log('Appointments fetched:', data?.length || 0);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
      Alert.alert('Error', 'Could not load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchAppointments();
      Alert.alert('Success', `Appointment ${status}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'booked' && new Date(apt.date) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status !== 'booked' || new Date(apt.date) < new Date()
  );

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Appointments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Upcoming ({upcomingAppointments.length})
        </Text>

        {upcomingAppointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No upcoming appointments
            </Text>
          </View>
        ) : (
          upcomingAppointments.map((appointment) => (
            <View key={appointment.id} style={commonStyles.card}>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                  {appointment.service}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12 }]}>
                    {appointment.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={commonStyles.textSecondary}>
                  Customer: {appointment.user?.name || 'Unknown'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Phone: {appointment.user?.phone || 'N/A'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Date: {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </Text>
                {appointment.barber && (
                  <Text style={commonStyles.textSecondary}>
                    Barber: {appointment.barber.name}
                  </Text>
                )}
                <Text style={commonStyles.textSecondary}>
                  Payment: {appointment.payment_mode === 'pay_in_person' ? 'In Person' : 'Online'} -{' '}
                  {appointment.payment_status}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={() => updateAppointmentStatus(appointment.id, 'completed')}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                    Complete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.error,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {pastAppointments.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Past Appointments ({pastAppointments.length})
            </Text>

            {pastAppointments.map((appointment) => (
              <View key={appointment.id} style={[commonStyles.card, { opacity: 0.7 }]}>
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {appointment.service}
                  </Text>
                  <View
                    style={{
                      backgroundColor: appointment.status === 'completed' ? colors.primary : colors.error,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      {appointment.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={commonStyles.textSecondary}>
                  Customer: {appointment.user?.name || 'Unknown'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Date: {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
