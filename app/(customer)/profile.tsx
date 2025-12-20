
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthday, setBirthday] = useState(user?.birthday ? new Date(user.birthday) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Errore', 'Nome e telefono sono obbligatori');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          birthday: birthday.toISOString().split('T')[0],
        })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Successo', 'Profilo aggiornato con successo');
      setEditModalVisible(false);
      refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il profilo');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Esci',
      'Sei sicuro di voler uscire?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Profilo</Text>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* User Info Card */}
        <View style={[commonStyles.card, { marginBottom: 20 }]}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={[commonStyles.text, { fontSize: 32, fontWeight: 'bold' }]}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold', marginBottom: 4 }]}>
              {user?.name}
            </Text>
            <Text style={commonStyles.textSecondary}>
              {user?.email}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 4 }]}>
              Telefono
            </Text>
            <Text style={commonStyles.text}>
              {user?.phone || 'Non impostato'}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 4 }]}>
              Compleanno
            </Text>
            <Text style={commonStyles.text}>
              {user?.birthday ? new Date(user.birthday).toLocaleDateString('it-IT') : 'Non impostato'}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 4 }]}>
              Crediti Fedeltà
            </Text>
            <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold', color: colors.primary }]}>
              {user?.fidelity_credits || 0} crediti
            </Text>
          </View>

          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: 8 }]}
            onPress={() => {
              setName(user?.name || '');
              setPhone(user?.phone || '');
              setBirthday(user?.birthday ? new Date(user.birthday) : new Date());
              setEditModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={buttonStyles.text}>Modifica Profilo</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Options */}
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Menu
        </Text>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(customer)/fidelity')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <IconSymbol name="star.fill" size={20} color={colors.text} />
          </View>
          <Text style={[commonStyles.text, { flex: 1 }]}>
            Programma Fedeltà
          </Text>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(customer)/bookings')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <IconSymbol name="calendar" size={20} color={colors.text} />
          </View>
          <Text style={[commonStyles.text, { flex: 1 }]}>
            I Miei Appuntamenti
          </Text>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12 }]}
          onPress={() => router.push('/(customer)/order-history')}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <IconSymbol name="bag.fill" size={20} color={colors.text} />
          </View>
          <Text style={[commonStyles.text, { flex: 1 }]}>
            Cronologia Ordini
          </Text>
          <IconSymbol name="chevron.right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[commonStyles.card, commonStyles.row, { marginBottom: 12, backgroundColor: colors.error }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}
          >
            <IconSymbol name="arrow.right.square.fill" size={20} color={colors.error} />
          </View>
          <Text style={[commonStyles.text, { flex: 1 }]}>
            Esci
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Modifica Profilo
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Telefono"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Compleanno</Text>
              <Text style={[commonStyles.text, { color: colors.primary }]}>
                {birthday.toLocaleDateString('it-IT')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setBirthday(selectedDate);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
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
