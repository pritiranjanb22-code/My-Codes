import { EventEmitter } from 'events';
import { NetworkInfo, NetworkDiagnostics, PeerDiagnostic, NATType, ConnectionQuality } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { discoveryService } from './DiscoveryService';
import { transportService } from './TransportService';
import { Platform, NativeModules } from 'react-native';

const { RNNetworkInfo } = NativeModules;

class NetworkDiagnosticsService extends EventEmitter {
  private diagnosticsCache: NetworkDiagnostics | null = null;
  private lastScanTime = 0;
  private scanInterval: NodeJS.Timeout | null = null;

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      if (RNNetworkInfo) {
        const [localIp, gateway, subnetMask, dnsServers, ipv6] = await Promise.all([
          RNNetworkInfo.getIPAddress(),
          RNNetworkInfo.getGateway(),
          RNNetworkInfo.getSubnetMask(),
          RNNetworkInfo.getDNSServers(),
          RNNetworkInfo.getIPv6Address().catch(() => null),
        ]);

        const networkRange = this.calculateNetworkRange(localIp, subnetMask);
        const natType = await this.detectNATType();

        return {
          localIp,
          gateway,
          subnetMask,
          networkRange,
          interfaceName: Platform.OS === 'ios' ? 'en0' : 'wlan0',
          ipv6: ipv6 || undefined,
          dnsServers: dnsServers || [],
          isConnected: true,
          internetReachable: await this.checkInternetConnectivity(),
          lanReachable: await this.checkLANConnectivity(),
          multicastSupported: await this.checkMulticastSupport(),
          natType,
        };
      }
    } catch (error) {
      console.warn('[NetworkDiagnostics] Failed to get network info:', error);
    }

    return this.getFallbackNetworkInfo();
  }

  private getFallbackNetworkInfo(): NetworkInfo {
    return {
      localIp: '127.0.0.1',
      gateway: '127.0.0.1',
      subnetMask: '255.255.255.0',
      networkRange: '127.0.0.0/24',
      interfaceName: 'loopback',
      dnsServers: [],
      isConnected: false,
      internetReachable: false,
      lanReachable: false,
      multicastSupported: false,
      natType: 'unknown',
    };
  }

  private calculateNetworkRange(ip: string, subnetMask: string): string {
    const ipParts = ip.split('.').map(Number);
    const maskParts = subnetMask.split('.').map(Number);
    const networkParts = ipParts.map((part, i) => part & maskParts[i]);
    return `${networkParts.join('.')}/${this.maskToCIDR(subnetMask)}`;
  }

  private maskToCIDR(mask: string): number {
    return mask.split('.').reduce((sum, octet) => sum + parseInt(octet, 10).toString(2).split('1').length - 1, 0);
  }

  private async detectNATType(): Promise<NATType> {
    try {
      const response = await fetch('https://stun.l.google.com:19302', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (response.ok) return 'open';
    } catch {}

    try {
      const response = await fetch('https://httpbin.org/ip', { signal: AbortSignal.timeout(5000) });
      if (response.ok) return 'moderate';
    } catch {}

    return 'strict';
  }

  private async checkInternetConnectivity(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com/generate_204', { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async checkLANConnectivity(): Promise<boolean> {
    const networkInfo = await this.getNetworkInfo();
    const gateway = networkInfo.gateway;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(`http://${gateway}`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  private async checkMulticastSupport(): Promise<boolean> {
    try {
      return discoveryService.isDiscoveryRunning();
    } catch {
      return false;
    }
  }

  async runFullDiagnostics(): Promise<NetworkDiagnostics> {
    const networkInfo = await this.getNetworkInfo();
    const peers = discoveryService.getAllPeers();
    const reachablePeers = peers.filter(p => p.reachable);
    
    const peerDiagnostics: PeerDiagnostic[] = await Promise.all(
      reachablePeers.map(async (peer) => {
        const ping = await this.pingPeer(peer.ip);
        const connectionType = await this.determineConnectionType(peer);
        
        return {
          peerId: peer.id,
          name: peer.name,
          ip: peer.ip,
          ping,
          packetLoss: 0,
          connectionType,
          quality: this.calculateQuality(ping, 0),
        };
      })
    );

    const diagnostics: NetworkDiagnostics = {
      localIp: networkInfo.localIp,
      gateway: networkInfo.gateway,
      internet: networkInfo.internetReachable,
      lan: networkInfo.lanReachable,
      peerDiscovery: discoveryService.isDiscoveryRunning(),
      directConnection: peerDiagnostics.some(p => p.connectionType === 'direct'),
      multicast: networkInfo.multicastSupported,
      natType: networkInfo.natType || 'unknown',
      ipv6: !!networkInfo.ipv6,
      reachablePeers: reachablePeers.length,
      peers: peerDiagnostics,
    };

    this.diagnosticsCache = diagnostics;
    this.emit('diagnosticsUpdated', diagnostics);
    return diagnostics;
  }

  private async pingPeer(ip: string): Promise<number> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      await fetch(`http://${ip}:8484/ping`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async determineConnectionType(peer: any): Promise<'direct' | 'relay' | 'unreachable'> {
    if (!peer.reachable) return 'unreachable';
    if (peer.isRelay) return 'relay';
    
    const connection = transportService.getConnection(peer.id);
    if (connection && connection.status === 'connected') {
      return connection.transport === 'relay' ? 'relay' : 'direct';
    }
    
    return 'direct';
  }

  private calculateQuality(ping: number, packetLoss: number): ConnectionQuality {
    if (ping < 0) return 'unknown';
    if (ping < 20 && packetLoss === 0) return 'excellent';
    if (ping < 50 && packetLoss < 1) return 'good';
    if (ping < 150 && packetLoss < 5) return 'poor';
    return 'unstable';
  }

  async testConnectionToPeer(peerId: string): Promise<PeerDiagnostic | null> {
    const peer = discoveryService.getPeer(peerId);
    if (!peer) return null;

    const ping = await this.pingPeer(peer.ip);
    const connectionType = await this.determineConnectionType(peer);

    return {
      peerId: peer.id,
      name: peer.name,
      ip: peer.ip,
      ping,
      packetLoss: 0,
      connectionType,
      quality: this.calculateQuality(ping, 0),
    };
  }

  async scanLocalNetwork(): Promise<string[]> {
    const networkInfo = await this.getNetworkInfo();
    const baseIp = networkInfo.localIp.split('.').slice(0, 3).join('.');
    const activeIps: string[] = [];

    const promises = [];
    for (let i = 1; i < 255; i++) {
      const ip = `${baseIp}.${i}`;
      if (ip !== networkInfo.localIp) {
        promises.push(this.checkHostAlive(ip));
      }
    }

    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        activeIps.push(`${baseIp}.${index + 1}`);
      }
    });

    return activeIps;
  }

  private async checkHostAlive(ip: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      await fetch(`http://${ip}:8484/ping`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }

  getCachedDiagnostics(): NetworkDiagnostics | null {
    return this.diagnosticsCache;
  }

  startPeriodicScans(intervalMs = 60000): void {
    this.stopPeriodicScans();
    this.scanInterval = setInterval(() => {
      this.runFullDiagnostics().catch(console.error);
    }, intervalMs);
  }

  stopPeriodicScans(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  async getNetworkTopology(): Promise<any> {
    const networkInfo = await this.getNetworkInfo();
    const peers = discoveryService.getAllPeers();
    const connections = transportService.getAllConnections();

    return {
      network: {
        localIp: networkInfo.localIp,
        gateway: networkInfo.gateway,
        networkRange: networkInfo.networkRange,
        natType: networkInfo.natType,
      },
      devices: peers.map(p => ({
        id: p.id,
        name: p.name,
        ip: p.ip,
        networkSegment: p.networkSegment,
        isRelay: p.isRelay,
        reachable: p.reachable,
        discoveryMethod: p.discoveryMethod,
        capabilities: p.capabilities,
      })),
      connections: connections.map(c => ({
        peerId: c.peerId,
        transport: c.transport,
        status: c.status,
        quality: c.quality,
        bytesSent: c.bytesSent,
        bytesReceived: c.bytesReceived,
      })),
    };
  }

  async troubleshootPeer(peerId: string): Promise<string[]> {
    const issues: string[] = [];
    const peer = discoveryService.getPeer(peerId);
    
    if (!peer) {
      issues.push('Peer not found in discovery cache');
      return issues;
    }

    if (!peer.reachable) {
      issues.push('Peer is marked as unreachable');
    }

    const networkInfo = await this.getNetworkInfo();
    
    if (peer.networkSegment !== this.calculateNetworkRange(networkInfo.localIp, networkInfo.subnetMask)) {
      issues.push(`Peer is on different subnet (${peer.networkSegment})`);
      issues.push('Check: Inter-VLAN routing, firewall rules between subnets');
    }

    if (!networkInfo.multicastSupported) {
      issues.push('Multicast not supported on this network');
      issues.push('Check: IGMP snooping, multicast filtering on router');
    }

    const connection = transportService.getConnection(peerId);
    if (!connection || connection.status !== 'connected') {
      issues.push('No active transport connection');
      issues.push('Check: Port 8484 UDP/TCP allowed, firewall rules');
    }

    if (networkInfo.natType === 'strict') {
      issues.push('Strict NAT detected - direct connections may fail');
      issues.push('Check: UPnP, port forwarding, or use relay');
    }

    return issues;
  }
}

export const networkDiagnosticsService = new NetworkDiagnosticsService();
export default networkDiagnosticsService;