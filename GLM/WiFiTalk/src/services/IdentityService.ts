import { generateKeyPair, generateKeyPairSync, createHash, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';
import { UserProfile, DeviceInfo, DeviceCapabilities } from '../types';
import { databaseService } from '../db/DatabaseService';
import { Platform, NativeModules } from 'react-native';

const { RNCrypto } = NativeModules;

class IdentityService {
  private currentUserId: string | null = null;
  private currentDeviceId: string | null = null;
  private keyPair: { publicKey: string; privateKey: string } | null = null;

  async initialize(): Promise<void> {
    const currentUser = await databaseService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.keyPair = {
        publicKey: currentUser.publicKey,
        privateKey: '', // Private key should be stored securely
      };
    }

    const deviceId = await this.getOrCreateDeviceId();
    this.currentDeviceId = deviceId;
  }

  async createUserProfile(name: string, deviceName: string): Promise<UserProfile> {
    const keyPair = await this.generateKeyPair();
    const userId = nanoid(16);
    const wifitalkId = this.generateWifiTalkId();
    const now = Date.now();

    const user: UserProfile = {
      id: userId,
      name,
      status: 'Hey there! I am using WiFiTalk.',
      wifitalkId,
      publicKey: keyPair.publicKey,
      createdAt: now,
      updatedAt: now,
      deviceName,
      isCurrentUser: true,
    };

    await databaseService.upsertUser(user);
    this.currentUserId = userId;
    this.keyPair = keyPair;

    const device = await this.createDeviceInfo(userId, deviceName);
    await databaseService.upsertDevice(device);

    return user;
  }

  async createDeviceInfo(userId: string, deviceName: string): Promise<DeviceInfo> {
    const deviceId = nanoid(16);
    const localIp = await this.getLocalIp();
    const networkSegment = this.getNetworkSegment(localIp);

    const capabilities: DeviceCapabilities = {
      textMessaging: true,
      voiceCall: true,
      videoCall: true,
      fileTransfer: true,
      walkieTalkie: true,
      screenShare: Platform.OS !== 'web',
      relay: Platform.OS !== 'ios',
      server: Platform.OS === 'windows' || Platform.OS === 'linux' || Platform.OS === 'macos',
    };

    const device: DeviceInfo = {
      id: deviceId,
      userId,
      name: deviceName,
      platform: Platform.OS as DeviceInfo['platform'],
      platformVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      localIp,
      networkSegment,
      isOnline: true,
      lastSeen: Date.now(),
      capabilities,
      isTrusted: true,
      isRelay: capabilities.relay,
    };

    this.currentDeviceId = deviceId;
    return device;
  }

  private async getOrCreateDeviceId(): Promise<string> {
    const devices = await databaseService.getDevicesByUser(this.currentUserId || '');
    if (devices.length > 0) {
      return devices[0].id;
    }
    return nanoid(16);
  }

  private generateWifiTalkId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'WT-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  private async getLocalIp(): Promise<string> {
    try {
      const { NetworkInfo } = require('react-native-network-info');
      return await NetworkInfo.getIPAddress();
    } catch {
      return '127.0.0.1';
    }
  }

  private getNetworkSegment(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return 'unknown';
  }

  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    if (RNCrypto && RNCrypto.generateKeyPair) {
      return RNCrypto.generateKeyPair('RSA', 2048);
    }

    return new Promise((resolve, reject) => {
      generateKeyPair('rsa', { modulusLength: 2048 }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        else {
          resolve({
            publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
            privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }),
          });
        }
      });
    });
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  getPublicKey(): string | null {
    return this.keyPair?.publicKey || null;
  }

  getPrivateKey(): string | null {
    return this.keyPair?.privateKey || null;
  }

  async signData(data: string): Promise<string> {
    if (!this.keyPair?.privateKey) throw new Error('No private key available');
    
    if (RNCrypto && RNCrypto.sign) {
      return RNCrypto.sign(data, this.keyPair.privateKey);
    }

    const crypto = require('crypto');
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(this.keyPair.privateKey, 'base64');
  }

  async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    if (RNCrypto && RNCrypto.verify) {
      return RNCrypto.verify(data, signature, publicKey);
    }

    const crypto = require('crypto');
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  }

  generateFingerprint(publicKey: string): string {
    const hash = createHash('sha256').update(publicKey).digest('hex');
    return hash.match(/.{2}/g)?.join(':').toUpperCase() || '';
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUserId) throw new Error('No current user');
    
    const user = await databaseService.getUser(this.currentUserId);
    if (!user) throw new Error('User not found');

    const updatedUser = { ...user, ...updates, updatedAt: Date.now() };
    await databaseService.upsertUser(updatedUser);
  }

  async updateDeviceInfo(updates: Partial<DeviceInfo>): Promise<void> {
    if (!this.currentDeviceId) throw new Error('No current device');
    
    const device = await databaseService.getDevice(this.currentDeviceId);
    if (!device) throw new Error('Device not found');

    const updatedDevice = { ...device, ...updates, lastSeen: Date.now() };
    await databaseService.upsertDevice(updatedDevice);
  }

  async setOnlineStatus(isOnline: boolean): Promise<void> {
    if (!this.currentDeviceId) return;
    await databaseService.updateDeviceOnlineStatus(this.currentDeviceId, isOnline);
  }

  computeSharedSecret(peerPublicKey: string): string {
    const hash = createHash('sha256');
    hash.update(this.keyPair?.privateKey || '');
    hash.update(peerPublicKey);
    return hash.digest('hex');
  }
}

export const identityService = new IdentityService();
export default identityService;