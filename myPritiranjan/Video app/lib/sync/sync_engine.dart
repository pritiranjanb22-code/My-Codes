import 'dart:async';
import 'dart:math';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class SyncEngine with Loggable {
  static const Duration heartbeatInterval = Duration(milliseconds: 500);
  static const Duration syncInterval = Duration(seconds: 1);
  static const Duration maxDriftThreshold = Duration(milliseconds: 100);
  static const Duration seekDriftThreshold = Duration(milliseconds: 500);
  static const double playbackRateCorrectionMax = 0.05;
  static const double playbackRateCorrectionMin = 0.01;

  final StreamController<SyncMessage> _outgoingMessages = StreamController.broadcast();
  final StreamController<SyncMessage> _incomingMessages = StreamController.broadcast();
  final StreamController<SyncState> _stateController = StreamController.broadcast();
  
  Timer? _heartbeatTimer;
  Timer? _syncTimer;
  Timer? _driftCorrectionTimer;
  
  int _sequenceNumber = 0;
  int _lastReceivedSequence = 0;
  
  DateTime? _hostClockOffset;
  Duration _networkLatency = Duration.zero;
  Duration _estimatedDrift = Duration.zero;
  Duration _lastKnownPosition = Duration.zero;
  double _currentPlaybackRate = 1.0;
  bool _isPlaying = false;
  bool _isHost = false;
  String? _hostId;
  String? _localUserId;
  
  final List<LatencySample> _latencySamples = [];
  static const int maxLatencySamples = 20;
  
  Stream<SyncMessage> get outgoingMessages => _outgoingMessages.stream;
  Stream<SyncMessage> get incomingMessages => _incomingMessages.stream;
  Stream<SyncState> get stateStream => _stateController.stream;
  
  SyncState get currentState => SyncState(
    isPlaying: _isPlaying,
    position: _lastKnownPosition,
    playbackRate: _currentPlaybackRate,
    hostClockOffset: _hostClockOffset,
    networkLatency: _networkLatency,
    estimatedDrift: _estimatedDrift,
    isHost: _isHost,
  );

  void initialize({
    required String localUserId,
    required bool isHost,
    String? hostId,
  }) {
    _localUserId = localUserId;
    _isHost = isHost;
    _hostId = hostId;
    _sequenceNumber = 0;
    _lastReceivedSequence = 0;
    _hostClockOffset = null;
    _networkLatency = Duration.zero;
    _estimatedDrift = Duration.zero;
    _currentPlaybackRate = 1.0;
    
    logInfo('SyncEngine initialized: isHost=$isHost, hostId=$hostId');
    
    _startHeartbeat();
    _startSyncLoop();
    _startDriftCorrection();
  }

  void handleIncomingMessage(SyncMessage message) {
    if (message.sequence <= _lastReceivedSequence) {
      logDebug('Discarding old message: seq=${message.sequence}, last=${_lastReceivedSequence}');
      return;
    }
    _lastReceivedSequence = message.sequence;
    
    _incomingMessages.add(message);
    
    switch (message.type) {
      case SyncMessageType.sync:
        _handleSyncMessage(message);
        break;
      case SyncMessageType.play:
        _handlePlayMessage(message);
        break;
      case SyncMessageType.pause:
        _handlePauseMessage(message);
        break;
      case SyncMessageType.seek:
        _handleSeekMessage(message);
        break;
      case SyncMessageType.heartbeat:
        _handleHeartbeat(message);
        break;
      case SyncMessageType.speed:
        _handleSpeedMessage(message);
        break;
      case SyncMessageType.hostChanged:
        _handleHostChanged(message);
        break;
      case SyncMessageType.ready:
        _handleReadyMessage(message);
        break;
      case SyncMessageType.startSync:
        _handleStartSync(message);
        break;
      default:
        break;
    }
  }

  void _handleSyncMessage(SyncMessage message) {
    final hostTime = message.payload['hostTime'] as int?;
    final position = message.payload['position'] as double?;
    final playbackRate = message.payload['playbackRate'] as double?;
    final isPlaying = message.payload['isPlaying'] as bool?;
    
    if (hostTime != null) {
      final hostTimestamp = DateTime.fromMillisecondsSinceEpoch(hostTime);
      final localNow = DateTime.now();
      final offset = localNow.difference(hostTimestamp);
      
      if (_hostClockOffset == null) {
        _hostClockOffset = offset;
      } else {
        _hostClockOffset = _smoothOffset(_hostClockOffset!, offset);
      }
    }
    
    if (position != null) {
      final hostPosition = Duration(milliseconds: (position * 1000).round());
      _updateDriftEstimate(hostPosition);
    }
    
    if (playbackRate != null) {
      _currentPlaybackRate = playbackRate;
    }
    
    if (isPlaying != null) {
      _isPlaying = isPlaying;
    }
    
    _notifyStateChanged();
  }

  void _handlePlayMessage(SyncMessage message) {
    final position = message.payload['position'] as double?;
    final scheduledTime = message.payload['scheduledTime'] as int?;
    
    if (scheduledTime != null) {
      final scheduled = DateTime.fromMillisecondsSinceEpoch(scheduledTime);
      final delay = scheduled.difference(DateTime.now());
      if (delay > Duration.zero && delay < Duration(seconds: 10)) {
        Future.delayed(delay, () {
          _isPlaying = true;
          if (position != null) {
            _lastKnownPosition = Duration(milliseconds: (position * 1000).round());
          }
          _notifyStateChanged();
        });
        return;
      }
    }
    
    _isPlaying = true;
    if (position != null) {
      _lastKnownPosition = Duration(milliseconds: (position * 1000).round());
    }
    _notifyStateChanged();
  }

  void _handlePauseMessage(SyncMessage message) {
    final position = message.payload['position'] as double?;
    _isPlaying = false;
    if (position != null) {
      _lastKnownPosition = Duration(milliseconds: (position * 1000).round());
    }
    _notifyStateChanged();
  }

  void _handleSeekMessage(SyncMessage message) {
    final position = message.payload['position'] as double?;
    if (position != null) {
      _lastKnownPosition = Duration(milliseconds: (position * 1000).round());
      _notifyStateChanged();
    }
  }

  void _handleHeartbeat(SyncMessage message) {
    final sendTime = message.payload['sendTime'] as int?;
    if (sendTime != null) {
      final rtt = DateTime.now().millisecondsSinceEpoch - sendTime;
      _recordLatencySample(Duration(milliseconds: rtt));
    }
    
    if (!_isHost) {
      _sendHeartbeatResponse(message.senderId);
    }
  }

  void _handleSpeedMessage(SyncMessage message) {
    final speed = message.payload['speed'] as double?;
    if (speed != null) {
      _currentPlaybackRate = speed;
      _notifyStateChanged();
    }
  }

  void _handleHostChanged(SyncMessage message) {
    final newHostId = message.payload['newHostId'] as String?;
    if (newHostId != null) {
      _hostId = newHostId;
      _isHost = newHostId == _localUserId;
      logInfo('Host changed to: $newHostId (am I host: $_isHost)');
    }
  }

  void _handleReadyMessage(SyncMessage message) {
    // Handle viewer ready state
  }

  void _handleStartSync(SyncMessage message) {
    final startTime = message.payload['startTime'] as int?;
    final position = message.payload['position'] as double?;
    
    if (startTime != null) {
      final scheduled = DateTime.fromMillisecondsSinceEpoch(startTime);
      final delay = scheduled.difference(DateTime.now());
      
      if (delay > Duration.zero && delay < Duration(seconds: 10)) {
        Future.delayed(delay, () {
          _isPlaying = true;
          if (position != null) {
            _lastKnownPosition = Duration(milliseconds: (position * 1000).round());
          }
          _notifyStateChanged();
        });
      }
    }
  }

  void _recordLatencySample(Duration rtt) {
    _latencySamples.add(LatencySample(rtt: rtt, timestamp: DateTime.now()));
    if (_latencySamples.length > maxLatencySamples) {
      _latencySamples.removeAt(0);
    }
    
    if (_latencySamples.length >= 3) {
      final sorted = _latencySamples.map((s) => s.rtt.inMilliseconds).toList()..sort();
      final median = sorted[sorted.length ~/ 2];
      _networkLatency = Duration(milliseconds: median ~/ 2);
    }
  }

  void _updateDriftEstimate(Duration hostPosition) {
    if (!_isPlaying) return;
    
    final expectedPosition = _lastKnownPosition;
    final drift = hostPosition - expectedPosition;
    
    _estimatedDrift = _smoothDrift(_estimatedDrift, drift);
    
    if (_estimatedDrift.abs() > maxDriftThreshold) {
      _applyDriftCorrection(_estimatedDrift);
    }
  }

  Duration _smoothOffset(Duration current, Duration newOffset) {
    final alpha = 0.3;
    return Duration(
      microseconds: (current.inMicroseconds * (1 - alpha) + newOffset.inMicroseconds * alpha).round(),
    );
  }

  Duration _smoothDrift(Duration current, Duration newDrift) {
    final alpha = 0.2;
    return Duration(
      microseconds: (current.inMicroseconds * (1 - alpha) + newDrift.inMicroseconds * alpha).round(),
    );
  }

  void _applyDriftCorrection(Duration drift) {
    if (drift.abs() < maxDriftThreshold) {
      final correctionFactor = (drift.inMilliseconds / 1000.0) * 0.1;
      final targetRate = 1.0 - correctionFactor.clamp(-playbackRateCorrectionMax, playbackRateCorrectionMax);
      _currentPlaybackRate = targetRate.clamp(1.0 - playbackRateCorrectionMax, 1.0 + playbackRateCorrectionMax);
      logDebug('Applying rate correction: $_currentPlaybackRate for drift: ${drift.inMilliseconds}ms');
    } else if (drift.abs() > seekDriftThreshold) {
      _lastKnownPosition += drift;
      _currentPlaybackRate = 1.0;
      logInfo('Large drift detected (${drift.inMilliseconds}ms), seeking to ${_lastKnownPosition}');
    }
    _notifyStateChanged();
  }

  void _startHeartbeat() {
    _heartbeatTimer = Timer.periodic(heartbeatInterval, (_) {
      _sendHeartbeat();
    });
  }

  void _startSyncLoop() {
    _syncTimer = Timer.periodic(syncInterval, (_) {
      if (_isHost) {
        _broadcastSync();
      }
    });
  }

  void _startDriftCorrection() {
    _driftCorrectionTimer = Timer.periodic(const Duration(milliseconds: 200), (_) {
      if (!_isHost && _isPlaying) {
        _lastKnownPosition += Duration(milliseconds: (200 * _currentPlaybackRate).round());
        _notifyStateChanged();
      }
    });
  }

  void _sendHeartbeat() {
    final message = SyncMessage.create(
      type: SyncMessageType.heartbeat,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'sendTime': DateTime.now().millisecondsSinceEpoch,
        'position': _lastKnownPosition.inMilliseconds / 1000.0,
        'playbackRate': _currentPlaybackRate,
        'isPlaying': _isPlaying,
      },
    );
    _outgoingMessages.add(message);
  }

  void _sendHeartbeatResponse(String targetId) {
    final message = SyncMessage.create(
      type: SyncMessageType.heartbeat,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'sendTime': DateTime.now().millisecondsSinceEpoch,
        'isResponse': true,
      },
    );
    _outgoingMessages.add(message);
  }

  void _broadcastSync() {
    final message = SyncMessage.create(
      type: SyncMessageType.sync,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'hostTime': DateTime.now().millisecondsSinceEpoch,
        'position': _lastKnownPosition.inMilliseconds / 1000.0,
        'playbackRate': _currentPlaybackRate,
        'isPlaying': _isPlaying,
      },
    );
    _outgoingMessages.add(message);
  }

  int _nextSequence() => ++_sequenceNumber;

  void sendPlay({Duration? position, Duration? scheduledDelay}) {
    final payload = <String, dynamic>{
      'position': (position ?? _lastKnownPosition).inMilliseconds / 1000.0,
    };
    
    if (scheduledDelay != null) {
      payload['scheduledTime'] = DateTime.now().add(scheduledDelay).millisecondsSinceEpoch;
    }
    
    final message = SyncMessage.create(
      type: SyncMessageType.play,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: payload,
    );
    _outgoingMessages.add(message);
    
    _isPlaying = true;
    if (position != null) _lastKnownPosition = position;
    _notifyStateChanged();
  }

  void sendPause({Duration? position}) {
    final message = SyncMessage.create(
      type: SyncMessageType.pause,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'position': (position ?? _lastKnownPosition).inMilliseconds / 1000.0,
      },
    );
    _outgoingMessages.add(message);
    
    _isPlaying = false;
    if (position != null) _lastKnownPosition = position;
    _notifyStateChanged();
  }

  void sendSeek(Duration position) {
    final message = SyncMessage.create(
      type: SyncMessageType.seek,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'position': position.inMilliseconds / 1000.0,
      },
    );
    _outgoingMessages.add(message);
    
    _lastKnownPosition = position;
    _notifyStateChanged();
  }

  void sendSpeedChange(double speed) {
    final message = SyncMessage.create(
      type: SyncMessageType.speed,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {'speed': speed},
    );
    _outgoingMessages.add(message);
    
    _currentPlaybackRate = speed;
    _notifyStateChanged();
  }

  void sendReady() {
    final message = SyncMessage.create(
      type: SyncMessageType.ready,
      senderId: _localUserId!,
      sequence: _nextSequence(),
    );
    _outgoingMessages.add(message);
  }

  void sendStartSync(Duration position, {Duration delay = const Duration(seconds: 3)}) {
    final startTime = DateTime.now().add(delay);
    final message = SyncMessage.create(
      type: SyncMessageType.startSync,
      senderId: _localUserId!,
      sequence: _nextSequence(),
      payload: {
        'startTime': startTime.millisecondsSinceEpoch,
        'position': position.inMilliseconds / 1000.0,
      },
    );
    _outgoingMessages.add(message);
  }

  void updateLocalPosition(Duration position, {bool isPlaying = true, double? playbackRate}) {
    _lastKnownPosition = position;
    _isPlaying = isPlaying;
    if (playbackRate != null) _currentPlaybackRate = playbackRate;
    
    if (_isHost) {
      _broadcastSync();
    }
  }

  void setPlaybackRate(double rate) {
    _currentPlaybackRate = rate.clamp(0.25, 3.0);
    _notifyStateChanged();
  }

  void _notifyStateChanged() {
    _stateController.add(currentState);
  }

  void dispose() {
    _heartbeatTimer?.cancel();
    _syncTimer?.cancel();
    _driftCorrectionTimer?.cancel();
    _outgoingMessages.close();
    _incomingMessages.close();
    _stateController.close();
  }
}

class LatencySample {
  final Duration rtt;
  final DateTime timestamp;
  
  LatencySample({required this.rtt, required this.timestamp});
}

class SyncState {
  final bool isPlaying;
  final Duration position;
  final double playbackRate;
  final Duration? hostClockOffset;
  final Duration networkLatency;
  final Duration estimatedDrift;
  final bool isHost;

  const SyncState({
    required this.isPlaying,
    required this.position,
    required this.playbackRate,
    this.hostClockOffset,
    required this.networkLatency,
    required this.estimatedDrift,
    required this.isHost,
  });

  Duration get correctedPosition {
    if (hostClockOffset == null) return position;
    return position + hostClockOffset!;
  }
  
  bool get isInSync => estimatedDrift.abs() < const Duration(milliseconds: 100);
}