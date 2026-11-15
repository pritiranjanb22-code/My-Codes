import { EventEmitter } from 'events';
import { FileTransfer, TransferMode } from '../types';
import { databaseService } from '../db/DatabaseService';
import { identityService } from './IdentityService';
import { discoveryService } from './DiscoveryService';
import { transportService } from './TransportService';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';
import RNFS from 'react-native-fs';

const CHUNK_SIZE = 64 * 1024;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface TransferSession {
  transfer: FileTransfer;
  fileHandle: any;
  chunksSent: number;
  retries: number;
  isPaused: boolean;
  abortController: AbortController;
}

class FileTransferService extends EventEmitter {
  private activeTransfers: Map<string, TransferSession> = new Map();
  private incomingTransfers: Map<string, TransferSession> = new Map();
  private transferPort = 8486;

  constructor() {
    super();
    this.setupTransportHandlers();
  }

  private setupTransportHandlers(): void {
    transportService.registerHandler('file_transfer_start', this.handleTransferStart.bind(this));
    transportService.registerHandler('file_transfer_chunk', this.handleTransferChunk.bind(this));
    transportService.registerHandler('file_transfer_complete', this.handleTransferComplete.bind(this));
    transportService.registerHandler('file_transfer_cancel', this.handleTransferCancel.bind(this));
    transportService.registerHandler('file_transfer_pause', this.handleTransferPause.bind(this));
    transportService.registerHandler('file_transfer_resume', this.handleTransferResume.bind(this));
    transportService.registerHandler('file_transfer_request', this.handleTransferRequest.bind(this));
  }

  async sendFile(
    conversationId: string,
    receiverId: string,
    filePath: string,
    fileName: string,
    mimeType: string,
    mode: TransferMode = 'direct'
  ): Promise<FileTransfer> {
    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) throw new Error('No current user');

    const stat = await RNFS.stat(filePath);
    const fileSize = stat.size;
    const checksum = await this.calculateChecksum(filePath);
    const chunksTotal = Math.ceil(fileSize / CHUNK_SIZE);

    const transfer: FileTransfer = {
      id: nanoid(),
      conversationId,
      senderId: currentUserId,
      receiverId,
      fileName,
      fileSize,
      mimeType,
      localPath: filePath,
      status: 'pending',
      progress: 0,
      chunksTotal,
      chunksTransferred: 0,
      checksum,
      startedAt: Date.now(),
      isPaused: false,
      transferMode: mode,
    };

    await databaseService.upsertFileTransfer(transfer);
    this.emit('transferStarted', transfer);

    const peer = this.findPeerForUser(receiverId);
    if (!peer) {
      transfer.status = 'failed';
      transfer.error = 'Peer not found';
      await databaseService.upsertFileTransfer(transfer);
      this.emit('transferFailed', transfer);
      throw new Error('Peer not found');
    }

    return this.startTransfer(transfer, peer);
  }

  private async startTransfer(transfer: FileTransfer, peer: any): Promise<FileTransfer> {
    if (!transportService.isConnected(peer.id)) {
      await transportService.connectToPeer(peer.id);
    }

    transfer.status = 'connecting';
    await databaseService.upsertFileTransfer(transfer);

    const startMessage = {
      type: 'file_transfer_start',
      transferId: transfer.id,
      fileName: transfer.fileName,
      fileSize: transfer.fileSize,
      mimeType: transfer.mimeType,
      checksum: transfer.checksum,
      chunksTotal: transfer.chunksTotal,
    };

    try {
      await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(startMessage)));
      transfer.status = 'transferring';
      await databaseService.upsertFileTransfer(transfer);

      const session: TransferSession = {
        transfer,
        fileHandle: null,
        chunksSent: 0,
        retries: 0,
        isPaused: false,
        abortController: new AbortController(),
      };

      this.activeTransfers.set(transfer.id, session);
      await this.sendChunks(session, peer.id);
      
      return transfer;
    } catch (error) {
      transfer.status = 'failed';
      transfer.error = error instanceof Error ? error.message : 'Unknown error';
      await databaseService.upsertFileTransfer(transfer);
      this.emit('transferFailed', transfer);
      throw error;
    }
  }

  private async sendChunks(session: TransferSession, peerId: string): Promise<void> {
    const { transfer } = session;
    
    try {
      session.fileHandle = await RNFS.open(transfer.localPath, 'r');
      
      while (session.chunksSent < transfer.chunksTotal && !session.abortController.signal.aborted) {
        if (session.isPaused) {
          await this.waitForResume(session);
          continue;
        }

        const chunk = await this.readChunk(session.fileHandle, session.chunksSent * CHUNK_SIZE, CHUNK_SIZE);
        if (!chunk || chunk.length === 0) break;

        const chunkMessage = {
          type: 'file_transfer_chunk',
          transferId: transfer.id,
          chunkIndex: session.chunksSent,
          data: Array.from(chunk),
          checksum: createHash('sha256').update(chunk).digest('hex'),
        };

        await transportService.send(peerId, new TextEncoder().encode(JSON.stringify(chunkMessage)));
        
        session.chunksSent++;
        transfer.chunksTransferred = session.chunksSent;
        transfer.progress = (session.chunksSent / transfer.chunksTotal) * 100;
        transfer.lastActivity = Date.now();
        
        await databaseService.upsertFileTransfer(transfer);
        this.emit('transferProgress', transfer);
      }

      if (!session.abortController.signal.aborted) {
        await this.completeTransfer(session, peerId);
      }
    } catch (error) {
      await this.handleTransferError(session, error);
    } finally {
      if (session.fileHandle) {
        await RNFS.close(session.fileHandle);
      }
    }
  }

  private async readChunk(fileHandle: any, position: number, length: number): Promise<Uint8Array> {
    const buffer = await RNFS.read(fileHandle, length, position);
    return new Uint8Array(buffer);
  }

  private async completeTransfer(session: TransferSession, peerId: string): Promise<void> {
    const { transfer } = session;
    
    const completeMessage = {
      type: 'file_transfer_complete',
      transferId: transfer.id,
      checksum: transfer.checksum,
    };

    await transportService.send(peerId, new TextEncoder().encode(JSON.stringify(completeMessage)));
    
    transfer.status = 'completed';
    transfer.progress = 100;
    transfer.completedAt = Date.now();
    await databaseService.upsertFileTransfer(transfer);
    
    this.activeTransfers.delete(transfer.id);
    this.emit('transferCompleted', transfer);
  }

  private async handleTransferError(session: TransferSession, error: any): Promise<void> {
    const { transfer } = session;
    
    if (session.retries < MAX_RETRIES && !session.abortController.signal.aborted) {
      session.retries++;
      transfer.error = `Retry ${session.retries}/${MAX_RETRIES}: ${error.message}`;
      await databaseService.upsertFileTransfer(transfer);
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * session.retries));
      await this.sendChunks(session, this.findPeerForUser(transfer.receiverId)?.id);
    } else {
      transfer.status = 'failed';
      transfer.error = error instanceof Error ? error.message : 'Unknown error';
      transfer.cancelledAt = Date.now();
      await databaseService.upsertFileTransfer(transfer);
      
      this.activeTransfers.delete(transfer.id);
      this.emit('transferFailed', transfer);
    }
  }

  private async waitForResume(session: TransferSession): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!session.isPaused || session.abortController.signal.aborted) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  async pauseTransfer(transferId: string): Promise<void> {
    const session = this.activeTransfers.get(transferId) || this.incomingTransfers.get(transferId);
    if (session) {
      session.isPaused = true;
      session.transfer.isPaused = true;
      await databaseService.upsertFileTransfer(session.transfer);
      this.emit('transferPaused', session.transfer);
    }
  }

  async resumeTransfer(transferId: string): Promise<void> {
    const session = this.activeTransfers.get(transferId) || this.incomingTransfers.get(transferId);
    if (session) {
      session.isPaused = false;
      session.transfer.isPaused = false;
      await databaseService.upsertFileTransfer(session.transfer);
      this.emit('transferResumed', session.transfer);
      
      if (this.activeTransfers.has(transferId)) {
        const peer = this.findPeerForUser(session.transfer.receiverId);
        if (peer) {
          this.sendChunks(session, peer.id);
        }
      }
    }
  }

  async cancelTransfer(transferId: string): Promise<void> {
    const session = this.activeTransfers.get(transferId) || this.incomingTransfers.get(transferId);
    if (session) {
      session.abortController.abort();
      session.transfer.status = 'cancelled';
      session.transfer.cancelledAt = Date.now();
      await databaseService.upsertFileTransfer(session.transfer);
      
      if (this.activeTransfers.has(transferId)) {
        const peer = this.findPeerForUser(session.transfer.receiverId);
        if (peer) {
          const cancelMessage = {
            type: 'file_transfer_cancel',
            transferId,
          };
          await transportService.send(peer.id, new TextEncoder().encode(JSON.stringify(cancelMessage)));
        }
      }
      
      this.activeTransfers.delete(transferId);
      this.incomingTransfers.delete(transferId);
      this.emit('transferCancelled', session.transfer);
    }
  }

  private async handleTransferStart(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId, fileName, fileSize, mimeType, checksum, chunksTotal } = message;

    const currentUserId = identityService.getCurrentUserId();
    if (!currentUserId) return;

    const transfer: FileTransfer = {
      id: transferId,
      conversationId: '',
      senderId: '',
      receiverId: currentUserId,
      fileName,
      fileSize,
      mimeType,
      localPath: `${RNFS.CachesDirectoryPath}/WiFiTalk/${transferId}_${fileName}`,
      status: 'pending',
      progress: 0,
      chunksTotal,
      chunksTransferred: 0,
      checksum,
      startedAt: Date.now(),
      isPaused: false,
      transferMode: 'direct',
    };

    await RNFS.mkdir(`${RNFS.CachesDirectoryPath}/WiFiTalk`, { NSURLIsExcludedFromBackupKey: true });
    const fileHandle = await RNFS.open(transfer.localPath, 'w');

    const session: TransferSession = {
      transfer,
      fileHandle,
      chunksSent: 0,
      retries: 0,
      isPaused: false,
      abortController: new AbortController(),
    };

    this.incomingTransfers.set(transferId, session);
    transfer.status = 'transferring';
    await databaseService.upsertFileTransfer(transfer);
    this.emit('incomingTransfer', transfer);
  }

  private async handleTransferChunk(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId, chunkIndex, data: chunkData, checksum } = message;

    const session = this.incomingTransfers.get(transferId);
    if (!session) return;

    const chunk = new Uint8Array(chunkData);
    const computedChecksum = createHash('sha256').update(chunk).digest('hex');
    
    if (computedChecksum !== checksum) {
      console.error('[FileTransfer] Chunk checksum mismatch');
      return;
    }

    await RNFS.write(session.fileHandle, Buffer.from(chunk).toString('base64'), 0, chunk.length, chunkIndex * CHUNK_SIZE);
    
    session.chunksSent = chunkIndex + 1;
    session.transfer.chunksTransferred = session.chunksSent;
    session.transfer.progress = (session.chunksSent / session.transfer.chunksTotal) * 100;
    
    await databaseService.upsertFileTransfer(session.transfer);
    this.emit('transferProgress', session.transfer);
  }

  private async handleTransferComplete(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId, checksum } = message;

    const session = this.incomingTransfers.get(transferId);
    if (!session) return;

    await RNFS.close(session.fileHandle);
    
    const computedChecksum = await this.calculateChecksum(session.transfer.localPath);
    if (computedChecksum !== checksum) {
      session.transfer.status = 'failed';
      session.transfer.error = 'Checksum verification failed';
      await databaseService.upsertFileTransfer(session.transfer);
      this.emit('transferFailed', session.transfer);
      this.incomingTransfers.delete(transferId);
      return;
    }

    session.transfer.status = 'completed';
    session.transfer.progress = 100;
    session.transfer.completedAt = Date.now();
    await databaseService.upsertFileTransfer(session.transfer);
    
    this.incomingTransfers.delete(transferId);
    this.emit('transferCompleted', session.transfer);
  }

  private async handleTransferCancel(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId } = message;

    const session = this.incomingTransfers.get(transferId) || this.activeTransfers.get(transferId);
    if (session) {
      session.abortController.abort();
      if (session.fileHandle) {
        await RNFS.close(session.fileHandle);
      }
      session.transfer.status = 'cancelled';
      session.transfer.cancelledAt = Date.now();
      await databaseService.upsertFileTransfer(session.transfer);
      
      this.activeTransfers.delete(transferId);
      this.incomingTransfers.delete(transferId);
      this.emit('transferCancelled', session.transfer);
    }
  }

  private async handleTransferPause(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId } = message;

    const session = this.activeTransfers.get(transferId);
    if (session) {
      session.isPaused = true;
      session.transfer.isPaused = true;
      await databaseService.upsertFileTransfer(session.transfer);
      this.emit('transferPaused', session.transfer);
    }
  }

  private async handleTransferResume(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    const { transferId } = message;

    const session = this.activeTransfers.get(transferId);
    if (session) {
      session.isPaused = false;
      session.transfer.isPaused = false;
      await databaseService.upsertFileTransfer(session.transfer);
      this.emit('transferResumed', session.transfer);
      
      const peer = this.findPeerForUser(session.transfer.receiverId);
      if (peer) {
        this.sendChunks(session, peer.id);
      }
    }
  }

  private async handleTransferRequest(data: Uint8Array): Promise<void> {
    const message = JSON.parse(new TextDecoder().decode(data));
    // Handle incoming transfer request (accept/decline UI)
    this.emit('transferRequest', message);
  }

  private findPeerForUser(userId: string): any {
    const peers = discoveryService.getPeers();
    return peers.find(p => p.userId === userId);
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    const stream = RNFS.readStream(filePath, { encoding: 'base64' });
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: string) => {
        hash.update(Buffer.from(chunk, 'base64'));
      });
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      stream.on('error', reject);
    });
  }

  getActiveTransfers(): FileTransfer[] {
    return Array.from(this.activeTransfers.values()).map(s => s.transfer);
  }

  getIncomingTransfers(): FileTransfer[] {
    return Array.from(this.incomingTransfers.values()).map(s => s.transfer);
  }

  getTransfer(transferId: string): FileTransfer | undefined {
    const session = this.activeTransfers.get(transferId) || this.incomingTransfers.get(transferId);
    return session?.transfer;
  }

  onTransferStarted(callback: (transfer: FileTransfer) => void): () => void {
    this.on('transferStarted', callback);
    return () => this.off('transferStarted', callback);
  }

  onTransferProgress(callback: (transfer: FileTransfer) => void): () => void {
    this.on('transferProgress', callback);
    return () => this.off('transferProgress', callback);
  }

  onTransferCompleted(callback: (transfer: FileTransfer) => void): () => void {
    this.on('transferCompleted', callback);
    return () => this.off('transferCompleted', callback);
  }

  onTransferFailed(callback: (transfer: FileTransfer) => void): () => void {
    this.on('transferFailed', callback);
    return () => this.off('transferFailed', callback);
  }

  onIncomingTransfer(callback: (transfer: FileTransfer) => void): () => void {
    this.on('incomingTransfer', callback);
    return () => this.off('incomingTransfer', callback);
  }
}

export const fileTransferService = new FileTransferService();
export default fileTransferService;