import React, { forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../constants';

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address' | 'phone-pad';
  icon?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCompleteType?: string;
  style?: any;
  maxLength?: number;
  autoFocus?: boolean;
  editable?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    icon,
    error,
    disabled,
    multiline,
    numberOfLines,
    leftElement,
    rightElement,
    secureTextEntry,
    autoCapitalize = 'sentences',
    autoCompleteType = 'off',
    style,
    maxLength,
    autoFocus,
    editable = true,
  }, ref) => {
    return (
      <View style={[styles.container, style]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputWrapper, error && styles.inputError, disabled && styles.inputDisabled]}>
          {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
          {icon && <Ionicons name={icon} size={22} color={error ? COLORS.error : COLORS.textLight} style={styles.icon} />}
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLight}
            keyboardType={keyboardType}
            disabled={disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCompleteType={autoCompleteType}
            autoFocus={autoFocus}
            editable={editable}
            maxLength={maxLength}
            textContentType="none"
          />
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

InputField.displayName = 'InputField';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  style?: any;
}

export const Button = ({ title, onPress, variant = 'primary', disabled, loading, fullWidth = true, icon, style }: ButtonProps) => {
  const baseStyle = styles.button;
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline,
    danger: styles.buttonDanger,
    ghost: styles.buttonGhost,
  };
  const textStyles = {
    primary: styles.buttonTextPrimary,
    secondary: styles.buttonTextSecondary,
    outline: styles.buttonTextOutline,
    danger: styles.buttonTextDanger,
    ghost: styles.buttonTextGhost,
  };

  return (
    <TouchableOpacity
      style={[baseStyle, variantStyles[variant], fullWidth && styles.buttonFullWidth, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <View style={styles.spinner} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} style={styles.buttonIcon} />}
          <Text style={textStyles[variant]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  padding?: number;
}

export const Card = ({ children, style, onPress, padding = SPACING.md }: CardProps) => {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      style={[
        styles.card,
        { padding },
        onPress && styles.cardPressable,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {children}
    </Component>
  );
};

export interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export const Badge = ({ text, variant = 'primary', size = 'md', style }: BadgeProps) => {
  const variantColors = {
    primary: { bg: COLORS.primary + '15', text: COLORS.primary },
    success: { bg: COLORS.success + '15', text: COLORS.success },
    warning: { bg: COLORS.warning + '15', text: COLORS.warning },
    danger: { bg: COLORS.error + '15', text: COLORS.error },
    info: { bg: COLORS.info + '15', text: COLORS.info },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 },
    lg: { paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 },
  };

  const colors = variantColors[variant];
  const sizes = sizeStyles[size];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, ...sizes }, style]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{text}</Text>
    </View>
  );
};

export interface AvatarProps {
  source?: { uri: string };
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: any;
}

export const Avatar = ({ source, name, size = 'md', style }: AvatarProps) => {
  const sizeMap = { sm: 32, md: 40, lg: 56, xl: 80 };
  const fontSizeMap = { sm: 12, md: 14, lg: 20, xl: 28 };
  const sizeValue = sizeMap[size];
  const fontSize = fontSizeMap[size];

  if (source?.uri) {
    return (
      <View style={[styles.avatar, { width: sizeValue, height: sizeValue }, style]}>
        <Image source={source} style={styles.avatarImage} resizeMode="cover" />
      </View>
    );
  }

  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View
      style={[
        styles.avatar,
        { width: sizeValue, height: sizeValue, backgroundColor: COLORS.primary },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, marginBottom: SPACING.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    ...SHADOWS.sm,
  },
  inputError: { borderColor: COLORS.error },
  inputDisabled: { backgroundColor: COLORS.background },
  leftElement: { marginRight: SPACING.md },
  rightElement: { marginLeft: SPACING.md },
  icon: { marginRight: SPACING.md },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text, paddingVertical: 0 },
  inputMultiline: { paddingVertical: SPACING.md },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: SPACING.xs, marginLeft: SPACING.xs },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 52,
  },
  buttonFullWidth: { width: '100%' },
  buttonDisabled: { opacity: 0.6 },
  buttonPrimary: { backgroundColor: COLORS.primary, ...SHADOWS.sm },
  buttonSecondary: { backgroundColor: COLORS.secondary },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary },
  buttonDanger: { backgroundColor: COLORS.error },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonTextPrimary: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  buttonTextSecondary: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  buttonTextOutline: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  buttonTextDanger: { color: '#fff', fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  buttonTextGhost: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold },
  buttonIcon: { marginRight: SPACING.xs },
  spinner: { width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent', borderRadius: 10 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardPressable: { ...SHADOWS.sm },
  badge: {
    borderRadius: BORDER_RADIUS.round,
    alignSelf: 'flex-start',
  },
  badgeText: { fontWeight: FONT_WEIGHTS.semiBold },
  avatar: {
    borderRadius: 9999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#fff', fontWeight: FONT_WEIGHTS.bold },
});