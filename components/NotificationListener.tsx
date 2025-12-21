
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../services/notificationService';
import { initializeFCM, handleInitialNotification } from '../services/firebaseNotificationService';
import { useAuth } from '../contexts/AuthContext';

export function NotificationListener() {
  const router = useRouter();
  const { user } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize Firebase Cloud Messaging
    if (user?.id) {
      initializeFCM(user.id);
      handleInitialNotification();
    }

    // Listen for notifications received while app is foregrounded (Expo)
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Expo notification received:', notification);
    });

    // Listen for user interactions with notifications (Expo)
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Expo notification response:', response);
      
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    });

    // Listen for Firebase notification taps when app is in background
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Firebase notification opened app from background:', remoteMessage);
      if (remoteMessage.data) {
        handleNotificationNavigation(remoteMessage.data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      unsubscribeOnNotificationOpenedApp();
    };
  }, [router, user]);

  const handleNotificationNavigation = (data: any) => {
    // Handle different notification types
    if (data.type === 'spin_wheel') {
      router.push('/(customer)/fidelity');
    } else if (data.type === 'appointment') {
      router.push('/(customer)/bookings');
    } else if (data.type === 'order') {
      router.push('/(customer)/order-history');
    } else if (data.type === 'product') {
      router.push('/(customer)/products');
    }
  };

  return null;
}
