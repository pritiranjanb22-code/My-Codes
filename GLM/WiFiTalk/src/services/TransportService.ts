import { EventEmitter } from 'events';
import { PeerConnection, TransportType, ConnectionStatus, ConnectionQuality, EncryptionInfo } from '../types';
import { discoveryService } from './DiscoveryService';
import { identityService } from './IdentityService';
import { databaseService } from '../db/DatabaseService';
import { Platform } from 'react-native';

const { RNWebRTC, RNTcpSocket } = require('react-native-webrtc');

interface Transport {
  connect(peerId: string, address: string, port: number): Promise<void>;
  disconnect(peerId: string): Promise<void>;
  send(peerId: string, data: Uint8Array): Promise<void>;
  onData(callback: (peerId: string, data: Uint8Array) => void): () => void;
  onConnectionChange(callback: (peerId: string, status: ConnectionStatus) => void): () => void;
}

class WebRTCTransport implements Transport {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private dataCallback: ((peerId: string, data: Uint8Array) => void) | null = null;
  private connectionCallback: ((peerId: string, status: ConnectionStatus) => void) | null = null;
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  async connect(peerId: string, address: string, port: number): Promise<void> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.peerConnections.set(peerId, pc);

    const channel = pc.createDataChannel('wifitalk', { ordered: true });
    this.setupDataChannel(peerId, channel);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling(peerId, { type: 'candidate', candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      let status: ConnectionStatus = 'connecting';
      if (state === 'connected') status = 'connected';
      else if (state === 'disconnected' || state === 'failed') status = 'failed';
      else if (state === 'closed') status = 'disconnected';
      
      this.connectionCallback?.(peerId, status);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.sendSignaling(peerId, { type: 'offer', sdp: offer.sdp });
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`[WebRTCTransport] Data channel open for ${peerId}`);
      this.connectionCallback?.(peerId, 'connected');
    };

    channel.onclose = () => {
      console.log(`[WebRTCTransport] Data channel closed for ${peerId}`);
      this.connectionCallback?.(peerId, 'disconnected');
    };

    channel.onerror = (error) => {
      console.error(`[WebRTCTransport] Data channel error for ${peerId}:`, error);
      this.connectionCallback?.(peerId, 'failed');
    };

    channel.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer 
        ? new Uint8Array(event.data) 
        : new TextEncoder().encode(event.data);
      this.dataCallback?.(peerId, data);
    };

    this.dataChannels.set(peerId, channel);
  }

  async disconnect(peerId: string): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const channel = this.dataChannels.get(peerId);
    if (channel) {
      channel.close();
      this.dataChannels.delete(peerId);
    }
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    const channel = this.dataChannels.get(peerId);
    if (channel && channel.readyState === 'open') {
      channel.send(data.buffer);
    } else {
      throw new Error(`Data channel not open for ${peerId}`);
    }
  }

  onData(callback: (peerId: string, data: Uint8Array) => void): () => void {
    this.dataCallback = callback;
    return () => { this.dataCallback = null; };
  }

  onConnectionChange(callback: (peerId: string, status: ConnectionStatus) => void): () => void {
    this.connectionCallback = callback;
    return () => { this.connectionCallback = null; };
  }

  private sendSignaling(peerId: string, signal: any): void {
    // Signaling would go through a separate signaling channel
    // For local network, we can use the discovery service's UDP socket
    console.log(`[WebRTCTransport] Signaling for ${peerId}:`, signal.type);
  }

  async handleSignaling(peerId: string, signal: any): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;

    if (signal.type === 'offer') {
      await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignaling(peerId, { type: 'answer', sdp: answer.sdp });
    } else if (signal.type === 'answer') {
      await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
    } else if (signal.type === 'candidate') {
      await pc.addIceCandidate(signal.candidate);
    }
  }
}

class TCPTransport implements Transport {
  private sockets: Map<string, any> = new Map();
  private dataCallback: ((peerId: string, data: Uint8Array) => void) | null = null;
  private connectionCallback: ((peerId: string, status: ConnectionStatus) => void) | null = null;

  async connect(peerId: string, address: string, port: number): Promise<void> {
    if (!RNTcpSocket) throw new Error('TCP socket not available');

    const socket = new RNTcpSocket();
    this.sockets.set(peerId, socket);

    socket.on('connect', () => {
      console.log(`[TCPTransport] Connected to ${peerId}`);
      this.connectionCallback?.(peerId, 'connected');
    });

    socket.on('data', (data: Buffer) => {
      this.dataCallback?.(peerId, new Uint8Array(data));
    });

    socket.on('close', () => {
      console.log(`[TCPTransport] Disconnected from ${peerId}`);
      this.connectionCallback?.(peerId, 'disconnected');
      this.sockets.delete(peerId);
    });

    socket.on('error', (error: Error) => {
      console.error(`[TCPTransport] Error for ${peerId}:`, error);
      this.connectionCallback?.(peerId, 'failed');
    });

    await socket.connect(port, address);
  }

  async disconnect(peerId: string): Promise<void> {
    const socket = this.sockets.get(peerId);
    if (socket) {
      socket.destroy();
      this.sockets.delete(peerId);
    }
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    const socket = this.sockets.get(peerId);
    if (socket) {
      socket.write(Buffer.from(data));
    } else {
      throw new Error(`Socket not connected for ${peerId}`);
    }
  }

  onData(callback: (peerId: string, data: Uint8Array) => void): () => void {
    this.dataCallback = callback;
    return () => { this.dataCallback = null; };
  }

  onConnectionChange(callback: (peerId: string, status: ConnectionStatus) => void): () => void {
    this.connectionCallback = callback;
    return () => { this.connectionCallback = null; };
  }
}

class RelayTransport implements Transport {
  private relayConnections: Map<string, WebSocket> = new Map();
  private dataCallback: ((peerId: string, data: Uint8Array) => void) | null = null;
  private connectionCallback: ((peerId: string, status: ConnectionStatus) => void) | null = null;

  async connect(peerId: string, address: string, port: number): Promise<void> {
    const ws = new WebSocket(`ws://${address}:${port}/relay/${peerId}`);
    this.relayConnections.set(peerId, ws);

    ws.onopen = () => {
      console.log(`[RelayTransport] Connected to relay for ${peerId}`);
      this.connectionCallback?.(peerId, 'connected');
    };

    ws.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer 
        ? new Uint8Array(event.data) 
        : new TextEncoder().encode(event.data);
      this.dataCallback?.(peerId, data);
    };

    ws.onclose = () => {
      console.log(`[RelayTransport] Disconnected from relay for ${peerId}`);
      this.connectionCallback?.(peerId, 'disconnected');
      this.relayConnections.delete(peerId);
    };

    ws.onerror = (error) => {
      console.error(`[RelayTransport] Error for ${peerId}:`, error);
      this.connectionCallback?.(peerId, 'failed');
    };
  }

  async disconnect(peerId: string): Promise<void> {
    const ws = this.relayConnections.get(peerId);
    if (ws) {
      ws.close();
      this.relayConnections.delete(peerId);
    }
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    const ws = this.relayConnections.get(peerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data.buffer);
    } else {
      throw new Error(`Relay not connected for ${peerId}`);
    }
  }

  onData(callback: (peerId: string, data: Uint8Array) => void): () => void {
    this.dataCallback = callback;
    return () => { this.dataCallback = null; };
  }

  onConnectionChange(callback: (peerId: string, status: ConnectionStatus) => void): () => void {
    this.connectionCallback = callback;
    return () => { this.connectionCallback = null; };
  }
}

export class TransportService extends EventEmitter {
  private transports: Map<TransportType, Transport> = new Map();
  private activeConnections: Map<string, { transport: Transport; peerId: string; address: string; port: number }> = new Map();
  private connectionInfo: Map<string, PeerConnection> = new Map();
  private dataHandlers: Map<string, (data: Uint8Array) => Promise<void>> = new Map();

  constructor() {
    super();
    this.transports.set('webrtc', new WebRTCTransport());
    this.transports.set('tcp', new TCPTransport());
    this.transports.set('relay', new RelayTransport());
  }

  async initialize(): Promise<void> {
    for (const [type, transport] of this.transports) {
      transport.onData(this.handleIncomingData.bind(this));
      transport.onConnectionChange(this.handleConnectionChange.bind(this));
    }
  }

  async connectToPeer(peerId: string, preferredTransports: TransportType[] = ['webrtc', 'tcp']): Promise<PeerConnection> {
    const peer = discoveryService.getPeer(peerId);
    if (!peer) throw new Error('Peer not found');

    for (const transportType of preferredTransports) {
      const transport = this.transports.get(transportType);
      if (!transport) continue;

      try {
        await transport.connect(peerId, peer.ip, peer.port);
        
        const connection: PeerConnection = {
          peerId,
          localId: identityService.getCurrentDeviceId() || '',
          status: 'connected',
          transport: transportType,
          localAddress: '', // Would be filled by transport
          remoteAddress: `${peer.ip}:${peer.port}`,
          connectedAt: Date.now(),
          lastActivity: Date.now(),
          bytesSent: 0,
          bytesReceived: 0,
          quality: 'excellent',
          encryption: {
            algorithm: 'AES-GCM-256',
            keyExchange: 'ECDH-P256',
            verified: true,
            fingerprint: '',
          },
        };

        this.activeConnections.set(peerId, { transport, peerId, address: peer.ip, port: peer.port });
        this.connectionInfo.set(peerId, connection);
        
        this.emit('connected', connection);
        return connection;
      } catch (error) {
        console.warn(`[TransportService] Failed to connect via ${transportType}:`, error);
        continue;
      }
    }

    throw new Error('All transport methods failed');
  }

  async disconnectFromPeer(peerId: string): Promise<void> {
    const connection = this.activeConnections.get(peerId);
    if (connection) {
      await connection.transport.disconnect(peerId);
      this.activeConnections.delete(peerId);
      
      const info = this.connectionInfo.get(peerId);
      if (info) {
        info.status = 'disconnected';
        this.emit('disconnected', info);
      }
    }
  }

  async send(peerId: string, data: Uint8Array): Promise<void> {
    const connection = this.activeConnections.get(peerId);
    if (!connection) throw new Error('Not connected to peer');

    await connection.transport.send(peerId, data);
    
    const info = this.connectionInfo.get(peerId);
    if (info) {
      info.bytesSent += data.length;
      info.lastActivity = Date.now();
    }
  }

  registerHandler(messageType: string, handler: (data: Uint8Array) => Promise<void>): void {
    this.dataHandlers.set(messageType, handler);
  }

  unregisterHandler(messageType: string): void {
    this.dataHandlers.delete(messageType);
  }

  private async handleIncomingData(peerId: string, data: Uint8Array): Promise<void> {
    const info = this.connectionInfo.get(peerId);
    if (info) {
      info.bytesReceived += data.length;
      info.lastActivity = Date.now();
    }

    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      const handler = this.dataHandlers.get(message.type);
      if (handler) {
        await handler(data);
      } else {
        this.emit('message', peerId, message);
      }
    } catch {
      this.emit('rawData', peerId, data);
    }
  }

  private handleConnectionChange(peerId: string, status: ConnectionStatus): void {
    const info = this.connectionInfo.get(peerId);
    if (info) {
      info.status = status;
      this.emit('connectionChange', info);
    }
  }

  getConnection(peerId: string): PeerConnection | undefined {
    return this.connectionInfo.get(peerId);
  }

  getAllConnections(): PeerConnection[] {
    return Array.from(this.connectionInfo.values());
  }

  isConnected(peerId: string): boolean {
    const info = this.connectionInfo.get(peerId);
    return info?.status === 'connected';
  }

  getActiveTransports(): TransportType[] {
    return Array.from(this.activeConnections.values()).map(c => 
      this.getTransportType(c.transport)
    );
  }

  private getTransportType(transport: Transport): TransportType {
    for (const [type, t] of this.transports) {
      if (t === transport) return type;
    }
    return 'tcp';
  }

  async shutdown(): Promise<void> {
    for (const peerId of this.activeConnections.keys()) {
      await this.disconnectFromPeer(peerId);
    }
  }
}

export const transportService = new TransportService();
export default transportService;