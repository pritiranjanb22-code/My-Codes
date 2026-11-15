import { EventEmitter } from 'events';
import { Message, Conversation, ConversationParticipant, MessageStatus, MessageType } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { transportService } from './TransportService';
import { discoveryService } from './DiscoveryService';
import { nanoid } from 'nanoid';
import { createHash, randomBytes } from 'crypto';

const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  VOICE_NOTE: 'voice_note',
  FILE: 'file',
  SYSTEM: 'system',
  CALL_LOG: 'call_log',
  TYPING: 'typing',
  READ_RECEIPT: 'read_receipt',
  DELIVERY_RECEIPT: 'delivery_receipt',
  REACTION: 'reaction',
  EDIT: 'edit',
  DELETE: 'delete',
};

interface OutgoingMessage {
  conversationId: string;
  type: MessageType;
  content: string;
  metadata?: any;
  replyTo?: string;
  tempId: string;
}

class MessagingService extends EventEmitter {
  private messageQueue: Map<string, OutgoingMessage[]> = new Map();
  private pendingAcknowledgments: Map<string, { message: Message; resolve: (value: Message) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private encryptionKeys: Map<string, CryptoKey> = new Map();

  constructor() {
    super();
    this.setupTransportHandlers();
  }

  private setupTransportHandlers(): void {
    transportService.registerHandler(MESSAGE_TYPES.TEXT, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.IMAGE, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.VIDEO, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.AUDIO, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.DOCUMENT, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.VOICE_NOTE, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.FILE, this.handleIncomingMessage.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.TYPING, this.handleTypingIndicator.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.READ_RECEIPT, this.handleReadReceipt.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.DELIVERY_RECEIPT, this.handleDeliveryReceipt.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.REACTION, this.handleReaction.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.EDIT, this.handleEdit.bind(this));
    transportService.registerHandler(MESSAGE_TYPES.DELETE, this.handleDelete.bind(this));
  }

  async sendMessage(
    conversationId: string,
    type: MessageType,
    content: string,
    metadata?: any,
    replyTo?: string
  ): Promise<Message> {
    const tempId = nanoid();
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const conversation = await databaseService.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message: Message = {
      id: tempId,
      conversationId,
      senderId: currentUserId,
      type,
      content,
      metadata,
      status: 'sending',
      timestamp: Date.now(),
      replyTo,
      reactions: [],
      isLocal: true,
      encryption: {
        algorithm: 'AES-GCM-256',
        keyExchange: 'ECDH-P256',
        verified: true,
        fingerprint: '',
      },
    };

    await databaseService.upsertMessage(message);
    this.emit('messageSent', message);

    if (conversation.type === 'direct') {
      const recipientId = conversation.participants.find(p => p.userId !== currentUserId)?.userId;
      if (recipientId) {
        await this.deliverMessage(message, recipientId);
      }
    } else if (conversation.type === 'group') {
      for (const participant of conversation.participants) {
        if (participant.userId !== currentUserId && participant.isActive) {
          await this.deliverMessage(message, participant.userId);
        }
      }
    }

    return message;
  }

  private async deliverMessage(message: Message, recipientId: string): Promise<void> {
    const peer = this.findPeerForUser(recipientId);
    
    if (peer && transportService.isConnected(peer.id)) {
      try {
        const encrypted = await this.encryptMessage(message, peer.id);
        await transportService.send(peer.id, encrypted);
        message.status = 'sent';
        message.isLocal = true;
      } catch (error) {
        console.error('[MessagingService] Failed to send via transport:', error);
        await this.queueMessage(message, recipientId);
      }
    } else {
      await this.queueMessage(message, recipientId);
    }

    await databaseService.upsertMessage(message);
    this.emit('messageStatusChanged', message);
  }

  private async queueMessage(message: Message, recipientId: string): Promise<void> {
    const queue = this.messageQueue.get(recipientId) || [];
    queue.push({
      conversationId: message.conversationId,
      type: message.type,
      content: message.content,
      metadata: message.metadata,
      replyTo: message.replyTo,
      tempId: message.id,
    });
    this.messageQueue.set(recipientId, queue);
    message.status = 'pending';
  }

  private findPeerForUser(userId: string): any {
    const peers = discoveryService.getPeers();
    return peers.find(p => p.userId === userId);
  }

  private async encryptMessage(message: Message, peerId: string): Promise<Uint8Array> {
    const key = await this.getOrCreateEncryptionKey(peerId);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));
    
    const iv = randomBytes(12);
    const crypto = require('crypto');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private async getOrCreateEncryptionKey(peerId: string): Promise<Buffer> {
    if (this.encryptionKeys.has(peerId)) {
      return this.encryptionKeys.get(peerId)!;
    }

    const peer = discoveryService.getPeer(peerId);
    if (!peer) throw new Error('Peer not found');

    const sharedSecret = identityService.computeSharedSecret(peer.id);
    const key = createHash('sha256').update(sharedSecret).digest();
    
    this.encryptionKeys.set(peerId, key);
    return key;
  }

  private async handleIncomingMessage(data: Uint8Array): Promise<void> {
    try {
      const peerId = this.getPeerIdFromData(data);
      const key = await this.getOrCreateEncryptionKey(peerId);
      const decrypted = await this.decryptMessage(data, key);
      const message = JSON.parse(new TextDecoder().decode(decrypted)) as Message;

      message.isLocal = false;
      message.status = 'delivered';
      
      await databaseService.upsertMessage(message);
      this.emit('messageReceived', message);

      await this.sendDeliveryReceipt(message);
    } catch (error) {
      console.error('[MessagingService] Failed to handle incoming message:', error);
    }
  }

  private getPeerIdFromData(data: Uint8Array): string {
    return 'peer-id-placeholder';
  }

  private async decryptMessage(data: Uint8Array, key: Buffer): Promise<Uint8Array> {
    const iv = data.slice(0, 12);
    const authTag = data.slice(12, 28);
    const encrypted = data.slice(28);
    
    const crypto = require('crypto');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  private async sendDeliveryReceipt(message: Message): Promise<void> {
    const receipt = {
      type: MESSAGE_TYPES.DELIVERY_RECEIPT,
      messageId: message.id,
      conversationId: message.conversationId,
      timestamp: Date.now(),
    };
    
    const peer = this.findPeerForUser(message.senderId);
    if (peer && transportService.isConnected(peer.id)) {
      await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(receipt)));
    }
  }

  private async handleDeliveryReceipt(data: Uint8Array): Promise<void> {
    const receipt = JSON.parse(new TextDecoder().decode(data));
    const message = await databaseService.getMessage(receipt.messageId);
    if (message) {
      message.status = 'delivered';
      message.deliveredAt = receipt.timestamp;
      await databaseService.upsertMessage(message);
      this.emit('messageStatusChanged', message);
    }
  }

  private async handleReadReceipt(data: Uint8Array): Promise<void> {
    const receipt = JSON.parse(new TextDecoder().decode(data));
    const message = await databaseService.getMessage(receipt.messageId);
    if (message) {
      message.status = 'read';
      message.readAt = receipt.timestamp;
      await databaseService.upsertMessage(message);
      this.emit('messageStatusChanged', message);
    }
  }

  async sendReadReceipt(messageId: string, conversationId: string): Promise<void> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const receipt = {
      type: MESSAGE_TYPES.READ_RECEIPT,
      messageId,
      conversationId,
      userId: currentUserId,
      timestamp: Date.now(),
    };

    const conversation = await databaseService.getConversation(conversationId);
    if (!conversation) return;

    for (const participant of conversation.participants) {
      if (participant.userId !== currentUserId) {
        const peer = this.findPeerForUser(participant.userId);
        if (peer && transportService.isConnected(peer.id)) {
          await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(receipt)));
        }
      }
    }
  }

  private async handleTypingIndicator(data: Uint8Array): Promise<void> {
    const indicator = JSON.parse(new TextDecoder().decode(data));
    this.emit('typing', indicator);
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const indicator = {
      type: MESSAGE_TYPES.TYPING,
      conversationId,
      userId: currentUserId,
      isTyping,
      timestamp: Date.now(),
    };

    const conversation = databaseService.getConversation(conversationId);
    if (!conversation) return;

    for (const participant of conversation.participants) {
      if (participant.userId !== currentUserId) {
        const peer = this.findPeerForUser(participant.userId);
        if (peer && transportService.isConnected(peer.id)) {
          transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(indicator)));
        }
      }
    }
  }

  private async handleReaction(data: Uint8Array): Promise<void> {
    const reaction = JSON.parse(new TextDecoder().decode(data));
    const message = await databaseService.getMessage(reaction.messageId);
    if (message) {
      const existing = message.reactions.find(r => r.emoji === reaction.emoji);
      if (existing) {
        if (!existing.userIds.includes(reaction.userId)) {
          existing.userIds.push(reaction.userId);
          existing.count++;
        }
      } else {
        message.reactions.push({
          emoji: reaction.emoji,
          userIds: [reaction.userId],
          count: 1,
        });
      }
      await databaseService.upsertMessage(message);
      this.emit('reactionChanged', message);
    }
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const reaction = {
      type: MESSAGE_TYPES.REACTION,
      messageId,
      emoji,
      userId: currentUserId,
      timestamp: Date.now(),
    };

    const message = await databaseService.getMessage(messageId);
    if (!message) return;

    const conversation = await databaseService.getConversation(message.conversationId);
    if (!conversation) return;

    for (const participant of conversation.participants) {
      if (participant.userId !== currentUserId) {
        const peer = this.findPeerForUser(participant.userId);
        if (peer && transportService.isConnected(peer.id)) {
          await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(reaction)));
        }
      }
    }
  }

  private async handleEdit(data: Uint8Array): Promise<void> {
    const edit = JSON.parse(new TextDecoder().decode(data));
    const message = await databaseService.getMessage(edit.messageId);
    if (message) {
      message.content = edit.content;
      message.editedAt = edit.timestamp;
      await databaseService.upsertMessage(message);
      this.emit('messageEdited', message);
    }
  }

  async editMessage(messageId: string, content: string): Promise<void> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const message = await databaseService.getMessage(messageId);
    if (!message || message.senderId !== currentUserId) return;

    const edit = {
      type: MESSAGE_TYPES.EDIT,
      messageId,
      content,
      timestamp: Date.now(),
    };

    message.content = content;
    message.editedAt = Date.now();
    await databaseService.upsertMessage(message);

    const conversation = await databaseService.getConversation(message.conversationId);
    if (!conversation) return;

    for (const participant of conversation.participants) {
      if (participant.userId !== currentUserId) {
        const peer = this.findPeerForUser(participant.userId);
        if (peer && transportService.isConnected(peer.id)) {
          await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(edit)));
        }
      }
    }

    this.emit('messageEdited', message);
  }

  private async handleDelete(data: Uint8Array): Promise<void> {
    const del = JSON.parse(new TextDecoder().decode(data));
    const message = await databaseService.getMessage(del.messageId);
    if (message) {
      message.deletedAt = del.timestamp;
      message.content = 'This message was deleted';
      await databaseService.upsertMessage(message);
      this.emit('messageDeleted', message);
    }
  }

  async deleteMessage(messageId: string, forEveryone = false): Promise<void> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const message = await databaseService.getMessage(messageId);
    if (!message || message.senderId !== currentUserId) return;

    if (forEveryone) {
      const del = {
        type: MESSAGE_TYPES.DELETE,
        messageId,
        timestamp: Date.now(),
      };

      const conversation = await databaseService.getConversation(message.conversationId);
      if (conversation) {
        for (const participant of conversation.participants) {
          if (participant.userId !== currentUserId) {
            const peer = this.findPeerForUser(participant.userId);
            if (peer && transportService.isConnected(peer.id)) {
              await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(del)));
            }
          }
        }
      }
    }

    message.deletedAt = Date.now();
    message.content = 'This message was deleted';
    await databaseService.upsertMessage(message);
    this.emit('messageDeleted', message);
  }

  async createDirectConversation(otherUserId: string): Promise<Conversation> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const existingConversations = await databaseService.getConversations();
    const existing = existingConversations.find(c => 
      c.type === 'direct' && 
      c.participants.length === 2 &&
      c.participants.some(p => p.userId === currentUserId) &&
      c.participants.some(p => p.userId === otherUserId)
    );

    if (existing) return existing;

    const currentUser = await databaseService.getUser(currentUserId);
    const otherUser = await databaseService.getUser(otherUserId);
    if (!currentUser || !otherUser) throw new Error('User not found');

    const conversationId = nanoid();
    const now = Date.now();

    const conversation: Conversation = {
      id: conversationId,
      type: 'direct',
      participants: [
        { userId: currentUserId, role: 'member', joinedAt: now, isActive: true },
        { userId: otherUserId, role: 'member', joinedAt: now, isActive: true },
      ],
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      settings: {
        disappearingMessages: false,
        encryptionEnabled: true,
        onlyAdminsCanPost: false,
        onlyAdminsCanEditInfo: false,
      },
    };

    await databaseService.upsertConversation(conversation);
    for (const participant of conversation.participants) {
      await databaseService.upsertConversationParticipant(conversationId, participant);
    }

    this.emit('conversationCreated', conversation);
    return conversation;
  }

  async createGroupConversation(name: string, memberIds: string[], avatar?: string): Promise<Conversation> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const allMemberIds = [...new Set([currentUserId, ...memberIds])];
    const conversationId = nanoid();
    const now = Date.now();

    const conversation: Conversation = {
      id: conversationId,
      type: 'group',
      name,
      avatar,
      participants: allMemberIds.map((userId, index) => ({
        userId,
        role: userId === currentUserId ? 'owner' : 'member',
        joinedAt: now,
        isActive: true,
      })),
      unreadCount: 0,
      isMuted: false,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
      settings: {
        disappearingMessages: false,
        encryptionEnabled: true,
        onlyAdminsCanPost: false,
        onlyAdminsCanEditInfo: true,
      },
    };

    await databaseService.upsertConversation(conversation);
    for (const participant of conversation.participants) {
      await databaseService.upsertConversationParticipant(conversationId, participant);
    }

    this.emit('conversationCreated', conversation);
    return conversation;
  }

  async getMessages(conversationId: string, limit = 50, before?: number): Promise<Message[]> {
    return databaseService.getMessages(conversationId, limit, before);
  }

  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    await databaseService.markMessagesAsRead(conversationId, currentUserId, messageId);
    await this.sendReadReceipt(messageId, conversationId);
  }

  processPendingMessages(): void {
    for (const [recipientId, queue] of this.messageQueue.entries()) {
      const peer = this.findPeerForUser(recipientId);
      if (peer && transportService.isConnected(peer.id)) {
        const messages = [...queue];
        this.messageQueue.set(recipientId, []);
        
        for (const msg of messages) {
          this.sendMessage(msg.conversationId, msg.type, msg.content, msg.metadata, msg.replyTo);
        }
      }
    }
  }

  onMessageReceived(callback: (message: Message) => void): () => void {
    this.on('messageReceived', callback);
    return () => this.off('messageReceived', callback);
  }

  onMessageStatusChanged(callback: (message: Message) => void): () => void {
    this.on('messageStatusChanged', callback);
    return () => this.off('messageStatusChanged', callback);
  }

  onTyping(callback: (indicator: any) => void): () => void {
    this.on('typing', callback);
    return () => this.off('typing', callback);
  }
}

export const messagingService = new MessagingService();
export default messagingService;