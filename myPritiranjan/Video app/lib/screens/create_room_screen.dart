import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'
import 'package:file_picker/file_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:watch_together/components/animated_background.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/utils/logger.dart';

class CreateRoomScreen extends ConsumerStatefulWidget {
  const CreateRoomScreen({super.key});

  @override
  ConsumerState<CreateRoomScreen> createState() => _CreateRoomScreenState();
}

class _CreateRoomScreenState extends ConsumerState<CreateRoomScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  final _nameController = TextEditingController();
  final _roomNameController = TextEditingController();
  final _pinController = TextEditingController();
  
  VideoInfo? _selectedVideo;
  File? _videoFile;
  bool _isLoading = false;
  String? _errorMessage;
  
  int _currentStep = 0;
  final List<GlobalKey<FormState>> _formKeys = [
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
  ];

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _slideAnimation = Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _nameController.dispose();
    _roomNameController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(24),
                      child: _buildStepContent(),
                    ),
                  ),
                  _buildBottomActions(),
                ],
              ),
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
                const Text(
                  'Create Watch Party',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  _getStepTitle(),
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          _buildStepIndicator(),
        ],
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0: return 'Enter your name and room details';
      case 1: return 'Select a video to watch';
      case 2: return 'Share the room with friends';
      default: return '';
    }
  }

  Widget _buildStepIndicator() {
    return Row(
      children: List.generate(3, (index) {
        final isActive = index <= _currentStep;
        final isCompleted = index < _currentStep;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isActive 
                  ? (isCompleted ? AppTheme.successColor : AppTheme.primaryColor)
                  : AppTheme.dividerColor,
            ),
          ),
        );
      }),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0: return _buildNameStep();
      case 1: return _buildVideoStep();
      case 2: return _buildShareStep();
      default: return const SizedBox();
    }
  }

  Widget _buildNameStep() {
    return Form(
      key: _formKeys[0],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Your Name',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    hintText: 'Enter your nickname',
                    prefixIcon: Icon(Icons.person_rounded),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your name';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Room Name',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _roomNameController,
                  decoration: const InputDecoration(
                    hintText: 'e.g., Movie Night',
                    prefixIcon: Icon(Icons.video_library_rounded),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter a room name';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          GlassCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Room PIN (Optional)',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                    ),
                    const Spacer(),
                    Switch(
                      value: _pinController.text.isNotEmpty,
                      onChanged: (value) {
                        if (!value) {
                          _pinController.clear();
                        }
                      },
                      activeColor: AppTheme.primaryColor,
                    ),
                  ],
                ),
                if (_pinController.text.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pinController,
                    decoration: const InputDecoration(
                      hintText: '4-6 digit PIN',
                      prefixIcon: Icon(Icons.lock_rounded),
                    ),
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    validator: (value) {
                      if (value != null && value.isNotEmpty && value.length < 4) {
                        return 'PIN must be at least 4 digits';
                      }
                      return null;
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_selectedVideo != null) ...[
          GlassCard(
            child: Row(
              children: [
                Container(
                  width: 80,
                  height: 45,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.videocam_rounded, color: Colors.white, size: 32),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedVideo!.name,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${_selectedVideo!.formattedSize} • ${_selectedVideo!.formattedDuration} • ${_selectedVideo!.resolution}',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _pickVideo,
                  icon: const Icon(Icons.edit_rounded, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ] else ...[
          GlassCard(
            onTap: _pickVideo,
            child: Column(
              children: [
                const SizedBox(height: 40),
                Icon(Icons.cloud_upload_rounded, size: 48, color: AppTheme.textMuted),
                const SizedBox(height: 16),
                Text(
                  'Select a Video',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 8),
                Text(
                  'Choose a video from your device\nSupported: MP4, MKV, MOV, AVI, WebM',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _pickVideo,
                  icon: const Icon(Icons.folder_open_rounded),
                  label: const Text('Browse Files'),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          GlassCard(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(Icons.error_outline_rounded, color: AppTheme.errorColor, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: AppTheme.errorColor, fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildShareStep() {
    if (_selectedVideo == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.errorColor),
            const SizedBox(height: 16),
            const Text('Please select a video first', style: TextStyle(fontSize: 18, color: AppTheme.textSecondary)),
          ],
        ),
      );
    }

    final roomId = 'WT${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';
    final qrData = 'watchtogether://join?room=$roomId&pin=${_pinController.text}';

    return Column(
      children: [
        GlassCard(
          child: Column(
            children: [
              const Text(
                'Room Created!',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                'Room ID: $roomId',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppTheme.textSecondary),
              ),
              if (_pinController.text.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'PIN: ${_pinController.text}',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppTheme.warningColor),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Text(
                'Scan to Join',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 200,
                  backgroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          child: Column(
            children: [
              const Text(
                'Or share manually',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 16),
              _buildShareButton(
                icon: Icons.copy_rounded,
                label: 'Copy Room ID',
                onTap: () => _copyToClipboard(roomId),
              ),
              _buildShareButton(
                icon: Icons.share_rounded,
                label: 'Share via Apps',
                onTap: () => _shareRoom(roomId),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        GlassCard(
          onTap: () => _startSession(roomId),
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.play_circle_fill_rounded, color: AppTheme.successColor, size: 28),
              const SizedBox(width: 12),
              const Text(
                'Start Watch Party',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShareButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
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
      title: Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppTheme.textPrimary)),
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textMuted),
    );
  }

  Widget _buildBottomActions() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                child: const Text('Back'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _nextStep,
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_currentStep == 2 ? 'Done' : 'Next'),
            ),
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    if (!_formKeys[_currentStep].currentState!.validate()) return;
    
    if (_currentStep == 1 && _selectedVideo == null) {
      setState(() => _errorMessage = 'Please select a video');
      return;
    }
    
    setState(() {
      _errorMessage = null;
      _currentStep++;
      if (_currentStep >= 3) _currentStep = 2;
    });
  }

  void _previousStep() {
    setState(() {
      _currentStep--;
      _errorMessage = null;
    });
  }

  Future<void> _pickVideo() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.video,
        allowMultiple: false,
      );
      
      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        _videoFile = File(file.path!);
        
        _selectedVideo = VideoInfo(
          id: const Uuid().v4(),
          name: file.name,
          path: file.path!,
          sizeBytes: file.size,
          hash: '', // Will be calculated
          duration: Duration.zero, // Will be detected
          width: 1920,
          height: 1080,
          codec: 'unknown',
          container: file.extension ?? 'mp4',
        );
        
        setState(() => _errorMessage = null);
      }
    } catch (e) {
      AppLogger.e('Failed to pick video', error: e);
      setState(() => _errorMessage = 'Failed to select video: $e');
    }
  }

  Future<void> _startSession(String roomId) async {
    // Navigate to room lobby
    Navigator.pushNamed(context, '/room-lobby', arguments: {
      'roomId': roomId,
      'isHost': true,
      'video': _selectedVideo,
      'userName': _nameController.text,
      'pin': _pinController.text,
    });
  }

  void _copyToClipboard(String text) {
    // Clipboard copy implementation
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Copied: $text')),
    );
  }

  void _shareRoom(String roomId) {
    // Share implementation
  }
}