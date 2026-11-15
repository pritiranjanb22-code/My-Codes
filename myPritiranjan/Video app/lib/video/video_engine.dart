import 'dart:async';
import 'dart:io';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class VideoEngine with Loggable {
  late Player _player;
  late VideoController _videoController;
  
  VideoInfo? _currentVideo;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double _playbackRate = 1.0;
  double _volume = 1.0;
  bool _isPlaying = false;
  bool _isInitialized = false;
  bool _isBuffering = false;
  double _bufferProgress = 0.0;
  
  final StreamController<VideoState> _stateController = StreamController.broadcast();
  final StreamController<VideoEvent> _eventController = StreamController.broadcast();
  
  Stream<VideoState> get stateStream => _stateController.stream;
  Stream<VideoEvent> get eventStream => _eventController.stream;
  
  VideoState get currentState => VideoState(
    position: _position,
    duration: _duration,
    playbackRate: _playbackRate,
    volume: _volume,
    isPlaying: _isPlaying,
    isBuffering: _isBuffering,
    bufferProgress: _bufferProgress,
    videoInfo: _currentVideo,
  );

  Future<void> initialize() async {
    if (_isInitialized) return;
    
    MediaKit.ensureInitialized();
    
    _player = Player(
      configuration: PlayerConfiguration(
        title: 'WatchTogether',
        ready: () => logInfo('Player ready'),
        completed: () => _onCompleted(),
        error: (error) => _onError(error),
        buffering: (isBuffering) => _onBuffering(isBuffering),
        bufferProgress: (progress) => _onBufferProgress(progress),
        playing: (isPlaying) => _onPlayingChanged(isPlaying),
        position: (position) => _onPositionChanged(position),
        duration: (duration) => _onDurationChanged(duration),
      ),
    );
    
    _videoController = VideoController(_player, configuration: VideoControllerConfiguration(
      enableHardwareAcceleration: true,
    ));
    
    _isInitialized = true;
    logInfo('VideoEngine initialized');
  }

  VideoController get videoController => _videoController;
  Player get player => _player;

  Future<bool> loadVideo(VideoInfo videoInfo, {String? localPath}) async {
    try {
      _currentVideo = videoInfo;
      
      final path = localPath ?? videoInfo.localPath ?? videoInfo.path;
      final media = Media(path);
      
      await _player.open(media, play: false);
      _player.setRate(_playbackRate);
      _player.setVolume(_volume);
      
      logInfo('Video loaded: ${videoInfo.name}');
      return true;
    } catch (e) {
      logError('Failed to load video', error: e);
      return false;
    }
  }

  Future<void> play({Duration? position}) async {
    if (position != null) {
      await seek(position);
    }
    await _player.play();
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
    _position = position;
    _notifyStateChanged();
  }

  Future<void> setPlaybackRate(double rate) async {
    _playbackRate = rate.clamp(0.25, 3.0);
    await _player.setRate(_playbackRate);
    _notifyStateChanged();
  }

  Future<void> setVolume(double volume) async {
    _volume = volume.clamp(0.0, 1.0);
    await _player.setVolume(_volume);
    _notifyStateChanged();
  }

  Future<void> togglePlayPause() async {
    if (_isPlaying) {
      await pause();
    } else {
      await play();
    }
  }

  Future<void> skipForward({Duration offset = const Duration(seconds: 10)}) async {
    final newPosition = (_position + offset).clamp(Duration.zero, _duration);
    await seek(newPosition);
  }

  Future<void> skipBackward({Duration offset = const Duration(seconds: 10)}) async {
    final newPosition = (_position - offset).clamp(Duration.zero, _duration);
    await seek(newPosition);
  }

  Future<void> setAudioTrack(int index) async {
    await _player.setAudioTrack(index);
  }

  Future<void> setSubtitleTrack(int index) async {
    await _player.setSubtitleTrack(index);
  }

  Future<void> setSubtitleEnabled(bool enabled) async {
    // Implementation depends on media_kit version
  }

  List<int> get availableAudioTracks => _player.state.audioTracksIndices;
  List<int> get availableSubtitleTracks => _player.state.subtitleTracksIndices;
  int get currentAudioTrack => _player.state.audioTrackIndex ?? -1;
  int get currentSubtitleTrack => _player.state.subtitleTrackIndex ?? -1;

  void _onCompleted() {
    _isPlaying = false;
    _notifyStateChanged();
    _eventController.add(VideoEvent(type: VideoEventType.completed));
  }

  void _onError(String error) {
    logError('Player error: $error');
    _eventController.add(VideoEvent(type: VideoEventType.error, data: error));
  }

  void _onBuffering(bool isBuffering) {
    _isBuffering = isBuffering;
    _notifyStateChanged();
  }

  void _onBufferProgress(double progress) {
    _bufferProgress = progress.clamp(0.0, 1.0);
    _notifyStateChanged();
  }

  void _onPlayingChanged(bool isPlaying) {
    _isPlaying = isPlaying;
    _notifyStateChanged();
  }

  void _onPositionChanged(Duration position) {
    _position = position;
    _notifyStateChanged();
  }

  void _onDurationChanged(Duration duration) {
    _duration = duration;
    _notifyStateChanged();
  }

  void _notifyStateChanged() {
    _stateController.add(currentState);
  }

  void dispose() {
    _player.dispose();
    _stateController.close();
    _eventController.close();
    _isInitialized = false;
  }
}

class VideoState {
  final Duration position;
  final Duration duration;
  final double playbackRate;
  final double volume;
  final bool isPlaying;
  final bool isBuffering;
  final double bufferProgress;
  final VideoInfo? videoInfo;

  const VideoState({
    required this.position,
    required this.duration,
    required this.playbackRate,
    required this.volume,
    required this.isPlaying,
    required this.isBuffering,
    required this.bufferProgress,
    this.videoInfo,
  });

  double get progress => duration.inMilliseconds > 0 
      ? position.inMilliseconds / duration.inMilliseconds 
      : 0.0;
  
  String get formattedPosition => _formatDuration(position);
  String get formattedDuration => _formatDuration(duration);
  String get formattedRemaining => _formatDuration(duration - position);
  
  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    final seconds = d.inSeconds.remainder(60);
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

enum VideoEventType { completed, error, buffering, trackChanged }

class VideoEvent {
  final VideoEventType type;
  final dynamic data;
  
  const VideoEvent({required this.type, this.data});
}