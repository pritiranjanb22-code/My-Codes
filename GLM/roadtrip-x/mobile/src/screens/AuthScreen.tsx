import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackScreenProps } from '@/navigation/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { apiService } from '@/services/api';
import { validateEmail, validatePassword } from '@/utils/helpers';

type Props = RootStackScreenProps<'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const { setAuthenticated, setUser, setToken, setAuthLoading } = useAppStore();

  const handleAuth = async () => {
    setAuthLoading(true);
    try {
      // Demo mode - bypass API
      const demoUser = {
        id: 'demo-user-1',
        email: 'demo@roadtripx.com',
        name: 'Demo User',
        avatar: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const demoToken = 'demo-token-123';
      
      setUser(demoUser);
      setToken(demoToken);
      setAuthenticated(true);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="car-sport" size={64} color={COLORS.accent} />
          </View>
          <Text style={styles.appName}>RoadTrip X</Text>
          <Text style={styles.tagline}>Your Ultimate Group Road Trip Companion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onChangeText={validateEmail}
            />
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              onChangeText={validatePassword}
            />
            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={isLogin ? 'Sign In' : 'Create Account'}
            onPress={handleAuth}
            fullWidth
            size="lg"
            loading={false}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Continue with Google"
            variant="outline"
            onPress={handleAuth}
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="logo-google" size={20} color={COLORS.text} />}
          />

          <Button
            title="Continue with Apple"
            variant="outline"
            onPress={handleAuth}
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="logo-apple" size={20} color={COLORS.text} />}
          />

          <TouchableOpacity style={styles.switchAuth} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchAuthText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchAuthLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>🚀 Demo Mode - Tap any button to continue</Text>
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
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  appName: {
    fontSize: FONT_SIZES.display,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
    marginTop: SPACING.xs,
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
  switchAuth: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  switchAuthText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  switchAuthLink: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  demoBanner: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
  },
  demoBannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
  },
});