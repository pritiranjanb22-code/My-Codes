import { EventEmitter } from 'events';
import { NetworkPeer, DeviceCapabilities, DiscoveryMethod } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { Platform, NativeModules } from 'react-native';

const { RNZeroConf, RNUdp, RNMdns } = NativeModules;

const DISCOVERY_PORT = 8484;
const SERVICE_TYPE = '_wifitalk._tcp.';
const SERVICE_NAME = 'WiFiTalk';
const DISCOVERY_INTERVAL = 30000;
const PEER_TIMEOUT = 120000;

type PeerDiscoveredCallback = (peer: NetworkPeer) => void;
type PeerLostCallback = (peerId: string) => void;
type PeerUpdatedCallback = (peer: NetworkPeer) => void;

class DiscoveryService extends EventEmitter {
  private isRunning = false;
  private mdnsBrowser: any = null;
  private udpSocket: any = null;
  private discoveryTimer: NodeJS.Timeout | null = null;
  private peerCache: Map<string, NetworkPeer> = new Map();
  private announcedServices: Map<string, any> = new Map();
  private localPeer: NetworkPeer | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;
    
    await this.createLocalPeer();
    await this.startMdns();
    await this.startUdpBroadcast();
    this.startPeriodicDiscovery();
    this.isRunning = true;
    
    console.log('[DiscoveryService] Started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.stopPeriodicDiscovery();
    await this.stopMdns();
    await this.stopUdpBroadcast();
    this.peerCache.clear();
    this.isRunning = false;
    
    console.log('[DiscoveryService] Stopped');
  }

  private async createLocalPeer(): Promise<void> {
    const userId = identityService.getCurrentUserId();
    const deviceId = identityService.getCurrentDeviceId();
    const user = userId ? await databaseService.getUser(userId) : null;
    const device = deviceId ? await databaseService.getDevice(deviceId) : null;

    if (!user || !device) return;

    this.localPeer = {
      id: deviceId!,
      deviceId: deviceId!,
      userId: userId!,
      name: user.name,
      ip: device.localIp,
      port: DISCOVERY_PORT,
      discoveredAt: Date.now(),
      lastSeen: Date.now(),
      discoveryMethod: 'mdns',
      reachable: true,
      networkSegment: device.networkSegment,
      capabilities: device.capabilities,
      isRelay: device.isRelay,
      version: '1.0.0',
    };
  }

  private async startMdns(): Promise<void> {
    try {
      if (RNZeroConf) {
        this.mdnsBrowser = await RNZeroConf.start(SERVICE_TYPE);
        this.mdnsBrowser.on('serviceFound', this.onMdnsServiceFound.bind(this));
        this.mdnsBrowser.on('serviceLost', this.onMdnsServiceLost.bind(this));
        this.mdnsBrowser.on('serviceResolved', this.onMdnsServiceResolved.bind(this));
        
        await this.announceMdnsService();
      } else if (RNMdns) {
        await RNMdns.start(SERVICE_TYPE);
        RNMdns.on('serviceFound', this.onMdnsServiceFound.bind(this));
        RNMdns.on('serviceLost', this.onMdnsServiceLost.bind(this));
        
        await this.announceMdnsService();
      }
    } catch (error) {
      console.warn('[DiscoveryService] mDNS not available:', error);
    }
  }

  private async stopMdns(): Promise<void> {
    try {
      if (this.mdnsBrowser) {
        await this.mdnsBrowser.stop();
        this.mdnsBrowser = null;
      }
      if (RNZeroConf) {
        await RNZeroConf.stop();
      }
      if (RNMdns) {
        await RNMdns.stop();
      }
    } catch (error) {
      console.warn('[DiscoveryService] Error stopping mDNS:', error);
    }
  }

  private async announceMdnsService(): Promise<void> {
    const userId = identityService.getCurrentUserId();
    const deviceId = identityService.getCurrentDeviceId();
    const user = userId ? await databaseService.getUser(userId) : null;
    const device = deviceId ? await databaseService.getDevice(deviceId) : null;

    if (!user || !device) return;

    const txtRecord = {
      id: deviceId!,
      userId: userId!,
      name: user.name,
      wifitalkId: user.wifitalkId,
      caps: JSON.stringify(device.capabilities),
      version: '1.0.0',
      relay: device.isRelay.toString(),
    };

    try {
      if (RNZeroConf) {
        await RNZeroConf.register(SERVICE_NAME, SERVICE_TYPE, DISCOVERY_PORT, txtRecord);
      } else if (RNMdns) {
        await RNMdns.register(SERVICE_NAME, SERVICE_TYPE, DISCOVERY_PORT, txtRecord);
      }
    } catch (error) {
      console.warn('[DiscoveryService] Failed to announce mDNS service:', error);
    }
  }

  private onMdnsServiceFound(service: any): void {
    console.log('[DiscoveryService] mDNS service found:', service.name);
  }

  private onMdnsServiceLost(service: any): void {
    console.log('[DiscoveryService] mDNS service lost:', service.name);
    this.handlePeerLost(service.txtRecord?.id || service.name);
  }

  private onMdnsServiceResolved(service: any): void {
    if (!service.txtRecord) return;
    
    const peer = this.parsePeerFromService(service, 'mdns');
    if (peer && peer.id !== this.localPeer?.id) {
      this.handlePeerDiscovered(peer);
    }
  }

  private parsePeerFromService(service: any, method: DiscoveryMethod): NetworkPeer | null {
    const txt = service.txtRecord;
    if (!txt || !txt.id) return null;

    const deviceId = txt.id;
    if (deviceId === this.localPeer?.deviceId) return null;

    let capabilities: DeviceCapabilities = {
      textMessaging: true,
      voiceCall: true,
      videoCall: true,
      fileTransfer: true,
      walkieTalkie: true,
      screenShare: false,
      relay: false,
      server: false,
    };

    try {
      if (txt.caps) {
        capabilities = JSON.parse(txt.caps);
      }
    } catch {}

    return {
      id: deviceId,
      deviceId,
      userId: txt.userId || '',
      name: txt.name || service.name,
      ip: service.addresses?.[0] || service.ip || '',
      port: service.port || DISCOVERY_PORT,
      discoveredAt: Date.now(),
      lastSeen: Date.now(),
      discoveryMethod: method,
      reachable: true,
      networkSegment: this.getNetworkSegment(service.addresses?.[0] || service.ip || ''),
      capabilities,
      isRelay: txt.relay === 'true',
      version: txt.version || '1.0.0',
    };
  }

  private async startUdpBroadcast(): Promise<void> {
    try {
      if (RNUdp) {
        this.udpSocket = await RNUdp.createSocket('udp4');
        await this.udpSocket.bind(DISCOVERY_PORT);
        
        this.udpSocket.on('message', this.onUdpMessage.bind(this));
        this.udpSocket.on('error', (err: Error) => {
          console.warn('[DiscoveryService] UDP error:', err);
        });

        await this.sendUdpAnnouncement();
      }
    } catch (error) {
      console.warn('[DiscoveryService] UDP broadcast not available:', error);
    }
  }

  private async stopUdpBroadcast(): Promise<void> {
    try {
      if (this.udpSocket) {
        await this.udpSocket.close();
        this.udpSocket = null;
      }
    } catch (error) {
      console.warn('[DiscoveryService] Error stopping UDP:', error);
    }
  }

  private async sendUdpAnnouncement(): Promise<void> {
    if (!this.udpSocket || !this.localPeer) return;

    const userId = identityService.getCurrentUserId();
    const user = userId ? await databaseService.getUser(userId) : null;
    if (!user) return;

    const announcement = {
      type: 'announce',
      id: this.localPeer.deviceId,
      userId: this.localPeer.userId,
      name: user.name,
      wifitalkId: user.wifitalkId,
      caps: this.localPeer.capabilities,
      version: '1.0.0',
      relay: this.localPeer.isRelay,
      timestamp: Date.now(),
    };

    const message = JSON.stringify(announcement);
    
    try {
      await this.udpSocket.send(message, DISCOVERY_PORT, '255.255.255.255');
      await this.udpSocket.send(message, DISCOVERY_PORT, '239.255.255.250');
    } catch (error) {
      console.warn('[DiscoveryService] Failed to send UDP announcement:', error);
    }
  }

  private onUdpMessage(message: Buffer, rinfo: { address: string; port: number }): void {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'announce' && data.id !== this.localPeer?.deviceId) {
        const peer: NetworkPeer = {
          id: data.id,
          deviceId: data.id,
          userId: data.userId,
          name: data.name,
          ip: rinfo.address,
          port: data.port || DISCOVERY_PORT,
          discoveredAt: Date.now(),
          lastSeen: Date.now(),
          discoveryMethod: 'udp_broadcast',
          reachable: true,
          networkSegment: this.getNetworkSegment(rinfo.address),
          capabilities: data.caps || {},
          isRelay: data.relay || false,
          version: data.version || '1.0.0',
        };
        
        this.handlePeerDiscovered(peer);
      } else if (data.type === 'ping') {
        this.sendUdpPong(rinfo.address, rinfo.port);
      } else if (data.type === 'pong') {
        this.handlePong(data, rinfo.address);
      }
    } catch (error) {
      console.warn('[DiscoveryService] Invalid UDP message:', error);
    }
  }

  private async sendUdpPong(ip: string, port: number): Promise<void> {
    if (!this.udpSocket) return;
    
    const pong = {
      type: 'pong',
      id: this.localPeer?.deviceId,
      timestamp: Date.now(),
    };
    
    try {
      await this.udpSocket.send(JSON.stringify(pong), port, ip);
    } catch (error) {
      console.warn('[DiscoveryService] Failed to send pong:', error);
    }
  }

  private handlePong(data: any, ip: string): void {
    const peer = this.peerCache.get(data.id);
    if (peer) {
      const latency = Date.now() - data.timestamp;
      peer.latency = latency;
      peer.lastSeen = Date.now();
      peer.reachable = true;
      this.peerCache.set(peer.id, peer);
      this.emit('peerUpdated', peer);
    }
  }

  private startPeriodicDiscovery(): void {
    this.discoveryTimer = setInterval(async () => {
      await this.sendUdpAnnouncement();
      this.cleanupStalePeers();
    }, DISCOVERY_INTERVAL);
  }

  private stopPeriodicDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer);
      this.discoveryTimer = null;
    }
  }

  private cleanupStalePeers(): void {
    const now = Date.now();
    for (const [id, peer] of this.peerCache.entries()) {
      if (now - peer.lastSeen > PEER_TIMEOUT) {
        this.handlePeerLost(id);
      }
    }
  }

  private handlePeerDiscovered(peer: NetworkPeer): void {
    const existing = this.peerCache.get(peer.id);
    
    if (existing) {
      peer.discoveredAt = existing.discoveredAt;
      peer.discoveryMethod = this.mergeDiscoveryMethods(existing.discoveryMethod, peer.discoveryMethod);
    }

    this.peerCache.set(peer.id, peer);
    this.persistPeer(peer);
    
    if (!existing) {
      this.emit('peerDiscovered', peer);
    } else {
      this.emit('peerUpdated', peer);
    }
  }

  private handlePeerLost(peerId: string): void {
    const peer = this.peerCache.get(peerId);
    if (peer) {
      peer.reachable = false;
      this.persistPeer(peer);
      this.emit('peerLost', peerId);
    }
    this.peerCache.delete(peerId);
  }

  private mergeDiscoveryMethods(method1: DiscoveryMethod, method2: DiscoveryMethod): DiscoveryMethod {
    const priority: Record<DiscoveryMethod, number> = {
      mdns: 5,
      udp_broadcast: 4,
      relay: 3,
      manual: 2,
      qr: 2,
      bootstrap: 1,
    };
    return priority[method1] >= priority[method2] ? method1 : method2;
  }

  private getNetworkSegment(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return 'unknown';
  }

  private async persistPeer(peer: NetworkPeer): Promise<void> {
    try {
      await databaseService.upsertNetworkPeer(peer);
    } catch (error) {
      console.warn('[DiscoveryService] Failed to persist peer:', error);
    }
  }

  async addManualPeer(ip: string, port = DISCOVERY_PORT): Promise<NetworkPeer | null> {
    const peer: NetworkPeer = {
      id: `manual-${ip}-${port}`,
      deviceId: `manual-${ip}-${port}`,
      userId: '',
      name: `Manual Peer (${ip})`,
      ip,
      port,
      discoveredAt: Date.now(),
      lastSeen: Date.now(),
      discoveryMethod: 'manual',
      reachable: true,
      networkSegment: this.getNetworkSegment(ip),
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
      isRelay: false,
      version: '1.0.0',
    };

    this.handlePeerDiscovered(peer);
    return peer;
  }

  async testPeerReachability(peerId: string): Promise<boolean> {
    const peer = this.peerCache.get(peerId);
    if (!peer || !this.udpSocket) return false;

    const ping = {
      type: 'ping',
      id: this.localPeer?.deviceId,
      timestamp: Date.now(),
    };

    try {
      await this.udpSocket.send(JSON.stringify(ping), peer.port, peer.ip);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        const handler = (p: any) => {
          if (p.type === 'pong' && p.id === peerId) {
            clearTimeout(timeout);
            this.udpSocket.off('message', handler);
            resolve(true);
          }
        };
        this.udpSocket.on('message', handler);
      });
    } catch {
      return false;
    }
  }

  getPeers(): NetworkPeer[] {
    return Array.from(this.peerCache.values()).filter(p => p.reachable);
  }

  getAllPeers(): NetworkPeer[] {
    return Array.from(this.peerCache.values());
  }

  getPeer(peerId: string): NetworkPeer | undefined {
    return this.peerCache.get(peerId);
  }

  getLocalPeer(): NetworkPeer | null {
    return this.localPeer;
  }

  isDiscoveryRunning(): boolean {
    return this.isRunning;
  }

  onPeerDiscovered(callback: PeerDiscoveredCallback): () => void {
    this.on('peerDiscovered', callback);
    return () => this.off('peerDiscovered', callback);
  }

  onPeerLost(callback: PeerLostCallback): () => void {
    this.on('peerLost', callback);
    return () => this.off('peerLost', callback);
  }

  onPeerUpdated(callback: PeerUpdatedCallback): () => void {
    this.on('peerUpdated', callback);
    return () => this.off('peerUpdated', callback);
  }
}

export const discoveryService = new DiscoveryService();
export default discoveryService;