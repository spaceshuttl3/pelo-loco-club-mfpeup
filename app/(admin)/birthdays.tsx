
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';

interface Birthday {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  days_until: number;
}

export default function BirthdaysScreen() {
  const router = useRouter();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Birthday | null>(null);
  const [couponText, setCouponText] = useState('Birthday Special');
  const [discountValue, setDiscountValue] = useState('20');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_upcoming_birthdays', { days_ahead: 30 });

      if (error) {
        console.error('Error fetching birthdays:', error);
        return;
      }

      setBirthdays(data || []);
    } catch (error) {
      console.error('Error in fetchBirthdays:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBirthdays();
  };

  const handleSendCoupon = (user: Birthday) => {
    setSelectedUser(user);
    setCouponText('Birthday Special');
    setDiscountValue('20');
    setModalVisible(true);
  };

  const sendCoupon = async () => {
    if (!selectedUser) return;

    if (!couponText || !discountValue) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      Alert.alert('Error', 'Please enter a valid discount percentage (1-100)');
      return;
    }

    setSending(true);
    try {
      // Generate coupon code
      const couponCode = `BDAY${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Create coupon
      const { error } = await supabase
        .from('coupons')
        .insert({
          user_id: selectedUser.id,
          coupon_type: couponText,
          discount_value: discount,
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'active',
          coupon_code: couponCode,
        });

      if (error) {
        console.error('Error creating coupon:', error);
        Alert.alert('Error', 'Could not send coupon');
        return;
      }

      Alert.alert(
        'Success',
        `Birthday coupon sent to ${selectedUser.name}!\n\nCoupon Code: ${couponCode}\nDiscount: ${discount}%`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setSelectedUser(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in sendCoupon:', error);
      Alert.alert('Error', 'Could not send coupon');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Upcoming Birthdays</Text>
      </View>

      <ScrollView
        style={commonStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {birthdays.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift.fill" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No upcoming birthdays in the next 30 days
            </Text>
          </View>
        ) : (
          birthdays.map((birthday) => (
            <View key={birthday.id} style={[commonStyles.card, { marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: colors.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <IconSymbol name="gift.fill" size={24} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {birthday.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {new Date(birthday.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: birthday.days_until === 0 ? colors.primary : colors.card,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600' }]}>
                    {birthday.days_until === 0 ? 'Today!' : `${birthday.days_until} days`}
                  </Text>
                </View>
              </View>

              <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
                  {birthday.email}
                </Text>
                <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 12 }]}>
                  {birthday.phone}
                </Text>
                <TouchableOpacity
                  style={[buttonStyles.primary, { paddingVertical: 10 }]}
                  onPress={() => handleSendCoupon(birthday)}
                >
                  <Text style={buttonStyles.text}>Send Birthday Coupon</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Send Birthday Coupon
            </Text>

            {selectedUser && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedUser.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Birthday: {new Date(selectedUser.birthday).toLocaleDateString()}
                </Text>
              </View>
            )}

            <TextInput
              style={commonStyles.input}
              placeholder="Coupon Text"
              placeholderTextColor={colors.textSecondary}
              value={couponText}
              onChangeText={setCouponText}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Discount Percentage"
              placeholderTextColor={colors.textSecondary}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="number-pad"
            />

            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 16 }]}>
              Coupon will be valid for 30 days
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={sendCoupon}
                disabled={sending}
              >
                <Text style={buttonStyles.text}>
                  {sending ? 'Sending...' : 'Send Coupon'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedUser(null);
                }}
                disabled={sending}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
