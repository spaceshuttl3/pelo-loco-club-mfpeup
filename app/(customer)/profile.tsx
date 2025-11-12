
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('Signed out successfully');
              // Navigation will be handled automatically by the auth state change
            } catch (error: any) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20, marginBottom: 24 }]}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <IconSymbol name="person.fill" size={40} color={colors.text} />
          </View>
          <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
            {user?.name}
          </Text>
          <Text style={commonStyles.textSecondary}>
            {user?.email}
          </Text>
        </View>

        <View style={commonStyles.card}>
          <View style={[commonStyles.row, { marginBottom: 16 }]}>
            <Text style={commonStyles.text}>Phone</Text>
            <Text style={commonStyles.textSecondary}>{user?.phone}</Text>
          </View>
          {user?.birthday && (
            <View style={commonStyles.row}>
              <Text style={commonStyles.text}>Birthday</Text>
              <Text style={commonStyles.textSecondary}>
                {new Date(user.birthday).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={commonStyles.card}>
          <TouchableOpacity
            style={[commonStyles.row, { paddingVertical: 8 }]}
            onPress={() => router.push('/(customer)/bookings')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="calendar" size={24} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                My Bookings
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />

          <TouchableOpacity
            style={[commonStyles.row, { paddingVertical: 8 }]}
            onPress={() => router.push('/(customer)/spin-wheel')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="gift.fill" size={24} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                My Coupons
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[buttonStyles.primary, { backgroundColor: colors.error, marginTop: 24 }]}
          onPress={handleSignOut}
        >
          <Text style={buttonStyles.text}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
