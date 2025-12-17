
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendBroadcast = async () => {
    if (!notificationTitle || !notificationMessage) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSending(true);
    // TODO: Implement Firebase Cloud Messaging
    setTimeout(() => {
      setSending(false);
      Alert.alert('Success', 'Notification sent to all users!');
      setNotificationTitle('');
      setNotificationMessage('');
    }, 1500);
  };

  const quickNotifications = [
    {
      id: 'discount-15',
      title: '15% Off Today!',
      message: 'Get 15% off on all beard products today only!',
      icon: 'tag.fill',
      color: colors.accent,
    },
    {
      id: 'book-appointment',
      title: 'Book Your Appointment',
      message: 'Haven&apos;t seen you in a while! Book your next cut today.',
      icon: 'calendar',
      color: colors.primary,
    },
    {
      id: 'new-products',
      title: 'New Products Available',
      message: 'Check out our new premium grooming products!',
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
        <Text style={commonStyles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Send Custom Notification
        </Text>

        <TextInput
          style={commonStyles.input}
          placeholder="Notification Title"
          placeholderTextColor={colors.textSecondary}
          value={notificationTitle}
          onChangeText={setNotificationTitle}
        />

        <TextInput
          style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Notification Message"
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
            {sending ? 'Sending...' : 'Send to All Users'}
          </Text>
        </TouchableOpacity>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Quick Notifications
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
            📱 Push Notifications Setup
          </Text>
          <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
            To enable push notifications, you need to set up Firebase Cloud Messaging.
            This feature requires additional configuration in your Firebase project.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}