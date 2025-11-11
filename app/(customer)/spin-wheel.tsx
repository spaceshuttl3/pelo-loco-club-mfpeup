
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const WHEEL_REWARDS = [
  { type: '5% Off', value: 5, color: colors.primary },
  { type: '10% Off', value: 10, color: colors.secondary },
  { type: 'Free Sample', value: 0, color: colors.accent },
  { type: 'No Win', value: 0, color: colors.textSecondary },
  { type: '15% Off', value: 15, color: colors.primary },
  { type: 'Free Beard Trim', value: 15, color: colors.secondary },
];

export default function SpinWheelScreen() {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));
  const [canSpin, setCanSpin] = useState(true);

  const handleSpin = async () => {
    if (!canSpin || spinning) return;

    setSpinning(true);
    setCanSpin(false);

    // Animate the spin
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: true,
    }).start();

    // Randomly select a reward
    const randomIndex = Math.floor(Math.random() * WHEEL_REWARDS.length);
    const reward = WHEEL_REWARDS[randomIndex];

    setTimeout(async () => {
      setSpinning(false);
      spinValue.setValue(0);

      if (reward.type !== 'No Win') {
        // Save coupon to database
        try {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);

          await supabase.from('coupons').insert([
            {
              user_id: user?.id,
              coupon_type: reward.type,
              discount_value: reward.value,
              expiration_date: expirationDate.toISOString(),
              status: 'active',
            },
          ]);

          Alert.alert(
            '🎉 Congratulations!',
            `You won: ${reward.type}!\n\nYour coupon has been added to your profile.`
          );
        } catch (error) {
          console.error('Error saving coupon:', error);
          Alert.alert('Error', 'Failed to save your coupon. Please try again.');
        }
      } else {
        Alert.alert('😔 Better Luck Next Time', 'Try again tomorrow!');
      }
    }, 3000);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1800deg'],
  });

  return (
    <View style={[commonStyles.container, commonStyles.centerContent]}>
      <View style={commonStyles.content}>
        <Text style={[commonStyles.title, { textAlign: 'center', marginBottom: 20 }]}>
          Spin The Wheel
        </Text>
        <Text style={[commonStyles.textSecondary, { textAlign: 'center', marginBottom: 40 }]}>
          Try your luck and win amazing rewards!
        </Text>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Animated.View
            style={{
              width: 250,
              height: 250,
              borderRadius: 125,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ rotate: spin }],
              borderWidth: 8,
              borderColor: colors.primary,
            }}
          >
            <IconSymbol name="gift.fill" size={80} color={colors.primary} />
          </Animated.View>
        </View>

        <TouchableOpacity
          style={[
            buttonStyles.primary,
            { width: '100%', maxWidth: 300, alignSelf: 'center' },
            (!canSpin || spinning) && { opacity: 0.5 },
          ]}
          onPress={handleSpin}
          disabled={!canSpin || spinning}
        >
          <Text style={buttonStyles.text}>
            {spinning ? 'Spinning...' : canSpin ? 'Spin Now!' : 'Come Back Tomorrow'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 40 }}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 16 }]}>
            Possible Rewards
          </Text>
          {WHEEL_REWARDS.map((reward, index) => (
            <View
              key={index}
              style={[
                commonStyles.card,
                { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
              ]}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: reward.color,
                  marginRight: 12,
                }}
              />
              <Text style={commonStyles.text}>{reward.type}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
