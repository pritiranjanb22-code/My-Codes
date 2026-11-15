import React from 'react';
import { Image, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '@/constants';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  shape?: 'circle' | 'square';
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const sizeMap: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
};

const fontSizeMap: Record<string, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

export const Avatar = ({
  source,
  name,
  size = 'md',
  shape = 'circle',
  backgroundColor,
  textColor = COLORS.white,
  style,
  textStyle,
  onPress,
}: AvatarProps) => {
  const sizeValue = typeof size === 'number' ? size : sizeMap[size] || sizeMap.md;
  const fontSize = typeof size === 'number' ? size * 0.35 : fontSizeMap[size] || fontSizeMap.md;
  const borderRadius = shape === 'circle' ? sizeValue / 2 : BORDER_RADIUS.md;

  const bgColor = backgroundColor || getColorFromName(name || '');

  const avatarStyle: ViewStyle = [
    styles.container,
    { width: sizeValue, height: sizeValue, borderRadius },
    { backgroundColor: bgColor },
    style,
  ];

  const textStyleFinal: TextStyle = [
    styles.text,
    { fontSize, color: textColor },
    textStyle,
  ];

  const renderAvatar = () => {
    if (source) {
      if (typeof source === 'number') {
        return <Image source={source} style={[styles.image, { width: sizeValue, height: sizeValue, borderRadius }]} />;
      }
      return <Image source={source} style={[styles.image, { width: sizeValue, height: sizeValue, borderRadius }]} />;
    }

    if (name) {
      const initials = getInitials(name);
      return <Text style={textStyleFinal}>{initials}</Text>;
    }

    return <Text style={textStyleFinal}>?</Text>;
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={avatarStyle}>
        {renderAvatar()}
      </TouchableOpacity>
    );
  }

  return <View style={avatarStyle}>{renderAvatar()}</View>;
};

import { TouchableOpacity } from 'react-native';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    '#E74C3C', '#E67E22', '#F39C12', '#2ECC71',
    '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
    '#00BCD4', '#FF5722', '#795548', '#607D8B',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  text: {
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default Avatar;