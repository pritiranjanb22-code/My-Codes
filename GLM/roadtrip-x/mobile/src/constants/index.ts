export const APP_NAME = 'RoadTrip X';
export const APP_VERSION = '1.0.0';

export const EXPENSE_CATEGORIES = [
  { id: 'fuel', label: 'Fuel', icon: '⛽', color: '#FF6B35' },
  { id: 'toll', label: 'Toll', icon: '🛣', color: '#4ECDC4' },
  { id: 'food', label: 'Food', icon: '🍔', color: '#45B7D1' },
  { id: 'hotel', label: 'Hotel', icon: '🏨', color: '#96CEB4' },
  { id: 'parking', label: 'Parking', icon: '🅿', color: '#FFEAA7' },
  { id: 'tickets', label: 'Tickets', icon: '🎟', color: '#DDA0DD' },
  { id: 'shopping', label: 'Shopping', icon: '🛒', color: '#98D8C8' },
  { id: 'vehicle_repair', label: 'Vehicle Repair', icon: '🔧', color: '#F7DC6F' },
  { id: 'water', label: 'Water', icon: '💧', color: '#85C1E9' },
  { id: 'snacks', label: 'Snacks', icon: '☕', color: '#F8B500' },
  { id: 'other', label: 'Other', icon: '📦', color: '#BDC3C7' },
] as const;

export const EXPENSE_CATEGORY_MAP = EXPENSE_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {} as Record<string, { id: string; label: string; icon: string; color: string }>);

export const VEHICLE_FUEL_TYPES = [
  { id: 'petrol', label: 'Petrol' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'electric', label: 'Electric' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'cng', label: 'CNG' },
] as const;

export const TRIP_ROLES = [
  { id: 'owner', label: 'Owner', permissions: ['all'] },
  { id: 'admin', label: 'Admin', permissions: ['manage_trip', 'manage_members', 'manage_expenses', 'manage_itinerary', 'manage_vehicles', 'invite'] },
  { id: 'member', label: 'Member', permissions: ['add_expense', 'view_trip', 'chat', 'share_location', 'upload_photos', 'create_polls'] },
  { id: 'driver', label: 'Driver', permissions: ['view_trip', 'chat', 'share_location', 'vehicle_location', 'fuel_tracking'] },
  { id: 'viewer', label: 'Viewer', permissions: ['view_trip'] },
] as const;

export const TRIP_STATUS = [
  { id: 'planning', label: 'Planning', color: '#3498DB' },
  { id: 'active', label: 'Active', color: '#2ECC71' },
  { id: 'completed', label: 'Completed', color: '#9B59B6' },
  { id: 'cancelled', label: 'Cancelled', color: '#E74C3C' },
] as const;

export const LOCATION_SHARE_MODES = [
  { id: 'always', label: 'Share Always', description: 'Continuously share location' },
  { id: 'during_trip', label: 'Share During Trip', description: 'Share only when trip is active' },
  { id: 'one_hour', label: 'Share for 1 Hour', description: 'Temporary sharing for 1 hour' },
  { id: 'paused', label: 'Pause Sharing', description: 'Stop sharing location' },
] as const;

export const EMERGENCY_TYPES = [
  { id: 'accident', label: 'Accident', icon: '🚗💥', color: '#E74C3C' },
  { id: 'breakdown', label: 'Vehicle Breakdown', icon: '🔧', color: '#F39C12' },
  { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: '#E74C3C' },
  { id: 'police', label: 'Police', icon: '👮', color: '#3498DB' },
  { id: 'fire', label: 'Fire', icon: '🔥', color: '#E74C3C' },
  { id: 'other', label: 'Other', icon: '⚠️', color: '#95A5A6' },
] as const;

export const SETTLEMENT_STATUS = [
  { id: 'pending', label: 'Pending', color: '#F39C12' },
  { id: 'completed', label: 'Completed', color: '#2ECC71' },
  { id: 'cancelled', label: 'Cancelled', color: '#E74C3C' },
] as const;

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'other', label: 'Other', icon: '💳' },
] as const;

export const VEHICLE_HEALTH_TYPES = [
  { id: 'engine_oil', label: 'Engine Oil', icon: '🛢' },
  { id: 'tyres', label: 'Tyres', icon: '🛞' },
  { id: 'brake', label: 'Brakes', icon: '🛑' },
  { id: 'battery', label: 'Battery', icon: '🔋' },
  { id: 'coolant', label: 'Coolant', icon: '❄️' },
  { id: 'service', label: 'Service', icon: '🔧' },
  { id: 'insurance', label: 'Insurance', icon: '📄' },
  { id: 'puc', label: 'PUC', icon: '🌿' },
] as const;

export const ROAD_TRIP_CHECKLIST = [
  { id: 'tyres', text: 'Tyres', category: 'vehicle' },
  { id: 'spare_tyre', text: 'Spare Tyre', category: 'vehicle' },
  { id: 'jack', text: 'Jack', category: 'vehicle' },
  { id: 'engine_oil', text: 'Engine Oil', category: 'vehicle' },
  { id: 'coolant', text: 'Coolant', category: 'vehicle' },
  { id: 'brakes', text: 'Brakes', category: 'vehicle' },
  { id: 'first_aid', text: 'First Aid Kit', category: 'safety' },
  { id: 'documents', text: 'Documents (License, RC, Insurance)', category: 'documents' },
  { id: 'charging_cable', text: 'Charging Cable', category: 'electronics' },
  { id: 'emergency_kit', text: 'Emergency Kit', category: 'safety' },
  { id: 'water', text: 'Water Bottles', category: 'personal' },
  { id: 'snacks', text: 'Snacks', category: 'personal' },
  { id: 'power_bank', text: 'Power Bank', category: 'electronics' },
  { id: 'camera', text: 'Camera', category: 'electronics' },
  { id: 'torch', text: 'Torch/Flashlight', category: 'safety' },
] as const;

export const NOTIFICATION_TYPES = {
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_UPDATED: 'expense_updated',
  SETTLEMENT_CREATED: 'settlement_created',
  PAYMENT_RECEIVED: 'payment_received',
  YOU_OWE: 'you_owe',
  MEMBER_FAR: 'member_far',
  FUEL_STOP_RECOMMENDED: 'fuel_stop_recommended',
  EMERGENCY_TRIGGERED: 'emergency_triggered',
  BUDGET_ALERT: 'budget_alert',
  POLL_CREATED: 'poll_created',
  TRIP_STARTED: 'trip_started',
  TRIP_ENDED: 'trip_ended',
  DESTINATION_REACHED: 'destination_reached',
  VEHICLE_UPDATED: 'vehicle_updated',
  LOCATION_SHARING_STARTED: 'location_sharing_started',
  LOCATION_SHARING_STOPPED: 'location_sharing_stopped',
} as const;

export const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#e94560',
  accentLight: '#ff6b6b',
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceLight: '#252542',
  text: '#ffffff',
  textSecondary: '#a0a0b0',
  textMuted: '#6b6b80',
  border: '#2d2d44',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db',
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gradientStart: '#1a1a2e',
  gradientEnd: '#16213e',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 250,
  slow: 350,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

export const MAP_PROVIDER = 'google'; // 'google' | 'mapbox' | 'openstreetmap'

export const LOCATION_UPDATE_INTERVAL = {
  normal: 30000, // 30 seconds
  convoy: 10000, // 10 seconds
  stationary: 120000, // 2 minutes
  lowBattery: 60000, // 1 minute
};

export const DISTANCE_THRESHOLDS = {
  groupSeparation: 5000, // 5km
  nearbyMember: 2000, // 2km
  destinationArrival: 1000, // 1km
  fuelStopWarning: 50000, // 50km remaining range
};

export const BUDGET_ALERT_THRESHOLDS = {
  warning: 0.8, // 80%
  critical: 0.95, // 95%
};

export const OFFLINE_SYNC_INTERVAL = 30000; // 30 seconds
export const MAX_OFFLINE_RETRIES = 3;

export const AI_ASSISTANT_NAME = 'RoadTrip AI';

export const DEMO_TRIP = {
  name: 'Bangalore → Mysore → Coorg → Chikmagalur → Bangalore',
  description: 'A scenic road trip through Karnataka',
  startLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Bangalore, Karnataka',
    name: 'Bangalore',
  },
  endLocation: {
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Bangalore, Karnataka',
    name: 'Bangalore',
  },
  startDate: new Date().toISOString(),
  budget: 30000,
  currency: 'INR',
};