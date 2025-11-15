
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
import { Picker } from '@react-native-picker/picker';

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
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountMethod, setDiscountMethod] = useState<'percentage' | 'euros' | 'spin'>('percentage');
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

      // Filter to only show birthdays within the next 30 days
      const upcomingBirthdays = birthdaysWithDays.filter(b => b.days_until >= 0 && b.days_until <= 30);

      // Sort by days until birthday (ascending)
      upcomingBirthdays.sort((a, b) => a.days_until - b.days_until);

      console.log('Total birthdays processed:', birthdaysWithDays.length);
      console.log('Birthdays within 30 days:', upcomingBirthdays.length);
      
      setBirthdays(upcomingBirthdays);
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
    setCouponCode(`BDAY${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setDiscountValue('20');
    setDiscountMethod('percentage');
    setModalVisible(true);
  };

  const sendCoupon = async () => {
    if (!selectedUser || !couponCode || !discountValue) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount <= 0) {
      Alert.alert('Errore', 'Inserisci un valore di sconto valido');
      return;
    }

    if (discountMethod === 'percentage' && discount > 100) {
      Alert.alert('Errore', 'La percentuale di sconto non può superare il 100%');
      return;
    }

    setSending(true);
    try {
      // Check if coupon code already exists
      const { data: existingCoupon, error: checkError } = await supabase
        .from('coupons')
        .select('id')
        .eq('coupon_code', couponCode)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking coupon code:', checkError);
        Alert.alert('Errore', 'Impossibile verificare il codice coupon');
        setSending(false);
        return;
      }

      if (existingCoupon) {
        Alert.alert(
          'Codice Duplicato',
          'Esiste già un coupon con questo codice. Scegli un codice diverso.',
          [{ text: 'OK' }]
        );
        setSending(false);
        return;
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Determine coupon type based on discount method
      let couponType = 'Compleanno Speciale';
      if (discountMethod === 'euros') {
        couponType = `Compleanno - €${discount} di sconto`;
      } else if (discountMethod === 'spin') {
        couponType = 'Compleanno - Gira la Ruota';
      } else {
        couponType = `Compleanno - ${discount}% di sconto`;
      }

      const { error } = await supabase
        .from('coupons')
        .insert({
          user_id: selectedUser.id,
          coupon_type: couponType,
          discount_value: discount,
          expiration_date: expirationDate.toISOString().split('T')[0],
          status: 'active',
          coupon_code: couponCode,
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
              setCouponCode('');
              setDiscountValue('');
              setDiscountMethod('percentage');
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
        <Text style={commonStyles.headerTitle}>Compleanni (30 giorni)</Text>
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
          Prossimi 30 Giorni ({birthdays.length})
        </Text>

        {birthdays.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessun compleanno nei prossimi 30 giorni.
              {'\n'}
              Assicurati che i clienti abbiano inserito la loro data di nascita.
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {birthdays.map((user, index) => (
              <View key={`birthday-${user.id}-${index}`} style={commonStyles.card}>
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
                    <Text style={buttonStyles.text}>Crea Coupon Personalizzato</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
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
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <ScrollView>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                Crea Coupon Personalizzato
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

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                Codice Coupon
              </Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Codice Coupon (es. BDAY2024)"
                placeholderTextColor={colors.textSecondary}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />

              <Text style={[commonStyles.text, { marginBottom: 8, marginTop: 16, fontWeight: '600' }]}>
                Metodo di Sconto
              </Text>
              <View style={[commonStyles.card, { marginBottom: 16 }]}>
                <Picker
                  selectedValue={discountMethod}
                  onValueChange={(itemValue) => setDiscountMethod(itemValue)}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Percentuale (%)" value="percentage" />
                  <Picker.Item label="Euro (€)" value="euros" />
                  <Picker.Item label="Gira la Ruota" value="spin" />
                </Picker>
              </View>

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                {discountMethod === 'percentage' ? 'Percentuale di Sconto' : discountMethod === 'euros' ? 'Sconto in Euro' : 'Valore Gira la Ruota'}
              </Text>
              <TextInput
                style={commonStyles.input}
                placeholder={discountMethod === 'percentage' ? 'Es. 20' : discountMethod === 'euros' ? 'Es. 10' : 'Es. 1'}
                placeholderTextColor={colors.textSecondary}
                value={discountValue}
                onChangeText={setDiscountValue}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={sendCoupon}
                  disabled={sending}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>
                    {sending ? 'Invio...' : 'Crea Coupon'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedUser(null);
                    setCouponCode('');
                    setDiscountValue('');
                    setDiscountMethod('percentage');
                  }}
                  disabled={sending}
                  activeOpacity={0.7}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
