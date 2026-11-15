import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants';
import { useAuth } from '../../hooks/useApi';
import { useAuthStore } from '../../store';
import { InputField, Button } from '../../components/common';
import { useNavigation, useRoute } from '@react-navigation/native';

type VerifyOtpRouteParams = {
  phone: string;
  purpose: 'login' | 'register' | 'forgot_password';
  name?: string;
  email?: string;
};

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const { verifyOtp, isLoading, error } = useAuth();
  const { setLoading } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<{ params: VerifyOtpRouteParams }>();
  const { phone, purpose, name, email } = route.params;

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTimer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      // Focus next input would require refs
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;
    
    setLoading(true);
    try {
      await verifyOtp(phone, otpCode, purpose, name, email);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      // Resend OTP via API
      // This would call the sendOtp API
      setResendTimer(60);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to <Text style={{ fontWeight: FONT_WEIGHTS.semiBold }}>{formatPhone(phone)}</Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : styles.otpBoxEmpty,
                error && styles.otpBoxError,
              ]}
              onPress={() => {}}
            >
              <Text style={[
                styles.otpText,
                digit ? styles.otpTextFilled : styles.otpTextEmpty,
              ]}>
                {digit || '•'}
              </Text>
              <InputField
                style={styles.hiddenInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                maxLength={1}
                keyboardType="numeric"
                autoFocus={index === 0}
                editable={false}
              />
            </TouchableOpacity>
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>{error.message}</Text>
        )}

        <View style={styles.buttonSection}>
          <Button
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isLoading}
            fullWidth
            disabled={otp.join('').length !== 6}
          />
          
          <TouchableOpacity style={styles.resendContainer} onPress={handleResend} disabled={resendTimer > 0}>
            <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Didn't receive OTP? Resend"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Need help? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Contact Support</Text>
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
    flexGrow: 1,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  otpBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  otpBoxEmpty: {
    borderColor: COLORS.border,
  },
  otpBoxError: {
    borderColor: COLORS.error,
  },
  otpText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  otpTextFilled: {
    color: COLORS.primary,
  },
  otpTextEmpty: {
    color: COLORS.textLight,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  errorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  buttonSection: {
    gap: SPACING.md,
  },
  resendContainer: {
    paddingVertical: SPACING.md,
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: COLORS.textLight,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semiBold,
  },
});