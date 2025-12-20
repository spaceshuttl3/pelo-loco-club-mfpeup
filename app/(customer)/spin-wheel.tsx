
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface SpinWheelPrize {
  id: string;
  coupon_text: string;
  discount_value: number;
  is_active: boolean;
}

export default function SpinWheelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  
  // Spin wheel state
  const [spinWheelVisible, setSpinWheelVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [wonPrize, setWonPrize] = useState<SpinWheelPrize | null>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [wonCouponCode, setWonCouponCode] = useState('');

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

  const fetchSpinWheelPrizes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_coupon_config')
        .select('*')
        .eq('is_spin_wheel', true)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching spin wheel prizes:', error);
        return;
      }

      console.log('Spin wheel prizes fetched:', data?.length || 0);
      setPrizes(data || []);
    } catch (error) {
      console.error('Error in fetchSpinWheelPrizes:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchSpinWheelPrizes();
    }
  }, [user, fetchCoupons, fetchSpinWheelPrizes]);

  // Check if opened from notification with spin_wheel parameter or redeem_coupon
  useEffect(() => {
    if (params.action === 'spin_wheel') {
      console.log('Opening spin wheel from notification');
      setSpinWheelVisible(true);
    } else if (params.action === 'redeem_coupon') {
      console.log('Opening redeem coupon modal from notification');
      if (params.coupon_code) {
        setRedeemCode(params.coupon_code as string);
      }
      setRedeemModalVisible(true);
    }
  }, [params]);

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

  const spinWheel = async () => {
    if (prizes.length === 0) {
      Alert.alert('Errore', 'Nessun premio disponibile al momento');
      return;
    }

    setSpinning(true);
    setWonPrize(null);
    spinValue.setValue(0);

    // Randomly select a prize
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const selectedPrize = prizes[randomIndex];
    
    console.log('Selected prize:', selectedPrize);

    // Calculate rotation (multiple full rotations + final position)
    const segmentAngle = 360 / prizes.length;
    const targetAngle = randomIndex * segmentAngle;
    const finalRotation = 360 * 5 + targetAngle; // 5 full rotations + final position

    Animated.timing(spinValue, {
      toValue: finalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      setWonPrize(selectedPrize);

      // Generate coupon code
      const couponCode = `SPIN${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setWonCouponCode(couponCode);
      
      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      try {
        // Create coupon in database
        const { error } = await supabase
          .from('coupons')
          .insert({
            user_id: user?.id,
            coupon_type: selectedPrize.coupon_text,
            discount_value: selectedPrize.discount_value,
            expiration_date: expirationDate.toISOString().split('T')[0],
            status: 'active',
            coupon_code: couponCode,
            config_id: selectedPrize.id,
          });

        if (error) throw error;

        // Show result modal
        setResultModalVisible(true);
        
        // Refresh coupons
        fetchCoupons();
      } catch (error) {
        console.error('Error creating coupon:', error);
        Alert.alert('Errore', 'Impossibile creare il coupon. Riprova.');
      }
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const closeResultModal = () => {
    setResultModalVisible(false);
    setSpinWheelVisible(false);
    setWonPrize(null);
    setWonCouponCode('');
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
        {/* Spin Wheel Button */}
        {prizes.length > 0 && (
          <TouchableOpacity
            style={[
              commonStyles.card,
              {
                backgroundColor: colors.primary,
                padding: 24,
                alignItems: 'center',
                marginBottom: 20,
              },
            ]}
            onPress={() => setSpinWheelVisible(true)}
            activeOpacity={0.7}
          >
            <IconSymbol name="gift.fill" size={48} color={colors.text} />
            <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold', marginTop: 12 }]}>
              Gira la Ruota
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 4, textAlign: 'center' }]}>
              Prova la tua fortuna e vinci un coupon!
            </Text>
          </TouchableOpacity>
        )}

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

      {/* Redeem Code Modal */}
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

      {/* Spin Wheel Modal */}
      <Modal
        visible={spinWheelVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !spinning && setSpinWheelVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <View style={[commonStyles.card, { width: '90%', padding: 24, alignItems: 'center' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 24, textAlign: 'center' }]}>
              🎰 Gira la Ruota della Fortuna!
            </Text>

            {/* Wheel */}
            <View style={{ position: 'relative', marginBottom: 24 }}>
              <Animated.View
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                  backgroundColor: colors.card,
                  borderWidth: 8,
                  borderColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ rotate: spin }],
                }}
              >
                {prizes.map((prize, index) => {
                  const angle = (360 / prizes.length) * index;
                  const segmentColor = index % 2 === 0 ? colors.primary : colors.card;
                  return (
                    <View
                      key={`prize-${prize.id}-${index}`}
                      style={{
                        position: 'absolute',
                        width: 120,
                        height: 120,
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -70 },
                        ],
                      }}
                    >
                      <View style={{ 
                        backgroundColor: segmentColor, 
                        padding: 8, 
                        borderRadius: 8,
                        alignItems: 'center',
                      }}>
                        <Text style={[commonStyles.text, { fontSize: 16, fontWeight: 'bold', textAlign: 'center' }]}>
                          {prize.discount_value}%
                        </Text>
                        <Text style={[commonStyles.textSecondary, { fontSize: 10, textAlign: 'center' }]}>
                          OFF
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Pointer */}
              <View
                style={{
                  position: 'absolute',
                  top: -20,
                  left: '50%',
                  marginLeft: -15,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 15,
                  borderRightWidth: 15,
                  borderTopWidth: 30,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderTopColor: colors.primary,
                }}
              />
            </View>

            {!spinning && !resultModalVisible && (
              <TouchableOpacity
                style={[buttonStyles.primary, { width: '100%' }]}
                onPress={spinWheel}
              >
                <Text style={buttonStyles.text}>Gira!</Text>
              </TouchableOpacity>
            )}

            {spinning && (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[commonStyles.text, { marginTop: 12 }]}>
                  Girando...
                </Text>
              </View>
            )}

            {!spinning && !resultModalVisible && (
              <TouchableOpacity
                style={[buttonStyles.primary, { width: '100%', marginTop: 12, backgroundColor: colors.card }]}
                onPress={() => {
                  setSpinWheelVisible(false);
                  setWonPrize(null);
                }}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Chiudi</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        visible={resultModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closeResultModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <View style={[commonStyles.card, { width: '90%', padding: 32, alignItems: 'center' }]}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🎉</Text>
            
            <Text style={[commonStyles.subtitle, { marginBottom: 16, textAlign: 'center', fontSize: 24 }]}>
              Congratulazioni!
            </Text>

            {wonPrize && (
              <>
                <Text style={[commonStyles.text, { fontSize: 18, marginBottom: 8, textAlign: 'center' }]}>
                  Hai vinto:
                </Text>
                <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 8 }]}>
                  {wonPrize.discount_value}% SCONTO
                </Text>
                <Text style={[commonStyles.textSecondary, { marginBottom: 20, textAlign: 'center' }]}>
                  {wonPrize.coupon_text}
                </Text>

                <View style={[commonStyles.card, { backgroundColor: colors.background, padding: 16, marginBottom: 20, width: '100%' }]}>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12, textAlign: 'center', marginBottom: 4 }]}>
                    Il tuo codice coupon:
                  </Text>
                  <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 }]}>
                    {wonCouponCode}
                  </Text>
                </View>

                <Text style={[commonStyles.textSecondary, { fontSize: 14, textAlign: 'center', marginBottom: 24 }]}>
                  Il coupon è stato aggiunto al tuo account e scadrà tra 30 giorni!
                </Text>
              </>
            )}

            <TouchableOpacity
              style={[buttonStyles.primary, { width: '100%' }]}
              onPress={closeResultModal}
            >
              <Text style={buttonStyles.text}>Fantastico!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
