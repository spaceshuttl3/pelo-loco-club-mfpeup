
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
  available_days: string[];
  available_hours: { start: string; end: string };
}

interface Service {
  id: string;
  name: string;
  earns_fidelity_reward?: boolean;
  duration: number;
}

interface BlockedDate {
  id: string;
  barber_id: string;
  blocked_date: string;
}

export default function ManageAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
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
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'booked' | 'completed' | 'cancelled'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
  const [showCustomEndPicker, setShowCustomEndPicker] = useState(false);

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true});

      if (error) {
        console.error('Error fetching barbers:', error);
        return;
      }

      setBarbers(data || []);
    } catch (error) {
      console.error('Error in fetchBarbers:', error);
    }
  };

  const fetchServices = async () => {
    try {
      // Try to fetch with earns_fidelity_reward column
      const { data, error } = await supabase
        .from('services')
        .select('id, name, earns_fidelity_reward, duration');

      if (error) {
        console.error('Error fetching services:', error);
        // If the column doesn't exist, fetch without it
        if (error.code === '42703') {
          console.log('earns_fidelity_reward column does not exist yet. Fetching without it...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('services')
            .select('id, name, duration');
          
          if (fallbackError) {
            console.error('Error fetching services (fallback):', fallbackError);
            return;
          }
          
          // Set all services to earn rewards by default
          setServices((fallbackData || []).map(s => ({ ...s, earns_fidelity_reward: true })));
        }
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error in fetchServices:', error);
    }
  };

  const fetchBlockedDates = useCallback(async () => {
    if (!selectedAppointment?.barber_id) return;

    try {
      const { data, error } = await supabase
        .from('barber_blocked_dates')
        .select('*')
        .eq('barber_id', selectedAppointment.barber_id);

      if (error) {
        console.error('Error fetching blocked dates:', error);
        return;
      }

      console.log('Blocked dates fetched:', data?.length || 0);
      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error in fetchBlockedDates:', error);
    }
  }, [selectedAppointment?.barber_id]);

  const fetchAppointments = useCallback(async () => {
    try {
      console.log('Fetching appointments...');
      
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
        `);

      if (selectedBarberId) {
        query = query.eq('barber_id', selectedBarberId);
      }

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('time', { ascending: false });

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
    fetchServices();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedBarberId, fetchAppointments]);

  useEffect(() => {
    if (selectedAppointment && editDate) {
      fetchExistingAppointmentsForDate(selectedAppointment.barber_id || '', editDate);
      fetchBlockedDates();
    }
  }, [editDate, selectedAppointment, fetchExistingAppointmentsForDate, fetchBlockedDates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const sendAppointmentEmail = async (
    userEmail: string,
    userName: string,
    appointmentDetails: {
      service: string;
      date: string;
      time: string;
      barberName: string;
      status: 'updated' | 'cancelled';
      reason?: string;
    }
  ) => {
    try {
      console.log('Sending appointment email notification...');
      
      // Call Supabase Edge Function to send email
      const { data, error } = await supabase.functions.invoke('send-appointment-notification', {
        body: {
          to: userEmail,
          userName,
          ...appointmentDetails,
        },
      });

      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully:', data);
      }
    } catch (error) {
      console.error('Error in sendAppointmentEmail:', error);
    }
  };

  const updateAppointmentStatus = async (appointment: Appointment, status: string) => {
    try {
      console.log(`Updating appointment ${appointment.id} to status: ${status}`);
      
      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointment.id);

      if (updateError) throw updateError;

      // If completing an appointment
      if (status === 'completed') {
        const userId = appointment.user_id;
        console.log(`Processing completion for user: ${userId}`);
        
        // Check if this service earns fidelity rewards
        const service = services.find(s => s.name === appointment.service);
        const shouldEarnReward = service?.earns_fidelity_reward !== false; // Default to true if not set
        
        // Check if this appointment was redeemed with fidelity points
        const wasRedeemedWithFidelity = !!appointment.fidelity_redemption_id;
        
        console.log(`Service: ${appointment.service}, Earns reward: ${shouldEarnReward}, Was redeemed with fidelity: ${wasRedeemedWithFidelity}`);
        
        // Award fidelity credit when appointment is completed (regardless of payment status)
        // Since payment is in person, we award points on completion
        // BUT do NOT award points if the appointment was redeemed with fidelity points
        if (shouldEarnReward && !wasRedeemedWithFidelity) {
          console.log('Awarding fidelity credit...');
          
          // Get current user credits
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('fidelity_credits')
            .eq('id', userId)
            .single();

          if (userError) {
            console.error('Error fetching user credits:', userError);
          } else {
            const currentCredits = userData?.fidelity_credits || 0;
            const newCredits = currentCredits + 1;

            console.log(`Current credits: ${currentCredits}, New credits: ${newCredits}`);

            // Update user credits
            const { error: creditError } = await supabase
              .from('users')
              .update({ fidelity_credits: newCredits })
              .eq('id', userId);

            if (creditError) {
              console.error('Error updating credits:', creditError);
            } else {
              console.log('Credits updated successfully');
              
              // Record transaction
              const { error: transactionError } = await supabase
                .from('fidelity_transactions')
                .insert({
                  user_id: userId,
                  credits_change: 1,
                  transaction_type: 'earned',
                  reference_type: 'appointment',
                  reference_id: appointment.id,
                  description: `Credito guadagnato: ${appointment.service}`,
                });

              if (transactionError) {
                console.error('Error recording transaction:', transactionError);
              } else {
                console.log('Transaction recorded successfully');
              }
            }
          }
        } else if (wasRedeemedWithFidelity) {
          console.log('Appointment was redeemed with fidelity points - no points awarded');
        } else {
          console.log('Service does not earn fidelity rewards');
        }

        // If there's a fidelity redemption, mark it as confirmed/used
        if (appointment.fidelity_redemption_id) {
          console.log(`Confirming fidelity redemption: ${appointment.fidelity_redemption_id}`);
          
          const { error: redemptionError } = await supabase
            .from('fidelity_redemptions')
            .update({ 
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              used_at: new Date().toISOString(),
            })
            .eq('id', appointment.fidelity_redemption_id);

          if (redemptionError) {
            console.error('Error updating redemption:', redemptionError);
          } else {
            console.log('Redemption confirmed successfully');
          }
        }
      }

      fetchAppointments();
      
      let successMessage = `Appuntamento ${status === 'completed' ? 'completato' : 'annullato'}`;
      
      if (status === 'completed') {
        const service = services.find(s => s.name === appointment.service);
        const shouldEarnReward = service?.earns_fidelity_reward !== false;
        const wasRedeemedWithFidelity = !!appointment.fidelity_redemption_id;
        
        if (wasRedeemedWithFidelity) {
          successMessage += '. Ricompensa confermata! (Nessun punto assegnato per appuntamenti riscattati con fedeltà)';
        } else if (shouldEarnReward) {
          successMessage += '. 1 credito fedeltà assegnato!';
        } else {
          successMessage += '. Questo servizio non guadagna crediti fedeltà.';
        }
      }
      
      Alert.alert('Successo', successMessage);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Errore', 'Impossibile aggiornare l\'appuntamento');
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

      // Send email notification
      if (selectedAppointment.user?.email) {
        await sendAppointmentEmail(
          selectedAppointment.user.email,
          selectedAppointment.user.name || 'Cliente',
          {
            service: selectedAppointment.service,
            date: new Date(selectedAppointment.date).toLocaleDateString('it-IT'),
            time: selectedAppointment.time,
            barberName: selectedAppointment.barber?.name || 'Barbiere',
            status: 'cancelled',
            reason: cancellationReason.trim(),
          }
        );
      }

      // If there's a pending fidelity redemption, cancel it and refund credits
      if (selectedAppointment.fidelity_redemption_id) {
        const { data: redemptionData, error: redemptionFetchError } = await supabase
          .from('fidelity_redemptions')
          .select('*, reward:fidelity_rewards(*)')
          .eq('id', selectedAppointment.fidelity_redemption_id)
          .single();

        if (!redemptionFetchError && redemptionData && redemptionData.status === 'pending') {
          // Refund credits
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('fidelity_credits')
            .eq('id', selectedAppointment.user_id)
            .single();

          if (!userError && userData) {
            const newCredits = (userData.fidelity_credits || 0) + redemptionData.credits_deducted;
            
            await supabase
              .from('users')
              .update({ fidelity_credits: newCredits })
              .eq('id', selectedAppointment.user_id);

            // Record refund transaction
            await supabase
              .from('fidelity_transactions')
              .insert({
                user_id: selectedAppointment.user_id,
                credits_change: redemptionData.credits_deducted,
                transaction_type: 'adjusted',
                reference_type: 'redemption',
                reference_id: redemptionData.id,
                description: `Crediti rimborsati: appuntamento annullato`,
              });

            // Cancel redemption
            await supabase
              .from('fidelity_redemptions')
              .update({ status: 'cancelled' })
              .eq('id', selectedAppointment.fidelity_redemption_id);
          }
        }
      }

      Alert.alert('Successo', 'Appuntamento annullato. Il cliente è stato notificato via email.');
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
    setBlockedDates([]);
    setEditModalVisible(true);
  };

  const isDateBlocked = useCallback((checkDate: Date): boolean => {
    const dateString = checkDate.toISOString().split('T')[0];
    return blockedDates.some(bd => bd.blocked_date === dateString);
  }, [blockedDates]);

  const isBarberAvailableOnDay = useCallback((checkDate: Date): boolean => {
    if (!selectedAppointment?.barber_id) return false;
    
    const barber = barbers.find(b => b.id === selectedAppointment.barber_id);
    if (!barber) return false;

    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
    return barber.available_days.includes(dayName);
  }, [selectedAppointment?.barber_id, barbers]);

  const isTimeSlotAvailable = (timeSlot: string): boolean => {
    if (!selectedAppointment) return true;

    // Check if time is within barber's working hours
    const barber = barbers.find(b => b.id === selectedAppointment.barber_id);
    if (barber) {
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTimeInMinutes = slotHour * 60 + slotMinute;
      
      const [startHour, startMinute] = barber.available_hours.start.split(':').map(Number);
      const startTimeInMinutes = startHour * 60 + startMinute;
      
      const [endHour, endMinute] = barber.available_hours.end.split(':').map(Number);
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      if (slotTimeInMinutes < startTimeInMinutes || slotTimeInMinutes >= endTimeInMinutes) {
        return false;
      }
    }

    const serviceName = selectedAppointment.service;
    const service = services.find(s => s.name === serviceName);
    const serviceDuration = service?.duration || 30;

    for (const appointment of existingAppointments) {
      const appointmentTime = appointment.time;
      const appointmentService = services.find(s => s.name === appointment.service);
      const appointmentDuration = appointmentService?.duration || 30;

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

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    // Check if date is blocked
    if (isDateBlocked(editDate)) {
      Alert.alert('Errore', 'Questa data non è disponibile per prenotazioni');
      return;
    }

    // Check if barber is available on this day
    if (!isBarberAvailableOnDay(editDate)) {
      const dayName = editDate.toLocaleDateString('it-IT', { weekday: 'long' });
      Alert.alert('Errore', `Il barbiere non è disponibile di ${dayName}`);
      return;
    }

    if (!isTimeSlotAvailable(editTime)) {
      Alert.alert(
        'Orario Non Disponibile',
        'Questo orario è in conflitto con un altro appuntamento o è fuori dall\'orario di lavoro del barbiere. Seleziona un orario diverso.',
        [{ text: 'OK' }]
      );
      return;
    }

    setUpdating(true);
    try {
      const oldDate = new Date(selectedAppointment.date).toLocaleDateString('it-IT');
      const oldTime = selectedAppointment.time;
      const newDate = editDate.toLocaleDateString('it-IT');
      const newTime = editTime;

      const { error } = await supabase
        .from('appointments')
        .update({
          date: editDate.toISOString().split('T')[0],
          time: editTime,
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      // Send email notification if date or time changed
      if (oldDate !== newDate || oldTime !== newTime) {
        if (selectedAppointment.user?.email) {
          await sendAppointmentEmail(
            selectedAppointment.user.email,
            selectedAppointment.user.name || 'Cliente',
            {
              service: selectedAppointment.service,
              date: newDate,
              time: newTime,
              barberName: selectedAppointment.barber?.name || 'Barbiere',
              status: 'updated',
            }
          );
        }
      }

      Alert.alert('Successo', 'Appuntamento aggiornato con successo. Il cliente è stato notificato via email.');
      setEditModalVisible(false);
      setSelectedAppointment(null);
      setExistingAppointments([]);
      setBlockedDates([]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Errore', 'Impossibile aggiornare l\'appuntamento');
    } finally {
      setUpdating(false);
    }
  };

  const generateTimeSlots = () => {
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

  // Apply filters
  let filteredAppointments = appointments;

  // Filter by status
  if (filterStatus !== 'all') {
    filteredAppointments = filteredAppointments.filter(apt => apt.status === filterStatus);
  }

  // Filter by timeframe
  if (filterTimeframe !== 'all') {
    if (filterTimeframe === 'today') {
      filteredAppointments = filteredAppointments.filter(apt => apt.date === todayString);
    } else if (filterTimeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoString = weekAgo.toISOString().split('T')[0];
      filteredAppointments = filteredAppointments.filter(apt => apt.date >= weekAgoString);
    } else if (filterTimeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoString = monthAgo.toISOString().split('T')[0];
      filteredAppointments = filteredAppointments.filter(apt => apt.date >= monthAgoString);
    } else if (filterTimeframe === 'custom') {
      const startDateString = customStartDate.toISOString().split('T')[0];
      const endDateString = customEndDate.toISOString().split('T')[0];
      filteredAppointments = filteredAppointments.filter(
        apt => apt.date >= startDateString && apt.date <= endDateString
      );
    }
  }

  // SMART LOGIC: Upcoming = booked appointments that are in the future (date > today OR date = today AND time > now)
  // Past = everything else (completed, cancelled, or booked but in the past)
  const upcomingAppointments = filteredAppointments.filter((apt) => {
    // Only booked appointments can be upcoming
    if (apt.status !== 'booked') return false;
    
    const aptDate = apt.date;
    
    // Future dates are upcoming
    if (aptDate > todayString) return true;
    
    // Today's appointments: check if time hasn't passed yet
    if (aptDate === todayString) {
      const [aptHour, aptMinute] = apt.time.split(':').map(Number);
      const aptTimeInMinutes = aptHour * 60 + aptMinute;
      return aptTimeInMinutes > currentTimeInMinutes;
    }
    
    // Past dates are not upcoming
    return false;
  });

  // Past appointments = all appointments that are NOT upcoming
  // This includes: completed, cancelled, and booked appointments that are in the past
  const pastAppointments = filteredAppointments.filter(
    (apt) => !upcomingAppointments.includes(apt)
  );

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Appuntamenti</Text>
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <IconSymbol name="line.3.horizontal.decrease.circle" size={28} color={colors.primary} />
        </TouchableOpacity>
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

                {/* Fidelity Redemption Badge */}
                {appointment.fidelity_redemption && (
                  <View style={[commonStyles.card, { backgroundColor: colors.secondary, padding: 12, marginBottom: 12 }]}>
                    <View style={[commonStyles.row, { marginBottom: 4 }]}>
                      <IconSymbol name="star.fill" size={20} color={colors.text} />
                      <Text style={[commonStyles.text, { fontWeight: '600', marginLeft: 8, flex: 1 }]}>
                        Ricompensa Fedeltà Riscattata
                      </Text>
                    </View>
                    <Text style={[commonStyles.text, { fontSize: 14 }]}>
                      {appointment.fidelity_redemption.reward?.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      {appointment.fidelity_redemption.reward?.description}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                      Stato: {appointment.fidelity_redemption.status === 'pending' ? 'In Attesa di Conferma' : 'Confermato'}
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
                    onPress={() => updateAppointmentStatus(appointment, 'completed')}
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
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                  Appuntamenti Passati ({pastAppointments.length})
                </Text>
                <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                  Include: completati, annullati e scaduti
                </Text>
              </View>
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
                          backgroundColor: 
                            appointment.status === 'completed' ? colors.primary : 
                            appointment.status === 'cancelled' ? colors.error : 
                            colors.accent,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={[commonStyles.text, { fontSize: 12 }]}>
                          {appointment.status === 'completed' ? 'COMPLETATO' : 
                           appointment.status === 'cancelled' ? 'ANNULLATO' : 
                           'SCADUTO'}
                        </Text>
                      </View>
                    </View>

                    {/* Show fidelity redemption info for past appointments */}
                    {appointment.fidelity_redemption && (
                      <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 8, marginBottom: 8 }]}>
                        <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600' }]}>
                          ⭐ Ricompensa: {appointment.fidelity_redemption.reward?.name}
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

            {isDateBlocked(editDate) && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                  ⚠️ Questa data è bloccata
                </Text>
              </View>
            )}

            {!isBarberAvailableOnDay(editDate) && selectedAppointment && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12, marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
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
                          Alert.alert('Non disponibile', 'Questo orario è in conflitto con un altro appuntamento o è fuori dall\'orario di lavoro');
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              padding: 20,
            }}
          >
            <View style={[commonStyles.card, { width: '100%', maxWidth: 400 }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                Filtra Appuntamenti
              </Text>

              <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                Stato
              </Text>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterStatus === 'all' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterStatus('all')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Tutti gli Appuntamenti</Text>
                {filterStatus === 'all' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterStatus === 'booked' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterStatus('booked')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Prenotati</Text>
                {filterStatus === 'booked' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterStatus === 'completed' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterStatus('completed')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Completati</Text>
                {filterStatus === 'completed' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 16 },
                  filterStatus === 'cancelled' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterStatus('cancelled')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Annullati</Text>
                {filterStatus === 'cancelled' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <Text style={[commonStyles.text, { fontWeight: '600', marginTop: 8, marginBottom: 8 }]}>
                Periodo
              </Text>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterTimeframe === 'all' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterTimeframe('all')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Tutti i Periodi</Text>
                {filterTimeframe === 'all' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterTimeframe === 'today' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterTimeframe('today')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Oggi</Text>
                {filterTimeframe === 'today' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterTimeframe === 'week' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterTimeframe('week')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Ultimi 7 Giorni</Text>
                {filterTimeframe === 'week' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 12 },
                  filterTimeframe === 'month' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterTimeframe('month')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Ultimo Mese</Text>
                {filterTimeframe === 'month' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  commonStyles.row,
                  { marginBottom: 16 },
                  filterTimeframe === 'custom' && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setFilterTimeframe('custom')}
                activeOpacity={0.7}
              >
                <Text style={commonStyles.text}>Periodo Personalizzato</Text>
                {filterTimeframe === 'custom' && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              {filterTimeframe === 'custom' && (
                <>
                  <TouchableOpacity
                    style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
                    onPress={() => setShowCustomStartPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={commonStyles.text}>Data Inizio</Text>
                    <Text style={[commonStyles.text, { color: colors.primary }]}>
                      {customStartDate.toLocaleDateString('it-IT')}
                    </Text>
                  </TouchableOpacity>

                  {showCustomStartPicker && (
                    <DateTimePicker
                      value={customStartDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowCustomStartPicker(false);
                        if (selectedDate) {
                          setCustomStartDate(selectedDate);
                        }
                      }}
                    />
                  )}

                  <TouchableOpacity
                    style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
                    onPress={() => setShowCustomEndPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={commonStyles.text}>Data Fine</Text>
                    <Text style={[commonStyles.text, { color: colors.primary }]}>
                      {customEndDate.toLocaleDateString('it-IT')}
                    </Text>
                  </TouchableOpacity>

                  {showCustomEndPicker && (
                    <DateTimePicker
                      value={customEndDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowCustomEndPicker(false);
                        if (selectedDate) {
                          setCustomEndDate(selectedDate);
                        }
                      }}
                      minimumDate={customStartDate}
                    />
                  )}
                </>
              )}

              <TouchableOpacity
                style={[buttonStyles.primary, { backgroundColor: colors.card }]}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
