import { EventEmitter } from 'events';
import { WalkieTalkieChannel, ChannelMember, ChannelType, ChannelRole, ChannelSettings, NetworkPeer } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { discoveryService } from './DiscoveryService';
import { transportService } from './TransportService';
import { nanoid } from 'nanoid';

const WALKIE_TALKIE_PORT = 8485;
const AUDIO_SAMPLE_RATE = 48000;
const AUDIO_CHANNELS = 1;
const FRAME_DURATION_MS = 20;
const MAX_SPEAKERS = 1;

interface AudioFrame {
  sequenceNumber: number;
  timestamp: number;
  data: Uint8Array;
  speakerId: string;
}

class WalkieTalkieService extends EventEmitter {
  private channels: Map<string, WalkieTalkieChannel> = new Map();
  private activeChannelId: string | null = null;
  private isTransmitting = false;
  private isListening = false;
  private currentSpeaker: string | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private sequenceNumber = 0;
  private speakersQueue: Set<string> = new Set();
  private lockMode = false;
  private vadEnabled = false;
  private vadThreshold = 0.01;
  private playbackBuffers: Map<string, AudioBuffer[]> = new Map();

  constructor() {
    super();
    this.setupTransportHandlers();
  }

  private setupTransportHandlers(): void {
    transportService.registerHandler('walkie_audio', this.handleIncomingAudio.bind(this));
    transportService.registerHandler('walkie_control', this.handleControlMessage.bind(this));
  }

  async initialize(): Promise<void> {
    const channels = await this.loadChannels();
    for (const channel of channels) {
      this.channels.set(channel.id, channel);
    }

    if (Platform.OS === 'web') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_SAMPLE_RATE,
      });
    }
  }

  private async loadChannels(): Promise<WalkieTalkieChannel[]> {
    // Load from database
    return [];
  }

  async createChannel(
    name: string,
    type: ChannelType = 'open',
    description?: string,
    settings?: Partial<ChannelSettings>
  ): Promise<WalkieTalkieChannel> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const channelId = nanoid();
    const now = Date.now();

    const defaultSettings: ChannelSettings = {
      maxSpeakers: type === 'emergency' ? 1 : 3,
      priority: type === 'emergency' ? 100 : type === 'announcement' ? 50 : 10,
      allowTextChat: true,
      recordTransmissions: false,
      autoJoin: type === 'open',
      ...settings,
    };

    const channel: WalkieTalkieChannel = {
      id: channelId,
      name,
      description,
      type,
      ownerId: currentUserId,
      members: [{
        userId: currentUserId,
        role: 'owner',
        joinedAt: now,
        isListening: true,
        canSpeak: true,
      }],
      settings: defaultSettings,
      isPriority: type === 'emergency' || type === 'announcement',
      createdAt: now,
      updatedAt: now,
    };

    this.channels.set(channelId, channel);
    await this.persistChannel(channel);
    this.emit('channelCreated', channel);
    return channel;
  }

  async joinChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const existingMember = channel.members.find(m => m.userId === currentUserId);
    if (existingMember) {
      existingMember.isListening = true;
    } else {
      const canSpeak = channel.settings.autoJoin || channel.members.length === 0;
      channel.members.push({
        userId: currentUserId,
        role: canSpeak ? 'speaker' : 'listener',
        joinedAt: Date.now(),
        isListening: true,
        canSpeak,
      });
    }

    channel.updatedAt = Date.now();
    await this.persistChannel(channel);

    if (channel.settings.autoJoin || existingMember) {
      await this.startListening(channelId);
    }

    this.emit('channelJoined', channel);
  }

  async leaveChannel(channelId: string): Promise<void> {
    await this.stopListening(channelId);
    await this.stopTransmitting();

    const channel = this.channels.get(channelId);
    if (!channel) return;

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    channel.members = channel.members.filter(m => m.userId !== currentUserId);
    channel.updatedAt = Date.now();
    await this.persistChannel(channel);

    if (this.activeChannelId === channelId) {
      this.activeChannelId = null;
    }

    this.emit('channelLeft', channelId);
  }

  async startListening(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('Channel not found');

    this.activeChannelId = channelId;
    this.isListening = true;

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const member = channel.members.find(m => m.userId === currentUserId);
    if (member) {
      member.isListening = true;
    }

    const peers = this.getChannelPeers(channel);
    for (const peer of peers) {
      if (transportService.isConnected(peer.id)) {
        await this.sendControlMessage(peer.id, {
          type: 'join',
          channelId,
          userId: currentUserId,
        });
      }
    }

    this.emit('listeningStarted', channel);
  }

  async stopListening(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    this.isListening = false;

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const member = channel.members.find(m => m.userId === currentUserId);
    if (member) {
      member.isListening = false;
    }

    const peers = this.getChannelPeers(channel);
    for (const peer of peers) {
      if (transportService.isConnected(peer.id)) {
        await this.sendControlMessage(peer.id, {
          type: 'leave',
          channelId,
          userId: currentUserId,
        });
      }
    }

    this.emit('listeningStopped', channelId);
  }

  async startTransmitting(): Promise<void> {
    if (this.isTransmitting) return;
    if (!this.activeChannelId) throw new Error('No active channel');

    const channel = this.channels.get(this.activeChannelId);
    if (!channel) throw new Error('Channel not found');

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const member = channel.members.find(m => m.userId === currentUserId);
    if (!member || !member.canSpeak) {
      throw new Error('You do not have permission to speak');
    }

    if (channel.currentSpeaker && channel.currentSpeaker !== currentUserId) {
      if (channel.isPriority && channel.settings.priority > 50) {
        await this.interruptCurrentSpeaker(channel);
      } else {
        throw new Error(`${channel.currentSpeaker} is currently speaking`);
      }
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_SAMPLE_RATE,
          channelCount: AUDIO_CHANNELS,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = this.audioContext || new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.audioProcessor.onaudioprocess = this.processAudio.bind(this);
      
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      this.isTransmitting = true;
      this.currentSpeaker = currentUserId;
      channel.currentSpeaker = currentUserId;

      const peers = this.getChannelPeers(channel);
      for (const peer of peers) {
        if (transportService.isConnected(peer.id)) {
          await this.sendControlMessage(peer.id, {
            type: 'start_speaking',
            channelId: this.activeChannelId,
            speakerId: currentUserId,
            speakerName: identityService.getCurrentUserId(),
          });
        }
      }

      this.emit('transmissionStarted', { channelId: this.activeChannelId, speakerId: currentUserId });
    } catch (error) {
      console.error('[WalkieTalkie] Failed to start transmitting:', error);
      throw error;
    }
  }

  async stopTransmitting(): Promise<void> {
    if (!this.isTransmitting) return;

    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.isTransmitting = false;
    const speakerId = this.currentSpeaker;
    this.currentSpeaker = null;

    if (this.activeChannelId) {
      const channel = this.channels.get(this.activeChannelId);
      if (channel) {
        channel.currentSpeaker = undefined;
      }

      const peers = this.getChannelPeers(channel!);
      for (const peer of peers) {
        if (transportService.isConnected(peer.id)) {
          await this.sendControlMessage(peer.id, {
            type: 'stop_speaking',
            channelId: this.activeChannelId,
            speakerId,
          });
        }
      }
    }

    this.emit('transmissionStopped', { channelId: this.activeChannelId, speakerId });
  }

  toggleLockMode(): void {
    this.lockMode = !this.lockMode;
    if (!this.lockMode && this.isTransmitting) {
      this.stopTransmitting();
    }
    this.emit('lockModeChanged', this.lockMode);
  }

  isLocked(): boolean {
    return this.lockMode;
  }

  setVADEnabled(enabled: boolean, threshold = 0.01): void {
    this.vadEnabled = enabled;
    this.vadThreshold = threshold;
  }

  private processAudio(event: AudioProcessingEvent): void {
    if (!this.isTransmitting) return;

    const inputBuffer = event.inputBuffer.getChannelData(0);
    
    if (this.vadEnabled) {
      const rms = this.calculateRMS(inputBuffer);
      if (rms < this.vadThreshold) return;
    }

    const pcmData = new Int16Array(inputBuffer.length);
    for (let i = 0; i < inputBuffer.length; i++) {
      const s = Math.max(-1, Math.min(1, inputBuffer[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    const frame: AudioFrame = {
      sequenceNumber: this.sequenceNumber++,
      timestamp: Date.now(),
      data: new Uint8Array(pcmData.buffer),
      speakerId: identityService.getCurrentUserId() || '',
    };

    this.broadcastAudio(frame);
  }

  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  private async broadcastAudio(frame: AudioFrame): Promise<void> {
    if (!this.activeChannelId) return;

    const channel = this.channels.get(this.activeChannelId);
    if (!channel) return;

    const message = {
      type: 'walkie_audio',
      channelId: this.activeChannelId,
      frame,
    };

    const data = new TextEncoder().encode(JSON.stringify(message));
    const peers = this.getChannelPeers(channel);
    
    for (const peer of peers) {
      if (transportService.isConnected(peer.id)) {
        try {
          await transportService.send(peer.id, data);
        } catch (error) {
          console.warn('[WalkieTalkie] Failed to send audio to peer:', peer.id, error);
        }
      }
    }
  }

  private async handleIncomingAudio(data: Uint8Array): Promise<void> {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      const { channelId, frame } = message;

      const channel = this.channels.get(channelId);
      if (!channel) return;

      if (frame.speakerId !== identityService.getCurrentUserId()) {
        this.playAudioFrame(frame, channelId);
      }

      this.emit('audioReceived', { channelId, frame });
    } catch (error) {
      console.error('[WalkieTalkie] Failed to handle incoming audio:', error);
    }
  }

  private playAudioFrame(frame: AudioFrame, channelId: string): void {
    if (!this.audioContext) return;

    const buffer = this.audioContext.createBuffer(1, frame.data.length / 2, AUDIO_SAMPLE_RATE);
    const channelData = buffer.getChannelData(0);
    const int16Data = new Int16Array(frame.data.buffer);
    
    for (let i = 0; i < int16Data.length; i++) {
      channelData[i] = int16Data[i] / 0x8000;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  private async handleControlMessage(data: Uint8Array): Promise<void> {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      const { type, channelId, speakerId, speakerName, userId } = message;

      const channel = this.channels.get(channelId);
      if (!channel) return;

      switch (type) {
        case 'start_speaking':
          channel.currentSpeaker = speakerId;
          this.emit('speakerStarted', { channelId, speakerId, speakerName });
          break;
        case 'stop_speaking':
          if (channel.currentSpeaker === speakerId) {
            channel.currentSpeaker = undefined;
          }
          this.emit('speakerStopped', { channelId, speakerId });
          break;
        case 'join':
          this.emit('memberJoined', { channelId, userId });
          break;
        case 'leave':
          this.emit('memberLeft', { channelId, userId });
          break;
      }
    } catch (error) {
      console.error('[WalkieTalkie] Failed to handle control message:', error);
    }
  }

  private async sendControlMessage(peerId: string, message: any): Promise<void> {
    const data = new TextEncoder().encode(JSON.stringify({ type: 'walkie_control', ...message }));
    await transportService.send(peerId, data);
  }

  private async interruptCurrentSpeaker(channel: WalkieTalkieChannel): Promise<void> {
    if (!channel.currentSpeaker) return;

    const peers = this.getChannelPeers(channel);
    for (const peer of peers) {
      if (transportService.isConnected(peer.id)) {
        await this.sendControlMessage(peer.id, {
          type: 'interrupt',
          channelId: channel.id,
          interruptedSpeakerId: channel.currentSpeaker,
        });
      }
    }

    channel.currentSpeaker = undefined;
  }

  private getChannelPeers(channel: WalkieTalkieChannel): NetworkPeer[] {
    const memberIds = channel.members.filter(m => m.isListening).map(m => m.userId);
    const peers = discoveryService.getPeers();
    return peers.filter(p => memberIds.includes(p.userId));
  }

  private async persistChannel(channel: WalkieTalkieChannel): Promise<void> {
    // Persist to database
  }

  getChannels(): WalkieTalkieChannel[] {
    return Array.from(this.channels.values());
  }

  getChannel(channelId: string): WalkieTalkieChannel | undefined {
    return this.channels.get(channelId);
  }

  getActiveChannel(): WalkieTalkieChannel | null {
    return this.activeChannelId ? this.channels.get(this.activeChannelId) || null : null;
  }

  isTransmittingAudio(): boolean {
    return this.isTransmitting;
  }

  isListeningToChannel(): boolean {
    return this.isListening;
  }

  getCurrentSpeaker(): string | null {
    return this.currentSpeaker;
  }

  getChannelMembers(channelId: string): ChannelMember[] {
    const channel = this.channels.get(channelId);
    return channel?.members || [];
  }

  async setMemberRole(channelId: string, userId: string, role: ChannelRole): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) throw new Error('Channel not found');

    const member = channel.members.find(m => m.userId === userId);
    if (member) {
      member.role = role;
      member.canSpeak = role === 'speaker' || role === 'moderator' || role === 'owner';
      channel.updatedAt = Date.now();
      await this.persistChannel(channel);
      this.emit('memberRoleChanged', { channelId, userId, role });
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    if (this.activeChannelId === channelId) {
      await this.leaveChannel(channelId);
    }

    this.channels.delete(channelId);
    this.emit('channelDeleted', channelId);
  }

  onTransmissionStarted(callback: (data: { channelId: string; speakerId: string }) => void): () => void {
    this.on('transmissionStarted', callback);
    return () => this.off('transmissionStarted', callback);
  }

  onTransmissionStopped(callback: (data: { channelId: string; speakerId: string }) => void): () => void {
    this.on('transmissionStopped', callback);
    return () => this.off('transmissionStopped', callback);
  }

  onSpeakerStarted(callback: (data: { channelId: string; speakerId: string; speakerName: string }) => void): () => void {
    this.on('speakerStarted', callback);
    return () => this.off('speakerStarted', callback);
  }

  onSpeakerStopped(callback: (data: { channelId: string; speakerId: string }) => void): () => void {
    this.on('speakerStopped', callback);
    return () => this.off('speakerStopped', callback);
  }

  onAudioReceived(callback: (data: { channelId: string; frame: AudioFrame }) => void): () => void {
    this.on('audioReceived', callback);
    return () => this.off('audioReceived', callback);
  }
}

export const walkieTalkieService = new WalkieTalkieService();
export default walkieTalkieService;