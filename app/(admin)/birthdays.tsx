
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

interface Birthday {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  days_until: number;
}

export default function BirthdaysScreen() {
  const router = useRouter();
  const { user: adminUser } = useAuth();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Birthday | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      console.log('Fetching birthdays...');
      
      // Get all users with birthdays
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, phone, birthday')
        .not('birthday', 'is', null)
        .eq('role', 'customer')
        .order('birthday', { ascending: true });

      if (error) {
        console.error('Error fetching birthdays:', error);
        Alert.alert('Errore', 'Impossibile caricare i compleanni');
        return;
      }

      console.log('Raw birthday data:', data?.length || 0);

      // Calculate days until birthday (ignoring year)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const birthdaysWithDays = data?.map(user => {
        const birthday = new Date(user.birthday);
        const birthMonth = birthday.getMonth();
        const birthDay = birthday.getDate();
        
        // Create birthday for this year
        let thisYearBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
        thisYearBirthday.setHours(0, 0, 0, 0);
        
        // If birthday has passed this year, use next year
        if (thisYearBirthday < today) {
          thisYearBirthday = new Date(today.getFullYear() + 1, birthMonth, birthDay);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`User: ${user.name}, Birthday: ${birthMonth + 1}/${birthDay}, Days until: ${daysUntil}`);
        
        return {
          ...user,
          days_until: daysUntil,
        };
      }) || [];

      // Filter to only show birthdays within the next 30 days
      const upcomingBirthdays = birthdaysWithDays.filter(b => b.days_until >= 0 && b.days_until <= 30);

      // Sort by days until birthday (ascending)
      upcomingBirthdays.sort((a, b) => a.days_until - b.days_until);

      console.log('Total birthdays processed:', birthdaysWithDays.length);
      console.log('Birthdays within 30 days:', upcomingBirthdays.length);
      
      setBirthdays(upcomingBirthdays);
    } catch (error) {
      console.error('Error in fetchBirthdays:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il caricamento dei compleanni');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBirthdays();
  };

  const handleSendNotification = (user: Birthday) => {
    console.log('SendNotification - Button pressed for:', user.name);
    setSelectedUser(user);
    setNotificationTitle(`Buon Compleanno ${user.name}!`);
    setNotificationMessage(`Ciao ${user.name}! Ti auguriamo un felicissimo compleanno! 🎉🎂`);
    setModalVisible(true);
  };

  const sendNotification = async () => {
    if (!selectedUser || !notificationTitle || !notificationMessage) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('custom_notifications')
        .insert({
          user_id: selectedUser.id,
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          notification_type: 'birthday',
          created_by: adminUser?.id,
        });

      if (error) {
        console.error('Error sending notification:', error);
        Alert.alert('Errore', 'Impossibile inviare la notifica');
        return;
      }

      Alert.alert(
        'Successo',
        `Notifica inviata a ${selectedUser.name}!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setModalVisible(false);
              setSelectedUser(null);
              setNotificationTitle('');
              setNotificationMessage('');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in sendNotification:', error);
      Alert.alert('Errore', 'Impossibile inviare la notifica');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

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
        <Text style={commonStyles.headerTitle}>Compleanni (30 giorni)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Prossimi 30 Giorni ({birthdays.length})
        </Text>

        {birthdays.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessun compleanno nei prossimi 30 giorni.
              {'\n'}
              Assicurati che i clienti abbiano inserito la loro data di nascita.
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {birthdays.map((user, index) => (
              <View key={`birthday-${user.id}-${index}`} style={commonStyles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: user.days_until === 0 ? colors.primary : user.days_until <= 7 ? colors.accent : colors.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <IconSymbol name="gift.fill" size={24} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {user.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {new Date(user.birthday).toLocaleDateString('it-IT', { month: 'long', day: 'numeric' })}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      {user.days_until === 0 
                        ? 'Oggi!' 
                        : user.days_until === 1 
                        ? 'Domani' 
                        : `Tra ${user.days_until} giorni`}
                    </Text>
                  </View>
                  {user.days_until === 0 && (
                    <View
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        OGGI
                      </Text>
                    </View>
                  )}
                  {user.days_until > 0 && user.days_until <= 7 && (
                    <View
                      style={{
                        backgroundColor: colors.accent,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        PRESTO
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                    📧 {user.email}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { marginBottom: 12 }]}>
                    📱 {user.phone}
                  </Text>

                  <TouchableOpacity
                    style={[buttonStyles.primary, { paddingVertical: 10 }]}
                    onPress={() => handleSendNotification(user)}
                    activeOpacity={0.7}
                  >
                    <Text style={buttonStyles.text}>Invia Notifica Personalizzata</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Send Notification Modal */}
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
                Invia Notifica Personalizzata
              </Text>

              {selectedUser && (
                <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {selectedUser.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    Compleanno: {new Date(selectedUser.birthday).toLocaleDateString('it-IT', { month: 'long', day: 'numeric' })}
                  </Text>
                </View>
              )}

              <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
                Titolo Notifica
              </Text>
              <TextInput
                style={commonStyles.input}
                placeholder="Titolo"
                placeholderTextColor={colors.textSecondary}
                value={notificationTitle}
                onChangeText={setNotificationTitle}
              />

              <Text style={[commonStyles.text, { marginBottom: 8, marginTop: 16, fontWeight: '600' }]}>
                Messaggio
              </Text>
              <TextInput
                style={[commonStyles.input, { height: 120 }]}
                placeholder="Scrivi il tuo messaggio personalizzato..."
                placeholderTextColor={colors.textSecondary}
                value={notificationMessage}
                onChangeText={setNotificationMessage}
                multiline
                textAlignVertical="top"
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={sendNotification}
                  disabled={sending}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>
                    {sending ? 'Invio...' : 'Invia Notifica'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedUser(null);
                    setNotificationTitle('');
                    setNotificationMessage('');
                  }}
                  disabled={sending}
                  activeOpacity={0.7}
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
