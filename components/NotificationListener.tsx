
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from '../services/notificationService';

export function NotificationListener() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
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
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  return null;
}
