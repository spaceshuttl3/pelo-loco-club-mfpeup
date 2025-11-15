
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
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [discountValue, setDiscountValue] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      console.log('Fetching birthdays...');
      
      // Get all users with birthdays
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, birthday')
        .not('birthday', 'is', null)
        .eq('role', 'customer')
        .order('birthday', { ascending: true });

      if (error) {
        console.error('Error fetching birthdays:', error);
        Alert.alert('Errore', 'Impossibile caricare i compleanni');
        return;
      }

      console.log('Raw birthday data:', data?.length || 0);

      // Calculate days until birthday (ignoring year)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const birthdaysWithDays = data?.map(user => {
        const birthday = new Date(user.birthday);
        const birthMonth = birthday.getMonth();
        const birthDay = birthday.getDate();
        
        // Create birthday for this year
        let thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
        thisYearBirthday.setHours(0, 0, 0, 0);
        
        // If birthday has passed this year, use next year
        if (thisYearBirthday < today) {
          thisYearBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`User: ${user.name}, Birthday: ${birthMonth + 1}/${birthDay}, Days until: ${daysUntil}`);
        
        return {
          ...user,
          days_until: daysUntil,
        };
      }) || [];

      // Sort by days until birthday (ascending) - this will show all future birthdays
      birthdaysWithDays.sort((a, b) => a.days_until - b.days_until);

      console.log('Total birthdays processed:', birthdaysWithDays.length);
      console.log('Birthdays within 7 days:', birthdaysWithDays.filter(b => b.days_until <= 7).length);
      console.log('Birthdays within 30 days:', birthdaysWithDays.filter(b => b.days_until <= 30).length);
      console.log('All future birthdays:', birthdaysWithDays.filter(b => b.days_until >= 0).length);
      
      setBirthdays(birthdaysWithDays);
    } catch (error) {
      console.error('Error in fetchBirthdays:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il caricamento dei compleanni');
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
    console.log('SendCoupon - Button pressed for:', user.name);
    setSelectedUser(user);
    setDiscountValue('20');
    setModalVisible(true);
  };

  const sendCoupon = async () => {
    if (!selectedUser || !discountValue) {
      Alert.alert('Errore', 'Inserisci un valore di sconto');
      return;
    }

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      Alert.alert('Errore', 'Inserisci una percentuale di sconto valida (1-100)');
      return;
    }

    setSending(true);
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const { error } = await supabase
        .from('coupons')
        .insert({
          user_id: selectedUser.id,
          coupon_type: 'Compleanno Speciale',
          discount_value: discount,
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'active',
          coupon_code: `BDAY${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

      if (error) {
        console.error('Error sending coupon:', error);
        Alert.alert('Errore', 'Impossibile inviare il coupon');
        return;
      }

      Alert.alert(
        'Successo',
        `Coupon di compleanno inviato a ${selectedUser.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setSelectedUser(null);
              setDiscountValue('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in sendCoupon:', error);
      Alert.alert('Errore', 'Impossibile inviare il coupon');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Show all future birthdays (days_until >= 0)
  const upcomingBirthdays = birthdays.filter(b => b.days_until >= 0);

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
        <Text style={commonStyles.headerTitle}>Compleanni Futuri</Text>
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
          Tutti i Compleanni Futuri ({upcomingBirthdays.length})
        </Text>

        {upcomingBirthdays.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessun compleanno futuro trovato.
              {'\n'}
              Assicurati che i clienti abbiano inserito la loro data di nascita.
            </Text>
          </View>
        ) : (
          upcomingBirthdays.map((user) => (
            <View key={user.id} style={commonStyles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: user.days_until === 0 ? colors.primary : user.days_until <= 7 ? colors.accent : colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <IconSymbol name="gift.fill" size={24} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {user.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {new Date(user.birthday).toLocaleDateString('it-IT', { month: 'long', day: 'numeric' })}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    {user.days_until === 0 
                      ? 'Oggi!' 
                      : user.days_until === 1 
                      ? 'Domani' 
                      : `Tra ${user.days_until} giorni`}
                  </Text>
                </View>
                {user.days_until === 0 && (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      OGGI
                    </Text>
                  </View>
                )}
                {user.days_until > 0 && user.days_until <= 7 && (
                  <View
                    style={{
                      backgroundColor: colors.accent,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      PRESTO
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                  📧 {user.email}
                </Text>
                <Text style={[commonStyles.textSecondary, { marginBottom: 12 }]}>
                  📱 {user.phone}
                </Text>

                <TouchableOpacity
                  style={[buttonStyles.primary, { paddingVertical: 10 }]}
                  onPress={() => handleSendCoupon(user)}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>Invia Coupon di Compleanno</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Send Coupon Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Invia Coupon di Compleanno
            </Text>

            {selectedUser && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedUser.name}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Compleanno: {new Date(selectedUser.birthday).toLocaleDateString('it-IT', { month: 'long', day: 'numeric' })}
                </Text>
              </View>
            )}

            <TextInput
              style={commonStyles.input}
              placeholder="Percentuale di Sconto"
              placeholderTextColor={colors.textSecondary}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="number-pad"
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={sendCoupon}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {sending ? 'Invio...' : 'Invia Coupon'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedUser(null);
                }}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
