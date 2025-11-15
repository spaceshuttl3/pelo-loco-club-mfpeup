
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
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  available_days: string[];
  available_hours: { start: string; end: string };
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  is_active: boolean;
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
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'pay_in_person' | 'online'>('pay_in_person');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber && date) {
      generateTimeSlots();
      fetchExistingAppointments();
    }
  }, [selectedBarber, date]);

  const fetchServices = async () => {
    try {
      console.log('Fetching services from database...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      console.log('Services fetched:', data?.length || 0);
      setServices(data || []);
    } catch (error) {
      console.error('Error in fetchServices:', error);
    }
  };

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
    } finally {
      setLoadingData(false);
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

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = date.toISOString().split('T')[0] === now.toISOString().split('T')[0];

    for (let hour = startHour; hour < endHour; hour++) {
      const slot1 = `${hour.toString().padStart(2, '0')}:00`;
      const slot2 = `${hour.toString().padStart(2, '0')}:30`;

      // Filter out past time slots if it's today
      if (isToday) {
        // Check if slot1 is in the future
        if (hour > currentHour || (hour === currentHour && 0 > currentMinute)) {
          slots.push(slot1);
        }
        // Check if slot2 is in the future
        if (hour > currentHour || (hour === currentHour && 30 > currentMinute)) {
          slots.push(slot2);
        }
      } else {
        // Not today, add all slots
        slots.push(slot1);
        slots.push(slot2);
      }
    }

    setAvailableTimeSlots(slots);
  };

  const isTimeSlotAvailable = (timeSlot: string): boolean => {
    if (!selectedService) return true;

    const service = services.find(s => s.id === selectedService);
    if (!service) return true;

    const serviceDuration = service.duration;

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
      const service = services.find(s => s.id === selectedService);
      
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

  if (loadingData) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Check if the selected date is today
  const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

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
        {services.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>Nessun servizio disponibile</Text>
          </View>
        ) : (
          <React.Fragment>
            {services.map((service) => (
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
                  {service.description && (
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                      {service.description}
                    </Text>
                  )}
                </View>
                {selectedService === service.id && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </React.Fragment>
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Seleziona Barbiere</Text>
        {barbers.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>Nessun barbiere disponibile</Text>
          </View>
        ) : (
          <React.Fragment>
            {barbers.map((barber) => (
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
                    Disponibile: Martedì - Sabato
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Orari: {barber.available_hours.start} - {barber.available_hours.end}
                  </Text>
                </View>
                {selectedBarber === barber.id && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </React.Fragment>
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Seleziona Data e Orario</Text>

        {isToday && (
          <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 12, marginBottom: 12 }]}>
            <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
              ⭐ Prenotazioni per oggi disponibili!
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            style={[commonStyles.card, { flex: 1, alignItems: 'center', padding: 20 }]}
            onPress={() => {
              console.log('Date picker opened');
              setShowDatePicker(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="calendar" size={40} color={colors.primary} />
            <Text style={[commonStyles.text, { marginTop: 12, textAlign: 'center', fontWeight: '600', fontSize: 16 }]}>
              {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 4, fontSize: 12 }]}>
              {date.toLocaleDateString('it-IT', { weekday: 'long' })}
            </Text>
          </TouchableOpacity>
        </View>

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

        <Text style={[commonStyles.text, { marginBottom: 12, fontWeight: '600', fontSize: 16 }]}>
          Orari Disponibili
        </Text>
        
        {availableTimeSlots.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 20 }}>
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
                      width: (width - 56) / 4,
                      margin: 4,
                      paddingVertical: 16,
                      borderRadius: 12,
                      backgroundColor: !isAvailable ? colors.border : (isSelected ? colors.primary : colors.card),
                      borderWidth: 2,
                      borderColor: !isAvailable ? colors.border : (isSelected ? colors.primary : colors.border),
                      opacity: !isAvailable ? 0.4 : 1,
                      alignItems: 'center',
                      justifyContent: 'center',
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
                  <Text style={[commonStyles.text, { fontSize: 16, fontWeight: 'bold' }]}>
                    {slot}
                  </Text>
                  {!isAvailable && (
                    <Text style={[commonStyles.textSecondary, { fontSize: 9, marginTop: 2 }]}>
                      Occupato
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20, marginBottom: 20 }]}>
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
