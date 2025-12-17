
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';

interface Coupon {
  id: string;
  coupon_type: string;
  discount_value: number;
  expiration_date: string;
  status: string;
  coupon_code: string;
}

export default function SpinWheelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
        return;
      }

      setCoupons(data || []);
    } catch (error) {
      console.error('Error in fetchCoupons:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user, fetchCoupons]);

  const handleRedeemCoupon = (coupon: Coupon) => {
    Alert.alert(
      'Riscatta Coupon',
      `Vuoi riscattare questo coupon?\n\n${coupon.coupon_type}\nSconto: ${coupon.discount_value}%\n\nMostra questo codice al barbiere:\n${coupon.coupon_code}`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Riscatta',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('coupons')
                .update({ status: 'used' })
                .eq('id', coupon.id);

              if (error) throw error;

              Alert.alert('Successo', 'Coupon riscattato!');
              fetchCoupons();
            } catch (error) {
              console.error('Error redeeming coupon:', error);
              Alert.alert('Errore', 'Impossibile riscattare il coupon');
            }
          },
        },
      ]
    );
  };

  const handleRedeemByCode = async () => {
    if (!redeemCode.trim()) {
      Alert.alert('Errore', 'Inserisci un codice coupon');
      return;
    }

    setRedeeming(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('coupon_code', redeemCode.trim().toUpperCase())
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error finding coupon:', error);
        Alert.alert('Errore', 'Codice coupon non valido');
        return;
      }

      if (!data) {
        Alert.alert('Errore', 'Codice coupon non valido o già utilizzato');
        return;
      }

      const { error: updateError } = await supabase
        .from('coupons')
        .update({ 
          user_id: user?.id,
          status: 'active'
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      Alert.alert('Successo', 'Coupon aggiunto al tuo account!');
      setRedeemModalVisible(false);
      setRedeemCode('');
      fetchCoupons();
    } catch (error) {
      console.error('Error redeeming by code:', error);
      Alert.alert('Errore', 'Impossibile riscattare il coupon');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const usedCoupons = coupons.filter(c => c.status === 'used');

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>I Miei Coupon</Text>
        <TouchableOpacity onPress={() => setRedeemModalVisible(true)}>
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Coupon Attivi ({activeCoupons.length})
        </Text>

        {activeCoupons.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessun coupon attivo
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 16 }]}
              onPress={() => setRedeemModalVisible(true)}
            >
              <Text style={buttonStyles.text}>Riscatta Codice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {activeCoupons.map((coupon, index) => (
              <View
                key={`active-${coupon.id}-${index}`}
                style={[commonStyles.card, { backgroundColor: colors.primary, marginBottom: 16 }]}
              >
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold' }]}>
                      {coupon.discount_value}% SCONTO
                    </Text>
                    <Text style={[commonStyles.textSecondary, { marginTop: 4 }]}>
                      {coupon.coupon_type}
                    </Text>
                  </View>
                  <IconSymbol name="gift.fill" size={32} color={colors.text} />
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    Codice: {coupon.coupon_code}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    Scade: {new Date(coupon.expiration_date).toLocaleDateString('it-IT')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[buttonStyles.primary, { backgroundColor: colors.card }]}
                  onPress={() => handleRedeemCoupon(coupon)}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>
                    Riscatta Coupon
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </React.Fragment>
        )}

        {usedCoupons.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Coupon Utilizzati ({usedCoupons.length})
            </Text>

            <React.Fragment>
              {usedCoupons.map((coupon, index) => (
                <View
                  key={`used-${coupon.id}-${index}`}
                  style={[commonStyles.card, { opacity: 0.6, marginBottom: 12 }]}
                >
                  <View style={[commonStyles.row, { marginBottom: 8 }]}>
                    <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                      {coupon.discount_value}% SCONTO
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.textSecondary,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        UTILIZZATO
                      </Text>
                    </View>
                  </View>
                  <Text style={commonStyles.textSecondary}>
                    {coupon.coupon_type}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          </>
        )}
      </ScrollView>

      <Modal
        visible={redeemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', padding: 24 }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center' }]}>
              Riscatta Codice Coupon
            </Text>

            <Text style={[commonStyles.textSecondary, { marginBottom: 16, textAlign: 'center' }]}>
              Inserisci il codice coupon che hai ricevuto
            </Text>

            <TextInput
              style={[commonStyles.input, { textAlign: 'center', textTransform: 'uppercase' }]}
              placeholder="CODICE COUPON"
              placeholderTextColor={colors.textSecondary}
              value={redeemCode}
              onChangeText={setRedeemCode}
              autoCapitalize="characters"
              editable={!redeeming}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleRedeemByCode}
                disabled={redeeming}
              >
                <Text style={buttonStyles.text}>
                  {redeeming ? 'Riscatto...' : 'Riscatta'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setRedeemModalVisible(false);
                  setRedeemCode('');
                }}
                disabled={redeeming}
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
