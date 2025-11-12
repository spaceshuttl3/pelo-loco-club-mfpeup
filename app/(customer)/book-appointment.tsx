
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
  available_days: string[];
  available_hours: { start: string; end: string };
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'pay_in_person' | 'online'>('pay_in_person');
  const [loading, setLoading] = useState(false);
  const [loadingBarbers, setLoadingBarbers] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching barbers:', error);
        return;
      }

      setBarbers(data || []);
      if (data && data.length > 0) {
        setSelectedBarber(data[0].id);
      }
    } catch (error) {
      console.error('Error in fetchBarbers:', error);
    } finally {
      setLoadingBarbers(false);
    }
  };

  const handleBookAppointment = async () => {
    console.log('Book appointment button pressed');
    
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
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
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

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Book Appointment</Text>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>Select Service</Text>
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              commonStyles.card,
              commonStyles.row,
              selectedService === service.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setSelectedService(service.id)}
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
        {barbers.map((barber) => (
          <TouchableOpacity
            key={barber.id}
            style={[
              commonStyles.card,
              commonStyles.row,
              selectedBarber === barber.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => setSelectedBarber(barber.id)}
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
        ))}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Select Date & Time</Text>
        
        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => setShowDatePicker(true)}
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
                setDate(selectedDate);
              }
            }}
            minimumDate={new Date()}
          />
        )}

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row]}
          onPress={() => setShowTimePicker(true)}
        >
          <IconSymbol name="clock" size={24} color={colors.primary} />
          <Text style={[commonStyles.text, { marginLeft: 12 }]}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedTime) {
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
          onPress={() => setPaymentMode('pay_in_person')}
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
          onPress={() => setPaymentMode('online')}
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
        >
          <Text style={buttonStyles.text}>
            {loading ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
