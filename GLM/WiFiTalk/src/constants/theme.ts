import { Platform, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  round: 9999,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  overline: { fontSize: 10, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 1.5 },
  button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.5 },
};

export const colors = {
  primary: '#00A884',
  primaryDark: '#008972',
  primaryLight: '#E0F2F1',
  secondary: '#128C7E',
  accent: '#FF6B35',
  
  surface: '#FFFFFF',
  background: '#F0F2F5',
  backgroundDark: '#111B21',
  surfaceDark: '#1F2C34',
  
  textPrimary: '#111B21',
  textSecondary: '#667781',
  textTertiary: '#8696A0',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#E9EDEF',
  
  border: '#E9EDEF',
  borderDark: '#3A4A52',
  divider: '#E9EDEF',
  
  success: '#00A884',
  warning: '#FF9800',
  error: '#D32F2F',
  info: '#2196F3',
  
  online: '#00A884',
  offline: '#8696A0',
  busy: '#FF9800',
  away: '#FF9800',
  
  incoming: '#E5F6F3',
  outgoing: '#00A884',
  outgoingText: '#FFFFFF',
  
  voiceActive: '#D32F2F',
  voiceInactive: '#00A884',
};

export const zIndex = {
  modal: 1000,
  toast: 900,
  dropdown: 800,
  header: 700,
  fab: 600,
  bottomSheet: 500,
};