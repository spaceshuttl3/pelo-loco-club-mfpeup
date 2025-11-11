
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SERVICES } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookAppointmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'pay_in_person' | 'online'>('pay_in_person');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedTime) {
      Alert.alert('Error', 'Please select a service and time slot');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert([
        {
          user_id: user?.id,
          service: SERVICES.find(s => s.id === selectedService)?.name,
          date: selectedDate.toISOString().split('T')[0],
          time: selectedTime,
          status: 'booked',
          payment_mode: paymentMode,
          payment_status: paymentMode === 'online' ? 'paid' : 'pending',
        },
      ]);

      if (error) throw error;

      Alert.alert('Success', 'Appointment booked successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', error.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Select Service
        </Text>

        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[
              commonStyles.card,
              selectedService === service.id && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => setSelectedService(service.id)}
          >
            <View style={commonStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {service.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  {service.duration} min
                </Text>
              </View>
              <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                ${service.price}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>
          Select Date
        </Text>

        <TouchableOpacity
          style={commonStyles.card}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={commonStyles.text}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setSelectedDate(date);
            }}
          />
        )}

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>
          Select Time
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                {
                  backgroundColor: selectedTime === time ? colors.primary : colors.card,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  margin: 4,
                  minWidth: 80,
                  alignItems: 'center',
                },
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[commonStyles.text, { fontSize: 14 }]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>
          Payment Method
        </Text>

        <TouchableOpacity
          style={[
            commonStyles.card,
            paymentMode === 'pay_in_person' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => setPaymentMode('pay_in_person')}
        >
          <Text style={[commonStyles.text, { fontWeight: '600' }]}>
            Pay in Person
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 4 }]}>
            Pay at the shop after your appointment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            commonStyles.card,
            paymentMode === 'online' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => setPaymentMode('online')}
        >
          <Text style={[commonStyles.text, { fontWeight: '600' }]}>
            Pay Online
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 4 }]}>
            Stripe / Apple Pay (Coming Soon)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: 30 }]}
          onPress={handleBookAppointment}
          disabled={loading || !selectedService || !selectedTime}
        >
          <Text style={buttonStyles.text}>
            {loading ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
