import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, REGEX } from '../../constants';
import { useAuth } from '../../hooks/useApi';
import { InputField, Button } from '../../components/common';
import { useNavigation } from '@react-navigation/native';

export default function ForgotPasswordScreen() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { forgotPassword, isLoading, error } = useAuth();
  const navigation = useNavigation<any>();

  const handleSendOtp = async () => {
    if (!phone || !REGEX.PHONE.test(phone)) {
      return;
    }
    
    try {
      await forgotPassword(phone);
      setOtpSent(true);
    } catch (err) {
      // Error handled by hook
    }
  };

  if (!otpSent) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>Enter your mobile number to receive a reset OTP</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Mobile Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your registered mobile number"
              keyboardType="phone-pad"
              icon="call"
              autoCompleteType="tel"
              error={error?.message}
            />
          </View>

          <View style={styles.buttonSection}>
            <Button
              title="Send OTP"
              onPress={handleSendOtp}
              loading={isLoading}
              fullWidth
              disabled={!phone || !REGEX.PHONE.test(phone)}
            />
          </View>

          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // OTP sent - navigate to VerifyOtp with forgot_password purpose
  React.useEffect(() => {
    navigation.navigate('VerifyOtp', { phone, purpose: 'forgot_password' });
  }, []);

  return null;
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
    marginBottom: SPACING.xl,
  },
  buttonSection: {
    gap: SPACING.md,
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