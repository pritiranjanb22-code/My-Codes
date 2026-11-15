import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:audio_session/audio_session.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class VoiceChatService with Loggable {
  static const int sampleRate = 48000;
  static const int bitRate = 64000;
  static const int chunkDurationMs = 20;
  static const double duckingLevel = 0.3;
  static const Duration duckingFadeDuration = Duration(milliseconds: 200);
  
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  final AudioPlayer _localMonitor = AudioPlayer();
  
  final StreamController<VoiceState> _stateController = StreamController.broadcast();
  final StreamController<SpeakerUpdate> _speakerController = StreamController.broadcast();
  final StreamController<VoiceActivity> _activityController = StreamController.broadcast();
  
  Stream<VoiceState> get stateStream => _stateController.stream;
  Stream<SpeakerUpdate> get speakerStream => _speakerController.stream;
  Stream<VoiceActivity> get activityStream => _activityController.stream;
  
  VoiceState _currentState = VoiceState.disconnected();
  bool _isInitialized = false;
  bool _isRecording = false;
  bool _isMuted = false;
  bool _pushToTalk = false;
  bool _pushToTalkActive = false;
  double _movieVolume = 1.0;
  double _targetMovieVolume = 1.0;
  Timer? _duckingTimer;
  Timer? _vadTimer;
  Timer? _levelTimer;
  
  final Map<String, SpeakerInfo> _speakers = {};
  final List<double> _audioLevels = [];
  static const int maxAudioLevels = 10;
  
  String? _localUserId;
  String? _roomId;

  Future<void> initialize({
    required String localUserId,
    required String roomId,
  }) async {
    _localUserId = localUserId;
    _roomId = roomId;
    
    await _setupAudioSession();
    await _initializeRecorder();
    await _initializePlayer();
    
    _isInitialized = true;
    _updateState(VoiceState.connected(muted: _isMuted));
    logInfo('VoiceChatService initialized for user $_localUserId in room $_roomId');
  }

  Future<void> _setupAudioSession() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration(
      avAudioSessionCategory: AVAudioSessionCategory.playAndRecord,
      avAudioSessionCategoryOptions: [
        AVAudioSessionCategoryOptions.allowBluetooth,
        AVAudioSessionCategoryOptions.mixWithOthers,
        AVAudioSessionCategoryOptions.defaultToSpeaker,
      ],
      avAudioSessionMode: AVAudioSessionMode.videoChat,
      androidAudioAttributes: AudioAttributes(
        usage: AudioUsage.voiceCommunication,
        contentType: AudioContentType.speech,
        flags: AudioFlags.none,
      ),
      androidAudioFocusGainType: AudioFocusGainType.gainTransientMayDuck,
      androidWillPauseWhenDucked: true,
    ));
  }

  Future<void> _initializeRecorder() async {
    final hasPermission = await _recorder.hasPermission();
    if (!hasPermission) {
      logWarning('Microphone permission not granted');
      return;
    }
    
    await _recorder.openRecorder();
    logInfo('Recorder initialized');
  }

  Future<void> _initializePlayer() async {
    await _player.setSource(StreamAudioSource(
      StreamAudioSourceConfig(
        streamUrl: '',
        headers: {},
      ),
    ));
  }

  void startVoiceChat() {
    if (!_isInitialized || _isRecording) return;
    
    _startRecording();
    _startLevelMonitoring();
    _startVAD();
    
    _updateState(_currentState.copyWith(isActive: true));
    logInfo('Voice chat started');
  }

  void stopVoiceChat() {
    _stopRecording();
    _stopLevelMonitoring();
    _stopVAD();
    _stopDucking();
    
    _updateState(_currentState.copyWith(isActive: false));
    logInfo('Voice chat stopped');
  }

  void _startRecording() async {
    try {
      final config = RecordConfig(
        encoder: AudioEncoder.opus,
        sampleRate: sampleRate,
        bitRate: bitRate,
        numChannels: 1,
      );
      
      await _recorder.start(config, path: '');
      _isRecording = true;
      
      _recorder.onData.listen((data) {
        _onAudioData(data);
      });
    } catch (e) {
      logError('Failed to start recording', error: e);
    }
  }

  void _stopRecording() async {
    if (!_isRecording) return;
    
    await _recorder.stop();
    _isRecording = false;
  }

  void _onAudioData(List<int> data) {
    if (_isMuted || (_pushToTalk && !_pushToTalkActive)) return;
    
    final level = _calculateAudioLevel(data);
    _audioLevels.add(level);
    if (_audioLevels.length > maxAudioLevels) {
      _audioLevels.removeAt(0);
    }
    
    final avgLevel = _audioLevels.reduce((a, b) => a + b) / _audioLevels.length;
    _activityController.add(VoiceActivity(
      userId: _localUserId!,
      level: avgLevel,
      isSpeaking: avgLevel > 0.02,
      timestamp: DateTime.now(),
    ));
    
    _sendAudioData(data);
  }

  double _calculateAudioLevel(List<int> data) {
    if (data.isEmpty) return 0.0;
    
    double sum = 0;
    for (int i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        final sample = (data[i] | (data[i + 1] << 8)) / 32768.0;
        sum += sample.abs();
      }
    }
    return sum / (data.length / 2);
  }

  void _sendAudioData(List<int> data) {
    // Send to network service for distribution to other peers
    // This would be connected to the network layer
  }

  void receiveAudioData(String senderId, String senderName, List<int> data) {
    _playAudioData(data);
    
    _speakerController.add(SpeakerUpdate(
      userId: senderId,
      userName: senderName,
      isSpeaking: true,
      timestamp: DateTime.now(),
    ));
    
    _updateSpeaker(senderId, senderName, true);
    _startDucking();
  }

  void _playAudioData(List<int> data) {
    // Play received audio data
    // In a real implementation, this would use a streaming audio player
  }

  void _updateSpeaker(String userId, String userName, bool isSpeaking) {
    _speakers[userId] = SpeakerInfo(
      userId: userId,
      userName: userName,
      isSpeaking: isSpeaking,
      lastSpoke: DateTime.now(),
    );
    
    _speakerController.add(SpeakerUpdate(
      userId: userId,
      userName: userName,
      isSpeaking: isSpeaking,
      timestamp: DateTime.now(),
    ));
  }

  void _startDucking() {
    _targetMovieVolume = duckingLevel;
    _duckingTimer?.cancel();
    _duckingTimer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      _applyDucking();
    });
  }

  void _stopDucking() {
    _targetMovieVolume = 1.0;
    _duckingTimer?.cancel();
    _duckingTimer = Timer.periodic(const Duration(milliseconds: 50), (_) {
      _applyDucking();
      if ((_movieVolume - 1.0).abs() < 0.01) {
        _duckingTimer?.cancel();
        _movieVolume = 1.0;
      }
    });
  }

  void _applyDucking() {
    const step = 0.05;
    if (_movieVolume < _targetMovieVolume) {
      _movieVolume = min(_movieVolume + step, _targetMovieVolume);
    } else if (_movieVolume > _targetMovieVolume) {
      _movieVolume = max(_movieVolume - step, _targetMovieVolume);
    }
    
    // Apply to video player volume
    // This would be connected to the video engine
    _notifyMovieVolumeChange(_movieVolume);
  }

  void _notifyMovieVolumeChange(double volume) {
    // Notify video engine to adjust movie volume
  }

  void _startLevelMonitoring() {
    _levelTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      if (_audioLevels.isEmpty) return;
      
      final avgLevel = _audioLevels.reduce((a, b) => a + b) / _audioLevels.length;
      _updateState(_currentState.copyWith(inputLevel: avgLevel));
    });
  }

  void _stopLevelMonitoring() {
    _levelTimer?.cancel();
    _levelTimer = null;
    _audioLevels.clear();
  }

  void _startVAD() {
    _vadTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      _checkSpeakers();
    });
  }

  void _stopVAD() {
    _vadTimer?.cancel();
    _vadTimer = null;
  }

  void _checkSpeakers() {
    final now = DateTime.now();
    var anySpeaking = false;
    
    _speakers.removeWhere((userId, speaker) {
      if (now.difference(speaker.lastSpoke) > const Duration(milliseconds: 500)) {
        if (speaker.isSpeaking) {
          _speakerController.add(SpeakerUpdate(
            userId: userId,
            userName: speaker.userName,
            isSpeaking: false,
            timestamp: now,
          ));
        }
        return true;
      }
      if (speaker.isSpeaking) anySpeaking = true;
      return false;
    });
    
    if (!anySpeaking && _targetMovieVolume < 1.0) {
      _stopDucking();
    }
  }

  void setMuted(bool muted) {
    _isMuted = muted;
    _updateState(_currentState.copyWith(muted: muted));
  }

  void setPushToTalk(bool enabled) {
    _pushToTalk = enabled;
    _updateState(_currentState.copyWith(pushToTalk: enabled));
  }

  void setPushToTalkActive(bool active) {
    if (!_pushToTalk) return;
    _pushToTalkActive = active;
  }

  void setMovieVolume(double volume) {
    _movieVolume = volume.clamp(0.0, 1.0);
    if (!_isMuted && !_pushToTalkActive) {
      _targetMovieVolume = volume;
    }
  }

  List<SpeakerInfo> get activeSpeakers => _speakers.values
      .where((s) => s.isSpeaking)
      .toList();

  VoiceState get currentState => _currentState;

  void _updateState(VoiceState newState) {
    _currentState = newState;
    _stateController.add(newState);
  }

  void dispose() {
    stopVoiceChat();
    _recorder.dispose();
    _player.dispose();
    _localMonitor.dispose();
    _stateController.close();
    _speakerController.close();
    _activityController.close();
  }
}

class VoiceState {
  final bool isConnected;
  final bool isActive;
  final bool muted;
  final bool pushToTalk;
  final double inputLevel;
  final double outputLevel;
  final List<SpeakerInfo> activeSpeakers;

  const VoiceState({
    required this.isConnected,
    required this.isActive,
    required this.muted,
    required this.pushToTalk,
    required this.inputLevel,
    required this.outputLevel,
    required this.activeSpeakers,
  });

  factory VoiceState.disconnected() => const VoiceState(
    isConnected: false,
    isActive: false,
    muted: false,
    pushToTalk: false,
    inputLevel: 0.0,
    outputLevel: 0.0,
    activeSpeakers: [],
  );

  factory VoiceState.connected({bool muted = false}) => VoiceState(
    isConnected: true,
    isActive: false,
    muted: muted,
    pushToTalk: false,
    inputLevel: 0.0,
    outputLevel: 0.0,
    activeSpeakers: [],
  );

  VoiceState copyWith({
    bool? isConnected,
    bool? isActive,
    bool? muted,
    bool? pushToTalk,
    double? inputLevel,
    double? outputLevel,
    List<SpeakerInfo>? activeSpeakers,
  }) {
    return VoiceState(
      isConnected: isConnected ?? this.isConnected,
      isActive: isActive ?? this.isActive,
      muted: muted ?? this.muted,
      pushToTalk: pushToTalk ?? this.pushToTalk,
      inputLevel: inputLevel ?? this.inputLevel,
      outputLevel: outputLevel ?? this.outputLevel,
      activeSpeakers: activeSpeakers ?? this.activeSpeakers,
    );
  }
}

class SpeakerInfo {
  final String userId;
  final String userName;
  final bool isSpeaking;
  final DateTime lastSpoke;

  SpeakerInfo({
    required this.userId,
    required this.userName,
    required this.isSpeaking,
    required this.lastSpoke,
  });
}

class SpeakerUpdate {
  final String userId;
  final String userName;
  final bool isSpeaking;
  final DateTime timestamp;

  const SpeakerUpdate({
    required this.userId,
    required this.userName,
    required this.isSpeaking,
    required this.timestamp,
  });
}

class VoiceActivity {
  final String userId;
  final double level;
  final bool isSpeaking;
  final DateTime timestamp;

  const VoiceActivity({
    required this.userId,
    required this.level,
    required this.isSpeaking,
    required this.timestamp,
  });
}