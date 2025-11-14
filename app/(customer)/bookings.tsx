
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { Appointment } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';

interface ExistingAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
}

export default function BookingsScreen() {
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
        .neq('id', selectedAppointment?.id || '');

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
        reason: 'Puoi modificare gli appuntamenti solo con almeno 10 ore di anticipo.',
      };
    }

    return { canModify: true };
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    const { canModify, reason } = canModifyAppointment(appointment);

    if (!canModify) {
      Alert.alert('Impossibile Eliminare', reason);
      return;
    }

    Alert.alert(
      'Elimina Appuntamento',
      'Sei sicuro di voler eliminare questo appuntamento?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointment.id);

              if (error) throw error;

              Alert.alert('Successo', 'Appuntamento eliminato con successo');
              fetchAppointments();
            } catch (error) {
              console.error('Error deleting appointment:', error);
              Alert.alert('Errore', 'Impossibile eliminare l\'appuntamento');
            }
          },
        },
      ]
    );
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    const { canModify, reason } = canModifyAppointment(appointment);

    if (!canModify) {
      Alert.alert('Impossibile Riprogrammare', reason);
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

    for (const appointment of existingAppointments) {
      const appointmentTime = appointment.time;
      const appointmentDuration = getServiceDuration(appointment.service);

      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinute;

      const [aptHour, aptMinute] = appointmentTime.split(':').map(Number);
      const aptTimeInMinutes = aptHour * 60 + aptMinute;

      const newAppointmentEnd = slotTimeInMinutes + serviceDuration;
      const existingAppointmentEnd = aptTimeInMinutes + appointmentDuration;

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

    if (!isTimeSlotAvailable(editTime)) {
      Alert.alert(
        'Orario Non Disponibile',
        'Questo orario è in conflitto con un altro appuntamento. Seleziona un orario diverso.',
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

      Alert.alert('Successo', 'Appuntamento riprogrammato con successo');
      setEditModalVisible(false);
      setSelectedAppointment(null);
      setExistingAppointments([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Errore', 'Impossibile riprogrammare l\'appuntamento');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked':
        return 'PRENOTATO';
      case 'completed':
        return 'COMPLETATO';
      case 'cancelled':
        return 'ANNULLATO';
      default:
        return status.toUpperCase();
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
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Le Mie Prenotazioni</Text>
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
          Prossimi ({upcomingAppointments.length})
        </Text>

        {upcomingAppointments.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun appuntamento in programma
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
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={commonStyles.textSecondary}>
                      📅 {new Date(appointment.date).toLocaleDateString('it-IT', {
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
                      💳 {appointment.payment_mode === 'pay_in_person' ? 'Paga di Persona' : 'Pagato Online'}
                    </Text>
                  </View>

                  {!canModify && (
                    <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                      <Text style={[commonStyles.text, { fontSize: 12, textAlign: 'center' }]}>
                        ⚠️ Non modificabile - meno di 10 ore all&apos;appuntamento
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
                        Riprogramma
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
                        Elimina
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
              Appuntamenti Passati ({pastAppointments.length})
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
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={commonStyles.textSecondary}>
                    {new Date(appointment.date).toLocaleDateString('it-IT')} alle {appointment.time}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          </>
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Riprogramma Appuntamento
            </Text>

            {selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedAppointment.service}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Attuale: {new Date(selectedAppointment.date).toLocaleDateString('it-IT')} alle {selectedAppointment.time}
                </Text>
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Seleziona Nuova Data
            </Text>
            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="calendar" size={24} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                {editDate.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
              Seleziona Nuovo Orario
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
                          Alert.alert('Non disponibile', 'Questo orario è in conflitto con un altro appuntamento');
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
                  {updating ? 'Aggiornamento...' : 'Riprogramma'}
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
                <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
