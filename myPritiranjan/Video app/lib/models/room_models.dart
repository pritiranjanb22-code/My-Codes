import 'package:equatable/equatable.dart';
import 'package:uuid/uuid.dart';

final _uuid = Uuid();

enum UserRole { host, viewer, admin }
enum ConnectionQuality { excellent, good, poor, disconnected }
enum RoomState { creating, waiting, syncing, playing, paused, ended }
enum VideoSourceType { local, network, peer }
enum SyncMessageType {
  play, pause, seek, sync, buffer, join, leave, heartbeat,
  volume, mute, speed, hostChanged, videoInfo, ready, startSync
}

class User extends Equatable {
  final String id;
  final String name;
  final String avatarUrl;
  final UserRole role;
  final bool isMuted;
  final bool isSpeaking;
  final ConnectionQuality connectionQuality;
  final DateTime joinedAt;
  final String? deviceId;
  final Map<String, dynamic> metadata;

  const User({
    required this.id,
    required this.name,
    this.avatarUrl = '',
    this.role = UserRole.viewer,
    this.isMuted = false,
    this.isSpeaking = false,
    this.connectionQuality = ConnectionQuality.disconnected,
    required this.joinedAt,
    this.deviceId,
    this.metadata = const {},
  });

  factory User.create({
    required String name,
    UserRole role = UserRole.viewer,
    String? avatarUrl,
    String? deviceId,
  }) {
    return User(
      id: _uuid.v4(),
      name: name,
      avatarUrl: avatarUrl ?? '',
      role: role,
      joinedAt: DateTime.now(),
      deviceId: deviceId,
    );
  }

  User copyWith({
    String? id,
    String? name,
    String? avatarUrl,
    UserRole? role,
    bool? isMuted,
    bool? isSpeaking,
    ConnectionQuality? connectionQuality,
    DateTime? joinedAt,
    String? deviceId,
    Map<String, dynamic>? metadata,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isMuted: isMuted ?? this.isMuted,
      isSpeaking: isSpeaking ?? this.isSpeaking,
      connectionQuality: connectionQuality ?? this.connectionQuality,
      joinedAt: joinedAt ?? this.joinedAt,
      deviceId: deviceId ?? this.deviceId,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  List<Object?> get props => [
    id, name, avatarUrl, role, isMuted, isSpeaking,
    connectionQuality, joinedAt, deviceId, metadata,
  ];
}

class Room extends Equatable {
  final String id;
  final String name;
  final String hostId;
  final String? pin;
  final RoomState state;
  final List<User> participants;
  final VideoInfo? videoInfo;
  final DateTime createdAt;
  final DateTime? startedAt;
  final Map<String, dynamic> settings;
  final int maxParticipants;

  const Room({
    required this.id,
    required this.name,
    required this.hostId,
    this.pin,
    this.state = RoomState.creating,
    this.participants = const [],
    this.videoInfo,
    required this.createdAt,
    this.startedAt,
    this.settings = const {},
    this.maxParticipants = 20,
  });

  factory Room.create({
    required String name,
    required String hostId,
    String? pin,
    VideoInfo? videoInfo,
    int maxParticipants = 20,
  }) {
    return Room(
      id: _uuid.v4().substring(0, 8).toUpperCase(),
      name: name,
      hostId: hostId,
      pin: pin,
      videoInfo: videoInfo,
      createdAt: DateTime.now(),
      maxParticipants: maxParticipants,
      settings: {
        'allowPause': true,
        'allowSeek': true,
        'allowSpeedChange': true,
        'voiceChatEnabled': true,
        'chatEnabled': true,
        'autoSync': true,
        'syncThreshold': 100,
      },
    );
  }

  User? get host => participants.where((u) => u.id == hostId).firstOrNull;
  
  List<User> get viewers => participants.where((u) => u.id != hostId).toList();
  
  int get participantCount => participants.length;
  
  bool get isFull => participants.length >= maxParticipants;
  
  bool get isPlaying => state == RoomState.playing;
  
  bool get canStart => videoInfo != null && participants.length >= 2;

  Room copyWith({
    String? id,
    String? name,
    String? hostId,
    String? pin,
    RoomState? state,
    List<User>? participants,
    VideoInfo? videoInfo,
    DateTime? createdAt,
    DateTime? startedAt,
    Map<String, dynamic>? settings,
    int? maxParticipants,
  }) {
    return Room(
      id: id ?? this.id,
      name: name ?? this.name,
      hostId: hostId ?? this.hostId,
      pin: pin ?? this.pin,
      state: state ?? this.state,
      participants: participants ?? this.participants,
      videoInfo: videoInfo ?? this.videoInfo,
      createdAt: createdAt ?? this.createdAt,
      startedAt: startedAt ?? this.startedAt,
      settings: settings ?? this.settings,
      maxParticipants: maxParticipants ?? this.maxParticipants,
    );
  }

  @override
  List<Object?> get props => [
    id, name, hostId, pin, state, participants,
    videoInfo, createdAt, startedAt, settings, maxParticipants,
  ];
}

class VideoInfo extends Equatable {
  final String id;
  final String name;
  final String path;
  final int sizeBytes;
  final String hash;
  final Duration duration;
  final int width;
  final int height;
  final String codec;
  final String container;
  final List<AudioTrack> audioTracks;
  final List<SubtitleTrack> subtitleTracks;
  final VideoSourceType sourceType;
  final String? localPath;
  final Map<String, dynamic> metadata;

  const VideoInfo({
    required this.id,
    required this.name,
    required this.path,
    required this.sizeBytes,
    required this.hash,
    required this.duration,
    required this.width,
    required this.height,
    required this.codec,
    required this.container,
    this.audioTracks = const [],
    this.subtitleTracks = const [],
    this.sourceType = VideoSourceType.local,
    this.localPath,
    this.metadata = const {},
  });

  String get formattedSize {
    const units = ['B', 'KB', 'MB', 'GB'];
    double size = sizeBytes.toDouble();
    int unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return '${size.toStringAsFixed(1)} ${units[unitIndex]}';
  }

  String get formattedDuration {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    }
    return '${minutes}m ${seconds}s';
  }

  String get resolution => '${width}x$height';

  @override
  List<Object?> get props => [
    id, name, path, sizeBytes, hash, duration,
    width, height, codec, container, audioTracks,
    subtitleTracks, sourceType, localPath, metadata,
  ];
}

class AudioTrack extends Equatable {
  final int index;
  final String language;
  final String codec;
  final int channels;
  final int sampleRate;
  final String? title;

  const AudioTrack({
    required this.index,
    required this.language,
    required this.codec,
    required this.channels,
    required this.sampleRate,
    this.title,
  });

  @override
  List<Object?> get props => [index, language, codec, channels, sampleRate, title];
}

class SubtitleTrack extends Equatable {
  final int index;
  final String language;
  final String codec;
  final bool isForced;
  final bool isDefault;
  final String? title;

  const SubtitleTrack({
    required this.index,
    required this.language,
    required this.codec,
    this.isForced = false,
    this.isDefault = false,
    this.title,
  });

  @override
  List<Object?> get props => [index, language, codec, isForced, isDefault, title];
}

class SyncMessage extends Equatable {
  final SyncMessageType type;
  final String senderId;
  final int sequence;
  final DateTime timestamp;
  final Map<String, dynamic> payload;

  const SyncMessage({
    required this.type,
    required this.senderId,
    required this.sequence,
    required this.timestamp,
    this.payload = const {},
  });

  factory SyncMessage.create({
    required SyncMessageType type,
    required String senderId,
    required int sequence,
    Map<String, dynamic> payload = const {},
  }) {
    return SyncMessage(
      type: type,
      senderId: senderId,
      sequence: sequence,
      timestamp: DateTime.now(),
      payload: payload,
    );
  }

  Map<String, dynamic> toJson() => {
    'type': type.name,
    'senderId': senderId,
    'sequence': sequence,
    'timestamp': timestamp.millisecondsSinceEpoch,
    'payload': payload,
  };

  factory SyncMessage.fromJson(Map<String, dynamic> json) {
    return SyncMessage(
      type: SyncMessageType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => SyncMessageType.sync,
      ),
      senderId: json['senderId'],
      sequence: json['sequence'],
      timestamp: DateTime.fromMillisecondsSinceEpoch(json['timestamp']),
      payload: Map<String, dynamic>.from(json['payload'] ?? {}),
    );
  }

  @override
  List<Object?> get props => [type, senderId, sequence, timestamp, payload];
}

class NetworkStats extends Equatable {
  final Duration latency;
  final Duration jitter;
  final double packetLoss;
  final Duration syncDrift;
  final int bytesSent;
  final int bytesReceived;
  final DateTime lastUpdate;

  const NetworkStats({
    this.latency = Duration.zero,
    this.jitter = Duration.zero,
    this.packetLoss = 0.0,
    this.syncDrift = Duration.zero,
    this.bytesSent = 0,
    this.bytesReceived = 0,
    required this.lastUpdate,
  });

  NetworkStats copyWith({
    Duration? latency,
    Duration? jitter,
    double? packetLoss,
    Duration? syncDrift,
    int? bytesSent,
    int? bytesReceived,
    DateTime? lastUpdate,
  }) {
    return NetworkStats(
      latency: latency ?? this.latency,
      jitter: jitter ?? this.jitter,
      packetLoss: packetLoss ?? this.packetLoss,
      syncDrift: syncDrift ?? this.syncDrift,
      bytesSent: bytesSent ?? this.bytesSent,
      bytesReceived: bytesReceived ?? this.bytesReceived,
      lastUpdate: lastUpdate ?? this.lastUpdate,
    );
  }

  ConnectionQuality get quality {
    if (latency.inMilliseconds < 50 && packetLoss < 0.01) return ConnectionQuality.excellent;
    if (latency.inMilliseconds < 150 && packetLoss < 0.05) return ConnectionQuality.good;
    if (latency.inMilliseconds < 500 && packetLoss < 0.15) return ConnectionQuality.poor;
    return ConnectionQuality.disconnected;
  }

  @override
  List<Object?> get props => [
    latency, jitter, packetLoss, syncDrift, bytesSent, bytesReceived, lastUpdate,
  ];
}

class ChatMessage extends Equatable {
  final String id;
  final String senderId;
  final String senderName;
  final String content;
  final DateTime timestamp;
  final MessageType type;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.timestamp,
    this.type = MessageType.text,
  });

  factory ChatMessage.create({
    required String senderId,
    required String senderName,
    required String content,
    MessageType type = MessageType.text,
  }) {
    return ChatMessage(
      id: _uuid.v4(),
      senderId: senderId,
      senderName: senderName,
      content: content,
      timestamp: DateTime.now(),
      type: type,
    );
  }

  @override
  List<Object?> get props => [id, senderId, senderName, content, timestamp, type];
}

enum MessageType { text, system, notification }