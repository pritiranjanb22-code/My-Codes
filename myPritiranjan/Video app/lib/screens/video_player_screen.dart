import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/utils/logger.dart';

class VideoPlayerScreen extends ConsumerStatefulWidget {
  final String roomId;
  final bool isHost;
  final VideoInfo video;
  final String userName;
  
  const VideoPlayerScreen({
    super.key,
    required this.roomId,
    required this.isHost,
    required this.video,
    required this.userName,
  });

  @override
  ConsumerState<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends ConsumerState<VideoPlayerScreen>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  late VideoController _videoController;
  late Player _player;
  
  bool _controlsVisible = true;
  bool _isFullscreen = false;
  bool _isLocked = false;
  bool _showSettings = false;
  bool _showParticipants = false;
  bool _showChat = false;
  double _volume = 1.0;
  double _brightness = 1.0;
  double _playbackSpeed = 1.0;
  Timer? _hideControlsTimer;
  Timer? _positionUpdateTimer;
  
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  bool _isPlaying = false;
  bool _isBuffering = false;
  double _bufferProgress = 0.0;
  
  // Gesture detection
  double _dragStartX = 0;
  double _dragStartY = 0;
  Duration _dragStartPosition = Duration.zero;
  double _dragStartVolume = 1.0;
  double _dragStartBrightness = 1.0;
  bool _isSeeking = false;
  bool _isAdjustingVolume = false;
  bool _isAdjustingBrightness = false;
  
  // Sync
  StreamSubscription? _syncSubscription;
  
  // Participants & Chat
  List<User> _participants = [];
  List<ChatMessage> _messages = [];
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    _initializePlayer();
    _startPositionUpdates();
    _setupGestureDetection();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _hideControlsTimer?.cancel();
    _positionUpdateTimer?.cancel();
    _syncSubscription?.cancel();
    _chatController.dispose();
    _chatScrollController.dispose();
    _player.dispose();
    super.dispose();
  }

  void _initializePlayer() {
    _player = Player(
      configuration: PlayerConfiguration(
        title: widget.video.name,
        ready: () => _onPlayerReady(),
        completed: () => _onCompleted(),
        error: (error) => _onError(error),
        buffering: (buffering) => setState(() => _isBuffering = buffering),
        bufferProgress: (progress) => setState(() => _bufferProgress = progress),
        playing: (playing) => setState(() => _isPlaying = playing),
        position: (position) => setState(() => _position = position),
        duration: (duration) => setState(() => _duration = duration),
      ),
    );
    
    _videoController = VideoController(_player);
    
    final media = Media(widget.video.localPath ?? widget.video.path);
    _player.open(media, play: widget.isHost);
  }

  void _onPlayerReady() {
    _player.setRate(_playbackSpeed);
    _player.setVolume(_volume);
    
    if (widget.isHost) {
      // Host starts at position 0, viewers will sync
      _player.seek(Duration.zero);
    }
  }

  void _onCompleted() {
    if (widget.isHost) {
      _player.pause();
      _showEndDialog();
    }
  }

  void _onError(String error) {
    AppLogger.e('Player error: $error');
    _showErrorDialog(error);
  }

  void _startPositionUpdates() {
    _positionUpdateTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted && _isPlaying && widget.isHost) {
        _broadcastPosition();
      }
    });
  }

  void _broadcastPosition() {
    // Send position to sync engine
  }

  void _setupGestureDetection() {
    // Double tap to seek
    // Swipe for volume/brightness/seek
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _player.pause();
    } else if (state == AppLifecycleState.resumed) {
      if (_isPlaying) _player.play();
    }
  }

  void _toggleControls() {
    if (_isLocked) return;
    setState(() => _controlsVisible = !_controlsVisible);
    if (_controlsVisible) _startHideControlsTimer();
  }

  void _startHideControlsTimer() {
    _hideControlsTimer?.cancel();
    _hideControlsTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _isPlaying && !_showSettings && !_showParticipants && !_showChat) {
        setState(() => _controlsVisible = false);
      }
    });
  }

  void _togglePlayPause() {
    if (_isPlaying) {
      _player.pause();
    } else {
      _player.play();
    }
  }

  void _seek(Duration position) {
    _player.seek(position.clamp(Duration.zero, _duration));
  }

  void _skipForward({Duration offset = const Duration(seconds: 10)}) {
    _seek(_position + offset);
  }

  void _skipBackward({Duration offset = const Duration(seconds: 10)}) {
    _seek(_position - offset);
  }

  void _setPlaybackSpeed(double speed) {
    _playbackSpeed = speed.clamp(0.25, 3.0);
    _player.setRate(_playbackSpeed);
    _startHideControlsTimer();
  }

  void _setVolume(double volume) {
    _volume = volume.clamp(0.0, 1.0);
    _player.setVolume(_volume);
    _startHideControlsTimer();
  }

  void _toggleFullscreen() {
    setState(() => _isFullscreen = !_isFullscreen);
    _startHideControlsTimer();
  }

  void _toggleLock() {
    setState(() => _isLocked = !_isLocked);
    _startHideControlsTimer();
  }

  void _showEndDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Video Ended'),
        content: const Text('The video has finished playing.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _player.seek(Duration.zero);
              _player.play();
            },
            child: const Text('Replay'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String error) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: Text('Playback Error', style: TextStyle(color: AppTheme.errorColor)),
        content: Text(error),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration d) {
    final hours = d.inHours;
    final minutes = d.inMinutes.remainder(60);
    final seconds = d.inSeconds.remainder(60);
    if (hours > 0) {
      return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video Player
          Positioned.fill(
            child: GestureDetector(
              onTap: _toggleControls,
              onDoubleTapDown: _onDoubleTapDown,
              onDoubleTap: _onDoubleTap,
              onPanStart: _onPanStart,
              onPanUpdate: _onPanUpdate,
              onPanEnd: _onPanEnd,
              child: Video(_videoController),
            ),
          ),
          
          // Loading/Buffering Overlay
          if (_isBuffering)
            Positioned.fill(
              child: Container(
                color: Colors.black.withValues(alpha: 0.7),
                child: const Center(
                  child: CircularProgressIndicator(color: AppTheme.primaryColor),
                ),
              ),
            ),
          
          // Top Controls
          if (_controlsVisible && !_isLocked)
            _buildTopControls(),
          
          // Bottom Controls
          if (_controlsVisible && !_isLocked)
            _buildBottomControls(),
          
          // Lock Indicator
          if (_isLocked)
            Positioned(
              top: 50,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock_rounded, color: Colors.white, size: 20),
                      const SizedBox(width: 8),
                      Text('Controls Locked', style: TextStyle(color: Colors.white, fontSize: 14)),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: _toggleLock,
                        child: Text('Tap to unlock', style: TextStyle(color: AppTheme.primaryColor, fontSize: 14)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          
          // Side Panels
          if (_showParticipants) _buildParticipantsPanel(),
          if (_showChat) _buildChatPanel(),
          if (_showSettings) _buildSettingsPanel(),
        ],
      ),
    );
  }

  Widget _buildTopControls() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 16,
          left: 16,
          right: 16,
          bottom: 16,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withValues(alpha: 0.7),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          children: [
            if (!widget.isHost)
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 28),
              )
            else
              const SizedBox(width: 48),
            Expanded(
              child: Text(
                widget.video.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: () => setState(() => _showParticipants = !_showParticipants),
                  icon: Icon(Icons.people_rounded, color: Colors.white, size: 24),
                ),
                IconButton(
                  onPressed: () => setState(() => _showChat = !_showChat),
                  icon: Icon(Icons.chat_bubble_outline_rounded, color: Colors.white, size: 24),
                ),
                IconButton(
                  onPressed: () => setState(() => _showSettings = !_showSettings),
                  icon: Icon(Icons.settings_rounded, color: Colors.white, size: 24),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomControls() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom + 16,
          left: 16,
          right: 16,
          top: 16,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withValues(alpha: 0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Progress Bar
            GestureDetector(
              onTapDown: _onProgressTapDown,
              onHorizontalDragUpdate: _onProgressDragUpdate,
              onHorizontalDragEnd: _onProgressDragEnd,
              child: Column(
                children: [
                  Row(
                    children: [
                      Text(_formatDuration(_position), style: const TextStyle(color: Colors.white, fontSize: 12, fontFamily: 'monospace')),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Stack(
                          children: [
                            // Buffer progress
                            LinearProgressIndicator(
                              value: _bufferProgress,
                              backgroundColor: Colors.white.withValues(alpha: 0.3),
                              valueColor: AlwaysStoppedAnimation(Colors.white.withValues(alpha: 0.5)),
                              minHeight: 4,
                              borderRadius: BorderRadius.circular(2),
                            ),
                            // Playback progress
                            LinearProgressIndicator(
                              value: _duration.inMilliseconds > 0 ? _position.inMilliseconds / _duration.inMilliseconds : 0,
                              backgroundColor: Colors.transparent,
                              valueColor: const AlwaysStoppedAnimation(AppTheme.primaryColor),
                              minHeight: 4,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(_formatDuration(_duration), style: const TextStyle(color: Colors.white, fontSize: 12, fontFamily: 'monospace')),
                    ],
                  ),
                  if (_isSeeking) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Seeking to ${_formatDuration(_dragStartPosition)}',
                      style: TextStyle(color: AppTheme.primaryColor, fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Control Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: Icons.replay_10_rounded,
                  onTap: () => _skipBackward(),
                  tooltip: 'Backward 10s',
                ),
                _buildControlButton(
                  icon: _isPlaying ? Icons.pause_circle_filled_rounded : Icons.play_circle_filled_rounded,
                  onTap: _togglePlayPause,
                  size: 56,
                  iconSize: 28,
                  tooltip: 'Play/Pause',
                ),
                _buildControlButton(
                  icon: Icons.forward_10_rounded,
                  onTap: () => _skipForward(),
                  tooltip: 'Forward 10s',
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Additional Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildControlButton(
                  icon: _isLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
                  onTap: _toggleLock,
                  tooltip: _isLocked ? 'Unlock Controls' : 'Lock Controls',
                ),
                _buildControlButton(
                  icon: Icons.speed_rounded,
                  onTap: _showSpeedMenu,
                  tooltip: 'Playback Speed: ${_playbackSpeed}x',
                ),
                _buildControlButton(
                  icon: Icons.audiotrack_rounded,
                  onTap: _showAudioMenu,
                  tooltip: 'Audio Tracks',
                ),
                _buildControlButton(
                  icon: Icons.subtitles_rounded,
                  onTap: _showSubtitleMenu,
                  tooltip: 'Subtitles',
                ),
                _buildControlButton(
                  icon: _isFullscreen ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                  onTap: _toggleFullscreen,
                  tooltip: _isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onTap,
    double size = 44,
    double iconSize = 24,
    String? tooltip,
  }) {
    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(size / 2),
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: iconSize),
          ),
        ),
      ),
    );
  }

  void _onDoubleTapDown(TapDownDetails details) {
    _dragStartX = details.localPosition.dx;
    final screenWidth = MediaQuery.of(context).size.width;
    if (_dragStartX < screenWidth / 2) {
      // Left side - backward
    } else {
      // Right side - forward
    }
  }

  void _onDoubleTap() {
    final screenWidth = MediaQuery.of(context).size.width;
    if (_dragStartX < screenWidth / 2) {
      _skipBackward();
    } else {
      _skipForward();
    }
  }

  void _onPanStart(DragStartDetails details) {
    _dragStartX = details.localPosition.dx;
    _dragStartY = details.localPosition.dy;
    _dragStartPosition = _position;
    _dragStartVolume = _volume;
    _dragStartBrightness = _brightness;
    
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    // Determine gesture type based on start position
    if (_dragStartX < screenWidth * 0.15) {
      _isAdjustingBrightness = true;
    } else if (_dragStartX > screenWidth * 0.85) {
      _isAdjustingVolume = true;
    } else {
      _isSeeking = true;
    }
  }

  void _onPanUpdate(DragUpdateDetails details) {
    final screenHeight = MediaQuery.of(context).size.height;
    final deltaY = details.localPosition.dy - _dragStartY;
    final deltaX = details.localPosition.dx - _dragStartX;
    
    if (_isAdjustingVolume) {
      final newVolume = (_dragStartVolume - deltaY / screenHeight).clamp(0.0, 1.0);
      _setVolume(newVolume);
    } else if (_isAdjustingBrightness) {
      // Adjust brightness (would need platform channel)
      _brightness = (_dragStartBrightness - deltaY / screenHeight).clamp(0.0, 1.0);
    } else if (_isSeeking) {
      final newPosition = _dragStartPosition + Duration(milliseconds: (deltaX * 1000 / screenWidth).round());
      _dragStartPosition = newPosition.clamp(Duration.zero, _duration);
      setState(() {});
    }
  }

  void _onPanEnd(DragEndDetails details) {
    if (_isSeeking) {
      _seek(_dragStartPosition);
    }
    _isSeeking = false;
    _isAdjustingVolume = false;
    _isAdjustingBrightness = false;
  }

  void _onProgressTapDown(TapDownDetails details) {
    _isSeeking = true;
    _onProgressDragUpdate(DragUpdateDetails(
      primaryDelta: 0,
      localPosition: details.localPosition,
      globalPosition: details.globalPosition,
    ));
  }

  void _onProgressDragUpdate(DragUpdateDetails details) {
    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;
    
    final localPosition = renderBox.globalToLocal(details.globalPosition);
    final progress = (localPosition.dx / renderBox.size.width).clamp(0.0, 1.0);
    _dragStartPosition = Duration(milliseconds: (_duration.inMilliseconds * progress).round());
    setState(() {});
  }

  void _onProgressDragEnd(DragEndDetails details) {
    if (_isSeeking) {
      _seek(_dragStartPosition);
    }
    _isSeeking = false;
  }

  void _showSpeedMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Playback Speed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          ),
          ...[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0].map((speed) {
            return ListTile(
              title: Text('${speed}x', style: TextStyle(
                fontSize: 18,
                fontWeight: _playbackSpeed == speed ? FontWeight.w600 : FontWeight.w400,
                color: _playbackSpeed == speed ? AppTheme.primaryColor : AppTheme.textPrimary,
              )),
              trailing: _playbackSpeed == speed ? Icon(Icons.check_rounded, color: AppTheme.primaryColor) : null,
              onTap: () {
                _setPlaybackSpeed(speed);
                Navigator.pop(context);
              },
            );
          }),
        ],
      ),
    );
  }

  void _showAudioMenu() {
    // Show audio track selection
  }

  void _showSubtitleMenu() {
    // Show subtitle selection
  }

  Widget _buildParticipantsPanel() {
    return Positioned(
      top: 0,
      right: 0,
      bottom: 0,
      width: 300,
      child: GlassCard(
        margin: EdgeInsets.zero,
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text('Participants', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  IconButton(
                    onPressed: () => setState(() => _showParticipants = false),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.dividerColor),
            Expanded(
              child: ListView.builder(
                itemCount: _participants.length,
                itemBuilder: (context, index) {
                  final user = _participants[index];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: user.role == UserRole.host ? AppTheme.warningColor.withValues(alpha: 0.2) : AppTheme.primaryColor.withValues(alpha: 0.2),
                      child: Icon(
                        user.role == UserRole.host ? Icons.star_rounded : Icons.person_rounded,
                        color: user.role == UserRole.host ? AppTheme.warningColor : AppTheme.primaryColor,
                      ),
                    ),
                    title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                    subtitle: Row(
                      children: [
                        Icon(user.isMuted ? Icons.mic_off : Icons.mic, size: 12, color: user.isMuted ? AppTheme.textMuted : AppTheme.successColor),
                        const SizedBox(width: 4),
                        Text(user.isMuted ? 'Muted' : 'Speaking', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                        const SizedBox(width: 8),
                        _buildConnectionIndicator(user.connectionQuality),
                      ],
                    ),
                    trailing: widget.isHost && user.id != _participants.firstWhere((u) => u.role == UserRole.host).id
                        ? PopupMenuButton(
                            itemBuilder: (context) => [
                              PopupMenuItem(value: 'mute', child: Text(user.isMuted ? 'Unmute' : 'Mute')),
                              PopupMenuItem(value: 'remove', child: Text('Remove')),
                            ],
                            onSelected: (value) => _handleParticipantAction(value, user),
                          )
                        : null,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatPanel() {
    return Positioned(
      top: 0,
      right: 0,
      bottom: 0,
      width: 320,
      child: GlassCard(
        margin: EdgeInsets.zero,
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text('Chat', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  IconButton(
                    onPressed: () => setState(() => _showChat = false),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.dividerColor),
            Expanded(
              child: ListView.builder(
                controller: _chatScrollController,
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  return _buildChatBubble(msg);
                },
              ),
            ),
            const Divider(height: 1, color: AppTheme.dividerColor),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _chatController,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        filled: true,
                        fillColor: AppTheme.cardColor,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sendMessage,
                    icon: const Icon(Icons.send_rounded, color: AppTheme.primaryColor),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChatBubble(ChatMessage msg) {
    final isMe = msg.senderName == widget.userName;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primaryColor : AppTheme.cardColor,
          borderRadius: BorderRadius.circular(16).copyWith(
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Text(msg.senderName, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryColor)),
            Text(msg.content, style: TextStyle(fontSize: 14, color: isMe ? Colors.white : AppTheme.textPrimary)),
          ],
        ),
      ),
    );
  }

  void _sendMessage() {
    if (_chatController.text.trim().isEmpty) return;
    // Send message logic
    _chatController.clear();
  }

  Widget _buildSettingsPanel() {
    return Positioned(
      top: 0,
      right: 0,
      bottom: 0,
      width: 300,
      child: GlassCard(
        margin: EdgeInsets.zero,
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text('Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  IconButton(
                    onPressed: () => setState(() => _showSettings = false),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppTheme.dividerColor),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildSettingItem('Video Quality', 'Auto', Icons.hd_rounded),
                  _buildSettingItem('Audio Track', 'Default', Icons.audiotrack_rounded),
                  _buildSettingItem('Subtitles', 'Off', Icons.subtitles_rounded),
                  _buildSettingItem('Sleep Timer', 'Off', Icons.timer_rounded),
                  const SizedBox(height: 24),
                  const Text('Advanced', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                  _buildSettingItem('Hardware Decoding', 'On', Icons.memory_rounded),
                  _buildSettingItem('Buffer Size', 'Auto', Icons.storage_rounded),
                  _buildSettingItem('Sync Sensitivity', 'Normal', Icons.sync_rounded),
                  _buildSettingItem('Network Diagnostics', '', Icons.analytics_rounded, onTap: _openDiagnostics),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingItem(String title, String value, IconData icon, {VoidCallback? onTap}) {
    return ListTile(
      onTap: onTap,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.primaryColor, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(value, style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
      trailing: onTap != null ? const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textMuted) : null,
    );
  }

  void _openDiagnostics() {
    // Open diagnostics screen
  }

  void _handleParticipantAction(String action, User user) {
    // Handle mute/remove
  }
}