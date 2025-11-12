
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
  const [showTimePicker, setShowTimePicker] = useState(false);
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

    // Check if this time slot conflicts with any existing appointment
    for (const appointment of existingAppointments) {
      const appointmentTime = appointment.time;
      const appointmentService = SERVICES.find(s => s.name === appointment.service);
      const appointmentDuration = appointmentService?.duration || 30;

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

  const handleBookAppointment = async () => {
    console.log('BookAppointment - Button pressed');
    
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return;
    }

    if (!selectedBarber) {
      Alert.alert('Error', 'Please select a barber');
      return;
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      Alert.alert('Error', 'Please select a future date');
      return;
    }

    const selectedBarberData = barbers.find(b => b.id === selectedBarber);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (selectedBarberData && !selectedBarberData.available_days.includes(dayName)) {
      Alert.alert('Error', `The selected barber is not available on ${dayName}`);
      return;
    }

    const selectedTimeSlot = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Check if the selected time slot is available
    if (!isTimeSlotAvailable(selectedTimeSlot)) {
      Alert.alert('Error', 'This time slot is not available. Please select another time.');
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
        Alert.alert('Error', 'Could not book appointment. Please try again.');
        return;
      }

      Alert.alert(
        'Success!',
        `Your appointment has been booked for ${date.toLocaleDateString()} at ${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleBookAppointment:', error);
      Alert.alert('Error', 'Could not book appointment. Please try again.');
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
        <Text style={commonStyles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>Select Service</Text>
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
                {service.duration} min • ${service.price}
              </Text>
            </View>
            {selectedService === service.id && (
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Select Barber</Text>
        {allBarbers.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
            <Text style={commonStyles.textSecondary}>No barbers available</Text>
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
                  Available: {barber.available_days.join(', ')}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Hours: {barber.available_hours.start} - {barber.available_hours.end}
                </Text>
              </View>
              {selectedBarber === barber.id && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Select Date</Text>
        
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
            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                console.log('Date selected:', selectedDate);
                setDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Select Time</Text>
        
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
                      Alert.alert('Unavailable', 'This time slot is already booked');
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
          <TouchableOpacity
            style={[commonStyles.card, commonStyles.row]}
            onPress={() => {
              console.log('Time picker opened');
              setShowTimePicker(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="clock" size={24} color={colors.primary} />
            <Text style={[commonStyles.text, { marginLeft: 12 }]}>
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedTime) {
                console.log('Time selected:', selectedTime);
                setTime(selectedTime);
              }
            }}
          />
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Payment Method</Text>
        
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
              Pay in Person
            </Text>
            <Text style={commonStyles.textSecondary}>
              Pay at the shop
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
              Pay Online
            </Text>
            <Text style={commonStyles.textSecondary}>
              Pay now with card
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
            {loading ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
