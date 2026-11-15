import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../constants';
import { useAuthStore } from '../store';
import { Button } from '../components/common/Button';
import { useNavigation } from '@react-navigation/native';

const onboardingData = [
  {
    id: 1,
    title: 'Fresh Groceries at Your Doorstep',
    description: 'Order fresh fruits, vegetables, dairy, and pantry staples from your local grocery store.',
    illustration: '🛒',
  },
  {
    id: 2,
    title: 'Easy & Secure Payment',
    description: 'Pay via UPI with manual verification. Your payments are safe and secure.',
    illustration: '💳',
  },
  {
    id: 3,
    title: 'Real-time Order Tracking',
    description: 'Track your order from confirmation to delivery with live status updates.',
    illustration: '📦',
  },
];

export default function OnboardingScreen() {
  const { setLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleGetStarted = () => {
    setLoading(false);
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingData.map((item) => (
          <View key={item.id} style={styles.slide}>
            <View style={styles.illustrationContainer}>
              <Text style={styles.illustration}>{item.illustration}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.bottomSection}>
        <Button title="Get Started" onPress={handleGetStarted} variant="primary" fullWidth />
        <Text style={styles.skipText}>Fresh Mart Grocery - Your neighborhood store, now online</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    minHeight: '100%',
  },
  slide: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  illustration: {
    fontSize: 80,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  bottomSection: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skipText: {
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});