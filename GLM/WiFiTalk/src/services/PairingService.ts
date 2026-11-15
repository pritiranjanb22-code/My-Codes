import { EventEmitter } from 'events';
import { PairingRequest, PairingStatus, UserProfile, DeviceInfo } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { discoveryService } from './DiscoveryService';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import QRCode from 'react-native-qrcode-svg';

const PAIRING_CODE_LENGTH = 6;
const PAIRING_EXPIRY_MS = 10 * 60 * 1000;
const QR_VERSION = '1.0';

interface PairingData {
  version: string;
  type: 'pairing';
  deviceId: string;
  userId: string;
  userName: string;
  wifitalkId: string;
  publicKey: string;
  fingerprint: string;
  capabilities: any;
  timestamp: number;
  nonce: string;
}

class PairingService extends EventEmitter {
  private pendingRequests: Map<string, PairingRequest> = new Map();
  private pairingCode: string | null = null;
  private pairingCodeExpiry: number = 0;

  async initialize(): Promise<void> {
    const pending = await databaseService.getPendingPairingRequests();
    for (const request of pending) {
      this.pendingRequests.set(request.id, request);
    }
  }

  async createPairingRequest(targetDeviceId?: string, targetUserId?: string): Promise<PairingRequest> {
    const currentUserId = identityService.getCurrentUserId();
    const currentDeviceId = identityService.getCurrentDeviceId();
    const user = currentUserId ? await databaseService.getUser(currentUserId) : null;
    const device = currentDeviceId ? await databaseService.getDevice(currentDeviceId) : null;

    if (!user || !device) throw new Error('User or device not found');

    const id = nanoid();
    const code = this.generatePairingCode();
    const pairingData = this.createPairingData(user, device);
    const qrData = this.encodePairingData(pairingData);

    const request: PairingRequest = {
      id,
      fromDeviceId: currentDeviceId!,
      fromUserId: currentUserId!,
      fromUserName: user.name,
      fromPublicKey: user.publicKey,
      toDeviceId: targetDeviceId,
      toUserId: targetUserId,
      code,
      qrData,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + PAIRING_EXPIRY_MS,
    };

    await databaseService.upsertPairingRequest(request);
    this.pendingRequests.set(id, request);
    this.pairingCode = code;
    this.pairingCodeExpiry = request.expiresAt;

    this.emit('pairingRequestCreated', request);
    return request;
  }

  private generatePairingCode(): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRTUVWXY';
    let code = '';
    for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private createPairingData(user: UserProfile, device: DeviceInfo): PairingData {
    return {
      version: QR_VERSION,
      type: 'pairing',
      deviceId: device.id,
      userId: user.id,
      userName: user.name,
      wifitalkId: user.wifitalkId,
      publicKey: user.publicKey,
      fingerprint: identityService.generateFingerprint(user.publicKey),
      capabilities: device.capabilities,
      timestamp: Date.now(),
      nonce: nanoid(16),
    };
  }

  private encodePairingData(data: PairingData): string {
    return `WIFITALK:${JSON.stringify(data)}`;
  }

  decodePairingData(qrData: string): PairingData | null {
    try {
      if (!qrData.startsWith('WIFITALK:')) return null;
      const json = qrData.substring(9);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  async processQRCode(qrData: string): Promise<PairingRequest | null> {
    const pairingData = this.decodePairingData(qrData);
    if (!pairingData) return null;

    const existingRequest = await this.findExistingPairingRequest(pairingData.userId, pairingData.deviceId);
    if (existingRequest) {
      return existingRequest;
    }

    return this.createIncomingPairingRequest(pairingData);
  }

  async processPairingCode(code: string): Promise<PairingRequest | null> {
    const request = Array.from(this.pendingRequests.values()).find(
      r => r.code === code && r.status === 'pending' && r.expiresAt > Date.now()
    );
    return request || null;
  }

  private async findExistingPairingRequest(userId: string, deviceId: string): Promise<PairingRequest | null> {
    for (const request of this.pendingRequests.values()) {
      if (request.fromUserId === userId && request.fromDeviceId === deviceId && request.status === 'pending') {
        return request;
      }
    }
    return null;
  }

  private async createIncomingPairingRequest(pairingData: PairingData): Promise<PairingRequest> {
    const id = nanoid();
    const currentUserId = identityService.getCurrentUserId();
    const currentDeviceId = identityService.getCurrentDeviceId();

    const request: PairingRequest = {
      id,
      fromDeviceId: pairingData.deviceId,
      fromUserId: pairingData.userId,
      fromUserName: pairingData.userName,
      fromPublicKey: pairingData.publicKey,
      toDeviceId: currentDeviceId,
      toUserId: currentUserId,
      code: '',
      qrData: '',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + PAIRING_EXPIRY_MS,
    };

    await databaseService.upsertPairingRequest(request);
    this.pendingRequests.set(id, request);

    this.emit('incomingPairingRequest', request);
    return request;
  }

  async acceptPairing(requestId: string): Promise<{ user: UserProfile; device: DeviceInfo }> {
    const request = this.pendingRequests.get(requestId);
    if (!request) throw new Error('Pairing request not found');
    if (request.status !== 'pending') throw new Error('Request no longer pending');
    if (request.expiresAt < Date.now()) throw new Error('Request expired');

    const currentUserId = identityService.getCurrentUserId();
    const currentDeviceId = identityService.getCurrentDeviceId();
    const currentUser = currentUserId ? await databaseService.getUser(currentUserId) : null;
    const currentDevice = currentDeviceId ? await databaseService.getDevice(currentDeviceId) : null;

    if (!currentUser || !currentDevice) throw new Error('Current user/device not found');

    const trustedDevice: any = {
      deviceId: request.fromDeviceId,
      userId: request.fromUserId,
      name: `${request.fromUserName}'s ${request.fromDeviceId}`,
      fingerprint: identityService.generateFingerprint(request.fromPublicKey),
      publicKey: request.fromPublicKey,
      trustedAt: Date.now(),
      lastVerified: Date.now(),
      isRevoked: false,
    };

    await databaseService.upsertTrustedDevice(trustedDevice);

    const peerUser: UserProfile = {
      id: request.fromUserId,
      name: request.fromUserName,
      status: '',
      wifitalkId: '',
      publicKey: request.fromPublicKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deviceName: request.fromDeviceId,
      isCurrentUser: false,
    };
    await databaseService.upsertUser(peerUser);

    const peerDevice: DeviceInfo = {
      id: request.fromDeviceId,
      userId: request.fromUserId,
      name: request.fromDeviceId,
      platform: 'unknown',
      platformVersion: '',
      appVersion: '1.0.0',
      localIp: '',
      networkSegment: '',
      isOnline: false,
      lastSeen: Date.now(),
      capabilities: {
        textMessaging: true,
        voiceCall: true,
        videoCall: true,
        fileTransfer: true,
        walkieTalkie: true,
        screenShare: false,
        relay: false,
        server: false,
      },
      isTrusted: true,
      isRelay: false,
    };
    await databaseService.upsertDevice(peerDevice);

    request.status = 'accepted';
    request.completedAt = Date.now();
    await databaseService.upsertPairingRequest(request);
    this.pendingRequests.delete(requestId);

    this.emit('pairingAccepted', { user: peerUser, device: peerDevice });
    return { user: peerUser, device: peerDevice };
  }

  async rejectPairing(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) throw new Error('Pairing request not found');

    request.status = 'rejected';
    request.completedAt = Date.now();
    await databaseService.upsertPairingRequest(request);
    this.pendingRequests.delete(requestId);

    this.emit('pairingRejected', requestId);
  }

  async cancelPairing(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (!request) throw new Error('Pairing request not found');

    request.status = 'cancelled';
    request.completedAt = Date.now();
    await databaseService.upsertPairingRequest(request);
    this.pendingRequests.delete(requestId);

    this.emit('pairingCancelled', requestId);
  }

  getPendingRequests(): PairingRequest[] {
    return Array.from(this.pendingRequests.values()).filter(
      r => r.status === 'pending' && r.expiresAt > Date.now()
    );
  }

  getCurrentPairingCode(): { code: string; expiresAt: number } | null {
    if (this.pairingCode && this.pairingCodeExpiry > Date.now()) {
      return { code: this.pairingCode, expiresAt: this.pairingCodeExpiry };
    }
    return null;
  }

  generateQRCodeSVG(qrData: string, size = 256): string {
    return QRCode.toSVG(qrData, {
      width: size,
      height: size,
      color: '#000000',
      background: '#FFFFFF',
      level: 'M',
    });
  }

  async verifyFingerprint(deviceId: string, fingerprint: string): Promise<boolean> {
    const trusted = await databaseService.isDeviceTrusted(deviceId);
    if (!trusted) return false;

    const devices = await databaseService.getTrustedDevices();
    const device = devices.find(d => d.deviceId === deviceId);
    return device?.fingerprint === fingerprint;
  }

  onPairingRequestCreated(callback: (request: PairingRequest) => void): () => void {
    this.on('pairingRequestCreated', callback);
    return () => this.off('pairingRequestCreated', callback);
  }

  onIncomingPairingRequest(callback: (request: PairingRequest) => void): () => void {
    this.on('incomingPairingRequest', callback);
    return () => this.off('incomingPairingRequest', callback);
  }

  onPairingAccepted(callback: (data: { user: UserProfile; device: DeviceInfo }) => void): () => void {
    this.on('pairingAccepted', callback);
    return () => this.off('pairingAccepted', callback);
  }

  onPairingRejected(callback: (requestId: string) => void): () => void {
    this.on('pairingRejected', callback);
    return () => this.off('pairingRejected', callback);
  }
}

export const pairingService = new PairingService();
export default pairingService;