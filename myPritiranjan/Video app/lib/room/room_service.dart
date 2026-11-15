import 'dart:async';
import 'dart:math';
import 'package:uuid/uuid.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/network/discovery_service.dart';
import 'package:watch_together/network/file_transfer_service.dart';
import 'package:watch_together/sync/sync_engine.dart';
import 'package:watch_together/video/video_engine.dart';
import 'package:watch_together/voice/voice_chat_service.dart';
import 'package:watch_together/utils/logger.dart';

class RoomService with Loggable {
  final DiscoveryService _discoveryService;
  final FileTransferService _fileTransferService;
  final SyncEngine _syncEngine;
  final VideoEngine _videoEngine;
  final VoiceChatService _voiceChatService;
  
  Room? _currentRoom;
  User? _localUser;
  String? _localUserId;
  bool _isHost = false;
  
  final StreamController<Room?> _roomController = StreamController.broadcast();
  final StreamController<RoomEvent> _eventController = StreamController.broadcast();
  
  Stream<Room?> get roomStream => _roomController.stream;
  Stream<RoomEvent> get eventStream => _eventController.stream;
  Room? get currentRoom => _currentRoom;
  User? get localUser => _localUser;
  bool get isHost => _isHost;

  RoomService({
    required DiscoveryService discoveryService,
    required FileTransferService fileTransferService,
    required SyncEngine syncEngine,
    required VideoEngine videoEngine,
    required VoiceChatService voiceChatService,
  }) : _discoveryService = discoveryService,
       _fileTransferService = fileTransferService,
       _syncEngine = syncEngine,
       _videoEngine = videoEngine,
       _voiceChatService = voiceChatService {
    _setupListeners();
  }

  void _setupListeners() {
    _discoveryService.roomsStream.listen(_onRoomDiscovered);
    _syncEngine.outgoingMessages.listen(_onSyncMessageOutgoing);
    _syncEngine.incomingMessages.listen(_onSyncMessageIncoming);
    _syncEngine.stateStream.listen(_onSyncStateChanged);
    _videoEngine.stateStream.listen(_onVideoStateChanged);
    _videoEngine.eventStream.listen(_onVideoEvent);
    _voiceChatService.stateStream.listen(_onVoiceStateChanged);
    _voiceChatService.speakerStream.listen(_onSpeakerUpdate);
  }

  Future<Room> createRoom({
    required String userName,
    required String roomName,
    VideoInfo? videoInfo,
    String? pin,
    int maxParticipants = 20,
  }) async {
    _localUserId = const Uuid().v4();
    _localUser = User.create(name: userName, role: UserRole.host, deviceId: _localUserId);
    
    final room = Room.create(
      name: roomName,
      hostId: _localUser!.id,
      pin: pin,
      videoInfo: videoInfo,
      maxParticipants: maxParticipants,
    );
    
    room.participants.add(_localUser!);
    _currentRoom = room;
    _isHost = true;
    
    await _discoveryService.initialize(currentUser: _localUser!);
    await _discoveryService.startHosting(room);
    
    _syncEngine.initialize(
      localUserId: _localUserId!,
      isHost: true,
      hostId: _localUserId,
    );
    
    if (videoInfo != null) {
      await _fileTransferService.startHosting(videoInfo, videoInfo.localPath ?? videoInfo.path);
    }
    
    _roomController.add(_currentRoom);
    _eventController.add(RoomEvent(type: RoomEventType.created, room: room));
    
    logInfo('Created room: ${room.id}');
    return room;
  }

  Future<void> joinRoom({
    required String userName,
    required DiscoveredRoom discoveredRoom,
    String? pin,
  }) async {
    _localUserId = const Uuid().v4();
    _localUser = User.create(name: userName, role: UserRole.viewer, deviceId: _localUserId);
    _isHost = false;
    
    await _discoveryService.initialize(currentUser: _localUser!);
    
    _syncEngine.initialize(
      localUserId: _localUserId!,
      isHost: false,
      hostId: discoveredRoom.id,
    );
    
    final room = Room(
      id: discoveredRoom.id,
      name: discoveredRoom.name,
      hostId: '', // Will be updated when sync message received
      pin: pin,
      state: RoomState.waiting,
      participants: [_localUser!],
      createdAt: DateTime.now(),
    );
    
    _currentRoom = room;
    _roomController.add(_currentRoom);
    
    _syncEngine.sendReady();
    
    _eventController.add(RoomEvent(type: RoomEventType.joined, room: room));
    logInfo('Joined room: ${discoveredRoom.id}');
  }

  Future<void> leaveRoom() async {
    if (_currentRoom == null) return;
    
    _syncEngine.sendLeave();
    await _discoveryService.stopHosting();
    await _discoveryService.stopDiscovery();
    
    if (_isHost && _currentRoom!.videoInfo != null) {
      _fileTransferService.stopHosting(_currentRoom!.videoInfo!.id);
    }
    
    _voiceChatService.stopVoiceChat();
    _videoEngine.dispose();
    
    final oldRoom = _currentRoom;
    _currentRoom = null;
    _localUser = null;
    _isHost = false;
    
    _roomController.add(null);
    _eventController.add(RoomEvent(type: RoomEventType.left, room: oldRoom));
    logInfo('Left room');
  }

  Future<void> startPlayback() async {
    if (!_isHost || _currentRoom == null) return;
    
    if (_currentRoom!.videoInfo == null) {
      _eventController.add(RoomEvent(
        type: RoomEventType.error,
        data: 'No video selected',
      ));
      return;
    }
    
    final videoInfo = _currentRoom!.videoInfo!;
    final localPath = videoInfo.localPath ?? videoInfo.path;
    
    await _videoEngine.loadVideo(videoInfo, localPath: localPath);
    await _videoEngine.play();
    
    _syncEngine.sendStartSync(
      Duration.zero,
      delay: const Duration(seconds: 3),
    );
    
    _currentRoom = _currentRoom!.copyWith(state: RoomState.playing, startedAt: DateTime.now());
    _roomController.add(_currentRoom);
    
    _voiceChatService.startVoiceChat();
    
    _eventController.add(RoomEvent(type: RoomEventType.playbackStarted, room: _currentRoom));
    logInfo('Playback started');
  }

  void pausePlayback() {
    if (!_isHost) return;
    _syncEngine.sendPause(position: _videoEngine.currentState.position);
    _videoEngine.pause();
  }

  void resumePlayback() {
    if (!_isHost) return;
    _syncEngine.sendPlay(position: _videoEngine.currentState.position);
    _videoEngine.play();
  }

  void seek(Duration position) {
    if (!_isHost) return;
    _syncEngine.sendSeek(position);
    _videoEngine.seek(position);
  }

  void setPlaybackRate(double rate) {
    if (!_isHost) return;
    _syncEngine.sendSpeedChange(rate);
    _videoEngine.setPlaybackRate(rate);
  }

  void skipForward({Duration offset = const Duration(seconds: 10)}) {
    final newPosition = (_videoEngine.currentState.position + offset)
        .clamp(Duration.zero, _videoEngine.currentState.duration);
    seek(newPosition);
  }

  void skipBackward({Duration offset = const Duration(seconds: 10)}) {
    final newPosition = (_videoEngine.currentState.position - offset)
        .clamp(Duration.zero, _videoEngine.currentState.duration);
    seek(newPosition);
  }

  void setVideo(VideoInfo videoInfo) {
    if (!_isHost) return;
    
    _currentRoom = _currentRoom!.copyWith(videoInfo: videoInfo);
    _roomController.add(_currentRoom);
    
    if (videoInfo.localPath != null) {
      _fileTransferService.startHosting(videoInfo, videoInfo.localPath!);
    }
  }

  void muteParticipant(String participantId, bool muted) {
    if (!_isHost) return;
    
    final participant = _currentRoom?.participants
        .firstWhere((u) => u.id == participantId, orElse: () => null);
    if (participant != null) {
      final updated = participant.copyWith(isMuted: muted);
      _updateParticipant(updated);
    }
  }

  void removeParticipant(String participantId) {
    if (!_isHost) return;
    
    _currentRoom = _currentRoom!.copyWith(
      participants: _currentRoom!.participants.where((u) => u.id != participantId).toList(),
    );
    _roomController.add(_currentRoom);
  }

  void updateSettings(Map<String, dynamic> settings) {
    if (!_isHost) return;
    
    _currentRoom = _currentRoom!.copyWith(settings: settings);
    _roomController.add(_currentRoom);
  }

  void _updateParticipant(User user) {
    if (_currentRoom == null) return;
    
    _currentRoom = _currentRoom!.copyWith(
      participants: _currentRoom!.participants.map((u) => u.id == user.id ? user : u).toList(),
    );
    _roomController.add(_currentRoom);
  }

  void _onRoomDiscovered(DiscoveredRoom discoveredRoom) {
    logDebug('Room discovered: ${discoveredRoom.id}');
  }

  void _onSyncMessageOutgoing(SyncMessage message) {
    // Send to network layer
  }

  void _onSyncMessageIncoming(SyncMessage message) {
    _handleSyncMessage(message);
  }

  void _handleSyncMessage(SyncMessage message) {
    switch (message.type) {
      case SyncMessageType.join:
        _handleUserJoined(message);
        break;
      case SyncMessageType.leave:
        _handleUserLeft(message);
        break;
      case SyncMessageType.hostChanged:
        _handleHostChanged(message);
        break;
      case SyncMessageType.videoInfo:
        _handleVideoInfo(message);
        break;
      case SyncMessageType.ready:
        _handleUserReady(message);
        break;
      default:
        break;
    }
  }

  void _handleUserJoined(SyncMessage message) {
    final userName = message.payload['userName'] as String?;
    final userId = message.senderId;
    
    if (userName != null && userId != _localUserId) {
      final user = User.create(name: userName, deviceId: userId);
      _currentRoom = _currentRoom!.copyWith(
        participants: [..._currentRoom!.participants, user],
      );
      _roomController.add(_currentRoom);
      _eventController.add(RoomEvent(type: RoomEventType.userJoined, data: user));
    }
  }

  void _handleUserLeft(SyncMessage message) {
    final userId = message.senderId;
    
    if (userId != _localUserId) {
      _currentRoom = _currentRoom!.copyWith(
        participants: _currentRoom!.participants.where((u) => u.id != userId).toList(),
      );
      _roomController.add(_currentRoom);
      _eventController.add(RoomEvent(type: RoomEventType.userLeft, data: userId));
    }
  }

  void _handleHostChanged(SyncMessage message) {
    final newHostId = message.payload['newHostId'] as String?;
    if (newHostId != null) {
      final wasHost = _isHost;
      _isHost = newHostId == _localUserId;
      
      if (!_isHost && wasHost) {
        _eventController.add(RoomEvent(type: RoomEventType.hostMigrated, data: newHostId));
      }
      
      _updateParticipantRoles(newHostId);
    }
  }

  void _handleVideoInfo(SyncMessage message) {
    // Update video info from host
  }

  void _handleUserReady(SyncMessage message) {
    // Track ready users
  }

  void _updateParticipantRoles(String newHostId) {
    if (_currentRoom == null) return;
    
    _currentRoom = _currentRoom!.copyWith(
      hostId: newHostId,
      participants: _currentRoom!.participants.map((u) {
        if (u.id == newHostId) return u.copyWith(role: UserRole.host);
        if (u.id == _currentRoom!.hostId) return u.copyWith(role: UserRole.viewer);
        return u;
      }).toList(),
    );
    _roomController.add(_currentRoom);
  }

  void _onSyncStateChanged(SyncState state) {
    if (!_isHost && state.isPlaying != _videoEngine.currentState.isPlaying) {
      if (state.isPlaying) {
        _videoEngine.play(position: state.position);
      } else {
        _videoEngine.pause();
      }
    }
    
    if (!_isHost && (state.playbackRate - _videoEngine.currentState.playbackRate).abs() > 0.01) {
      _videoEngine.setPlaybackRate(state.playbackRate);
    }
  }

  void _onVideoStateChanged(VideoState state) {
    if (_isHost) {
      _syncEngine.updateLocalPosition(
        state.position,
        isPlaying: state.isPlaying,
        playbackRate: state.playbackRate,
      );
    }
  }

  void _onVideoEvent(VideoEvent event) {
    if (event.type == VideoEventType.completed && _isHost) {
      _syncEngine.sendPause(position: _videoEngine.currentState.duration);
      _videoEngine.pause();
      _eventController.add(RoomEvent(type: RoomEventType.playbackEnded, room: _currentRoom));
    }
  }

  void _onVoiceStateChanged(VoiceState state) {
    // Handle voice state changes
  }

  void _onSpeakerUpdate(SpeakerUpdate update) {
    _eventController.add(RoomEvent(type: RoomEventType.speakerUpdate, data: update));
  }

  void dispose() {
    leaveRoom();
    _roomController.close();
    _eventController.close();
  }
}

enum RoomEventType {
  created, joined, left, userJoined, userLeft,
  playbackStarted, playbackEnded, hostMigrated,
  speakerUpdate, error,
}

class RoomEvent {
  final RoomEventType type;
  final Room? room;
  final dynamic data;

  const RoomEvent({
    required this.type,
    this.room,
    this.data,
  });
}