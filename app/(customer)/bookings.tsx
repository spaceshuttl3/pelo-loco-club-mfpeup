
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function BookingsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

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
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return colors.secondary;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'booked' && new Date(apt.date) >= new Date()
  );
  const pastAppointments = appointments.filter(
    (apt) => apt.status === 'completed' || new Date(apt.date) < new Date()
  );

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.title, { marginBottom: 20 }]}>
          My Bookings
        </Text>

        {upcomingAppointments.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
              Upcoming
            </Text>
            {upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={commonStyles.card}>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {appointment.service}
                  </Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(appointment.status),
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <IconSymbol name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginLeft: 8 }]}>
                    {new Date(appointment.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginLeft: 8 }]}>
                    {appointment.time}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="creditcard" size={16} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginLeft: 8 }]}>
                    {appointment.payment_mode === 'pay_in_person' ? 'Pay in Person' : 'Paid Online'} -{' '}
                    {appointment.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {pastAppointments.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Past Appointments
            </Text>
            {pastAppointments.map((appointment) => (
              <View key={appointment.id} style={[commonStyles.card, { opacity: 0.7 }]}>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    {appointment.service}
                  </Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(appointment.status),
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <IconSymbol name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginLeft: 8 }]}>
                    {new Date(appointment.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginLeft: 8 }]}>
                    {appointment.time}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {appointments.length === 0 && (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
              No bookings yet
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
              Book your first appointment to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
