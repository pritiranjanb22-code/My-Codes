import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, REGEX } from '../../constants';
import { useAuth } from '../../hooks/useApi';
import { useAuthStore } from '../../store';
import { InputField, Button } from '../../components/common';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [useOtp, setUseOtp] = useState(false);
  const { login, isLoading, error } = useAuth();
  const { setLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!phone || !REGEX.PHONE.test(phone)) {
      return; // Validation handled by InputField
    }
    
    if (useOtp && !password) {
      return;
    }
    
    if (!useOtp && (!password || password.length < 6)) {
      return;
    }
    
    setLoading(true);
    try {
      await login(phone, useOtp ? undefined : password, useOtp ? password : undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || !REGEX.PHONE.test(phone)) {
      return;
    }
    
    setLoading(true);
    try {
      await login(phone, undefined, ''); // This will trigger OTP send
      setUseOtp(true);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your Fresh Mart account</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Mobile Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            icon="call"
            error={error?.message}
            autoCompleteType="tel"
          />

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setUseOtp(!useOtp)}
          >
            <Text style={[styles.toggleText, useOtp && styles.toggleTextActive]}>Login with Password</Text>
            <Text style={[styles.toggleText, !useOtp && styles.toggleTextActive]}>Login with OTP</Text>
          </TouchableOpacity>

          <InputField
            label={useOtp ? 'OTP' : 'Password'}
            value={password}
            onChangeText={setPassword}
            placeholder={useOtp ? 'Enter 6-digit OTP' : 'Enter your password'}
            keyboardType={useOtp ? 'numeric' : 'default'}
            secureTextEntry={!useOtp}
            icon={useOtp ? 'lock-outline' : 'lock-closed'}
            error={useOtp && password && password.length !== 6 ? 'Enter 6-digit OTP' : undefined}
          />

          {!useOtp && (
            <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonSection}>
          <Button
            title={useOtp ? 'Verify OTP' : 'Login'}
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            disabled={!phone || !REGEX.PHONE.test(phone) || (useOtp && (!password || password.length !== 6)) || (!useOtp && !password)}
          />
          
          {useOtp && (
            <Button
              title="Resend OTP"
              variant="outline"
              onPress={handleSendOtp}
              loading={isLoading}
              fullWidth
              style={{ marginTop: SPACING.md }}
            />
          )}
        </View>

        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    gap: SPACING.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  toggleText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  buttonSection: {
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  registerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});