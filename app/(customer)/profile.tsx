
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[commonStyles.title, { marginBottom: 30 }]}>
          Profile
        </Text>

        <View style={[commonStyles.card, { alignItems: 'center', padding: 30 }]}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={[commonStyles.title, { fontSize: 36, marginBottom: 0 }]}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
            {user?.name}
          </Text>
          <Text style={commonStyles.textSecondary}>
            {user?.email}
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={commonStyles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconSymbol name="phone.fill" size={20} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                {user?.phone || 'No phone number'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                {user?.birthday
                  ? new Date(user.birthday).toLocaleDateString()
                  : 'No birthday set'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
            Settings
          </Text>

          <TouchableOpacity style={commonStyles.card}>
            <View style={[commonStyles.row, { alignItems: 'center' }]}>
              <IconSymbol name="bell.fill" size={20} color={colors.textSecondary} />
              <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
                Notifications
              </Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.card}>
            <View style={[commonStyles.row, { alignItems: 'center' }]}>
              <IconSymbol name="gift.fill" size={20} color={colors.textSecondary} />
              <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
                My Coupons
              </Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.card}>
            <View style={[commonStyles.row, { alignItems: 'center' }]}>
              <IconSymbol name="questionmark.circle" size={20} color={colors.textSecondary} />
              <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
                Help & Support
              </Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[buttonStyles.outline, { marginTop: 30, borderColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Text style={[buttonStyles.text, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
