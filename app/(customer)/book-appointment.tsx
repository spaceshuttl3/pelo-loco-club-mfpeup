
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { supabase } from '../../lib/supabase';
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
  Dimensions,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { IconSymbol } from '../../components/IconSymbol';
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
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'pay_in_person' | 'online'>('pay_in_person');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);

  // Escalating UI states
  const [expandedSection, setExpandedSection] = useState<'service' | 'barber' | 'datetime' | 'payment' | null>('service');

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (selectedBarber && date) {
      console.log('Generating time slots for barber:', selectedBarber, 'date:', date);
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

      console.log('Existing appointments for', selectedDate, ':', data?.length || 0);
      setExistingAppointments(data || []);
    } catch (error) {
      console.error('Error in fetchExistingAppointments:', error);
    }
  };

  const generateTimeSlots = () => {
    const selectedBarberData = barbers.find(b => b.id === selectedBarber);
    if (!selectedBarberData) {
      console.log('No barber selected or barber not found');
      return;
    }

    const slots: string[] = [];
    const startHour = parseInt(selectedBarberData.available_hours.start.split(':')[0]);
    const endHour = parseInt(selectedBarberData.available_hours.end.split(':')[0]);

    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const isToday = date.toISOString().split('T')[0] === now.toISOString().split('T')[0];

    console.log('Generating slots from', startHour, 'to', endHour, 'isToday:', isToday);

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

    console.log('Generated', slots.length, 'time slots');
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

      // Check if the new appointment overlaps with existing appointment
      if (
        (slotTimeInMinutes >= aptTimeInMinutes && slotTimeInMinutes < existingAppointmentEnd) ||
        (newAppointmentEnd > aptTimeInMinutes && newAppointmentEnd <= existingAppointmentEnd) ||
        (slotTimeInMinutes < aptTimeInMinutes && newAppointmentEnd > existingAppointmentEnd)
      ) {
        return false;
      }
    }

    return true;
  };

  const handleBookAppointment = async () => {
    console.log('BookAppointment - Button pressed');
    console.log('Selected service:', selectedService);
    console.log('Selected barber:', selectedBarber);
    console.log('Selected time:', time);
    
    if (!selectedService) {
      Alert.alert('Errore', 'Seleziona un servizio');
      return;
    }

    if (!selectedBarber) {
      Alert.alert('Errore', 'Seleziona un barbiere');
      return;
    }

    if (!time) {
      Alert.alert('Errore', 'Seleziona un orario');
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

  const handleServiceSelect = (serviceId: string) => {
    console.log('Service selected:', serviceId);
    setSelectedService(serviceId);
    setExpandedSection(null);
    // Auto-expand next section after a short delay
    setTimeout(() => setExpandedSection('barber'), 300);
  };

  const handleBarberSelect = (barberId: string) => {
    console.log('Barber selected:', barberId);
    setSelectedBarber(barberId);
    setExpandedSection(null);
    // Reset time selection when barber changes
    setTime(null);
    // Auto-expand next section after a short delay
    setTimeout(() => setExpandedSection('datetime'), 300);
  };

  const handleDateTimeConfirm = () => {
    if (time) {
      console.log('Date and time confirmed:', date, time);
      setExpandedSection(null);
      // Auto-expand next section after a short delay
      setTimeout(() => setExpandedSection('payment'), 300);
    } else {
      Alert.alert('Attenzione', 'Seleziona prima un orario');
    }
  };

  const handlePaymentSelect = (mode: 'pay_in_person' | 'online') => {
    console.log('Payment mode selected:', mode);
    setPaymentMode(mode);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      console.log('Date selected:', selectedDate);
      setDate(selectedDate);
      // Reset time when date changes
      setTime(null);
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
        {/* Service Selection */}
        <TouchableOpacity
          style={[
            commonStyles.card,
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
            expandedSection === 'service' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => setExpandedSection(expandedSection === 'service' ? null : 'service')}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              1. Seleziona Servizio
            </Text>
            {selectedService && (
              <Text style={commonStyles.textSecondary}>
                {services.find(s => s.id === selectedService)?.name}
              </Text>
            )}
          </View>
          <IconSymbol
            name={expandedSection === 'service' ? 'chevron.up' : 'chevron.down'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        {expandedSection === 'service' && (
          <View style={{ marginBottom: 16 }}>
            {services.length === 0 ? (
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
                <Text style={commonStyles.textSecondary}>Nessun servizio disponibile</Text>
              </View>
            ) : (
              <React.Fragment>
                {services.map((service, serviceIndex) => (
                  <TouchableOpacity
                    key={`service-${service.id}-${serviceIndex}`}
                    style={[
                      commonStyles.card,
                      commonStyles.row,
                      { marginBottom: 8 },
                      selectedService === service.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => handleServiceSelect(service.id)}
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
          </View>
        )}

        {/* Barber Selection */}
        <TouchableOpacity
          style={[
            commonStyles.card,
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
            expandedSection === 'barber' && { borderColor: colors.primary, borderWidth: 2 },
            !selectedService && { opacity: 0.5 },
          ]}
          onPress={() => {
            if (selectedService) {
              setExpandedSection(expandedSection === 'barber' ? null : 'barber');
            } else {
              Alert.alert('Attenzione', 'Seleziona prima un servizio');
            }
          }}
          activeOpacity={0.7}
          disabled={!selectedService}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              2. Seleziona Barbiere
            </Text>
            {selectedBarber ? (
              <Text style={commonStyles.textSecondary}>
                {barbers.find(b => b.id === selectedBarber)?.name}
              </Text>
            ) : (
              <Text style={[commonStyles.textSecondary, { fontSize: 12, fontStyle: 'italic' }]}>
                {!selectedService ? 'Seleziona prima un servizio' : 'Tocca per selezionare'}
              </Text>
            )}
          </View>
          <IconSymbol
            name={expandedSection === 'barber' ? 'chevron.up' : 'chevron.down'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        {expandedSection === 'barber' && (
          <View style={{ marginBottom: 16 }}>
            {barbers.length === 0 ? (
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
                <Text style={commonStyles.textSecondary}>Nessun barbiere disponibile</Text>
              </View>
            ) : (
              <React.Fragment>
                {barbers.map((barber, barberIndex) => (
                  <TouchableOpacity
                    key={`barber-${barber.id}-${barberIndex}`}
                    style={[
                      commonStyles.card,
                      commonStyles.row,
                      { marginBottom: 8 },
                      selectedBarber === barber.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                    onPress={() => handleBarberSelect(barber.id)}
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
          </View>
        )}

        {/* Date & Time Selection */}
        <TouchableOpacity
          style={[
            commonStyles.card,
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
            expandedSection === 'datetime' && { borderColor: colors.primary, borderWidth: 2 },
            !selectedBarber && { opacity: 0.5 },
          ]}
          onPress={() => {
            if (selectedBarber) {
              setExpandedSection(expandedSection === 'datetime' ? null : 'datetime');
            } else {
              Alert.alert('Attenzione', 'Seleziona prima un barbiere');
            }
          }}
          activeOpacity={0.7}
          disabled={!selectedBarber}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              3. Seleziona Data e Orario
            </Text>
            {time ? (
              <Text style={commonStyles.textSecondary}>
                {date.toLocaleDateString('it-IT')} alle {time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : (
              <Text style={[commonStyles.textSecondary, { fontSize: 12, fontStyle: 'italic' }]}>
                {!selectedBarber ? 'Seleziona prima un barbiere' : 'Tocca per selezionare'}
              </Text>
            )}
          </View>
          <IconSymbol
            name={expandedSection === 'datetime' ? 'chevron.up' : 'chevron.down'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        {expandedSection === 'datetime' && (
          <View style={{ marginBottom: 16 }}>
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

            {showDatePicker && (
              <View style={[commonStyles.card, { marginBottom: 20, padding: 16 }]}>
                <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center' }]}>
                  Seleziona Data
                </Text>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor={colors.text}
                  style={{ height: 200 }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[buttonStyles.primary, { marginTop: 16 }]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={buttonStyles.text}>Conferma</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 12, fontWeight: '600', fontSize: 16 }]}>
              Orari Disponibili
            </Text>
            
            {availableTimeSlots.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 20 }}>
                {availableTimeSlots.map((slot, slotIndex) => {
                  const [hours, minutes] = slot.split(':');
                  const slotTime = new Date();
                  slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  const isSelected = time ? (time.getHours() === slotTime.getHours() && time.getMinutes() === slotTime.getMinutes()) : false;
                  const isAvailable = isTimeSlotAvailable(slot);
                  
                  return (
                    <TouchableOpacity
                      key={`timeslot-${slot}-${slotIndex}`}
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
                <Text style={commonStyles.textSecondary}>
                  {selectedBarber ? 'Nessun orario disponibile per questa data' : 'Seleziona prima un barbiere'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 12 }]}
              onPress={handleDateTimeConfirm}
              disabled={!time}
              activeOpacity={0.7}
            >
              <Text style={buttonStyles.text}>Conferma Data e Orario</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Payment Method Selection */}
        <TouchableOpacity
          style={[
            commonStyles.card,
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
            expandedSection === 'payment' && { borderColor: colors.primary, borderWidth: 2 },
            !time && { opacity: 0.5 },
          ]}
          onPress={() => {
            if (time) {
              setExpandedSection(expandedSection === 'payment' ? null : 'payment');
            } else {
              Alert.alert('Attenzione', 'Seleziona prima data e orario');
            }
          }}
          activeOpacity={0.7}
          disabled={!time}
        >
          <View style={{ flex: 1 }}>
            <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
              4. Metodo di Pagamento
            </Text>
            {paymentMode ? (
              <Text style={commonStyles.textSecondary}>
                {paymentMode === 'pay_in_person' ? 'Paga di Persona' : 'Paga Online'}
              </Text>
            ) : (
              <Text style={[commonStyles.textSecondary, { fontSize: 12, fontStyle: 'italic' }]}>
                {!time ? 'Seleziona prima data e orario' : 'Tocca per selezionare'}
              </Text>
            )}
          </View>
          <IconSymbol
            name={expandedSection === 'payment' ? 'chevron.up' : 'chevron.down'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        {expandedSection === 'payment' && (
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity
              style={[
                commonStyles.card,
                commonStyles.row,
                { marginBottom: 8 },
                paymentMode === 'pay_in_person' && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => handlePaymentSelect('pay_in_person')}
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
              onPress={() => handlePaymentSelect('online')}
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
          </View>
        )}

        {/* Book Button */}
        {selectedService && selectedBarber && time && paymentMode && (
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
