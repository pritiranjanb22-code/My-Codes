export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  ownerId: string;
  budget?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  role: 'owner' | 'admin' | 'member' | 'driver' | 'viewer';
  vehicleId?: string;
  joinedAt: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Vehicle {
  id: string;
  tripId: string;
  name: string;
  registrationNumber: string;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  tankCapacity: number;
  currentMileage: number;
  driverId: string;
  passengerIds: string[];
  fuelLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleMember {
  id: string;
  vehicleId: string;
  userId: string;
  user: User;
  isDriver: boolean;
}

export interface ItineraryStop {
  id: string;
  tripId: string;
  order: number;
  name: string;
  location: LocationPoint;
  arrivalTime?: string;
  departureTime?: string;
  duration?: number;
  notes?: string;
  photos: string[];
  expenses: string[];
  activities: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  paidBy: string;
  paidByUser: User;
  participants: ExpenseParticipant[];
  splitType: 'equal' | 'exact' | 'percentage' | 'shares' | 'custom';
  receiptUrl?: string;
  receiptOcrData?: ReceiptOcrData;
  vehicleId?: string;
  stopId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  userId: string;
  user: User;
  amount: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'other';
  paymentReference?: string;
  paymentScreenshot?: string;
}

export type ExpenseCategory = 
  | 'fuel' 
  | 'toll' 
  | 'food' 
  | 'hotel' 
  | 'parking' 
  | 'tickets' 
  | 'shopping' 
  | 'vehicle_repair' 
  | 'water' 
  | 'snacks' 
  | 'other';

export interface ReceiptOcrData {
  merchant: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  confidence: number;
}

export interface Settlement {
  id: string;
  tripId: string;
  fromUserId: string;
  fromUser: User;
  toUserId: string;
  toUser: User;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'other';
  paymentReference?: string;
  paymentScreenshot?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  tripId: string;
  totalContributed: number;
  spent: number;
  remaining: number;
  currency: string;
  transactions: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  user: User;
  type: 'contribution' | 'expense' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export interface FuelEntry {
  id: string;
  tripId: string;
  vehicleId: string;
  vehicle: Vehicle;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
  amount: number;
  litres: number;
  pricePerLitre: number;
  odometer: number;
  mileage: number;
  paidBy: string;
  paidByUser: User;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TollEntry {
  id: string;
  tripId: string;
  vehicleId: string;
  vehicle: Vehicle;
  amount: number;
  location: LocationPoint;
  name: string;
  paidBy: string;
  paidByUser: User;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  tripId: string;
  name: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  isCompleted: boolean;
  completedBy?: string;
  completedByUser?: User;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  type: 'text' | 'image' | 'voice' | 'location' | 'expense' | 'poll' | 'system';
  content: string;
  mediaUrl?: string;
  voiceDuration?: number;
  location?: LocationPoint;
  expenseId?: string;
  pollId?: string;
  replyToId?: string;
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Poll {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  question: string;
  options: PollOption[];
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  votes: number;
  voterIds: string[];
}

export interface PollVote {
  id: string;
  pollId: string;
  userId: string;
  optionId: string;
  createdAt: string;
}

export interface Media {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  location?: LocationPoint;
  stopId?: string;
  day: number;
  createdAt: string;
}

export interface EmergencyEvent {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  type: 'accident' | 'breakdown' | 'medical' | 'police' | 'fire' | 'other';
  location: LocationPoint;
  description?: string;
  status: 'active' | 'resolved' | 'cancelled';
  notifiedMembers: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  tripId?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  type: 'location' | 'expense' | 'photo' | 'stop' | 'chat' | 'fuel' | 'toll' | 'emergency' | 'member_join' | 'member_leave' | 'vehicle_update';
  title: string;
  description?: string;
  userId?: string;
  user?: User;
  location?: LocationPoint;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Budget {
  id: string;
  tripId: string;
  totalBudget: number;
  perPersonBudget?: number;
  currency: string;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocationSession {
  id: string;
  tripId: string;
  userId: string;
  user: User;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  batteryLevel?: number;
  isSharing: boolean;
  shareMode: 'always' | 'during_trip' | 'one_hour' | 'paused';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface TripState {
  currentTrip: Trip | null;
  trips: Trip[];
  members: TripMember[];
  vehicles: Vehicle[];
  itinerary: ItineraryStop[];
  expenses: Expense[];
  settlements: Settlement[];
  wallet: Wallet | null;
  fuelEntries: FuelEntry[];
  tollEntries: TollEntry[];
  checklists: Checklist[];
  messages: Message[];
  polls: Poll[];
  media: Media[];
  emergencyEvents: EmergencyEvent[];
  notifications: Notification[];
  timeline: TripEvent[];
  budget: Budget | null;
  locationSessions: LocationSession[];
  isLoading: boolean;
  error: string | null;
}

export interface LocationState {
  currentLocation: LocationPoint | null;
  isSharing: boolean;
  shareMode: 'always' | 'during_trip' | 'one_hour' | 'paused';
  nearbyMembers: LocationSession[];
  convoyMode: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: string[];
  unreadCount: number;
}

export interface ExpenseState {
  expenses: Expense[];
  settlements: Settlement[];
  wallet: Wallet | null;
  budget: Budget | null;
  categories: { category: ExpenseCategory; total: number }[];
  balances: { userId: string; user: User; balance: number }[];
  optimizedSettlements: Settlement[];
  isLoading: boolean;
  error: string | null;
}

export interface VehicleHealthItem {
  id: string;
  vehicleId: string;
  type: 'engine_oil' | 'tyres' | 'brake' | 'battery' | 'coolant' | 'service' | 'insurance' | 'puc';
  status: 'good' | 'warning' | 'critical' | 'unknown';
  lastChecked?: string;
  nextDue?: string;
  notes?: string;
}

export interface TripChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  category: 'documents' | 'safety' | 'vehicle' | 'personal' | 'electronics' | 'other';
}

export interface SOSState {
  isActive: boolean;
  activatedAt?: string;
  location?: LocationPoint;
  notifiedContacts: string[];
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tripContext?: TripContext;
}

export interface TripContext {
  tripId: string;
  currentLocation?: LocationPoint;
  remainingBudget?: number;
  participants?: User[];
  vehicles?: Vehicle[];
  itinerary?: ItineraryStop[];
  expenses?: Expense[];
}

export interface SmartSuggestion {
  id: string;
  type: 'fuel' | 'food' | 'restroom' | 'hotel' | 'viewpoint' | 'mechanic' | 'emergency';
  title: string;
  description: string;
  location: LocationPoint;
  distance: number;
  rating?: number;
  priceLevel?: number;
  isAddedToItinerary: boolean;
}

export interface TripRecap {
  trip: Trip;
  distance: number;
  duration: number;
  totalExpenses: number;
  categoryBreakdown: { category: ExpenseCategory; amount: number }[];
  participants: number;
  photosCount: number;
  fuelCost: number;
  tollCost: number;
  foodCost: number;
  hotelCost: number;
  createdAt: string;
}

export interface MapFilters {
  showMembers: boolean;
  showVehicles: boolean;
  showRoute: boolean;
  showStops: boolean;
  showFuelStations: boolean;
  showRestaurants: boolean;
  showHotels: boolean;
  showEmergency: boolean;
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: string;
  synced: boolean;
  retries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
  pendingChanges: number;
  failedChanges: number;
}