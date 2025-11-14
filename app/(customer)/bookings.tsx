
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface ExistingAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
}

export default function BookingsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAppointment && editDate) {
      fetchExistingAppointmentsForDate(selectedAppointment.barber_id || '', editDate);
    }
  }, [editDate, selectedAppointment]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        console.error('Error fetching appointments:', error);
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchAppointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchExistingAppointmentsForDate = async (barberId: string, date: Date) => {
    try {
      const selectedDate = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, time, service')
        .eq('barber_id', barberId)
        .eq('date', selectedDate)
        .eq('status', 'booked')
        .neq('id', selectedAppointment?.id || ''); // Exclude current appointment

      if (error) {
        console.error('Error fetching existing appointments:', error);
        return;
      }

      console.log('Existing appointments for conflict check:', data?.length || 0);
      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchExistingAppointmentsForDate:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const canModifyAppointment = (appointment: Appointment): { canModify: boolean; reason?: string } => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 10) {
      return {
        canModify: false,
        reason: 'You can only modify appointments at least 10 hours in advance.',
      };
    }

    return { canModify: true };
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    const { canModify, reason } = canModifyAppointment(appointment);

    if (!canModify) {
      Alert.alert('Cannot Delete', reason);
      return;
    }

    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
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

              Alert.alert('Success', 'Appointment deleted successfully');
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

  const handleRescheduleAppointment = (appointment: Appointment) => {
    const { canModify, reason } = canModifyAppointment(appointment);

    if (!canModify) {
      Alert.alert('Cannot Reschedule', reason);
      return;
    }

    setSelectedAppointment(appointment);
    setEditDate(new Date(appointment.date));
    setEditTime(appointment.time);
    setExistingAppointments([]);
    setEditModalVisible(true);
  };

  const isTimeSlotAvailable = (timeSlot: string): boolean => {
    if (!selectedAppointment) return true;

    const serviceName = selectedAppointment.service;
    const serviceDuration = getServiceDuration(serviceName);

    // Check if this time slot conflicts with any existing appointment
    for (const appointment of existingAppointments) {
      const appointmentTime = appointment.time;
      const appointmentDuration = getServiceDuration(appointment.service);

      // Convert times to minutes for easier comparison
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinute;

      const [aptHour, aptMinute] = appointmentTime.split(':').map(Number);
      const aptTimeInMinutes = aptHour * 60 + aptMinute;

      // Check if the new appointment would overlap with existing appointment
      const newAppointmentEnd = slotTimeInMinutes + serviceDuration;
      const existingAppointmentEnd = aptTimeInMinutes + appointmentDuration;

      // Check for overlap
      if (
        (slotTimeInMinutes >= aptTimeInMinutes && slotTimeInMinutes < existingAppointmentEnd) ||
        (newAppointmentEnd > aptTimeInMinutes && newAppointmentEnd <= existingAppointmentEnd) ||
        (slotTimeInMinutes <= aptTimeInMinutes && newAppointmentEnd >= existingAppointmentEnd)
      ) {
        return false;
      }
    }

    return true;
  };

  const getServiceDuration = (serviceName: string): number => {
    const serviceDurations: { [key: string]: number } = {
      'Haircut': 30,
      'Beard Trim': 15,
      'Haircut + Beard': 45,
      'Hair Coloring': 60,
      'Kids Haircut': 20,
    };
    return serviceDurations[serviceName] || 30;
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    // Check if the selected time slot is available
    if (!isTimeSlotAvailable(editTime)) {
      Alert.alert(
        'Time Slot Unavailable',
        'This time slot conflicts with another appointment. Please select a different time.',
        [{ text: 'OK' }]
      );
      return;
    }

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

      Alert.alert('Success', 'Appointment rescheduled successfully');
      setEditModalVisible(false);
      setSelectedAppointment(null);
      setExistingAppointments([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to reschedule appointment');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return colors.primary;
      case 'completed':
        return colors.primary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
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
        <Text style={commonStyles.headerTitle}>My Bookings</Text>
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
          <React.Fragment>
            {upcomingAppointments.map((appointment, index) => {
              const { canModify } = canModifyAppointment(appointment);
              
              return (
                <View key={`upcoming-${appointment.id}-${index}`} style={[commonStyles.card, { marginBottom: 16 }]}>
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
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        {appointment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={commonStyles.textSecondary}>
                      📅 {new Date(appointment.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      🕐 {appointment.time}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      💳 {appointment.payment_mode === 'pay_in_person' ? 'Pay in Person' : 'Paid Online'}
                    </Text>
                  </View>

                  {!canModify && (
                    <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                      <Text style={[commonStyles.text, { fontSize: 12, textAlign: 'center' }]}>
                        ⚠️ Cannot modify - less than 10 hours until appointment
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        buttonStyles.primary,
                        { flex: 1, paddingVertical: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                        !canModify && { opacity: 0.5 },
                      ]}
                      onPress={() => handleRescheduleAppointment(appointment)}
                      disabled={!canModify}
                      activeOpacity={0.7}
                    >
                      <Text style={[buttonStyles.text, { color: colors.text, fontSize: 14 }]}>
                        Reschedule
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        buttonStyles.primary,
                        { flex: 1, paddingVertical: 10, backgroundColor: colors.error },
                        !canModify && { opacity: 0.5 },
                      ]}
                      onPress={() => handleDeleteAppointment(appointment)}
                      disabled={!canModify}
                      activeOpacity={0.7}
                    >
                      <Text style={[buttonStyles.text, { fontSize: 14 }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </React.Fragment>
        )}

        {pastAppointments.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Past Appointments ({pastAppointments.length})
            </Text>

            <React.Fragment>
              {pastAppointments.map((appointment, index) => (
                <View key={`past-${appointment.id}-${index}`} style={[commonStyles.card, { opacity: 0.7, marginBottom: 12 }]}>
                  <View style={[commonStyles.row, { marginBottom: 8 }]}>
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
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        {appointment.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={commonStyles.textSecondary}>
                    {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          </>
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Reschedule Appointment
            </Text>

            {selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedAppointment.service}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Current: {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}
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
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {generateTimeSlots().map((slot, slotIndex) => {
                  const isAvailable = isTimeSlotAvailable(slot);
                  return (
                    <TouchableOpacity
                      key={`timeslot-${slot}-${slotIndex}`}
                      style={[
                        {
                          margin: 4,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: !isAvailable ? colors.border : (editTime === slot ? colors.primary : colors.card),
                          borderWidth: 1,
                          borderColor: !isAvailable ? colors.border : (editTime === slot ? colors.primary : colors.border),
                          opacity: !isAvailable ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => {
                        if (isAvailable) {
                          setEditTime(slot);
                        } else {
                          Alert.alert('Unavailable', 'This time slot conflicts with another appointment');
                        }
                      }}
                      disabled={!isAvailable}
                      activeOpacity={0.7}
                    >
                      <Text style={[commonStyles.text, { fontSize: 14 }]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleUpdateAppointment}
                disabled={updating}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {updating ? 'Updating...' : 'Reschedule'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setEditModalVisible(false);
                  setSelectedAppointment(null);
                  setExistingAppointments([]);
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
