
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Request permission for push notifications (iOS)
 */
export async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }

    return enabled;
  }
  return true; // Android doesn't need explicit permission request
}

/**
 * Get the FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save the FCM token to the user's profile in Supabase
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ fcm_token: token })
      .eq('id', userId);

    if (error) {
      console.error('Error saving FCM token:', error);
    } else {
      console.log('FCM token saved successfully');
    }
  } catch (error) {
    console.error('Error in saveFCMToken:', error);
  }
}

/**
 * Initialize Firebase Cloud Messaging
 */
export async function initializeFCM(userId: string): Promise<void> {
  try {
    // Request permission
    const hasPermission = await requestUserPermission();
    
    if (!hasPermission) {
      console.log('User denied notification permission');
      return;
    }

    // Get FCM token
    const token = await getFCMToken();
    
    if (token && userId) {
      await saveFCMToken(userId, token);
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed:', newToken);
      if (userId) {
        await saveFCMToken(userId, newToken);
      }
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || ''
        );
      }
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
    });

  } catch (error) {
    console.error('Error initializing FCM:', error);
  }
}

/**
 * Handle notification when app is opened from a notification
 */
export async function handleInitialNotification(): Promise<void> {
  const remoteMessage = await messaging().getInitialNotification();
  
  if (remoteMessage) {
    console.log('App opened from notification:', remoteMessage);
    // Handle the notification data here
  }
}

/**
 * Subscribe to a topic
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
  }
}

/**
 * Unsubscribe from a topic
 */
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
  }
}
