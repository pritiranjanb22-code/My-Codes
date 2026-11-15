import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';
import { useAuthStore } from '../store';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with your Expo project ID
    })).data;

    // Save token to backend
    await api.post('/customer/profile', { fcmToken: token });
    
    // Store locally
    await useAuthStore.getState().updateUser({ fcmToken: token });
    
    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export function setupNotificationHandlers() {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    // Update unread count in store
    useAuthStore.getState().setUnreadCount(
      useAuthStore.getState().unreadCount + 1
    );
    
    // Optionally show in-app banner
    // showInAppNotification(notification);
  });

  // Handle user tapping notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    
    // Navigate based on notification type
    handleNotificationNavigation(data);
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

function handleNotificationNavigation(data: any) {
  // This would need access to navigation - use a global navigation ref
  // For now, store the pending navigation
  if (data?.screen) {
    // Store in a global state or use a navigation ref
    console.log('Navigate to:', data.screen, data.params);
  }
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Immediate
  });
}

export async function scheduleOrderNotification(orderId: string, status: string) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    payment_verification_pending: {
      title: 'Payment Verification Pending',
      body: `Your payment for order #${orderId} is being verified.`,
    },
    payment_confirmed: {
      title: 'Payment Confirmed',
      body: `Payment for order #${orderId} confirmed. Order is being prepared.`,
    },
    payment_rejected: {
      title: 'Payment Rejected',
      body: `Payment for order #${orderId} was rejected. Please try again.`,
    },
    confirmed: {
      title: 'Order Confirmed',
      body: `Your order #${orderId} has been confirmed and is being prepared.`,
    },
    preparing: {
      title: 'Order Being Prepared',
      body: `Your order #${orderId} is being prepared for delivery.`,
    },
    ready_for_delivery: {
      title: 'Ready for Delivery',
      body: `Your order #${orderId} is ready and will be delivered soon.`,
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      body: `Your order #${orderId} is out for delivery!`,
    },
    delivered: {
      title: 'Order Delivered',
      body: `Your order #${orderId} has been delivered. Thank you!`,
    },
    cancelled: {
      title: 'Order Cancelled',
      body: `Your order #${orderId} has been cancelled.`,
    },
  };

  const message = statusMessages[status];
  if (message) {
    await sendLocalNotification(message.title, message.body, { orderId, status });
  }
}

// Android channel configuration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22c55e',
    sound: 'default',
  });

  Notifications.setNotificationChannelAsync('order-updates', {
    name: 'Order Updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#22c550',
    sound: 'default',
  });

  Notifications.setNotificationChannelAsync('promotions', {
    name: 'Promotions',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#f59e0b',
    sound: 'default',
  });
}

export const notificationService = {
  registerForPushNotifications,
  setupNotificationHandlers,
  sendLocalNotification,
  scheduleOrderNotification,
};