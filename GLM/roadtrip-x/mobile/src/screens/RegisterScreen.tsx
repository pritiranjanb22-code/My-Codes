import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { validateEmail, validatePassword, validatePhone } from '@/utils/helpers';

type Props = RootStackScreenProps<'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message || 'Invalid password';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      navigation.navigate('Main' as any);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Join RoadTrip X</Text>
          <Text style={styles.subtitle}>Create your account to start planning trips</Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              error={errors.name}
              autoCapitalize="words"
              autoComplete="name"
            />
            <Input
              label="Email"
              placeholder="you@example.com"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              label="Phone (Optional)"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Input
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              error={errors.password}
              secureTextEntry
              autoComplete="new-password"
            />
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(value) => handleChange('confirmPassword', value)}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          <Button title="Create Account" onPress={handleSubmit} fullWidth size="lg" />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <Button
              title="Google"
              variant="outline"
              onPress={() => {}}
              leftIcon={<Ionicons name="logo-google" size={20} color={COLORS.text} />}
            />
            <Button
              title="Apple"
              variant="outline"
              onPress={() => {}}
              leftIcon={<Ionicons name="logo-apple" size={20} color={COLORS.text} />}
            />
          </View>

          <TouchableOpacity style={styles.signIn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>{' '}
              and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  content: {
    paddingVertical: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  socialButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  signIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  signInText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  signInLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
    fontWeight: '600',
  },
  terms: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  termsLink: {
    color: COLORS.accent,
    fontWeight: '500',
  },
});