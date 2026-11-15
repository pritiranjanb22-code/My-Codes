import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  elevated: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  filled: {
    backgroundColor: COLORS.surfaceLight,
  },
};

const paddingStyles: Record<string, number> = {
  none: 0,
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

export const Card = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
}: CardProps) => {
  const vStyle = variantStyles[variant];
  const p = paddingStyles[padding];

  const containerStyle: ViewStyle = [
    styles.container,
    vStyle,
    { borderRadius: BORDER_RADIUS.lg },
    p > 0 ? { padding: p } : {},
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={containerStyle}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

import { TouchableOpacity } from 'react-native';

export const CardHeader = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.header, style]}>{children}</View>
);

export const CardContent = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.content, style]}>{children}</View>
);

export const CardFooter = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.footer, style]}>{children}</View>
);

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  content: {},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default Card;