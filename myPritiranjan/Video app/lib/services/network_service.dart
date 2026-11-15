import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/network/discovery_service.dart';
import 'package:watch_together/network/file_transfer_service.dart';
import 'package:watch_together/sync/sync_engine.dart';
import 'package:watch_together/voice/voice_chat_service.dart';
import 'package:watch_together/chat/chat_engine.dart';
import 'package:watch_together/security/security_manager.dart';
import 'package:watch_together/utils/logger.dart';

class NetworkService with Loggable {
  final DiscoveryService _discoveryService;
  final FileTransferService _fileTransferService;
  final SyncEngine _syncEngine;
  final VoiceChatService _voiceChatService;
  final ChatEngine _chatEngine;
  final SecurityManager _securityManager;
  
  WebSocketChannel? _wsChannel;
  String? _serverUrl;
  bool _isConnected = false;
  String? _localUserId;
  String? _roomId;
  
  final StreamController<NetworkEvent> _eventController = StreamController.broadcast();
  
  Stream<NetworkEvent> get events => _eventController.stream;
  bool get isConnected => _isConnected;
  
  DiscoveryService get discovery => _discoveryService;
  FileTransferService get fileTransfer => _fileTransferService;
  SyncEngine get sync => _syncEngine;
  VoiceChatService get voice => _voiceChatService;
  ChatEngine get chat => _chatEngine;
  SecurityManager get security => _securityManager;

  NetworkService({
    required DiscoveryService discoveryService,
    required FileTransferService fileTransferService,
    required SyncEngine syncEngine,
    required VoiceChatService voiceChatService,
    required ChatEngine chatEngine,
    required SecurityManager securityManager,
  }) : _discoveryService = discoveryService,
       _fileTransferService = fileTransferService,
       _syncEngine = syncEngine,
       _voiceChatService = voiceChatService,
       _chatEngine = chatEngine,
       _securityManager = securityManager {
    _setupInternalListeners();
  }

  void _setupInternalListeners() {
    _syncEngine.outgoingMessages.listen(_sendSyncMessage);
    _chatEngine.outgoingMessages.listen(_sendChatMessage);
    _voiceChatService.stateStream.listen(_onVoiceStateChange);
  }

  Future<void> initialize({required User localUser}) async {
    _localUserId = localUser.id;
    
    await _discoveryService.initialize(currentUser: localUser);
    await _fileTransferService.initialize();
    await _securityManager.initializeRoom(
      roomId: '', // Will be set when room is created/joined
      hostId: localUser.id,
    );
    
    _chatEngine.initialize(
      roomId: '',
      localUserId: localUser.id,
      localUserName: localUser.name,
    );
    
    logInfo('NetworkService initialized for user ${localUser.id}');
  }

  Future<void> createRoom(Room room) async {
    _roomId = room.id;
    _securityManager.initializeRoom(
      roomId: room.id,
      pin: room.pin,
      hostId: room.hostId,
    );
    
    await _discoveryService.startHosting(room);
    
    _syncEngine.initialize(
      localUserId: _localUserId!,
      isHost: true,
      hostId: _localUserId,
    );
    
    _chatEngine.initialize(
      roomId: room.id,
      localUserId: _localUserId!,
      localUserName: room.participants.firstWhere((u) => u.id == _localUserId).name,
    );
    
    _isConnected = true;
    _eventController.add(NetworkEvent(type: NetworkEventType.roomCreated, room: room));
  }

  Future<void> joinRoom(DiscoveredRoom discoveredRoom, String userName, String? pin) async {
    _roomId = discoveredRoom.id;
    
    await _discoveryService.stopDiscovery();
    
    _syncEngine.initialize(
      localUserId: _localUserId!,
      isHost: false,
      hostId: discoveredRoom.id,
    );
    
    _chatEngine.initialize(
      roomId: discoveredRoom.id,
      localUserId: _localUserId!,
      localUserName: userName,
    );
    
    _isConnected = true;
    _syncEngine.sendReady();
    
    _eventController.add(NetworkEvent(
      type: NetworkEventType.roomJoined,
      data: {'roomId': discoveredRoom.id, 'hostIp': discoveredRoom.hostIp},
    ));
  }

  Future<void> leaveRoom() async {
    if (_roomId == null) return;
    
    _syncEngine.sendLeave();
    await _discoveryService.stopHosting();
    await _discoveryService.stopDiscovery();
    
    if (_wsChannel != null) {
      await _wsChannel!.sink.close();
      _wsChannel = null;
    }
    
    _voiceChatService.stopVoiceChat();
    _securityManager.clearRoom();
    
    _isConnected = false;
    _roomId = null;
    
    _eventController.add(NetworkEvent(type: NetworkEventType.roomLeft));
  }

  void _sendSyncMessage(SyncMessage message) {
    if (_wsChannel != null) {
      _wsChannel!.sink.add(jsonEncode(message.toJson()));
    }
    // Also send via local network (UDP/WebRTC)
    _broadcastLocally(message);
  }

  void _broadcastLocally(SyncMessage message) {
    // Implementation for local UDP broadcast
  }

  void _sendChatMessage(ChatMessage message) {
    if (_wsChannel != null) {
      _wsChannel!.sink.add(jsonEncode({
        'type': 'chat',
        'message': message.toJson(),
      }));
    }
  }

  void _onVoiceStateChange(VoiceState state) {
    // Handle voice state changes
  }

  void handleIncomingMessage(String message) {
    try {
      final data = jsonDecode(message);
      
      if (data['type'] == 'sync') {
        final syncMsg = SyncMessage.fromJson(data['message']);
        _syncEngine.handleIncomingMessage(syncMsg);
      } else if (data['type'] == 'chat') {
        final chatMsg = ChatMessage.fromJson(data['message']);
        _chatEngine.receiveMessage(chatMsg);
      } else if (data['type'] == 'voice') {
        // Handle voice data
      }
    } catch (e) {
      logError('Failed to handle incoming message', error: e);
    }
  }

  void handleIncomingSyncMessage(SyncMessage message) {
    _syncEngine.handleIncomingMessage(message);
  }

  void handleIncomingChatMessage(ChatMessage message) {
    _chatEngine.receiveMessage(message);
  }

  void handleIncomingVoiceData(String senderId, String senderName, List<int> data) {
    _voiceChatService.receiveAudioData(senderId, senderName, data);
  }

  void dispose() {
    leaveRoom();
    _eventController.close();
  }
}

enum NetworkEventType {
  roomCreated, roomJoined, roomLeft,
  userJoined, userLeft,
  syncMessage, chatMessage, voiceData,
  connectionLost, connectionRestored,
  error,
}

class NetworkEvent {
  final NetworkEventType type;
  final Room? room;
  final dynamic data;

  const NetworkEvent({
    required this.type,
    this.room,
    this.data,
  });
}