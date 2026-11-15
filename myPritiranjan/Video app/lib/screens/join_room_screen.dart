import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:watch_together/components/animated_background.dart';
import 'package:watch_together/components/glass_card.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/network/discovery_service.dart';
import 'package:watch_together/utils/app_theme.dart';
import 'package:watch_together/utils/logger.dart';

class JoinRoomScreen extends ConsumerStatefulWidget {
  const JoinRoomScreen({super.key});

  @override
  ConsumerState<JoinRoomScreen> createState() => _JoinRoomScreenState();
}

class _JoinRoomScreenState extends ConsumerState<JoinRoomScreen>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;
  
  final _nameController = TextEditingController();
  final _roomIdController = TextEditingController();
  final _pinController = TextEditingController();
  
  final GlobalKey<FormState> _manualFormKey = GlobalKey<FormState>();
  final GlobalKey<FormState> _qrFormKey = GlobalKey<FormState>();
  
  int _currentTab = 0;
  bool _isScanning = false;
  bool _isJoining = false;
  String? _errorMessage;
  List<DiscoveredRoom> _discoveredRooms = [];
  
  QRViewController? _qrController;
  final GlobalKey _qrKey = GlobalKey(debugLabel: 'QR');

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
    _startDiscovery();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _nameController.dispose();
    _roomIdController.dispose();
    _pinController.dispose();
    _qrController?.dispose();
    super.dispose();
  }

  Future<void> _startDiscovery() async {
    // Discovery service would be injected
    // For now, simulate discovery
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
                  _buildTabBar(),
                  Expanded(
                    child: _currentTab == 0 ? _buildScanTab() : _buildManualTab(),
                  ),
                  if (_errorMessage != null) _buildErrorBanner(),
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
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Join Watch Party',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                Text(
                  'Scan QR or enter Room ID',
                  style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GlassCard(
        padding: const EdgeInsets.all(4),
        child: Row(
          children: [
            Expanded(
              child: _buildTabButton(
                index: 0,
                icon: Icons.qr_code_scanner_rounded,
                label: 'Scan QR',
              ),
            ),
            Expanded(
              child: _buildTabButton(
                index: 1,
                icon: Icons.input_rounded,
                label: 'Enter ID',
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton({
    required int index,
    required IconData icon,
    required String label,
  }) {
    final isSelected = _currentTab == index;
    return InkWell(
      onTap: () => setState(() => _currentTab = index),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildScanTab() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          if (!_isScanning) ...[
            Expanded(
              child: GlassCard(
                onTap: _startScanning,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.qr_code_scanner_rounded, size: 80, color: AppTheme.primaryColor.withValues(alpha: 0.5)),
                    const SizedBox(height: 24),
                    const Text(
                      'Scan QR Code',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Point camera at the host\'s QR code',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      onPressed: _startScanning,
                      icon: const Icon(Icons.camera_alt_rounded),
                      label: const Text('Start Scanning'),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            Expanded(
              flex: 3,
              child: GlassCard(
                padding: EdgeInsets.zero,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      QRView(
                        key: _qrKey,
                        onQRViewCreated: _onQRViewCreated,
                        overlay: QrScannerOverlayShape(
                          borderColor: AppTheme.primaryColor,
                          borderRadius: 16,
                          borderLength: 40,
                          borderWidth: 4,
                          cutOutSize: MediaQuery.of(context).size.width * 0.7,
                        ),
                      ),
                      Positioned(
                        bottom: 20,
                        left: 0,
                        right: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'Align QR code within frame',
                              style: TextStyle(color: Colors.white, fontSize: 14),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GlassCard(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Discovered Rooms',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 12),
                    if (_discoveredRooms.isEmpty)
                      Text(
                        'No rooms found nearby',
                        style: TextStyle(color: AppTheme.textMuted),
                      )
                    else
                      Expanded(
                        child: ListView.builder(
                          itemCount: _discoveredRooms.length,
                          itemBuilder: (context, index) {
                            final room = _discoveredRooms[index];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                                child: Icon(Icons.videocam_rounded, color: AppTheme.primaryColor, size: 20),
                              ),
                              title: Text(room.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text('${room.participantCount}/${room.maxParticipants} • ${room.hostName}'),
                              trailing: room.isLocked
                                  ? Icon(Icons.lock_rounded, color: AppTheme.warningColor, size: 20)
                                  : null,
                              onTap: () => _joinDiscoveredRoom(room),
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildManualTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Form(
        key: _manualFormKey,
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
                    'Room ID',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _roomIdController,
                    decoration: const InputDecoration(
                      hintText: 'e.g., WT12345678',
                      prefixIcon: Icon(Icons.videocam_rounded),
                    ),
                    textCapitalization: TextCapitalization.characters,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Please enter Room ID';
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
                    'PIN (if required)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pinController,
                    decoration: const InputDecoration(
                      hintText: 'Enter PIN',
                      prefixIcon: Icon(Icons.lock_rounded),
                    ),
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isJoining ? null : _joinManually,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: _isJoining
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Join Room', style: TextStyle(fontSize: 18)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner() {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.errorColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.errorColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline_rounded, color: AppTheme.errorColor),
          const SizedBox(width: 12),
          Expanded(
            child: Text(_errorMessage!, style: TextStyle(color: AppTheme.errorColor)),
          ),
          IconButton(
            onPressed: () => setState(() => _errorMessage = null),
            icon: Icon(Icons.close_rounded, color: AppTheme.errorColor),
          ),
        ],
      ),
    );
  }

  void _onQRViewCreated(QRViewController controller) {
    _qrController = controller;
    controller.scannedDataStream.listen((scanData) {
      if (scanData.code != null) {
        _handleQRCode(scanData.code!);
      }
    });
  }

  void _startScanning() async {
    final status = await _qrController?.getCameraInfo();
    if (status != null) {
      setState(() => _isScanning = true);
    }
  }

  void _handleQRCode(String code) {
    // Parse QR code: watchtogether://join?room=WT12345678&pin=1234
    try {
      final uri = Uri.parse(code);
      if (uri.scheme == 'watchtogether' && uri.host == 'join') {
        final roomId = uri.queryParameters['room'];
        final pin = uri.queryParameters['pin'];
        
        if (roomId != null) {
          _roomIdController.text = roomId;
          if (pin != null) _pinController.text = pin;
          _currentTab = 1;
          _stopScanning();
          _joinManually();
        }
      }
    } catch (e) {
      AppLogger.e('Failed to parse QR code', error: e);
    }
  }

  void _stopScanning() {
    _qrController?.pauseCamera();
    setState(() => _isScanning = false);
  }

  void _joinManually() async {
    if (!_manualFormKey.currentState!.validate()) return;
    
    setState(() {
      _isJoining = true;
      _errorMessage = null;
    });
    
    try {
      // Join room logic here
      await Future.delayed(const Duration(seconds: 1));
      
      Navigator.pushNamed(context, '/room-lobby', arguments: {
        'roomId': _roomIdController.text,
        'isHost': false,
        'userName': _nameController.text,
        'pin': _pinController.text,
      });
    } catch (e) {
      setState(() => _errorMessage = 'Failed to join: $e');
    } finally {
      setState(() => _isJoining = false);
    }
  }

  void _joinDiscoveredRoom(DiscoveredRoom room) {
    _roomIdController.text = room.id;
    if (room.isLocked) {
      _currentTab = 1;
    } else {
      _joinManually();
    }
  }
}