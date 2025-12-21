
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appointment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { IconSymbol } from '../../components/IconSymbol';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface ExistingAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
}

interface BlockedDate {
  id: string;
  barber_id: string;
  blocked_date: string;
}

interface Barber {
  id: string;
  name: string;
  available_days: string[];
  available_hours: { start: string; end: string };
}

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);

  const fetchAppointments = useCallback(async () => {
    try {
      console.log('Fetching appointments for user:', user?.id);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers!appointments_barber_id_fkey(id, name, available_days, available_hours)
        `)
        .eq('user_id', user?.id)
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
      Alert.alert('Errore', 'Impossibile caricare gli appuntamenti');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const fetchBarbers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name, available_days, available_hours')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching barbers:', error);
        return;
      }

      setBarbers(data || []);
    } catch (error) {
      console.error('Error in fetchBarbers:', error);
    }
  }, []);

  const fetchBlockedDates = useCallback(async (barberId: string) => {
    try {
      const { data, error } = await supabase
        .from('barber_blocked_dates')
        .select('*')
        .eq('barber_id', barberId);

      if (error) {
        console.error('Error fetching blocked dates:', error);
        return;
      }

      console.log('Blocked dates fetched:', data?.length || 0);
      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error in fetchBlockedDates:', error);
    }
  }, []);

  const fetchExistingAppointmentsForDate = useCallback(async (barberId: string, date: Date) => {
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
  }, [selectedAppointment?.id]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchBarbers();
    }
  }, [user, fetchAppointments, fetchBarbers]);

  useEffect(() => {
    if (selectedAppointment && editDate) {
      fetchExistingAppointmentsForDate(selectedAppointment.barber_id || '', editDate);
    }
  }, [editDate, selectedAppointment, fetchExistingAppointmentsForDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const canModifyAppointment = (appointment: Appointment): boolean => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  const isDateBlocked = useCallback((checkDate: Date): boolean => {
    const dateString = checkDate.toISOString().split('T')[0];
    return blockedDates.some(bd => bd.blocked_date === dateString);
  }, [blockedDates]);

  const isBarberAvailableOnDay = useCallback((checkDate: Date, barberId: string): boolean => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return false;

    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    return barber.available_days.includes(dayName);
  }, [barbers]);

  const isTimeInBarberHours = useCallback((timeSlot: string, barberId: string): boolean => {
    const barber = barbers.find(b => b.id === barberId);
    if (!barber) return false;

    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
    const slotTimeInMinutes = slotHour * 60 + slotMinute;

    const [startHour, startMinute] = barber.available_hours.start.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = barber.available_hours.end.split(':').map(Number);
    const endTimeInMinutes = endHour * 60 + endMinute;

    return slotTimeInMinutes >= startTimeInMinutes && slotTimeInMinutes < endTimeInMinutes;
  }, [barbers]);

  const handleCancelAppointment = (appointment: Appointment) => {
    if (!canModifyAppointment(appointment)) {
      Alert.alert(
        'Impossibile Annullare',
        'Gli appuntamenti possono essere annullati solo con almeno 24 ore di anticipo.'
      );
      return;
    }

    setSelectedAppointment(appointment);
    setCancellationReason('');
    setCancelModalVisible(true);
  };

  const confirmCancelAppointment = async () => {
    if (!selectedAppointment) return;

    if (!cancellationReason.trim()) {
      Alert.alert('Motivo Richiesto', 'Per favore, fornisci un motivo per l\'annullamento.');
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason.trim(),
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      Alert.alert('Successo', 'Appuntamento annullato');
      setCancelModalVisible(false);
      setSelectedAppointment(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Errore', 'Impossibile annullare l\'appuntamento');
    }
  };

  const handleRescheduleAppointment = async (appointment: Appointment) => {
    if (!canModifyAppointment(appointment)) {
      Alert.alert(
        'Impossibile Riprogrammare',
        'Gli appuntamenti possono essere riprogrammati solo con almeno 24 ore di anticipo.'
      );
      return;
    }

    setSelectedAppointment(appointment);
    setEditDate(new Date(appointment.date));
    setEditTime(appointment.time);
    setExistingAppointments([]);
    
    // Fetch blocked dates for this barber
    if (appointment.barber_id) {
      await fetchBlockedDates(appointment.barber_id);
    }
    
    setRescheduleModalVisible(true);
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

    // Validate date is not blocked
    if (isDateBlocked(editDate)) {
      Alert.alert(
        'Data Non Disponibile',
        'Questa data non è disponibile per prenotazioni.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate barber is available on this day
    if (!isBarberAvailableOnDay(editDate, selectedAppointment.barber_id || '')) {
      const dayName = editDate.toLocaleDateString('it-IT', { weekday: 'long' });
      Alert.alert(
        'Giorno Non Disponibile',
        `Il barbiere non è disponibile di ${dayName}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate time is within barber hours
    if (!isTimeInBarberHours(editTime, selectedAppointment.barber_id || '')) {
      Alert.alert(
        'Orario Non Disponibile',
        'Questo orario è fuori dall\'orario di lavoro del barbiere.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate no conflicts with other appointments
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
      setRescheduleModalVisible(false);
      setSelectedAppointment(null);
      setExistingAppointments([]);
      setBlockedDates([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Errore', 'Impossibile riprogrammare l\'appuntamento');
    } finally {
      setUpdating(false);
    }
  };

  const generateTimeSlots = (): string[] => {
    if (!selectedAppointment?.barber_id) return [];

    const barber = barbers.find(b => b.id === selectedAppointment.barber_id);
    if (!barber) return [];

    const slots: string[] = [];
    const startHour = parseInt(barber.available_hours.start.split(':')[0]);
    const endHour = parseInt(barber.available_hours.end.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
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
        return colors.card;
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

  const now = new Date();
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const todayString = now.toISOString().split('T')[0];

  const upcomingAppointments = appointments.filter((apt) => {
    if (apt.status !== 'booked') return false;
    
    const aptDate = apt.date;
    
    if (aptDate > todayString) return true;
    
    if (aptDate === todayString) {
      const [aptHour, aptMinute] = apt.time.split(':').map(Number);
      const aptTimeInMinutes = aptHour * 60 + aptMinute;
      return aptTimeInMinutes > currentTimeInMinutes;
    }
    
    return false;
  });

  const pastAppointments = appointments.filter(
    (apt) => !upcomingAppointments.includes(apt)
  );

  const dateIsBlocked = isDateBlocked(editDate);
  const barberAvailableOnDay = selectedAppointment?.barber_id 
    ? isBarberAvailableOnDay(editDate, selectedAppointment.barber_id) 
    : false;

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Le Mie Prenotazioni</Text>
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
          Prossimi Appuntamenti ({upcomingAppointments.length})
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
            {upcomingAppointments.map((appointment) => (
              <View key={`upcoming-${appointment.id}`} style={[commonStyles.card, { marginBottom: 16 }]}>
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
                    Data: {new Date(appointment.date).toLocaleDateString('it-IT')} alle {appointment.time}
                  </Text>
                  {appointment.barber && (
                    <Text style={commonStyles.textSecondary}>
                      Barbiere: {appointment.barber.name}
                    </Text>
                  )}
                  <Text style={commonStyles.textSecondary}>
                    Pagamento: {appointment.payment_mode === 'pay_in_person' ? 'Di Persona' : 'Online'} -{' '}
                    {appointment.payment_status === 'pending' ? 'In Attesa' : 'Pagato'}
                  </Text>
                </View>

                {canModifyAppointment(appointment) && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[buttonStyles.primary, { flex: 1, paddingVertical: 10 }]}
                      onPress={() => handleRescheduleAppointment(appointment)}
                    >
                      <Text style={[buttonStyles.text, { fontSize: 14 }]}>Riprogramma</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.error }]}
                      onPress={() => handleCancelAppointment(appointment)}
                    >
                      <Text style={[buttonStyles.text, { fontSize: 14 }]}>Annulla</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!canModifyAppointment(appointment) && (
                  <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 12 }]}>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      ⚠️ Modifiche disponibili solo con 24 ore di anticipo
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </React.Fragment>
        )}

        {pastAppointments.length > 0 && (
          <>
            <TouchableOpacity
              style={[
                commonStyles.card,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 30,
                  marginBottom: 16,
                  paddingVertical: 16,
                },
              ]}
              onPress={() => setShowPastAppointments(!showPastAppointments)}
              activeOpacity={0.7}
            >
              <Text style={[commonStyles.subtitle, { marginBottom: 0 }]}>
                Appuntamenti Passati ({pastAppointments.length})
              </Text>
              <IconSymbol
                name={showPastAppointments ? 'chevron.up' : 'chevron.down'}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>

            {showPastAppointments && (
              <React.Fragment>
                {pastAppointments.map((appointment) => (
                  <View key={`past-${appointment.id}`} style={[commonStyles.card, { opacity: 0.7, marginBottom: 12 }]}>
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
                      Data: {new Date(appointment.date).toLocaleDateString('it-IT')} alle {appointment.time}
                    </Text>
                    {appointment.barber && (
                      <Text style={commonStyles.textSecondary}>
                        Barbiere: {appointment.barber.name}
                      </Text>
                    )}

                    {appointment.cancellation_reason && (
                      <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 12, marginTop: 8 }]}>
                        <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600', marginBottom: 4 }]}>
                          Motivo Annullamento:
                        </Text>
                        <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                          {appointment.cancellation_reason}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </React.Fragment>
            )}
          </>
        )}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModalVisible(false)}
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

            {dateIsBlocked && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontSize: 13 }]}>
                  ⚠️ Questa data non è disponibile
                </Text>
              </View>
            )}

            {!barberAvailableOnDay && selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontSize: 13 }]}>
                  ⚠️ Il barbiere non è disponibile in questo giorno
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
              <View style={{ marginBottom: 16 }}>
                <DateTimePicker
                  value={editDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (selectedDate) {
                      setEditDate(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                  textColor={colors.text}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { marginTop: 8 }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={buttonStyles.text}>Conferma</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Seleziona Nuovo Orario
            </Text>
            <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {generateTimeSlots().map((slot) => {
                  const isAvailable = isTimeSlotAvailable(slot) && 
                    isTimeInBarberHours(slot, selectedAppointment?.barber_id || '') &&
                    !dateIsBlocked &&
                    barberAvailableOnDay;
                  
                  return (
                    <TouchableOpacity
                      key={`reschedule-slot-${slot}`}
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
                          Alert.alert('Non disponibile', 'Questo orario non è disponibile');
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
                  {updating ? 'Aggiornamento...' : 'Aggiorna'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setRescheduleModalVisible(false);
                  setSelectedAppointment(null);
                  setExistingAppointments([]);
                  setBlockedDates([]);
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

      {/* Cancel Modal with Reason */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Annulla Appuntamento
            </Text>

            {selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedAppointment.service}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Data: {new Date(selectedAppointment.date).toLocaleDateString('it-IT')} alle {selectedAppointment.time}
                </Text>
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Motivo dell&apos;annullamento
            </Text>
            <TextInput
              style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Spiega perché vuoi annullare questo appuntamento..."
              placeholderTextColor={colors.textSecondary}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.error }]}
                onPress={confirmCancelAppointment}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>Conferma Annullamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setSelectedAppointment(null);
                  setCancellationReason('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Indietro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
