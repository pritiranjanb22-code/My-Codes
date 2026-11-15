import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { AppRegistry } from 'expo';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFinanceStore } from '@/store';
import { AppNavigator } from '@/navigation/AppNavigator';
import { initDatabase, getDatabase } from '@/db';

if (Platform.OS !== 'web') {
  require('react-native-gesture-handler');
}

export default function App() {
  const initialize = useFinanceStore((state) => state.initialize);
  const isInitialized = useFinanceStore((state) => state.isInitialized);
  const isLoading = useFinanceStore((state) => state.isLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized || isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <View style={styles.loadingContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            <Text style={styles.loadingTitle}>Finance Manager</Text>
            <Text style={styles.loadingSubtitle}>Loading your finances...</Text>
            <View style={styles.spinner} />
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  spinner: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    borderTopColor: '#1A1A2E',
    borderRadius: 16,
    marginTop: 16,
  },
});

import { View, Text, StyleSheet, StatusBar } from 'react-native';