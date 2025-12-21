
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { sendBulkPushNotifications } from '../../services/notificationService';

interface SpinWheelPrize {
  id: string;
  coupon_text: string;
  discount_value: number;
  is_active: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [spinWheelPrizes, setSpinWheelPrizes] = useState<SpinWheelPrize[]>([]);
  const [loadingPrizes, setLoadingPrizes] = useState(true);

  useEffect(() => {
    fetchSpinWheelPrizes();
  }, []);

  const fetchSpinWheelPrizes = async () => {
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

      setSpinWheelPrizes(data || []);
    } catch (error) {
      console.error('Error in fetchSpinWheelPrizes:', error);
    } finally {
      setLoadingPrizes(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!notificationTitle || !notificationMessage) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    setSending(true);
    try {
      // Get all users with push tokens
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, push_token')
        .eq('role', 'customer')
        .not('push_token', 'is', null);

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        Alert.alert('Attenzione', 'Nessun utente con notifiche abilitate trovato');
        setSending(false);
        return;
      }

      // Try to create notifications in database (may fail if table doesn't exist)
      try {
        const notifications = users.map(user => ({
          user_id: user.id,
          title: notificationTitle,
          message: notificationMessage,
          notification_type: 'custom',
        }));

        await supabase
          .from('custom_notifications')
          .insert(notifications);
      } catch (dbError) {
        console.log('Database insert failed (table may not exist):', dbError);
        // Continue anyway - we can still send push notifications
      }

      // Send push notifications to users with tokens
      const pushTokens = users
        .filter(user => user.push_token)
        .map(user => user.push_token as string);

      if (pushTokens.length > 0) {
        await sendBulkPushNotifications(pushTokens, {
          title: notificationTitle,
          body: notificationMessage,
          data: { type: 'custom' },
        });
      }

      Alert.alert(
        'Successo',
        `Notifica inviata a ${users.length} utenti!\n${pushTokens.length} notifiche push inviate.`
      );
      setNotificationTitle('');
      setNotificationMessage('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      Alert.alert('Errore', 'Impossibile inviare la notifica');
    } finally {
      setSending(false);
    }
  };

  const handleSendSpinWheelNotification = async () => {
    if (spinWheelPrizes.length === 0) {
      Alert.alert('Errore', 'Nessun premio configurato per la ruota. Vai su Configurazione Premi per aggiungerne.');
      return;
    }

    Alert.alert(
      'Invia Notifica Ruota',
      'Vuoi inviare una notifica a tutti gli utenti per girare la ruota della fortuna?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Invia',
          onPress: async () => {
            setSending(true);
            try {
              // Get all users with push tokens
              const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, push_token')
                .eq('role', 'customer')
                .not('push_token', 'is', null);

              if (usersError) throw usersError;

              if (!users || users.length === 0) {
                Alert.alert('Attenzione', 'Nessun utente con notifiche abilitate trovato');
                setSending(false);
                return;
              }

              // Try to create notifications in database
              try {
                const notifications = users.map(user => ({
                  user_id: user.id,
                  title: '🎰 Gira la Ruota della Fortuna!',
                  message: 'Hai una possibilità di vincere un coupon esclusivo! Clicca qui per girare la ruota.',
                  notification_type: 'spin_wheel',
                }));

                await supabase
                  .from('custom_notifications')
                  .insert(notifications);
              } catch (dbError) {
                console.log('Database insert failed (table may not exist):', dbError);
                // Continue anyway
              }

              // Send push notifications
              const pushTokens = users
                .filter(user => user.push_token)
                .map(user => user.push_token as string);

              if (pushTokens.length > 0) {
                await sendBulkPushNotifications(pushTokens, {
                  title: '🎰 Gira la Ruota della Fortuna!',
                  body: 'Hai una possibilità di vincere un coupon esclusivo! Clicca qui per girare la ruota.',
                  data: { type: 'spin_wheel' },
                });
              }

              Alert.alert(
                'Successo',
                `Notifica ruota inviata a ${users.length} utenti!\n${pushTokens.length} notifiche push inviate.`
              );
            } catch (error) {
              console.error('Error sending spin wheel notification:', error);
              Alert.alert('Errore', 'Impossibile inviare la notifica');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const quickNotifications = [
    {
      id: 'discount-15',
      title: '15% di Sconto Oggi!',
      message: 'Ottieni il 15% di sconto su tutti i prodotti per barba solo oggi!',
      icon: 'tag.fill',
      color: colors.accent,
    },
    {
      id: 'book-appointment',
      title: 'Prenota il Tuo Appuntamento',
      message: 'È passato un po\' di tempo! Prenota il tuo prossimo taglio oggi.',
      icon: 'calendar',
      color: colors.primary,
    },
    {
      id: 'new-products',
      title: 'Nuovi Prodotti Disponibili',
      message: 'Scopri i nostri nuovi prodotti premium per la cura!',
      icon: 'bag.fill',
      color: colors.secondary,
    },
  ];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Notifiche Push</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Spin Wheel Notification */}
        <View style={[commonStyles.card, { backgroundColor: colors.primary, marginBottom: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <IconSymbol name="gift.fill" size={32} color={colors.text} />
            <Text style={[commonStyles.text, { fontSize: 18, fontWeight: 'bold', marginLeft: 12 }]}>
              Ruota della Fortuna
            </Text>
          </View>
          <Text style={[commonStyles.textSecondary, { marginBottom: 16 }]}>
            Invia una notifica push a tutti gli utenti per girare la ruota e vincere un coupon
          </Text>
          {loadingPrizes ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : spinWheelPrizes.length === 0 ? (
            <Text style={[commonStyles.textSecondary, { fontSize: 12, fontStyle: 'italic' }]}>
              Nessun premio configurato. Vai su Configurazione Premi.
            </Text>
          ) : (
            <>
              <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 12 }]}>
                Premi disponibili: {spinWheelPrizes.length}
              </Text>
              <TouchableOpacity
                style={[buttonStyles.primary, { backgroundColor: colors.card }]}
                onPress={handleSendSpinWheelNotification}
                disabled={sending}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>
                  {sending ? 'Invio...' : 'Invia Notifica Ruota'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Invia Notifica Personalizzata
        </Text>

        <TextInput
          style={commonStyles.input}
          placeholder="Titolo Notifica"
          placeholderTextColor={colors.textSecondary}
          value={notificationTitle}
          onChangeText={setNotificationTitle}
        />

        <TextInput
          style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Messaggio Notifica"
          placeholderTextColor={colors.textSecondary}
          value={notificationMessage}
          onChangeText={setNotificationMessage}
          multiline
        />

        <TouchableOpacity
          style={[buttonStyles.primary, { marginBottom: 30 }]}
          onPress={handleSendBroadcast}
          disabled={sending}
        >
          <Text style={buttonStyles.text}>
            {sending ? 'Invio...' : 'Invia a Tutti gli Utenti'}
          </Text>
        </TouchableOpacity>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Notifiche Rapide
        </Text>

        <React.Fragment>
          {quickNotifications.map((notification, index) => (
            <TouchableOpacity
              key={`notification-${notification.id}-${index}`}
              style={commonStyles.card}
              onPress={() => {
                setNotificationTitle(notification.title);
                setNotificationMessage(notification.message);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: notification.color,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <IconSymbol name={notification.icon as any} size={20} color={colors.text} />
                </View>
                <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                  {notification.title}
                </Text>
              </View>
              <Text style={commonStyles.textSecondary}>
                {notification.message}
              </Text>
            </TouchableOpacity>
          ))}
        </React.Fragment>

        <View style={{ marginTop: 30, padding: 16, backgroundColor: colors.card, borderRadius: 8 }}>
          <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
            📱 Sistema Notifiche Push
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
            Le notifiche push vengono inviate tramite Expo Push Notification Service a tutti gli utenti che hanno abilitato le notifiche.
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
            Gli utenti devono avere l&apos;app installata su un dispositivo fisico e aver accettato le notifiche push.
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
            Le notifiche vengono anche salvate nel database (se la tabella custom_notifications esiste) e possono essere visualizzate dagli utenti nell&apos;app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
