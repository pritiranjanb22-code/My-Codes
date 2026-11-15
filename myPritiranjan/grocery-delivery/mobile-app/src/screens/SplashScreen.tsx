import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { COLORS, SPACING } from '../constants';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>🛒</Text>
      </View>
      <Text style={styles.appName}>Fresh Mart Grocery</Text>
      <Text style={styles.tagline}>Fresh groceries delivered to your door</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: SPACING.xl,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});