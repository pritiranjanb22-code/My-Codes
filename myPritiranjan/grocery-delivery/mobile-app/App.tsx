import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast } from 'react-native-toast-message';
import { AppNavigator } from './navigation/AppNavigator';
import { useAuthStore } from './store';
import { initializeApp } from './utils/initializeApp';

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  React.useEffect(() => {
    initializeApp();
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.primary} />
          <SplashScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
        <AppNavigator />
        <Toast
          position="bottom"
          visibilityTime={3000}
          autoHide
          topOffset={30}
          bottomOffset={100}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const SplashScreen = () => (
  <React.Fragment>
    <View style={styles.splashContainer}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🛒</Text>
      </View>
      <Text style={styles.appName}>Fresh Mart Grocery</Text>
      <Text style={styles.tagline}>Fresh groceries delivered to your door</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
    </View>
  </React.Fragment>
);

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from './constants';