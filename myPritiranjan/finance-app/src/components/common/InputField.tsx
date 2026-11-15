import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'email-address';
  icon?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  secureTextEntry?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, value, onChangeText, placeholder, keyboardType = 'default', icon, error, disabled, multiline, numberOfLines, leftElement, rightElement, secureTextEntry }, ref) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={[styles.inputWrapper, error && styles.inputError, disabled && styles.inputDisabled]}>
          {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
          {icon && <Ionicons name={icon} size={22} color="#888" style={styles.icon} />}
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.inputMultiline]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#999"
            keyboardType={keyboardType}
            disabled={disabled}
            multiline={multiline}
            numberOfLines={numberOfLines}
            secureTextEntry={secureTextEntry}
            autoCapitalize="sentences"
            autoCompleteType="off"
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

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
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
  };
  const textStyles = {
    primary: styles.buttonTextPrimary,
    secondary: styles.buttonTextSecondary,
    outline: styles.buttonTextOutline,
    danger: styles.buttonTextDanger,
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

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  padding?: number;
}

export const Card = ({ children, style, onPress, padding = 16 }: CardProps) => {
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

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}

export const Modal = ({ visible, onClose, title, children, fullScreen = false }: ModalProps) => {
  if (!visible) return null;

  return (
    <View style={[styles.modalOverlay, fullScreen && styles.modalFullScreen]} activeOpacity={1}>
      <View style={[styles.modalContainer, fullScreen && styles.modalFullScreenContainer]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={28} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>{children}</View>
      </View>
    </View>
  );
};

interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const SelectField = ({ label, value, options, onChange, placeholder, error, disabled, renderOption }: SelectFieldProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.selectWrapper, error && styles.inputError, disabled && styles.inputDisabled]}
        onPress={disabled ? undefined : () => {}}
        disabled={disabled}
      >
        <View style={styles.selectContent}>
          {renderOption && value ? (
            renderOption(options.find((o) => o.value === value) || { value, label: value }))
          ) : (
            <>
              <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value ? options.find((o) => o.value === value)?.label : placeholder}</Text>
              <Ionicons name="chevron-down" size={22} color="#888" />
            </>
          )}
        </View>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputError: { borderColor: '#FF6B6B' },
  inputDisabled: { backgroundColor: '#F5F5F5' },
  leftElement: { marginRight: 10 },
  rightElement: { marginLeft: 10 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1A1A2E', paddingVertical: 0 },
  inputMultiline: { paddingVertical: 10 },
  errorText: { fontSize: 12, color: '#FF6B6B', marginTop: 4, marginLeft: 2 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
  },
  buttonFullWidth: { width: '100%' },
  buttonDisabled: { opacity: 0.6 },
  buttonPrimary: { backgroundColor: '#1A1A2E' },
  buttonSecondary: { backgroundColor: '#6C63FF' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1A1A2E' },
  buttonDanger: { backgroundColor: '#FF6B6B' },
  buttonTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextOutline: { color: '#1A1A2E', fontSize: 16, fontWeight: '600' },
  buttonTextDanger: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonIcon: { marginRight: 8 },
  spinner: { width: 20, height: 20, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent', borderRadius: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardPressable: { transition: 'transform 0.1s' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalFullScreen: { justifyContent: 'center' },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
  },
  modalFullScreenContainer: {
    borderRadius: 0,
    height: '100%',
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A2E' },
  modalClose: { padding: 4 },
  modalContent: { padding: 20 },
  selectWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    minHeight: 52,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { fontSize: 16, color: '#1A1A2E', flex: 1 },
  selectPlaceholder: { color: '#999' },
});