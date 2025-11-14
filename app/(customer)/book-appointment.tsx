
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { SERVICES } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  available_days: string[];
  available_hours: { start: string; end: string };
  is_active: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ExistingAppointment {
  id: string;
  date: string;
  time: string;
  service: string;
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'pay_in_person' | 'online'>('pay_in_person');
  const [loading, setLoading] = useState(false);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);

  useEffect(() => {
    fetchBarbers();
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    if (selectedBarber && date) {
      generateTimeSlots();
      fetchExistingAppointments();
    }
  }, [selectedBarber, date]);

  const fetchBarbers = async () => {
    try {
      console.log('Fetching barbers...');
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching barbers:', error);
        return;
      }

      console.log('Barbers fetched:', data?.length || 0);
      setBarbers(data || []);
      if (data && data.length > 0) {
        setSelectedBarber(data[0].id);
      }
    } catch (error) {
      console.error('Error in fetchBarbers:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      console.log('Fetching admin users...');
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('role', 'admin');

      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }

      console.log('Admin users fetched:', data?.length || 0);
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error in fetchAdminUsers:', error);
    } finally {
      setLoadingBarbers(false);
    }
  };

  const fetchExistingAppointments = async () => {
    try {
      const selectedDate = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, date, time, service')
        .eq('barber_id', selectedBarber)
        .eq('date', selectedDate)
        .eq('status', 'booked');

      if (error) {
        console.error('Error fetching existing appointments:', error);
        return;
      }

      console.log('Existing appointments:', data?.length || 0);
      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchExistingAppointments:', error);
    }
  };

  const generateTimeSlots = () => {
    const selectedBarberData = barbers.find(b => b.id === selectedBarber);
    if (!selectedBarberData) return;

    const slots: string[] = [];
    const startHour = parseInt(selectedBarberData.available_hours.start.split(':')[0]);
    const endHour = parseInt(selectedBarberData.available_hours.end.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    setAvailableTimeSlots(slots);
  };

  const isTimeSlotAvailable = (timeSlot: string): boolean => {
    if (!selectedService) return true;

    const service = SERVICES.find(s => s.id === selectedService);
    if (!service) return true;

    const serviceDuration = service.duration;

    for (const appointment of existingAppointments) {
      const appointmentTime = appointment.time;
      const appointmentService = SERVICES.find(s => s.name === appointment.service);
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

  const handleBookAppointment = async () => {
    console.log('BookAppointment - Button pressed');
    
    if (!selectedService) {
      Alert.alert('Errore', 'Seleziona un servizio');
      return;
    }

    if (!selectedBarber) {
      Alert.alert('Errore', 'Seleziona un barbiere');
      return;
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Errore', 'Seleziona una data futura');
      return;
    }

    const selectedBarberData = barbers.find(b => b.id === selectedBarber);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (selectedBarberData && !selectedBarberData.available_days.includes(dayName)) {
      Alert.alert('Errore', `Il barbiere selezionato non è disponibile di ${dayName}`);
      return;
    }

    const selectedTimeSlot = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (!isTimeSlotAvailable(selectedTimeSlot)) {
      Alert.alert('Errore', 'Questo orario non è disponibile. Seleziona un altro orario.');
      return;
    }

    setLoading(true);
    try {
      const service = SERVICES.find(s => s.id === selectedService);
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user?.id,
          barber_id: selectedBarber,
          service: service?.name,
          date: date.toISOString().split('T')[0],
          time: selectedTimeSlot,
          status: 'booked',
          payment_mode: paymentMode,
          payment_status: paymentMode === 'online' ? 'paid' : 'pending',
        });

      if (error) {
        console.error('Error booking appointment:', error);
        Alert.alert('Errore', 'Impossibile prenotare l\'appuntamento. Riprova.');
        return;
      }

      Alert.alert(
        'Successo!',
        `Il tuo appuntamento è stato prenotato per il ${date.toLocaleDateString('it-IT')} alle ${time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleBookAppointment:', error);
      Alert.alert('Errore', 'Impossibile prenotare l\'appuntamento. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingBarbers) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const allBarbers = [...barbers, ...adminUsers.map(admin => ({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: '',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours: { start: '09:00', end: '18:00' },
    is_active: true,
  }))];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            router.back();
          }} 
          style={{ marginRight: 16 }}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Prenota Appuntamento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>Seleziona Servizio</Text>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              commonStyles.card,
              commonStyles.row,
              selectedService === service.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => {
              console.log('Service selected:', service.name);
              setSelectedService(service.id);
            }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                {service.name}
              </Text>
              <Text style={commonStyles.textSecondary}>
                {service.duration} min • €{service.price}
              </Text>
            </View>
            {selectedService === service.id && (
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Seleziona Barbiere</Text>
        {allBarbers.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>Nessun barbiere disponibile</Text>
          </View>
        ) : (
          allBarbers.map((barber) => (
            <TouchableOpacity
              key={barber.id}
              style={[
                commonStyles.card,
                commonStyles.row,
                selectedBarber === barber.id && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => {
                console.log('Barber selected:', barber.name);
                setSelectedBarber(barber.id);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                  {barber.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Disponibile: {barber.available_days.join(', ')}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Orari: {barber.available_hours.start} - {barber.available_hours.end}
                </Text>
              </View>
              {selectedBarber === barber.id && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Seleziona Data</Text>
        
        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => {
            console.log('Date picker opened');
            setShowDatePicker(true);
          }}
          activeOpacity={0.7}
        >
          <IconSymbol name="calendar" size={24} color={colors.primary} />
          <Text style={[commonStyles.text, { marginLeft: 12 }]}>
            {date.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={[commonStyles.card, { width: '90%', padding: 20 }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center' }]}>
                Seleziona Data
              </Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    console.log('Date selected:', selectedDate);
                    setDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
                textColor={colors.text}
              />
              <TouchableOpacity
                style={[buttonStyles.primary, { marginTop: 16 }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={buttonStyles.text}>Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Seleziona Orario</Text>
        
        {availableTimeSlots.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {availableTimeSlots.map((slot) => {
              const [hours, minutes] = slot.split(':');
              const slotTime = new Date();
              slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              const isSelected = time.getHours() === slotTime.getHours() && time.getMinutes() === slotTime.getMinutes();
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
                      backgroundColor: !isAvailable ? colors.border : (isSelected ? colors.primary : colors.card),
                      borderWidth: 1,
                      borderColor: !isAvailable ? colors.border : (isSelected ? colors.primary : colors.border),
                      opacity: !isAvailable ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (isAvailable) {
                      console.log('Time slot selected:', slot);
                      setTime(slotTime);
                    } else {
                      Alert.alert('Non disponibile', 'Questo orario è già prenotato');
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
        ) : (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>Seleziona prima un barbiere</Text>
          </View>
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Metodo di Pagamento</Text>
        
        <TouchableOpacity
          style={[
            commonStyles.card,
            commonStyles.row,
            paymentMode === 'pay_in_person' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => {
            console.log('Payment mode selected: pay_in_person');
            setPaymentMode('pay_in_person');
          }}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600' }]}>
              Paga di Persona
            </Text>
            <Text style={commonStyles.textSecondary}>
              Paga al negozio
            </Text>
          </View>
          {paymentMode === 'pay_in_person' && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.card,
            commonStyles.row,
            paymentMode === 'online' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => {
            console.log('Payment mode selected: online');
            setPaymentMode('online');
          }}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600' }]}>
              Paga Online
            </Text>
            <Text style={commonStyles.textSecondary}>
              Paga ora con carta
            </Text>
          </View>
          {paymentMode === 'online' && (
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: 24 }]}
          onPress={handleBookAppointment}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={buttonStyles.text}>
            {loading ? 'Prenotazione...' : 'Prenota Appuntamento'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
