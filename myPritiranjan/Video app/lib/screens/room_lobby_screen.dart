import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'
import 'package:watch_together/components/animated_background.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/screens/video_player_screen.dart';

class RoomLobbyScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> arguments;
  
  const RoomLobbyScreen({super.key, required this.arguments});

  @override
  ConsumerState<RoomLobbyScreen> createState() => _RoomLobbyScreenState();
}

class _RoomLobbyScreenState extends ConsumerState<RoomLobbyScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  String get roomId => widget.arguments['roomId'];
  bool get isHost => widget.arguments['isHost'] ?? false;
  VideoInfo? get video => widget.arguments['video'];
  String get userName => widget.arguments['userName'] ?? 'User';
  String get pin => widget.arguments['pin'] ?? '';
  
  List<User> _participants = [];
  bool _isReady = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _animationController.forward();
    _initializeParticipants();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _initializeParticipants() {
    final hostUser = User.create(name: 'Host', role: UserRole.host);
    final localUser = User.create(name: userName, role: isHost ? UserRole.host : UserRole.viewer);
    
    _participants = isHost ? [hostUser, localUser] : [hostUser, localUser];
    
    if (!isHost) {
      _participants[0] = _participants[0].copyWith(name: 'Host');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      children: [
                        _buildRoomInfo(),
                        const SizedBox(height: 20),
                        _buildVideoInfo(),
                        const SizedBox(height: 20),
                        _buildParticipants(),
                        const SizedBox(height: 20),
                        _buildChatPreview(),
                      ],
                    ),
                  ),
                ),
                _buildBottomActions(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (!isHost)
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.textPrimary),
              style: IconButton.styleFrom(
                backgroundColor: AppTheme.cardColor.withValues(alpha: 0.5),
              ),
            ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Room: $roomId',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    if (pin.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.warningColor.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'PIN: $pin',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.warningColor,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  '${_participants.length} participants • ${isHost ? "You're the host" : "Waiting for host"}',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: _showRoomSettings,
            icon: const Icon(Icons.settings_rounded, color: AppTheme.textSecondary),
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.cardColor.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoomInfo() {
    return GlassCard(
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.info_outline_rounded, color: AppTheme.primaryColor, size: 24),
              const SizedBox(width: 12),
              const Text(
                'Room Information',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoRow('Room ID', roomId, copyable: true),
          if (pin.isNotEmpty) _buildInfoRow('PIN', pin),
          _buildInfoRow('Host', isHost ? 'You' : (_participants.firstWhere((u) => u.role == UserRole.host).name)),
          _buildInfoRow('Participants', '${_participants.length} / 20'),
          _buildInfoRow('Status', isHost ? 'Ready to start' : 'Waiting for host to start'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool copyable = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
          ),
          if (copyable)
            IconButton(
              onPressed: () => _copyToClipboard(value),
              icon: Icon(Icons.copy_rounded, size: 18, color: AppTheme.textMuted),
              constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
            ),
        ],
      ),
    );
  }

  Widget _buildVideoInfo() {
    if (video == null) {
      return GlassCard(
        child: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.warningColor, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                isHost ? 'No video selected. Go back to select one.' : 'Waiting for host to select video.',
                style: TextStyle(color: AppTheme.warningColor),
              ),
            ),
          ],
        ),
      );
    }

    return GlassCard(
      child: Row(
        children: [
          Container(
            width: 80,
            height: 45,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppTheme.primaryColor, AppTheme.secondaryColor]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.videocam_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  video!.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${video!.formattedSize} • ${video!.formattedDuration} • ${video!.resolution}',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          if (isHost)
            IconButton(
              onPressed: () => _changeVideo(),
              icon: const Icon(Icons.edit_rounded, color: AppTheme.textSecondary),
            ),
        ],
      ),
    );
  }

  Widget _buildParticipants() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.people_rounded, color: AppTheme.primaryColor, size: 24),
              const SizedBox(width: 12),
              Text(
                'Participants (${_participants.length})',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _participants.length,
            separatorBuilder: (_, __) => Divider(color: AppTheme.dividerColor, height: 1),
            itemBuilder: (context, index) {
              final user = _participants[index];
              final isLocal = user.name == userName;
              return _buildParticipantTile(user, isLocal);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildParticipantTile(User user, bool isLocal) {
    final roleIcon = user.role == UserRole.host ? Icons.star_rounded : Icons.person_rounded;
    final roleColor = user.role == UserRole.host ? AppTheme.warningColor : AppTheme.primaryColor;
    
    return ListTile(
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: roleColor.withValues(alpha: 0.2),
            child: Icon(roleIcon, color: roleColor, size: 20),
          ),
          if (isLocal)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AppTheme.successColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.backgroundColor, width: 2),
                ),
              ),
            ),
        ],
      ),
      title: Row(
        children: [
          Text(
            user.name + (isLocal ? ' (You)' : ''),
            style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          if (user.role == UserRole.host) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: AppTheme.warningColor.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                'HOST',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.warningColor),
              ),
            ),
          ],
        ],
      ),
      subtitle: Row(
        children: [
          Icon(
            user.isMuted ? Icons.mic_off_rounded : Icons.mic_rounded,
            size: 12,
            color: user.isMuted ? AppTheme.textMuted : AppTheme.successColor,
          ),
          const SizedBox(width: 4),
          Text(
            user.isMuted ? 'Muted' : 'Mic on',
            style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
          ),
          const SizedBox(width: 12),
          _buildConnectionIndicator(user.connectionQuality),
        ],
      ),
      trailing: isHost && !isLocal
          ? PopupMenuButton<String>(
              onSelected: (value) => _handleParticipantAction(value, user),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'mute', child: Text('Mute')),
                const PopupMenuItem(value: 'remove', child: Text('Remove')),
              ],
              child: Icon(Icons.more_vert_rounded, color: AppTheme.textMuted),
            )
          : null,
    );
  }

  Widget _buildConnectionIndicator(ConnectionQuality quality) {
    Color color;
    IconData icon;
    switch (quality) {
      case ConnectionQuality.excellent:
        color = AppTheme.successColor;
        icon = Icons.signal_cellular_alt_rounded;
        break;
      case ConnectionQuality.good:
        color = AppTheme.warningColor;
        icon = Icons.signal_cellular_alt_rounded;
        break;
      case ConnectionQuality.poor:
        color = AppTheme.errorColor;
        icon = Icons.signal_cellular_alt_rounded;
        break;
      case ConnectionQuality.disconnected:
        color = AppTheme.textMuted;
        icon = Icons.signal_cellular_off_rounded;
        break;
    }
    return Icon(icon, size: 12, color: color);
  }

  Widget _buildChatPreview() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.chat_bubble_outline_rounded, color: AppTheme.primaryColor, size: 24),
              const SizedBox(width: 12),
              const Text(
                'Chat',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
              const Spacer(),
              TextButton(
                onPressed: _openChat,
                child: const Text('Open'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildChatMessage('System', 'Welcome to the watch party!', isSystem: true),
          _buildChatMessage('Host', 'Video is ready. Press Start when everyone joins.'),
        ],
      ),
    );
  }

  Widget _buildChatMessage(String sender, String message, {bool isSystem = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isSystem) ...[
            CircleAvatar(
              radius: 12,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.2),
              child: Text(
                sender[0].toUpperCase(),
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.primaryColor),
              ),
            ),
            const SizedBox(width: 8),
          ] else ...[
            const SizedBox(width: 32),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isSystem)
                  Text(sender, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                Text(
                  message,
                  style: TextStyle(
                    fontSize: 13,
                    color: isSystem ? AppTheme.textMuted : AppTheme.textPrimary,
                    fontStyle: isSystem ? FontStyle.italic : FontStyle.normal,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (!isHost) ...[
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isReady ? null : _toggleReady,
                icon: Icon(_isReady ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded),
                label: Text(_isReady ? 'Ready' : 'Mark Ready'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _isReady ? AppTheme.successColor : AppTheme.primaryColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ] else ...[
            Expanded(
              child: ElevatedButton.icon(
                onPressed: video == null ? null : _startWatchParty,
                icon: const Icon(Icons.play_circle_fill_rounded, size: 28),
                label: const Text('Start Watch Party'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.successColor,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _toggleReady() {
    setState(() => _isReady = !_isReady);
    // Send ready signal to host
  }

  void _startWatchParty() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => VideoPlayerScreen(
          roomId: roomId,
          isHost: isHost,
          video: video!,
          userName: userName,
        ),
      ),
    );
  }

  void _changeVideo() {
    Navigator.pop(context);
  }

  void _showRoomSettings() {
    // Show settings bottom sheet
  }

  void _openChat() {
    // Open chat screen
  }

  void _handleParticipantAction(String action, User user) {
    if (action == 'mute') {
      // Mute participant
    } else if (action == 'remove') {
      // Remove participant
    }
  }

  void _copyToClipboard(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Copied: $text')),
    );
  }
}