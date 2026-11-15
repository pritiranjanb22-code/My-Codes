import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Trip,
  TripMember,
  Vehicle,
  ItineraryStop,
  Expense,
  Settlement,
  Wallet,
  FuelEntry,
  TollEntry,
  Checklist,
  Message,
  Poll,
  Media,
  EmergencyEvent,
  Notification,
  TripEvent,
  Budget,
  LocationSession,
  AuthState,
  TripState,
  LocationState,
  ChatState,
  ExpenseState,
  OfflineAction,
  SyncStatus,
} from '@/types';

interface AppStore extends AuthState, TripState, LocationState, ChatState, ExpenseState {
  // Auth actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setAuthLoading: (isLoading: boolean) => void;
  logout: () => void;

  // Trip actions
  setCurrentTrip: (trip: Trip | null) => void;
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  setMembers: (members: TripMember[]) => void;
  addMember: (member: TripMember) => void;
  updateMember: (member: TripMember) => void;
  removeMember: (memberId: string) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (vehicleId: string) => void;
  setItinerary: (itinerary: ItineraryStop[]) => void;
  addItineraryStop: (stop: ItineraryStop) => void;
  updateItineraryStop: (stop: ItineraryStop) => void;
  removeItineraryStop: (stopId: string) => void;
  reorderItinerary: (stops: ItineraryStop[]) => void;

  // Expense actions
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  removeExpense: (expenseId: string) => void;
  setSettlements: (settlements: Settlement[]) => void;
  addSettlement: (settlement: Settlement) => void;
  updateSettlement: (settlement: Settlement) => void;
  setWallet: (wallet: Wallet | null) => void;
  updateWallet: (wallet: Partial<Wallet>) => void;
  setFuelEntries: (entries: FuelEntry[]) => void;
  addFuelEntry: (entry: FuelEntry) => void;
  updateFuelEntry: (entry: FuelEntry) => void;
  removeFuelEntry: (entryId: string) => void;
  setTollEntries: (entries: TollEntry[]) => void;
  addTollEntry: (entry: TollEntry) => void;
  updateTollEntry: (entry: TollEntry) => void;
  removeTollEntry: (entryId: string) => void;

  // Checklist actions
  setChecklists: (checklists: Checklist[]) => void;
  addChecklist: (checklist: Checklist) => void;
  updateChecklist: (checklist: Checklist) => void;
  removeChecklist: (checklistId: string) => void;

  // Chat actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setChatConnected: (isConnected: boolean) => void;
  setTyping: (isTyping: boolean) => void;
  setTypingUsers: (users: string[]) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;

  // Poll actions
  setPolls: (polls: Poll[]) => void;
  addPoll: (poll: Poll) => void;
  updatePoll: (poll: Poll) => void;
  removePoll: (pollId: string) => void;

  // Media actions
  setMedia: (media: Media[]) => void;
  addMedia: (media: Media) => void;
  removeMedia: (mediaId: string) => void;

  // Emergency actions
  setEmergencyEvents: (events: EmergencyEvent[]) => void;
  addEmergencyEvent: (event: EmergencyEvent) => void;
  updateEmergencyEvent: (event: EmergencyEvent) => void;

  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;

  // Timeline actions
  setTimeline: (timeline: TripEvent[]) => void;
  addTimelineEvent: (event: TripEvent) => void;

  // Budget actions
  setBudget: (budget: Budget | null) => void;
  updateBudget: (budget: Partial<Budget>) => void;

  // Location actions
  setCurrentLocation: (location: LocationSession | null) => void;
  setLocationSharing: (isSharing: boolean) => void;
  setShareMode: (mode: 'always' | 'during_trip' | 'one_hour' | 'paused') => void;
  setNearbyMembers: (members: LocationSession[]) => void;
  setConvoyMode: (enabled: boolean) => void;
  setLocationLoading: (isLoading: boolean) => void;
  setLocationError: (error: string | null) => void;

  // Sync actions
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  addOfflineAction: (action: OfflineAction) => void;
  removeOfflineAction: (actionId: string) => void;
  markOfflineActionSynced: (actionId: string) => void;
  incrementOfflineRetries: (actionId: string) => void;

  // Computed getters
  getMemberById: (userId: string) => TripMember | undefined;
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  getExpensesByCategory: (category: string) => Expense[];
  getTotalExpenses: () => number;
  getUserBalance: (userId: string) => number;
  getOptimizedSettlements: () => Settlement[];
  getUnreadNotificationsCount: () => number;
  getActiveEmergencyEvents: () => EmergencyEvent[];
  getUpcomingStops: () => ItineraryStop[];
  getCompletedStops: () => ItineraryStop[];
}

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const initialTripState: TripState = {
  currentTrip: null,
  trips: [],
  members: [],
  vehicles: [],
  itinerary: [],
  expenses: [],
  settlements: [],
  wallet: null,
  fuelEntries: [],
  tollEntries: [],
  checklists: [],
  messages: [],
  polls: [],
  media: [],
  emergencyEvents: [],
  notifications: [],
  timeline: [],
  budget: null,
  locationSessions: [],
  isLoading: false,
  error: null,
};

const initialLocationState: LocationState = {
  currentLocation: null,
  isSharing: false,
  shareMode: 'paused',
  nearbyMembers: [],
  convoyMode: false,
  isLoading: false,
  error: null,
};

const initialChatState: ChatState = {
  messages: [],
  isConnected: false,
  isTyping: false,
  typingUsers: [],
  unreadCount: 0,
};

const initialExpenseState: ExpenseState = {
  expenses: [],
  settlements: [],
  wallet: null,
  budget: null,
  categories: [],
  balances: [],
  optimizedSettlements: [],
  isLoading: false,
  error: null,
};

const initialSyncStatus: SyncStatus = {
  isOnline: true,
  isSyncing: false,
  pendingChanges: 0,
  failedChanges: 0,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialAuthState,
      ...initialTripState,
      ...initialLocationState,
      ...initialChatState,
      ...initialExpenseState,
      syncStatus: initialSyncStatus,
      offlineActions: [],

      // Auth actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setAuthLoading: (isLoading) => set({ isLoading }),
      logout: () => set({
        ...initialAuthState,
        ...initialTripState,
        ...initialLocationState,
        ...initialChatState,
        ...initialExpenseState,
      }),

      // Trip actions
      setCurrentTrip: (currentTrip) => set({ currentTrip }),
      setTrips: (trips) => set({ trips }),
      addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
      updateTrip: (trip) => set((state) => ({
        trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
        currentTrip: state.currentTrip?.id === trip.id ? trip : state.currentTrip,
      })),
      removeTrip: (tripId) => set((state) => ({
        trips: state.trips.filter((t) => t.id !== tripId),
        currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
      })),
      setMembers: (members) => set({ members }),
      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      updateMember: (member) => set((state) => ({
        members: state.members.map((m) => (m.id === member.id ? member : m)),
      })),
      removeMember: (memberId) => set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
      })),
      setVehicles: (vehicles) => set({ vehicles }),
      addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
      updateVehicle: (vehicle) => set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
      })),
      removeVehicle: (vehicleId) => set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== vehicleId),
      })),
      setItinerary: (itinerary) => set({ itinerary }),
      addItineraryStop: (stop) => set((state) => ({ itinerary: [...state.itinerary, stop] })),
      updateItineraryStop: (stop) => set((state) => ({
        itinerary: state.itinerary.map((s) => (s.id === stop.id ? stop : s)),
      })),
      removeItineraryStop: (stopId) => set((state) => ({
        itinerary: state.itinerary.filter((s) => s.id !== stopId),
      })),
      reorderItinerary: (stops) => set({ itinerary: stops }),

      // Expense actions
      setExpenses: (expenses) => set({ expenses }),
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (expense) => set((state) => ({
        expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
      })),
      removeExpense: (expenseId) => set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== expenseId),
      })),
      setSettlements: (settlements) => set({ settlements }),
      addSettlement: (settlement) => set((state) => ({ settlements: [...state.settlements, settlement] })),
      updateSettlement: (settlement) => set((state) => ({
        settlements: state.settlements.map((s) => (s.id === settlement.id ? settlement : s)),
      })),
      setWallet: (wallet) => set({ wallet }),
      updateWallet: (wallet) => set((state) => ({
        wallet: state.wallet ? { ...state.wallet, ...wallet } : null,
      })),
      setFuelEntries: (fuelEntries) => set({ fuelEntries }),
      addFuelEntry: (entry) => set((state) => ({ fuelEntries: [...state.fuelEntries, entry] })),
      updateFuelEntry: (entry) => set((state) => ({
        fuelEntries: state.fuelEntries.map((e) => (e.id === entry.id ? entry : e)),
      })),
      removeFuelEntry: (entryId) => set((state) => ({
        fuelEntries: state.fuelEntries.filter((e) => e.id !== entryId),
      })),
      setTollEntries: (tollEntries) => set({ tollEntries }),
      addTollEntry: (entry) => set((state) => ({ tollEntries: [...state.tollEntries, entry] })),
      updateTollEntry: (entry) => set((state) => ({
        tollEntries: state.tollEntries.map((e) => (e.id === entry.id ? entry : e)),
      })),
      removeTollEntry: (entryId) => set((state) => ({
        tollEntries: state.tollEntries.filter((e) => e.id !== entryId),
      })),

      // Checklist actions
      setChecklists: (checklists) => set({ checklists }),
      addChecklist: (checklist) => set((state) => ({ checklists: [...state.checklists, checklist] })),
      updateChecklist: (checklist) => set((state) => ({
        checklists: state.checklists.map((c) => (c.id === checklist.id ? checklist : c)),
      })),
      removeChecklist: (checklistId) => set((state) => ({
        checklists: state.checklists.filter((c) => c.id !== checklistId),
      })),

      // Chat actions
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (message) => set((state) => ({
        messages: state.messages.map((m) => (m.id === message.id ? message : m)),
      })),
      removeMessage: (messageId) => set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      })),
      setChatConnected: (isConnected) => set({ isConnected }),
      setTyping: (isTyping) => set({ isTyping }),
      setTypingUsers: (typingUsers) => set({ typingUsers }),
      incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      resetUnreadCount: () => set({ unreadCount: 0 }),

      // Poll actions
      setPolls: (polls) => set({ polls }),
      addPoll: (poll) => set((state) => ({ polls: [...state.polls, poll] })),
      updatePoll: (poll) => set((state) => ({
        polls: state.polls.map((p) => (p.id === poll.id ? poll : p)),
      })),
      removePoll: (pollId) => set((state) => ({
        polls: state.polls.filter((p) => p.id !== pollId),
      })),

      // Media actions
      setMedia: (media) => set({ media }),
      addMedia: (media) => set((state) => ({ media: [...state.media, media] })),
      removeMedia: (mediaId) => set((state) => ({
        media: state.media.filter((m) => m.id !== mediaId),
      })),

      // Emergency actions
      setEmergencyEvents: (emergencyEvents) => set({ emergencyEvents }),
      addEmergencyEvent: (event) => set((state) => ({ emergencyEvents: [...state.emergencyEvents, event] })),
      updateEmergencyEvent: (event) => set((state) => ({
        emergencyEvents: state.emergencyEvents.map((e) => (e.id === event.id ? event : e)),
      })),

      // Notification actions
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
      markNotificationRead: (notificationId) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      })),

      // Timeline actions
      setTimeline: (timeline) => set({ timeline }),
      addTimelineEvent: (event) => set((state) => ({ timeline: [event, ...state.timeline] })),

      // Budget actions
      setBudget: (budget) => set({ budget }),
      updateBudget: (budget) => set((state) => ({
        budget: state.budget ? { ...state.budget, ...budget } : null,
      })),

      // Location actions
      setCurrentLocation: (currentLocation) => set({ currentLocation }),
      setLocationSharing: (isSharing) => set({ isSharing }),
      setShareMode: (shareMode) => set({ shareMode }),
      setNearbyMembers: (nearbyMembers) => set({ nearbyMembers }),
      setConvoyMode: (convoyMode) => set({ convoyMode }),
      setLocationLoading: (isLoading) => set({ isLoading }),
      setLocationError: (error) => set({ error }),

      // Sync actions
      setSyncStatus: (status) => set((state) => ({
        syncStatus: { ...state.syncStatus, ...status },
      })),
      addOfflineAction: (action) => set((state) => ({
        offlineActions: [...state.offlineActions, action],
        syncStatus: { ...state.syncStatus, pendingChanges: state.syncStatus.pendingChanges + 1 },
      })),
      removeOfflineAction: (actionId) => set((state) => ({
        offlineActions: state.offlineActions.filter((a) => a.id !== actionId),
        syncStatus: { ...state.syncStatus, pendingChanges: Math.max(0, state.syncStatus.pendingChanges - 1) },
      })),
      markOfflineActionSynced: (actionId) => set((state) => ({
        offlineActions: state.offlineActions.map((a) =>
          a.id === actionId ? { ...a, synced: true } : a
        ),
      })),
      incrementOfflineRetries: (actionId) => set((state) => ({
        offlineActions: state.offlineActions.map((a) =>
          a.id === actionId ? { ...a, retries: a.retries + 1 } : a
        ),
      })),

      // Computed getters
      getMemberById: (userId) => get().members.find((m) => m.userId === userId),
      getVehicleById: (vehicleId) => get().vehicles.find((v) => v.id === vehicleId),
      getExpensesByCategory: (category) => get().expenses.filter((e) => e.category === category),
      getTotalExpenses: () => get().expenses.reduce((sum, e) => sum + e.amount, 0),
      getUserBalance: (userId) => {
        const state = get();
        let balance = 0;
        state.expenses.forEach((expense) => {
          const participant = expense.participants.find((p) => p.userId === userId);
          if (participant) {
            balance -= participant.amount;
          }
          if (expense.paidBy === userId) {
            balance += expense.amount;
          }
        });
        return balance;
      },
      getOptimizedSettlements: () => {
        // Simple optimization - in reality this would be more complex
        return get().settlements.filter((s) => s.status === 'pending');
      },
      getUnreadNotificationsCount: () => get().notifications.filter((n) => !n.isRead).length,
      getActiveEmergencyEvents: () => get().emergencyEvents.filter((e) => e.status === 'active'),
      getUpcomingStops: () => get().itinerary.filter((s) => !s.isCompleted).sort((a, b) => a.order - b.order),
      getCompletedStops: () => get().itinerary.filter((s) => s.isCompleted).sort((a, b) => a.order - b.order),
    }),
    {
      name: 'roadtrip-x-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentTrip: state.currentTrip,
        trips: state.trips,
        members: state.members,
        vehicles: state.vehicles,
        itinerary: state.itinerary,
        expenses: state.expenses,
        settlements: state.settlements,
        wallet: state.wallet,
        fuelEntries: state.fuelEntries,
        tollEntries: state.tollEntries,
        checklists: state.checklists,
        polls: state.polls,
        budget: state.budget,
        shareMode: state.shareMode,
        convoyMode: state.convoyMode,
        offlineActions: state.offlineActions,
      }),
    }
  )
);