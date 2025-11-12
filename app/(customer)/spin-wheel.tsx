
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';

interface Coupon {
  id: string;
  coupon_type: string;
  discount_value: number;
  expiration_date: string;
  status: string;
  coupon_code: string;
}

export default function SpinWheelScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
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
      `Redeem ${coupon.discount_value}% off coupon?\n\nShow this code to the barber: ${coupon.coupon_code}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark as Used',
          onPress: async () => {
            setRedeeming(true);
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

              Alert.alert('Success', 'Coupon redeemed successfully!');
              fetchCoupons();
            } catch (error) {
              console.error('Error in handleRedeemCoupon:', error);
              Alert.alert('Error', 'Could not redeem coupon');
            } finally {
              setRedeeming(false);
            }
          },
        },
      ]
    );
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
        <Text style={commonStyles.headerTitle}>My Coupons</Text>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 24 }]}>
          <IconSymbol name="gift.fill" size={48} color={colors.text} />
          <Text style={[commonStyles.subtitle, { marginTop: 16, marginBottom: 8 }]}>
            Your Rewards
          </Text>
          <Text style={commonStyles.textSecondary}>
            Redeem your coupons at the shop or when booking appointments
          </Text>
        </View>

        {coupons.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="ticket" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              No active coupons available
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
              Check back later for special offers!
            </Text>
          </View>
        ) : (
          <>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Available Coupons
            </Text>
            {coupons.map((coupon) => {
              const expirationDate = new Date(coupon.expiration_date);
              const isExpiringSoon = (expirationDate.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

              return (
                <View key={coupon.id} style={[commonStyles.card, { marginBottom: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: colors.primary,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 16,
                      }}
                    >
                      <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold' }]}>
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
                    </View>
                  </View>

                  <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 12 }]}>
                      Expires: {expirationDate.toLocaleDateString()}
                      {isExpiringSoon && ' (Expiring Soon!)'}
                    </Text>
                    <TouchableOpacity
                      style={[buttonStyles.primary, { paddingVertical: 10 }]}
                      onPress={() => handleRedeemCoupon(coupon)}
                      disabled={redeeming}
                    >
                      <Text style={buttonStyles.text}>
                        {redeeming ? 'Redeeming...' : 'Redeem Coupon'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
