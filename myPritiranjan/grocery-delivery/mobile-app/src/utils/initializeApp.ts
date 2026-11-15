import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store';
import { api } from '../services/api';
import { STORAGE_KEYS } from '../constants';
import { registerForPushNotifications, setupNotificationHandlers } from '../services/pushNotifications';

export const initializeApp = async () => {
  try {
    // Check for stored auth tokens
    const [accessToken, refreshToken, userData] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA),
    ]);

    if (accessToken && refreshToken && userData) {
      try {
        const user = JSON.parse(userData);
        
        // Verify token is still valid by making a test request
        api.client.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        const response = await api.getProfile();
        
        useAuthStore.getState().setAuth(response, { accessToken, refreshToken });
        
        // Register for push notifications after successful auth
        await registerForPushNotifications();
        
        // Setup notification handlers
        setupNotificationHandlers();
      } catch (error) {
        // Token expired or invalid, try to refresh
        try {
          const tokens = await api.refreshToken(refreshToken);
          api.client.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
          
          const response = await api.getProfile();
          useAuthStore.getState().setAuth(response, tokens);
          
          // Register for push notifications after successful refresh
          await registerForPushNotifications();
          setupNotificationHandlers();
        } catch (refreshError) {
          // Refresh failed, clear auth
          await clearAuth();
        }
      }
    } else {
      useAuthStore.getState().setLoading(false);
    }
  } catch (error) {
    console.error('App initialization error:', error);
    useAuthStore.getState().setLoading(false);
  }
};

export const clearAuth = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
    SecureStore.deleteItemAsync(STORAGE_KEYS.FCM_TOKEN),
  ]);
  useAuthStore.getState().clearAuth();
};