
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../app/integrations/supabase/types';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GlassView } from 'expo-glass-effect';
import { useAuth } from '../../contexts/AuthContext';

interface ExistingAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
}

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export default function ManageAppointmentsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [editTime, setEditTime] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching barbers:', error);
        return;
      }

      setBarbers(data || []);
    } catch (error) {
      console.error('Error in fetchBarbers:', error);
    }
  };

  const fetchAppointments = useCallback(async () => {
    try {
      console.log('Fetching appointments...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          user:users!appointments_user_id_fkey(id, name, email, phone, fidelity_credits),
          barber:barbers!appointments_barber_id_fkey(id, name),
          fidelity_redemption:fidelity_redemptions!appointments_fidelity_redemption_id_fkey(
            id,
            status,
            credits_deducted,
            reward:fidelity_rewards(name, description)
          )
        `)
        .gte('date', todayString);

      if (selectedBarberId) {
        query = query.eq('barber_id', selectedBarberId);
      }

      const { data, error } = await query
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
  }, [selectedBarberId]);

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
    fetchBarbers();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (selectedAppointment && editDate) {
      fetchExistingAppointmentsForDate(selectedAppointment.barber_id || '', editDate);
    }
  }, [editDate, selectedAppointment, fetchExistingAppointmentsForDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const completeAppointmentAndAwardCredits = async (appointment: Appointment) => {
    try {
      // Check if payment is completed
      if (appointment.payment_status !== 'paid') {
        Alert.alert(
          'Pagamento Non Completato',
          'Il pagamento deve essere completato prima di assegnare i crediti. Vuoi completare l\'appuntamento senza assegnare crediti?',
          [
            { text: 'Annulla', style: 'cancel' },
            {
              text: 'Completa Senza Crediti',
              onPress: async () => {
                const { error } = await supabase
                  .from('appointments')
                  .update({ status: 'completed' })
                  .eq('id', appointment.id);

                if (error) throw error;
                Alert.alert('Successo', 'Appuntamento completato');
                fetchAppointments();
              },
            },
          ]
        );
        return;
      }

      // Check if credits already awarded
      if (appointment.credits_awarded) {
        Alert.alert('Crediti Già Assegnati', 'I crediti sono già stati assegnati per questo appuntamento');
        return;
      }

      // Award 1 credit
      const currentCredits = appointment.user?.fidelity_credits || 0;
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ fidelity_credits: currentCredits + 1 })
        .eq('id', appointment.user_id);

      if (updateUserError) throw updateUserError;

      // Mark appointment as completed and credited
      const { error: updateAppointmentError } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          credits_awarded: true,
        })
        .eq('id', appointment.id);

      if (updateAppointmentError) throw updateAppointmentError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('fidelity_transactions')
        .insert({
          user_id: appointment.user_id,
          credits_change: 1,
          transaction_type: 'earned',
          reference_type: 'appointment',
          reference_id: appointment.id,
          description: `Credito guadagnato: ${appointment.service}`,
        });

      if (transactionError) throw transactionError;

      // Confirm fidelity redemption if exists
      if (appointment.fidelity_redemption_id) {
        const { error: confirmError } = await supabase
          .from('fidelity_redemptions')
          .update({ 
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            confirmed_by: currentUser?.id,
          })
          .eq('id', appointment.fidelity_redemption_id);

        if (confirmError) {
          console.error('Error confirming redemption:', confirmError);
        }
      }

      Alert.alert('Successo', 'Appuntamento completato e 1 credito assegnato!');
      fetchAppointments();
    } catch (error) {
      console.error('Error completing appointment:', error);
      Alert.alert('Errore', 'Impossibile completare l\'appuntamento');
    }
  };

  const handleCancelAppointment = (appointment: Appointment) => {
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

      // If there's a pending redemption, cancel it and refund credits
      if (selectedAppointment.fidelity_redemption_id) {
        const { data: redemptionData, error: redemptionError } = await supabase
          .from('fidelity_redemptions')
          .select('*, user:users!fidelity_redemptions_user_id_fkey(fidelity_credits)')
          .eq('id', selectedAppointment.fidelity_redemption_id)
          .single();

        if (!redemptionError && redemptionData && redemptionData.status === 'pending') {
          // Refund credits
          const currentCredits = redemptionData.user?.fidelity_credits || 0;
          await supabase
            .from('users')
            .update({ fidelity_credits: currentCredits + redemptionData.credits_deducted })
            .eq('id', redemptionData.user_id);

          // Cancel redemption
          await supabase
            .from('fidelity_redemptions')
            .update({ status: 'cancelled' })
            .eq('id', selectedAppointment.fidelity_redemption_id);

          // Record transaction
          await supabase
            .from('fidelity_transactions')
            .insert({
              user_id: redemptionData.user_id,
              credits_change: redemptionData.credits_deducted,
              transaction_type: 'cancelled',
              reference_type: 'redemption',
              reference_id: redemptionData.id,
              description: 'Crediti rimborsati per appuntamento annullato',
            });
        }
      }

      Alert.alert('Successo', 'Appuntamento annullato. Il cliente è stato notificato.');
      setCancelModalVisible(false);
      setSelectedAppointment(null);
      setCancellationReason('');
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      Alert.alert('Errore', 'Impossibile annullare l\'appuntamento');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
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

      Alert.alert('Successo', 'Appuntamento aggiornato con successo');
      setEditModalVisible(false);
      setSelectedAppointment(null);
      setExistingAppointments([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Errore', 'Impossibile aggiornare l\'appuntamento');
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

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Appuntamenti</Text>
        <View style={{ width: 24 }} />
      </View>

      {Platform.OS === 'ios' ? (
        <GlassView
          style={{
            marginHorizontal: 16,
            marginBottom: 14,
            marginTop: 16,
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: 'transparent',
          }}
          intensity={80}
          tint="dark"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          >
            <TouchableOpacity
              style={[
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: !selectedBarberId ? colors.primary : 'rgba(255,255,255,0.1)',
                },
              ]}
              onPress={() => setSelectedBarberId(null)}
            >
              <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                Tutti
              </Text>
            </TouchableOpacity>
            {barbers.map((barber) => (
              <TouchableOpacity
                key={barber.id}
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: selectedBarberId === barber.id ? colors.primary : 'rgba(255,255,255,0.1)',
                  },
                ]}
                onPress={() => setSelectedBarberId(barber.id)}
              >
                <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                  {barber.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </GlassView>
      ) : (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 16,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 8 }}
          >
            <TouchableOpacity
              style={[
                {
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: !selectedBarberId ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedBarberId(null)}
            >
              <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                Tutti
              </Text>
            </TouchableOpacity>
            {barbers.map((barber) => (
              <TouchableOpacity
                key={barber.id}
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: selectedBarberId === barber.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedBarberId(barber.id)}
              >
                <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                  {barber.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
            {upcomingAppointments.map((appointment, index) => (
              <View key={`upcoming-${appointment.id}-${index}`} style={[commonStyles.card, { marginBottom: 16 }]}>
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
                      PRENOTATO
                    </Text>
                  </View>
                </View>

                {appointment.fidelity_redemption && (
                  <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 12, marginBottom: 12 }]}>
                    <View style={[commonStyles.row, { marginBottom: 4 }]}>
                      <IconSymbol name="star.fill" size={20} color={colors.text} />
                      <Text style={[commonStyles.text, { fontWeight: '600', marginLeft: 8, flex: 1 }]}>
                        Ricompensa Fedeltà Riscattata
                      </Text>
                    </View>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      {appointment.fidelity_redemption.reward?.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      Crediti: {appointment.fidelity_redemption.credits_deducted}
                    </Text>
                  </View>
                )}

                <View style={{ marginBottom: 12 }}>
                  <Text style={commonStyles.textSecondary}>
                    Cliente: {appointment.user?.name || 'Sconosciuto'}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Telefono: {appointment.user?.phone || 'N/D'}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Crediti Cliente: {appointment.user?.fidelity_credits || 0}
                  </Text>
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

                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                    onPress={() => completeAppointmentAndAwardCredits(appointment)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                      Completa
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
                      borderColor: colors.border,
                    }}
                    onPress={() => handleEditAppointment(appointment)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                      Riprogramma
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
                    onPress={() => handleCancelAppointment(appointment)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                      Annulla
                    </Text>
                  </TouchableOpacity>
                </View>
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
                {pastAppointments.map((appointment, index) => (
                  <View key={`past-${appointment.id}-${index}`} style={[commonStyles.card, { opacity: 0.7, marginBottom: 12 }]}>
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
                          {appointment.status === 'completed' ? 'COMPLETATO' : 'ANNULLATO'}
                        </Text>
                      </View>
                    </View>

                    {appointment.fidelity_redemption && appointment.fidelity_redemption.status === 'confirmed' && (
                      <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 8, marginBottom: 8 }]}>
                        <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600' }]}>
                          ⭐ Ricompensa Fedeltà Usata: {appointment.fidelity_redemption.reward?.name}
                        </Text>
                      </View>
                    )}

                    <Text style={commonStyles.textSecondary}>
                      Cliente: {appointment.user?.name || 'Sconosciuto'}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      Data: {new Date(appointment.date).toLocaleDateString('it-IT')} alle {appointment.time}
                    </Text>
                    {appointment.barber && (
                      <Text style={commonStyles.textSecondary}>
                        Barbiere: {appointment.barber.name}
                      </Text>
                    )}
                    {appointment.credits_awarded && (
                      <Text style={[commonStyles.textSecondary, { color: colors.primary }]}>
                        ✓ Credito assegnato
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

      {/* Edit Modal */}
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
                  Cliente: {selectedAppointment.user?.name}
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
                {generateTimeSlots().map((slot) => {
                  const isAvailable = isTimeSlotAvailable(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
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
                  {updating ? 'Aggiornamento...' : 'Aggiorna'}
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
                  Cliente: {selectedAppointment.user?.name}
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
