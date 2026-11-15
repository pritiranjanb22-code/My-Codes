export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  status: string;
  phoneNumber?: string;
  wifitalkId: string;
  publicKey: string;
  createdAt: number;
  updatedAt: number;
  deviceName: string;
  isCurrentUser: boolean;
}

export interface DeviceInfo {
  id: string;
  userId: string;
  name: string;
  platform: 'android' | 'ios' | 'windows' | 'linux' | 'macos' | 'web';
  platformVersion: string;
  appVersion: string;
  localIp: string;
  publicIp?: string;
  macAddress?: string;
  isOnline: boolean;
  lastSeen: number;
  capabilities: DeviceCapabilities;
  networkSegment: string;
  signalStrength?: number;
  isTrusted: boolean;
  isRelay: boolean;
  pairedAt?: number;
}

export interface DeviceCapabilities {
  textMessaging: boolean;
  voiceCall: boolean;
  videoCall: boolean;
  fileTransfer: boolean;
  walkieTalkie: boolean;
  screenShare: boolean;
  relay: boolean;
  server: boolean;
}

export interface NetworkInfo {
  localIp: string;
  gateway: string;
  subnetMask: string;
  networkRange: string;
  interfaceName: string;
  ipv6?: string;
  dnsServers: string[];
  isConnected: boolean;
  internetReachable: boolean;
  lanReachable: boolean;
  multicastSupported: boolean;
  natType?: NATType;
}

export type NATType = 'open' | 'moderate' | 'strict' | 'unknown';

export interface PeerConnection {
  peerId: string;
  localId: string;
  status: ConnectionStatus;
  transport: TransportType;
  localAddress: string;
  remoteAddress: string;
  connectedAt: number;
  lastActivity: number;
  bytesSent: number;
  bytesReceived: number;
  rtt?: number;
  packetLoss?: number;
  jitter?: number;
  quality: ConnectionQuality;
  encryption: EncryptionInfo;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'failed';
export type TransportType = 'tcp' | 'udp' | 'webrtc' | 'relay' | 'bluetooth';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'unstable' | 'unknown';

export interface EncryptionInfo {
  algorithm: string;
  keyExchange: string;
  verified: boolean;
  fingerprint: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  status: MessageStatus;
  timestamp: number;
  deliveredAt?: number;
  readAt?: number;
  editedAt?: number;
  deletedAt?: number;
  replyTo?: string;
  reactions: MessageReaction[];
  isLocal: boolean;
  encryption: EncryptionInfo;
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'document' 
  | 'voice_note' 
  | 'location' 
  | 'contact' 
  | 'system' 
  | 'call_log' 
  | 'file';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  localPath?: string;
  remoteUrl?: string;
  checksum?: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatar?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isMuted: boolean;
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
  settings: ConversationSettings;
}

export type ConversationType = 'direct' | 'group' | 'channel' | 'walkie_talkie';

export interface ConversationParticipant {
  userId: string;
  role: ParticipantRole;
  joinedAt: number;
  lastReadMessageId?: string;
  isActive: boolean;
}

export type ParticipantRole = 'owner' | 'admin' | 'member' | 'guest';

export interface ConversationSettings {
  disappearingMessages: boolean;
  disappearingTimer?: number;
  encryptionEnabled: boolean;
  onlyAdminsCanPost: boolean;
  onlyAdminsCanEditInfo: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  admins: string[];
  members: GroupMember[];
  settings: GroupSettings;
  createdAt: number;
  updatedAt: number;
}

export interface GroupMember {
  userId: string;
  role: ParticipantRole;
  joinedAt: number;
  invitedBy?: string;
}

export interface GroupSettings {
  onlyAdminsCanEditInfo: boolean;
  onlyAdminsCanSendMessages: boolean;
  approveNewMembers: boolean;
  disappearingMessages: boolean;
  disappearingTimer?: number;
}

export interface FileTransfer {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  localPath: string;
  remotePath?: string;
  status: FileTransferStatus;
  progress: number;
  chunksTotal: number;
  chunksTransferred: number;
  checksum: string;
  startedAt: number;
  completedAt?: number;
  cancelledAt?: number;
  error?: string;
  isPaused: boolean;
  transferMode: TransferMode;
}

export type FileTransferStatus = 'pending' | 'connecting' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type TransferMode = 'direct' | 'relay' | 'server';

export interface Call {
  id: string;
  type: CallType;
  status: CallStatus;
  initiatorId: string;
  participants: CallParticipant[];
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  duration: number;
  quality: ConnectionQuality;
  networkInfo: NetworkInfo;
}

export type CallType = 'voice' | 'video' | 'group_voice' | 'group_video';
export type CallStatus = 'initiating' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed' | 'declined' | 'missed';

export interface CallParticipant {
  userId: string;
  deviceId: string;
  status: ParticipantCallStatus;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  joinedAt?: number;
  leftAt?: number;
  quality: ConnectionQuality;
  rtt?: number;
}

export type ParticipantCallStatus = 'invited' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'declined';

export interface WalkieTalkieChannel {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  type: ChannelType;
  ownerId: string;
  members: ChannelMember[];
  settings: ChannelSettings;
  currentSpeaker?: string;
  isPriority: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ChannelType = 'open' | 'private' | 'emergency' | 'announcement';

export interface ChannelMember {
  userId: string;
  role: ChannelRole;
  joinedAt: number;
  isListening: boolean;
  canSpeak: boolean;
}

export type ChannelRole = 'owner' | 'moderator' | 'speaker' | 'listener';

export interface ChannelSettings {
  maxSpeakers: number;
  priority: number;
  allowTextChat: boolean;
  recordTransmissions: boolean;
  autoJoin: boolean;
}

export interface VoiceMessage {
  id: string;
  conversationId: string;
  senderId: string;
  localPath: string;
  duration: number;
  waveform?: number[];
  status: MessageStatus;
  playedAt?: number;
  timestamp: number;
  encryption: EncryptionInfo;
}

export interface NetworkPeer {
  id: string;
  deviceId: string;
  userId: string;
  name: string;
  ip: string;
  port: number;
  discoveredAt: number;
  lastSeen: number;
  discoveryMethod: DiscoveryMethod;
  reachable: boolean;
  latency?: number;
  hops?: number;
  networkSegment: string;
  capabilities: DeviceCapabilities;
  isRelay: boolean;
  version: string;
}

export type DiscoveryMethod = 'mdns' | 'udp_broadcast' | 'manual' | 'qr' | 'relay' | 'bootstrap';

export interface PairingRequest {
  id: string;
  fromDeviceId: string;
  fromUserId: string;
  fromUserName: string;
  fromPublicKey: string;
  toDeviceId?: string;
  toUserId?: string;
  code: string;
  qrData: string;
  status: PairingStatus;
  createdAt: number;
  expiresAt: number;
  completedAt?: number;
}

export type PairingStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface TrustedDevice {
  deviceId: string;
  userId: string;
  name: string;
  fingerprint: string;
  publicKey: string;
  trustedAt: number;
  lastVerified: number;
  isRevoked: boolean;
  revokedAt?: number;
}

export interface NetworkDiagnostics {
  localIp: string;
  gateway: string;
  internet: boolean;
  lan: boolean;
  peerDiscovery: boolean;
  directConnection: boolean;
  multicast: boolean;
  natType: NATType;
  ipv6: boolean;
  reachablePeers: number;
  peers: PeerDiagnostic[];
}

export interface PeerDiagnostic {
  peerId: string;
  name: string;
  ip: string;
  ping: number;
  packetLoss: number;
  connectionType: 'direct' | 'relay' | 'unreachable';
  quality: ConnectionQuality;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export type NotificationType = 
  | 'message' 
  | 'call' 
  | 'walkie_talkie' 
  | 'file_transfer' 
  | 'pairing_request' 
  | 'peer_joined' 
  | 'peer_left' 
  | 'group_invite' 
  | 'system';

export interface StorageInfo {
  total: number;
  used: number;
  free: number;
  breakdown: {
    photos: number;
    videos: number;
    documents: number;
    voice: number;
    cache: number;
    database: number;
  };
}

export interface AppSettings {
  privacy: PrivacySettings;
  security: SecuritySettings;
  network: NetworkSettings;
  notifications: NotificationSettings;
  calls: CallSettings;
  walkieTalkie: WalkieTalkieSettings;
  storage: StorageSettings;
  dataUsage: DataUsageSettings;
  appearance: AppearanceSettings;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface PrivacySettings {
  discoverable: boolean;
  showOnlineStatus: boolean;
  showLastSeen: 'everyone' | 'contacts' | 'nobody';
  showProfilePhoto: 'everyone' | 'contacts' | 'nobody';
  showStatus: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  groupsCanAdd: 'everyone' | 'contacts' | 'nobody';
  blockList: string[];
}

export interface SecuritySettings {
  lockApp: boolean;
  lockTimeout: number;
  biometricLock: boolean;
  twoFactorAuth: boolean;
  encryptionKeys: boolean;
  deviceVerification: boolean;
  sessionManagement: boolean;
}

export interface NetworkSettings {
  preferLocal: boolean;
  allowRelay: boolean;
  allowInternet: boolean;
  discoveryPort: number;
  mdnsEnabled: boolean;
  udpBroadcastEnabled: boolean;
  relayNodes: RelayNodeConfig[];
  vpnDetection: boolean;
}

export interface RelayNodeConfig {
  id: string;
  address: string;
  port: number;
  isEnabled: boolean;
  isTrusted: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  calls: boolean;
  walkieTalkie: boolean;
  fileTransfers: boolean;
  peerEvents: boolean;
  groupEvents: boolean;
  sound: boolean;
  vibration: boolean;
  preview: boolean;
}

export interface CallSettings {
  autoAnswer: boolean;
  videoEnabled: boolean;
  speakerDefault: boolean;
  noiseCancellation: boolean;
  echoCancellation: boolean;
  lowDataMode: boolean;
  pictureInPicture: boolean;
}

export interface WalkieTalkieSettings {
  holdToTalk: boolean;
  tapToLock: boolean;
  voiceActivation: boolean;
  vadThreshold: number;
  priorityChannelId?: string;
  audioQuality: 'low' | 'medium' | 'high';
  playbackSpeed: number;
}

export interface StorageSettings {
  autoDownloadMedia: boolean;
  autoDownloadOnWifi: boolean;
  autoDownloadOnMobile: boolean;
  maxCacheSize: number;
  clearCacheOnExit: boolean;
  backupEnabled: boolean;
  backupLocation: 'local' | 'cloud' | 'both';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface DataUsageSettings {
  trackUsage: boolean;
  warningThreshold: number;
  limitThreshold: number;
  resetDay: number;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  chatWallpaper?: string;
  bubbleStyle: 'default' | 'rounded' | 'square';
  showTimestamps: boolean;
  showAvatarsInGroups: boolean;
}

export interface BackupInfo {
  id: string;
  type: 'local' | 'cloud';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size: number;
  itemCount: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  path?: string;
}