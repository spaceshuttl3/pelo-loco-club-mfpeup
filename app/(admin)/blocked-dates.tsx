
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Barber {
  id: string;
  name: string;
  email: string;
}

interface BlockedDate {
  id: string;
  barber_id: string;
  blocked_date: string;
  reason: string;
  created_at: string;
  barber?: Barber;
}

export default function BlockedDatesScreen() {
  const router = useRouter();
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
      } else {
        setBarbers(barbersData || []);
      }

      // Fetch blocked dates
      const { data: blockedData, error: blockedError } = await supabase
        .from('barber_blocked_dates')
        .select(`
          *,
          barber:barbers!barber_blocked_dates_barber_id_fkey(id, name, email)
        `)
        .order('blocked_date', { ascending: true });

      if (blockedError) {
        console.error('Error fetching blocked dates:', blockedError);
      } else {
        setBlockedDates(blockedData || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddBlockedDate = () => {
    setSelectedBarber('');
    setSelectedDate(new Date());
    setReason('');
    setModalVisible(true);
  };

  const handleSaveBlockedDate = async () => {
    if (!selectedBarber) {
      Alert.alert('Errore', 'Seleziona un barbiere');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Errore', 'Inserisci un motivo');
      return;
    }

    const dateString = selectedDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    if (dateString < today) {
      Alert.alert('Errore', 'Non puoi bloccare date passate');
      return;
    }

    // Check if date is already blocked for this barber
    const existingBlock = blockedDates.find(
      bd => bd.barber_id === selectedBarber && bd.blocked_date === dateString
    );

    if (existingBlock) {
      Alert.alert('Errore', 'Questa data è già bloccata per questo barbiere');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('barber_blocked_dates')
        .insert({
          barber_id: selectedBarber,
          blocked_date: dateString,
          reason: reason.trim(),
        });

      if (error) throw error;

      Alert.alert('Successo', 'Data bloccata con successo');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error saving blocked date:', error);
      Alert.alert('Errore', 'Impossibile bloccare la data');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlockedDate = (blockedDate: BlockedDate) => {
    Alert.alert(
      'Elimina Blocco',
      `Sei sicuro di voler sbloccare il ${new Date(blockedDate.blocked_date).toLocaleDateString('it-IT')}?`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('barber_blocked_dates')
                .delete()
                .eq('id', blockedDate.id);

              if (error) throw error;

              Alert.alert('Successo', 'Blocco rimosso');
              fetchData();
            } catch (error) {
              console.error('Error deleting blocked date:', error);
              Alert.alert('Errore', 'Impossibile rimuovere il blocco');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Group blocked dates by barber
  const groupedByBarber: { [key: string]: BlockedDate[] } = {};
  blockedDates.forEach(bd => {
    if (!groupedByBarber[bd.barber_id]) {
      groupedByBarber[bd.barber_id] = [];
    }
    groupedByBarber[bd.barber_id].push(bd);
  });

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Date Bloccate</Text>
        <TouchableOpacity onPress={handleAddBlockedDate}>
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 20 }]}>
          <Text style={[commonStyles.text, { fontSize: 14 }]}>
            ℹ️ Blocca date specifiche per impedire prenotazioni. I clienti non potranno prenotare appuntamenti nelle date bloccate.
          </Text>
        </View>

        {blockedDates.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="calendar.badge.minus" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessuna data bloccata
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 16 }]}
              onPress={handleAddBlockedDate}
            >
              <Text style={buttonStyles.text}>Blocca Data</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {Object.keys(groupedByBarber).map((barberId, barberIndex) => {
              const barberBlocks = groupedByBarber[barberId];
              const barberName = barberBlocks[0]?.barber?.name || 'Barbiere Sconosciuto';

              return (
                <View key={`barber-${barberId}-${barberIndex}`} style={{ marginBottom: 24 }}>
                  <Text style={[commonStyles.subtitle, { marginBottom: 12, fontSize: 18 }]}>
                    {barberName}
                  </Text>

                  {barberBlocks.map((blockedDate, blockIndex) => (
                    <View
                      key={`block-${blockedDate.id}-${blockIndex}`}
                      style={[commonStyles.card, { marginBottom: 12 }]}
                    >
                      <View style={[commonStyles.row, { marginBottom: 8 }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[commonStyles.text, { fontWeight: '600', fontSize: 16 }]}>
                            📅 {new Date(blockedDate.blocked_date).toLocaleDateString('it-IT', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteBlockedDate(blockedDate)}
                          style={{ padding: 4 }}
                        >
                          <IconSymbol name="trash" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>

                      <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 12, marginTop: 8 }]}>
                        <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600', marginBottom: 4 }]}>
                          Motivo:
                        </Text>
                        <Text style={[commonStyles.textSecondary, { fontSize: 13 }]}>
                          {blockedDate.reason}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Add Blocked Date Modal */}
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
                Blocca Data
              </Text>

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                Seleziona Barbiere *
              </Text>
              <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
                {barbers.map((barber, barberIndex) => (
                  <TouchableOpacity
                    key={`barber-select-${barber.id}-${barberIndex}`}
                    style={[
                      commonStyles.card,
                      {
                        marginBottom: 8,
                        borderWidth: 2,
                        borderColor: selectedBarber === barber.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedBarber(barber.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[commonStyles.row]}>
                      <Text style={[commonStyles.text, { flex: 1 }]}>
                        {barber.name}
                      </Text>
                      {selectedBarber === barber.id && (
                        <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                Seleziona Data *
              </Text>
              <TouchableOpacity
                style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <IconSymbol name="calendar" size={24} color={colors.primary} />
                <Text style={[commonStyles.text, { marginLeft: 12 }]}>
                  {selectedDate.toLocaleDateString('it-IT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={{ marginBottom: 16 }}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    textColor={colors.text}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[buttonStyles.primary, { marginTop: 8 }]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={buttonStyles.text}>Conferma</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                Motivo *
              </Text>
              <TextInput
                style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Es: Ferie, Malattia, Evento speciale..."
                placeholderTextColor={colors.textSecondary}
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                editable={!saving}
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleSaveBlockedDate}
                  disabled={saving}
                >
                  <Text style={buttonStyles.text}>
                    {saving ? 'Salvataggio...' : 'Blocca'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => setModalVisible(false)}
                  disabled={saving}
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
