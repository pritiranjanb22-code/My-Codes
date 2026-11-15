import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Props = RootStackScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Enter your credentials to continue</Text>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button title="Sign In" onPress={() => navigation.navigate('Main' as any)} fullWidth size="lg" />

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

        <TouchableOpacity style={styles.signUp}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <Text style={styles.signUpLink} onPress={() => navigation.navigate('Register')}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
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
  signUp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
    fontWeight: '600',
  },
});