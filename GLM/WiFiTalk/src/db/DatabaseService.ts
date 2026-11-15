import SQLite from 'react-native-sqlite-storage';
import { SCHEMA, DATABASE_NAME, DATABASE_VERSION, getMigrationSql } from './Schema';
import {
  UserProfile,
  DeviceInfo,
  Conversation,
  Message,
  Group,
  FileTransfer,
  Call,
  WalkieTalkieChannel,
  VoiceMessage,
  NetworkPeer,
  PairingRequest,
  TrustedDevice,
  Notification,
  RelayNodeConfig,
} from '../types';

SQLite.DEBUG(false);
SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
      createFromLocation: 0,
    });

    await this._runMigrations();
    await this._createTables();
  }

  private async _runMigrations(): Promise<void> {
    if (!this.db) return;

    const result = await this.db.executeSql(
      "SELECT value FROM app_settings WHERE key = 'db_version'"
    );
    const currentVersion = result[0].rows.length > 0 
      ? parseInt(result[0].rows.item(0).value, 10) 
      : 0;

    if (currentVersion < DATABASE_VERSION) {
      for (let v = currentVersion + 1; v <= DATABASE_VERSION; v++) {
        const migrations = getMigrationSql(v);
        for (const sql of migrations) {
          await this.db.executeSql(sql);
        }
      }
      await this.db.executeSql(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('db_version', ?)",
        [DATABASE_VERSION.toString()]
      );
    }
  }

  private async _createTables(): Promise<void> {
    if (!this.db) return;

    for (const sql of SCHEMA) {
      await this.db.executeSql(sql);
    }
  }

  getDb(): SQLite.SQLiteDatabase | null {
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  async transaction<T>(callback: (tx: SQLite.Transaction) => Promise<T>): Promise<T> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction(callback);
  }

  async executeSql(sql: string, params: unknown[] = []): Promise<SQLite.ResultSet[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.executeSql(sql, params);
  }

  // User operations
  async upsertUser(user: UserProfile): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO users (id, name, avatar, status, phone_number, wifitalk_id, public_key, private_key, created_at, updated_at, device_name, is_current_user)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.avatar || null,
        user.status,
        user.phoneNumber || null,
        user.wifitalkId,
        user.publicKey,
        '', // private_key not stored in this table
        user.createdAt,
        user.updatedAt,
        user.deviceName,
        user.isCurrentUser ? 1 : 0,
      ]
    );
  }

  async getUser(id: string): Promise<UserProfile | null> {
    const result = await this.executeSql('SELECT * FROM users WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    return this._mapUser(result[0].rows.item(0));
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const result = await this.executeSql('SELECT * FROM users WHERE is_current_user = 1 LIMIT 1');
    if (result[0].rows.length === 0) return null;
    return this._mapUser(result[0].rows.item(0));
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const result = await this.executeSql('SELECT * FROM users ORDER BY name');
    const users: UserProfile[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      users.push(this._mapUser(result[0].rows.item(i)));
    }
    return users;
  }

  async deleteUser(id: string): Promise<void> {
    await this.executeSql('DELETE FROM users WHERE id = ?', [id]);
  }

  private _mapUser(row: any): UserProfile {
    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      status: row.status,
      phoneNumber: row.phone_number,
      wifitalkId: row.wifitalk_id,
      publicKey: row.public_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deviceName: row.device_name,
      isCurrentUser: row.is_current_user === 1,
    };
  }

  // Device operations
  async upsertDevice(device: DeviceInfo): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO devices (id, user_id, name, platform, platform_version, app_version, local_ip, public_ip, mac_address, is_online, last_seen, capabilities, network_segment, signal_strength, is_trusted, is_relay, paired_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device.id,
        device.userId,
        device.name,
        device.platform,
        device.platformVersion,
        device.appVersion,
        device.localIp,
        device.publicIp || null,
        device.macAddress || null,
        device.isOnline ? 1 : 0,
        device.lastSeen,
        JSON.stringify(device.capabilities),
        device.networkSegment,
        device.signalStrength || null,
        device.isTrusted ? 1 : 0,
        device.isRelay ? 1 : 0,
        device.pairedAt || null,
      ]
    );
  }

  async getDevice(id: string): Promise<DeviceInfo | null> {
    const result = await this.executeSql('SELECT * FROM devices WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    return this._mapDevice(result[0].rows.item(0));
  }

  async getDevicesByUser(userId: string): Promise<DeviceInfo[]> {
    const result = await this.executeSql('SELECT * FROM devices WHERE user_id = ?', [userId]);
    const devices: DeviceInfo[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      devices.push(this._mapDevice(result[0].rows.item(i)));
    }
    return devices;
  }

  async getOnlineDevices(): Promise<DeviceInfo[]> {
    const result = await this.executeSql('SELECT * FROM devices WHERE is_online = 1');
    const devices: DeviceInfo[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      devices.push(this._mapDevice(result[0].rows.item(i)));
    }
    return devices;
  }

  async updateDeviceOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    await this.executeSql(
      'UPDATE devices SET is_online = ?, last_seen = ? WHERE id = ?',
      [isOnline ? 1 : 0, Date.now(), id]
    );
  }

  private _mapDevice(row: any): DeviceInfo {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      platform: row.platform,
      platformVersion: row.platform_version,
      appVersion: row.app_version,
      localIp: row.local_ip,
      publicIp: row.public_ip,
      macAddress: row.mac_address,
      isOnline: row.is_online === 1,
      lastSeen: row.last_seen,
      capabilities: JSON.parse(row.capabilities),
      networkSegment: row.network_segment,
      signalStrength: row.signal_strength,
      isTrusted: row.is_trusted === 1,
      isRelay: row.is_relay === 1,
      pairedAt: row.paired_at,
    };
  }

  // Conversation operations
  async upsertConversation(conversation: Conversation): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO conversations (id, type, name, avatar, is_muted, is_pinned, created_at, updated_at, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        conversation.id,
        conversation.type,
        conversation.name || null,
        conversation.avatar || null,
        conversation.isMuted ? 1 : 0,
        conversation.isPinned ? 1 : 0,
        conversation.createdAt,
        conversation.updatedAt,
        JSON.stringify(conversation.settings),
      ]
    );
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const result = await this.executeSql('SELECT * FROM conversations WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    const conv = this._mapConversation(result[0].rows.item(0));
    conv.participants = await this.getConversationParticipants(id);
    return conv;
  }

  async getConversations(): Promise<Conversation[]> {
    const result = await this.executeSql(
      'SELECT * FROM conversations ORDER BY is_pinned DESC, updated_at DESC'
    );
    const conversations: Conversation[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const conv = this._mapConversation(result[0].rows.item(i));
      conv.participants = await this.getConversationParticipants(conv.id);
      conversations.push(conv);
    }
    return conversations;
  }

  async getConversationParticipants(conversationId: string): Promise<ConversationParticipant[]> {
    const result = await this.executeSql(
      'SELECT * FROM conversation_participants WHERE conversation_id = ?',
      [conversationId]
    );
    const participants: ConversationParticipant[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const row = result[0].rows.item(i);
      participants.push({
        userId: row.user_id,
        role: row.role,
        joinedAt: row.joined_at,
        lastReadMessageId: row.last_read_message_id,
        isActive: row.is_active === 1,
      });
    }
    return participants;
  }

  async upsertConversationParticipant(
    conversationId: string,
    participant: ConversationParticipant
  ): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO conversation_participants (conversation_id, user_id, role, joined_at, last_read_message_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        conversationId,
        participant.userId,
        participant.role,
        participant.joinedAt,
        participant.lastReadMessageId || null,
        participant.isActive ? 1 : 0,
      ]
    );
  }

  private _mapConversation(row: any): Conversation {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      avatar: row.avatar,
      participants: [],
      lastMessage: undefined,
      unreadCount: 0,
      isMuted: row.is_muted === 1,
      isPinned: row.is_pinned === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      settings: JSON.parse(row.settings),
    };
  }

  // Message operations
  async upsertMessage(message: Message): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO messages (id, conversation_id, sender_id, type, content, metadata, status, timestamp, delivered_at, read_at, edited_at, deleted_at, reply_to, reactions, is_local, encryption)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.conversationId,
        message.senderId,
        message.type,
        message.content,
        JSON.stringify(message.metadata || {}),
        message.status,
        message.timestamp,
        message.deliveredAt || null,
        message.readAt || null,
        message.editedAt || null,
        message.deletedAt || null,
        message.replyTo || null,
        JSON.stringify(message.reactions),
        message.isLocal ? 1 : 0,
        JSON.stringify(message.encryption),
      ]
    );
  }

  async getMessages(conversationId: string, limit = 50, before?: number): Promise<Message[]> {
    let sql = 'SELECT * FROM messages WHERE conversation_id = ? AND deleted_at IS NULL';
    const params: unknown[] = [conversationId];
    
    if (before) {
      sql += ' AND timestamp < ?';
      params.push(before);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const result = await this.executeSql(sql, params);
    const messages: Message[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      messages.push(this._mapMessage(result[0].rows.item(i)));
    }
    return messages.reverse();
  }

  async getMessage(id: string): Promise<Message | null> {
    const result = await this.executeSql('SELECT * FROM messages WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    return this._mapMessage(result[0].rows.item(0));
  }

  async updateMessageStatus(id: string, status: Message['status'], deliveredAt?: number, readAt?: number): Promise<void> {
    const updates: string[] = ['status = ?'];
    const params: unknown[] = [status];
    
    if (deliveredAt) {
      updates.push('delivered_at = ?');
      params.push(deliveredAt);
    }
    if (readAt) {
      updates.push('read_at = ?');
      params.push(readAt);
    }
    
    params.push(id);
    await this.executeSql(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  async markMessagesAsRead(conversationId: string, userId: string, messageId: string): Promise<void> {
    await this.executeSql(
      `UPDATE messages SET read_at = ?, status = 'read' 
       WHERE conversation_id = ? AND sender_id != ? AND timestamp <= (SELECT timestamp FROM messages WHERE id = ?) AND read_at IS NULL`,
      [Date.now(), conversationId, userId, messageId]
    );
    
    await this.executeSql(
      `UPDATE conversation_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?`,
      [messageId, conversationId, userId]
    );
  }

  private _mapMessage(row: any): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      type: row.type,
      content: row.content,
      metadata: JSON.parse(row.metadata || '{}'),
      status: row.status,
      timestamp: row.timestamp,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      editedAt: row.edited_at,
      deletedAt: row.deleted_at,
      replyTo: row.reply_to,
      reactions: JSON.parse(row.reactions || '[]'),
      isLocal: row.is_local === 1,
      encryption: JSON.parse(row.encryption),
    };
  }

  // File transfer operations
  async upsertFileTransfer(transfer: FileTransfer): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO file_transfers (id, conversation_id, sender_id, receiver_id, file_name, file_size, mime_type, local_path, remote_path, status, progress, chunks_total, chunks_transferred, checksum, started_at, completed_at, cancelled_at, error, is_paused, transfer_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer.id,
        transfer.conversationId,
        transfer.senderId,
        transfer.receiverId,
        transfer.fileName,
        transfer.fileSize,
        transfer.mimeType,
        transfer.localPath,
        transfer.remotePath || null,
        transfer.status,
        transfer.progress,
        transfer.chunksTotal,
        transfer.chunksTransferred,
        transfer.checksum,
        transfer.startedAt,
        transfer.completedAt || null,
        transfer.cancelledAt || null,
        transfer.error || null,
        transfer.isPaused ? 1 : 0,
        transfer.transferMode,
      ]
    );
  }

  async getFileTransfer(id: string): Promise<FileTransfer | null> {
    const result = await this.executeSql('SELECT * FROM file_transfers WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    return this._mapFileTransfer(result[0].rows.item(0));
  }

  async getFileTransfersByConversation(conversationId: string): Promise<FileTransfer[]> {
    const result = await this.executeSql(
      'SELECT * FROM file_transfers WHERE conversation_id = ? ORDER BY started_at DESC',
      [conversationId]
    );
    const transfers: FileTransfer[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      transfers.push(this._mapFileTransfer(result[0].rows.item(i)));
    }
    return transfers;
  }

  private _mapFileTransfer(row: any): FileTransfer {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      localPath: row.local_path,
      remotePath: row.remote_path,
      status: row.status,
      progress: row.progress,
      chunksTotal: row.chunks_total,
      chunksTransferred: row.chunks_transferred,
      checksum: row.checksum,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      error: row.error,
      isPaused: row.is_paused === 1,
      transferMode: row.transfer_mode,
    };
  }

  // Network peer operations
  async upsertNetworkPeer(peer: NetworkPeer): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO network_peers (id, device_id, user_id, name, ip, port, discovered_at, last_seen, discovery_method, reachable, latency, hops, network_segment, capabilities, is_relay, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        peer.id,
        peer.deviceId,
        peer.userId,
        peer.name,
        peer.ip,
        peer.port,
        peer.discoveredAt,
        peer.lastSeen,
        peer.discoveryMethod,
        peer.reachable ? 1 : 0,
        peer.latency || null,
        peer.hops || null,
        peer.networkSegment,
        JSON.stringify(peer.capabilities),
        peer.isRelay ? 1 : 0,
        peer.version,
      ]
    );
  }

  async getNetworkPeers(reachableOnly = true): Promise<NetworkPeer[]> {
    let sql = 'SELECT * FROM network_peers';
    if (reachableOnly) {
      sql += ' WHERE reachable = 1';
    }
    sql += ' ORDER BY last_seen DESC';
    
    const result = await this.executeSql(sql);
    const peers: NetworkPeer[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      peers.push(this._mapNetworkPeer(result[0].rows.item(i)));
    }
    return peers;
  }

  async updatePeerReachability(id: string, reachable: boolean, latency?: number): Promise<void> {
    await this.executeSql(
      'UPDATE network_peers SET reachable = ?, last_seen = ?, latency = ? WHERE id = ?',
      [reachable ? 1 : 0, Date.now(), latency || null, id]
    );
  }

  private _mapNetworkPeer(row: any): NetworkPeer {
    return {
      id: row.id,
      deviceId: row.device_id,
      userId: row.user_id,
      name: row.name,
      ip: row.ip,
      port: row.port,
      discoveredAt: row.discovered_at,
      lastSeen: row.last_seen,
      discoveryMethod: row.discovery_method,
      reachable: row.reachable === 1,
      latency: row.latency,
      hops: row.hops,
      networkSegment: row.network_segment,
      capabilities: JSON.parse(row.capabilities),
      isRelay: row.is_relay === 1,
      version: row.version,
    };
  }

  // Pairing operations
  async upsertPairingRequest(request: PairingRequest): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO pairing_requests (id, from_device_id, from_user_id, from_user_name, from_public_key, to_device_id, to_user_id, code, qr_data, status, created_at, expires_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request.id,
        request.fromDeviceId,
        request.fromUserId,
        request.fromUserName,
        request.fromPublicKey,
        request.toDeviceId || null,
        request.toUserId || null,
        request.code,
        request.qrData,
        request.status,
        request.createdAt,
        request.expiresAt,
        request.completedAt || null,
      ]
    );
  }

  async getPairingRequest(id: string): Promise<PairingRequest | null> {
    const result = await this.executeSql('SELECT * FROM pairing_requests WHERE id = ?', [id]);
    if (result[0].rows.length === 0) return null;
    return this._mapPairingRequest(result[0].rows.item(0));
  }

  async getPendingPairingRequests(): Promise<PairingRequest[]> {
    const result = await this.executeSql(
      "SELECT * FROM pairing_requests WHERE status = 'pending' AND expires_at > ? ORDER BY created_at DESC",
      [Date.now()]
    );
    const requests: PairingRequest[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      requests.push(this._mapPairingRequest(result[0].rows.item(i)));
    }
    return requests;
  }

  private _mapPairingRequest(row: any): PairingRequest {
    return {
      id: row.id,
      fromDeviceId: row.from_device_id,
      fromUserId: row.from_user_id,
      fromUserName: row.from_user_name,
      fromPublicKey: row.from_public_key,
      toDeviceId: row.to_device_id,
      toUserId: row.to_user_id,
      code: row.code,
      qrData: row.qr_data,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      completedAt: row.completed_at,
    };
  }

  // Trusted devices
  async upsertTrustedDevice(device: TrustedDevice): Promise<void> {
    await this.executeSql(
      `INSERT OR REPLACE INTO trusted_devices (device_id, user_id, name, fingerprint, public_key, trusted_at, last_verified, is_revoked, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device.deviceId,
        device.userId,
        device.name,
        device.fingerprint,
        device.publicKey,
        device.trustedAt,
        device.lastVerified,
        device.isRevoked ? 1 : 0,
        device.revokedAt || null,
      ]
    );
  }

  async isDeviceTrusted(deviceId: string): Promise<boolean> {
    const result = await this.executeSql(
      'SELECT 1 FROM trusted_devices WHERE device_id = ? AND is_revoked = 0',
      [deviceId]
    );
    return result[0].rows.length > 0;
  }

  async getTrustedDevices(): Promise<TrustedDevice[]> {
    const result = await this.executeSql('SELECT * FROM trusted_devices WHERE is_revoked = 0');
    const devices: TrustedDevice[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      devices.push(this._mapTrustedDevice(result[0].rows.item(i)));
    }
    return devices;
  }

  private _mapTrustedDevice(row: any): TrustedDevice {
    return {
      deviceId: row.device_id,
      userId: row.user_id,
      name: row.name,
      fingerprint: row.fingerprint,
      publicKey: row.public_key,
      trustedAt: row.trusted_at,
      lastVerified: row.last_verified,
      isRevoked: row.is_revoked === 1,
      revokedAt: row.revoked_at,
    };
  }

  // Notifications
  async insertNotification(notification: Notification): Promise<void> {
    await this.executeSql(
      `INSERT INTO notifications (id, type, title, body, data, timestamp, read, action_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        notification.id,
        notification.type,
        notification.title,
        notification.body,
        JSON.stringify(notification.data || {}),
        notification.timestamp,
        notification.read ? 1 : 0,
        notification.actionUrl || null,
      ]
    );
  }

  async getNotifications(limit = 50): Promise<Notification[]> {
    const result = await this.executeSql(
      'SELECT * FROM notifications ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
    const notifications: Notification[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      notifications.push(this._mapNotification(result[0].rows.item(i)));
    }
    return notifications;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.executeSql('UPDATE notifications SET read = 1 WHERE id = ?', [id]);
  }

  private _mapNotification(row: any): Notification {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      data: JSON.parse(row.data || '{}'),
      timestamp: row.timestamp,
      read: row.read === 1,
      actionUrl: row.action_url,
    };
  }

  // Settings
  async setSetting(key: string, value: unknown): Promise<void> {
    await this.executeSql(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  }

  async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const result = await this.executeSql('SELECT value FROM app_settings WHERE key = ?', [key]);
    if (result[0].rows.length === 0) return defaultValue;
    try {
      return JSON.parse(result[0].rows.item(0).value);
    } catch {
      return defaultValue;
    }
  }
}

export const databaseService = new DatabaseService();
export default databaseService;