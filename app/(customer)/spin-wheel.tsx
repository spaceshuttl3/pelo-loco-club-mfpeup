
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

      setCoupons(data || []);
    } catch (error) {
      console.error('Error in fetchCoupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async (coupon: Coupon) => {
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
        <Text style={commonStyles.headerTitle}>My Coupons</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
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
    </SafeAreaView>
  );
}
