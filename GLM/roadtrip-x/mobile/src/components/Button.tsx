import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: COLORS.accent,
  },
  secondary: {
    backgroundColor: COLORS.surfaceLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
  },
};

const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.sm,
  },
  md: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZES.md,
  },
  lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    fontSize: FONT_SIZES.lg,
  },
};

const variantTextColors: Record<string, string> = {
  primary: COLORS.white,
  secondary: COLORS.text,
  outline: COLORS.accent,
  ghost: COLORS.accent,
  danger: COLORS.white,
};

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      style,
      textStyle,
    },
    ref
  ) => {
    const sizeStyle = sizeStyles[size];
    const vStyle = variantStyles[variant];
    const textColor = variantTextColors[variant];

    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.container,
          vStyle,
          {
            paddingVertical: sizeStyle.paddingVertical,
            paddingHorizontal: sizeStyle.paddingHorizontal,
            ...(fullWidth ? { width: '100%' } : {}),
            ...(disabled || loading ? { opacity: 0.6 } : {}),
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading ? (
          <LoadingSpinner size={sizeStyle.fontSize + 4} color={textColor} />
        ) : (
          <React.Fragment>
            {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
            <Text
              style={[
                styles.text,
                { color: textColor, fontSize: sizeStyle.fontSize, fontWeight: FONT_WEIGHTS.semibold },
                textStyle,
              ]}
            >
              {title}
            </Text>
            {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
          </React.Fragment>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const LoadingSpinner = ({ size, color }: { size: number; color: string }) => {
  return (
    <React.Fragment>
      <Text style={{ fontSize: size, color }}>⏳</Text>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.small,
  },
  text: {
    textAlign: 'center',
  },
});

export default Button;