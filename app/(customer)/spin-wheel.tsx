
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCoupons();
    }
  }, [user]);

  const fetchCoupons = async () => {
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

      console.log('Coupons fetched:', data?.length || 0);
      setCoupons(data || []);
    } catch (error) {
      console.error('Error in fetchCoupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async (coupon: Coupon) => {
    console.log('RedeemCoupon - Button pressed for:', coupon.coupon_type);
    
    Alert.alert(
      'Redeem Coupon',
      `Redeem ${coupon.coupon_type} (${coupon.discount_value}% off)?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('coupons')
                .update({ status: 'used' })
                .eq('id', coupon.id);

              if (error) {
                console.error('Error redeeming coupon:', error);
                Alert.alert('Error', 'Could not redeem coupon');
                return;
              }

              Alert.alert('Success', 'Coupon redeemed! Show this to the barber at checkout.');
              fetchCoupons();
            } catch (error) {
              console.error('Error in handleRedeemCoupon:', error);
              Alert.alert('Error', 'Could not redeem coupon');
            }
          },
        },
      ]
    );
  };

  const handleRedeemByCode = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    setRedeeming(true);
    try {
      console.log('Searching for coupon code:', couponCode.toUpperCase().trim());
      
      // Check if coupon exists and is valid
      const { data: couponData, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .eq('coupon_code', couponCode.toUpperCase().trim())
        .eq('user_id', user?.id)
        .single();

      console.log('Coupon search result:', couponData);
      console.log('Coupon search error:', fetchError);

      if (fetchError || !couponData) {
        Alert.alert('Error', 'Invalid coupon code or coupon does not belong to you');
        return;
      }

      // Check if already used
      if (couponData.status === 'used') {
        Alert.alert('Error', 'This coupon has already been used');
        return;
      }

      // Check if coupon is expired
      const expirationDate = new Date(couponData.expiration_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expirationDate < today) {
        Alert.alert('Error', 'This coupon has expired');
        return;
      }

      // Mark coupon as used
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ status: 'used' })
        .eq('id', couponData.id);

      if (updateError) {
        console.error('Error redeeming coupon:', updateError);
        Alert.alert('Error', 'Could not redeem coupon');
        return;
      }

      Alert.alert(
        'Success!',
        `Coupon redeemed: ${couponData.coupon_type} (${couponData.discount_value}% off)`,
        [
          {
            text: 'OK',
            onPress: () => {
              setRedeemModalVisible(false);
              setCouponCode('');
              fetchCoupons();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleRedeemByCode:', error);
      Alert.alert('Error', 'Could not redeem coupon');
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
        <Text style={commonStyles.headerTitle}>My Coupons</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Redeem coupon button pressed');
            setRedeemModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <TouchableOpacity
          style={[buttonStyles.primary, { marginBottom: 24 }]}
          onPress={() => setRedeemModalVisible(true)}
          activeOpacity={0.7}
        >
          <IconSymbol name="ticket.fill" size={20} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={buttonStyles.text}>Redeem Coupon Code</Text>
        </TouchableOpacity>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Active Coupons ({activeCoupons.length})
        </Text>

        {activeCoupons.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              No active coupons available
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
              Check back later for special offers!
            </Text>
          </View>
        ) : (
          activeCoupons.map((coupon) => (
            <View key={coupon.id} style={[commonStyles.card, { backgroundColor: colors.primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold' }]}>
                    {coupon.discount_value}%
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {coupon.coupon_type}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Code: {coupon.coupon_code}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Expires: {new Date(coupon.expiration_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[buttonStyles.primary, { backgroundColor: colors.card }]}
                onPress={() => handleRedeemCoupon(coupon)}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>Redeem Coupon</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {usedCoupons.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Used Coupons ({usedCoupons.length})
            </Text>

            {usedCoupons.map((coupon) => (
              <View key={coupon.id} style={[commonStyles.card, { opacity: 0.5 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 16, fontWeight: 'bold' }]}>
                      {coupon.discount_value}%
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                      {coupon.coupon_type}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      Used
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Redeem Coupon Modal */}
      <Modal
        visible={redeemModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Redeem Coupon Code
            </Text>

            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
              <Text style={[commonStyles.text, { textAlign: 'center' }]}>
                Enter your coupon code below to redeem your discount
              </Text>
            </View>

            <TextInput
              style={[commonStyles.input, { textTransform: 'uppercase' }]}
              placeholder="Enter Coupon Code"
              placeholderTextColor={colors.textSecondary}
              value={couponCode}
              onChangeText={(text) => setCouponCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleRedeemByCode}
                disabled={redeeming}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {redeeming ? 'Redeeming...' : 'Redeem'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setRedeemModalVisible(false);
                  setCouponCode('');
                }}
                disabled={redeeming}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
