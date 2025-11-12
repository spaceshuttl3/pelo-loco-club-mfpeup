
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments...');
      
      // Get all appointments with date >= today (not filtering by time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          user:users!appointments_user_id_fkey(id, name, email, phone),
          barber:barbers!appointments_barber_id_fkey(id, name)
        `)
        .gte('date', todayString)
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

  const handleDeleteAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment for ${appointment.user?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointment.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Appointment deleted');
              fetchAppointments();
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Error', 'Failed to delete appointment');
            }
          },
        },
      ]
    );
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDate(new Date(appointment.date));
    setEditTime(appointment.time);
    setEditModalVisible(true);
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          date: editDate.toISOString().split('T')[0],
          time: editTime,
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      Alert.alert('Success', 'Appointment updated successfully');
      setEditModalVisible(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    } finally {
      setUpdating(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Show all future appointments (admin can see everything)
  const upcomingAppointments = appointments.filter(
    (apt) => apt.status === 'booked'
  );

  const pastAppointments = appointments.filter(
    (apt) => apt.status !== 'booked'
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
        contentContainerStyle={{ paddingBottom: 120 }}
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
            <View key={appointment.id} style={[commonStyles.card, { marginBottom: 16 }]}>
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

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
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

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => handleEditAppointment(appointment)}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                    Reschedule
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}
                  onPress={() => handleDeleteAppointment(appointment)}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600', color: colors.error }]}>
                    Delete
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
              <View key={appointment.id} style={[commonStyles.card, { opacity: 0.7, marginBottom: 12 }]}>
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

      {/* Edit Appointment Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Reschedule Appointment
            </Text>

            {selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedAppointment.service}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Customer: {selectedAppointment.user?.name}
                </Text>
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Select New Date
            </Text>
            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="calendar" size={24} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                {editDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setEditDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Select New Time
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 }}>
              {generateTimeSlots().map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    {
                      margin: 4,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: editTime === slot ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: editTime === slot ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setEditTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text style={[commonStyles.text, { fontSize: 14 }]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleUpdateAppointment}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {updating ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setEditModalVisible(false);
                  setSelectedAppointment(null);
                }}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
