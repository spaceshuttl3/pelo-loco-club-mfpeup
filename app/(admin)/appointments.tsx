
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
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ManageAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, user:users(*)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'booked' && new Date(apt.date) >= new Date()
  );

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Upcoming Appointments ({upcomingAppointments.length})
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
                    backgroundColor: colors.secondary,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={[commonStyles.textSecondary, { fontSize: 12, color: colors.text }]}>
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
                <Text style={commonStyles.textSecondary}>
                  Payment: {appointment.payment_mode === 'pay_in_person' ? 'In Person' : 'Online'} -{' '}
                  {appointment.payment_status}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.success,
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
      </ScrollView>
    </View>
  );
}
