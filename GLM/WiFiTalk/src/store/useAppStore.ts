import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfile, DeviceInfo, Conversation, Message, NetworkPeer, WalkieTalkieChannel, FileTransfer, Call, AppSettings, Notification } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from '../services/IdentityService';

interface AppState {
  // User & Device
  currentUser: UserProfile | null;
  currentDevice: DeviceInfo | null;
  isAuthenticated: boolean;
  
  // Conversations & Messages
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Map<string, Message[]>;
  unreadCounts: Map<string, number>;
  
  // Network & Peers
  peers: NetworkPeer[];
  isDiscovering: boolean;
  networkInfo: any;
  
  // Walkie Talkie
  channels: WalkieTalkieChannel[];
  activeChannelId: string | null;
  isTransmitting: boolean;
  isListening: boolean;
  currentSpeaker: string | null;
  
  // File Transfers
  activeTransfers: FileTransfer[];
  incomingTransfers: FileTransfer[];
  
  // Calls
  activeCall: Call | null;
  callHistory: Call[];
  
  // Settings
  settings: AppSettings;
  
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentUser: (user: UserProfile | null) => void;
  setCurrentDevice: (device: DeviceInfo | null) => void;
  setAuthenticated: (auth: boolean) => void;
  
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  
  setPeers: (peers: NetworkPeer[]) => void;
  addPeer: (peer: NetworkPeer) => void;
  updatePeer: (id: string, updates: Partial<NetworkPeer>) => void;
  removePeer: (id: string) => void;
  setDiscovering: (discovering: boolean) => void;
  setNetworkInfo: (info: any) => void;
  
  setChannels: (channels: WalkieTalkieChannel[]) => void;
  addChannel: (channel: WalkieTalkieChannel) => void;
  updateChannel: (id: string, updates: Partial<WalkieTalkieChannel>) => void;
  setActiveChannel: (id: string | null) => void;
  setTransmitting: (transmitting: boolean) => void;
  setListening: (listening: boolean) => void;
  setCurrentSpeaker: (speakerId: string | null) => void;
  
  setActiveTransfers: (transfers: FileTransfer[]) => void;
  addActiveTransfer: (transfer: FileTransfer) => void;
  updateTransfer: (id: string, updates: Partial<FileTransfer>) => void;
  removeTransfer: (id: string) => void;
  setIncomingTransfers: (transfers: FileTransfer[]) => void;
  
  setActiveCall: (call: Call | null) => void;
  addCallToHistory: (call: Call) => void;
  
  setSettings: (settings: Partial<AppSettings>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  reset: () => void;
}

const defaultSettings: AppSettings = {
  privacy: {
    discoverable: true,
    showOnlineStatus: true,
    showLastSeen: 'contacts',
    showProfilePhoto: 'contacts',
    showStatus: 'contacts',
    readReceipts: true,
    groupsCanAdd: 'contacts',
    blockList: [],
  },
  security: {
    lockApp: false,
    lockTimeout: 300,
    biometricLock: false,
    twoFactorAuth: false,
    encryptionKeys: true,
    deviceVerification: true,
    sessionManagement: true,
  },
  network: {
    preferLocal: true,
    allowRelay: true,
    allowInternet: true,
    discoveryPort: 8484,
    mdnsEnabled: true,
    udpBroadcastEnabled: true,
    relayNodes: [],
    vpnDetection: true,
  },
  notifications: {
    enabled: true,
    messages: true,
    calls: true,
    walkieTalkie: true,
    fileTransfers: true,
    peerEvents: true,
    groupEvents: true,
    sound: true,
    vibration: true,
    preview: true,
  },
  calls: {
    autoAnswer: false,
    videoEnabled: true,
    speakerDefault: false,
    noiseCancellation: true,
    echoCancellation: true,
    lowDataMode: false,
    pictureInPicture: true,
  },
  walkieTalkie: {
    holdToTalk: true,
    tapToLock: false,
    voiceActivation: false,
    vadThreshold: 0.01,
    audioQuality: 'high',
    playbackSpeed: 1.0,
  },
  storage: {
    autoDownloadMedia: true,
    autoDownloadOnWifi: true,
    autoDownloadOnMobile: false,
    maxCacheSize: 500 * 1024 * 1024,
    clearCacheOnExit: false,
    backupEnabled: false,
    backupLocation: 'local',
    backupFrequency: 'weekly',
  },
  dataUsage: {
    trackUsage: true,
    warningThreshold: 1024 * 1024 * 1024,
    limitThreshold: 2 * 1024 * 1024 * 1024,
    resetDay: 1,
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    bubbleStyle: 'default',
    showTimestamps: true,
    showAvatarsInGroups: true,
  },
  language: 'en',
  theme: 'system',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentDevice: null,
      isAuthenticated: false,
      conversations: [],
      activeConversationId: null,
      messages: new Map(),
      unreadCounts: new Map(),
      peers: [],
      isDiscovering: false,
      networkInfo: null,
      channels: [],
      activeChannelId: null,
      isTransmitting: false,
      isListening: false,
      currentSpeaker: null,
      activeTransfers: [],
      incomingTransfers: [],
      activeCall: null,
      callHistory: [],
      settings: defaultSettings,
      notifications: [],
      unreadNotificationCount: 0,
      isLoading: false,
      error: null,

      // Actions
      setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
      setCurrentDevice: (device) => set({ currentDevice: device }),
      setAuthenticated: (auth) => set({ isAuthenticated: auth }),

      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations.filter(c => c.id !== conversation.id)],
      })),
      updateConversation: (id, updates) => set((state) => ({
        conversations: state.conversations.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      setActiveConversation: (id) => set({ activeConversationId: id }),
      addMessage: (message) => set((state) => {
        const newMessages = new Map(state.messages);
        const convMessages = newMessages.get(message.conversationId) || [];
        newMessages.set(message.conversationId, [...convMessages, message]);
        
        const newUnread = new Map(state.unreadCounts);
        if (state.activeConversationId !== message.conversationId) {
          newUnread.set(message.conversationId, (newUnread.get(message.conversationId) || 0) + 1);
        }
        
        return { messages: newMessages, unreadCounts: newUnread };
      }),
      updateMessage: (id, updates) => set((state) => {
        const newMessages = new Map(state.messages);
        for (const [convId, messages] of newMessages.entries()) {
          const index = messages.findIndex(m => m.id === id);
          if (index !== -1) {
            const newMsgs = [...messages];
            newMsgs[index] = { ...newMsgs[index], ...updates };
            newMessages.set(convId, newMsgs);
            break;
          }
        }
        return { messages: newMessages };
      }),
      setMessages: (conversationId, messages) => set((state) => {
        const newMessages = new Map(state.messages);
        newMessages.set(conversationId, messages);
        return { messages: newMessages };
      }),
      incrementUnread: (conversationId) => set((state) => {
        if (state.activeConversationId === conversationId) return state;
        const newUnread = new Map(state.unreadCounts);
        newUnread.set(conversationId, (newUnread.get(conversationId) || 0) + 1);
        return { unreadCounts: newUnread };
      }),
      clearUnread: (conversationId) => set((state) => {
        const newUnread = new Map(state.unreadCounts);
        newUnread.set(conversationId, 0);
        return { unreadCounts: newUnread };
      }),

      setPeers: (peers) => set({ peers }),
      addPeer: (peer) => set((state) => ({
        peers: [...state.peers.filter(p => p.id !== peer.id), peer],
      })),
      updatePeer: (id, updates) => set((state) => ({
        peers: state.peers.map(p => p.id === id ? { ...p, ...updates } : p),
      })),
      removePeer: (id) => set((state) => ({
        peers: state.peers.filter(p => p.id !== id),
      })),
      setDiscovering: (discovering) => set({ isDiscovering: discovering }),
      setNetworkInfo: (info) => set({ networkInfo: info }),

      setChannels: (channels) => set({ channels }),
      addChannel: (channel) => set((state) => ({
        channels: [...state.channels.filter(c => c.id !== channel.id), channel],
      })),
      updateChannel: (id, updates) => set((state) => ({
        channels: state.channels.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      setActiveChannel: (id) => set({ activeChannelId: id }),
      setTransmitting: (transmitting) => set({ isTransmitting: transmitting }),
      setListening: (listening) => set({ isListening: listening }),
      setCurrentSpeaker: (speakerId) => set({ currentSpeaker: speakerId }),

      setActiveTransfers: (transfers) => set({ activeTransfers: transfers }),
      addActiveTransfer: (transfer) => set((state) => ({
        activeTransfers: [...state.activeTransfers.filter(t => t.id !== transfer.id), transfer],
      })),
      updateTransfer: (id, updates) => set((state) => ({
        activeTransfers: state.activeTransfers.map(t => t.id === id ? { ...t, ...updates } : t),
      })),
      removeTransfer: (id) => set((state) => ({
        activeTransfers: state.activeTransfers.filter(t => t.id !== id),
      })),
      setIncomingTransfers: (transfers) => set({ incomingTransfers: transfers }),

      setActiveCall: (call) => set({ activeCall: call }),
      addCallToHistory: (call) => set((state) => ({
        callHistory: [call, ...state.callHistory.slice(0, 99)],
      })),

      setSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings },
      })),
      loadSettings: async () => {
        const stored = await databaseService.getSetting('app_settings', defaultSettings);
        set({ settings: stored });
      },
      saveSettings: async () => {
        const { settings } = get();
        await databaseService.setSetting('app_settings', settings);
      },

      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications].slice(0, 100),
        unreadNotificationCount: state.unreadNotificationCount + 1,
      })),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
      })),
      clearNotifications: () => set({ notifications: [], unreadNotificationCount: 0 }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      reset: () => set({
        currentUser: null,
        currentDevice: null,
        isAuthenticated: false,
        conversations: [],
        activeConversationId: null,
        messages: new Map(),
        unreadCounts: new Map(),
        peers: [],
        isDiscovering: false,
        networkInfo: null,
        channels: [],
        activeChannelId: null,
        isTransmitting: false,
        isListening: false,
        currentSpeaker: null,
        activeTransfers: [],
        incomingTransfers: [],
        activeCall: null,
        callHistory: [],
        notifications: [],
        unreadNotificationCount: 0,
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'wifitalk-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name) => {
          const value = await databaseService.getSetting(name, null);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name, value) => {
          await databaseService.setSetting(name, JSON.parse(value));
        },
        removeItem: async (name) => {
          await databaseService.executeSql('DELETE FROM app_settings WHERE key = ?', [name]);
        },
      })),
      partialize: (state) => ({
        settings: state.settings,
        activeConversationId: state.activeConversationId,
        activeChannelId: state.activeChannelId,
      }),
    }
  )
);