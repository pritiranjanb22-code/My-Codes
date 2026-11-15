import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, REGEX } from '../../constants';
import { useAuth } from '../../hooks/useApi';
import { useAuthStore } from '../../store';
import { InputField, Button } from '../../components/common';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useOtp, setUseOtp] = useState(true);
  const { register, isLoading, error } = useAuth();
  const { setLoading } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    if (!name.trim() || !phone || !REGEX.PHONE.test(phone)) {
      return;
    }
    
    if (useOtp && !password) {
      return;
    }
    
    if (!useOtp && (!password || password.length < 6)) {
      return;
    }
    
    setLoading(true);
    try {
      await register(phone, name, email || undefined);
      navigation.navigate('VerifyOtp', { phone, purpose: 'register', name, email: email || undefined });
    } finally {
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Fresh Mart Grocery today</Text>
        </View>

        <View style={styles.form}>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            icon="account"
            autoCapitalize="words"
            autoCompleteType="name"
            error={!name.trim() && error ? 'Name is required' : undefined}
          />

          <InputField
            label="Mobile Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            icon="call"
            autoCompleteType="tel"
            error={phone && !REGEX.PHONE.test(phone) ? 'Enter valid 10-digit mobile number' : undefined}
          />

          <InputField
            label="Email (Optional)"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon="mail"
            autoCompleteType="email"
            autoCapitalize="none"
            error={email && !REGEX.EMAIL.test(email) ? 'Enter valid email address' : undefined}
          />

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setUseOtp(!useOtp)}
          >
            <Text style={[styles.toggleText, useOtp && styles.toggleTextActive]}>Login with OTP</Text>
            <Text style={[styles.toggleText, !useOtp && styles.toggleTextActive]}>Set Password</Text>
          </TouchableOpacity>

          <InputField
            label={useOtp ? 'OTP' : 'Password'}
            value={password}
            onChangeText={setPassword}
            placeholder={useOtp ? 'Enter 6-digit OTP' : 'Create a password (min 6 characters)'}
            keyboardType={useOtp ? 'numeric' : 'default'}
            secureTextEntry={!useOtp}
            icon={useOtp ? 'lock-outline' : 'lock-closed'}
            error={useOtp && password && password.length !== 6 ? 'Enter 6-digit OTP' : !useOtp && password && password.length < 6 ? 'Password must be at least 6 characters' : undefined}
          />
        </View>

        <View style={styles.buttonSection}>
          <Button
            title={useOtp ? 'Send OTP & Register' : 'Register with Password'}
            onPress={handleRegister}
            loading={isLoading}
            fullWidth
            disabled={!name.trim() || !phone || !REGEX.PHONE.test(phone) || (useOtp && (!password || password.length !== 6)) || (!useOtp && (!password || password.length < 6))}
          />
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
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
  buttonSection: {
    marginTop: SPACING.lg,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});