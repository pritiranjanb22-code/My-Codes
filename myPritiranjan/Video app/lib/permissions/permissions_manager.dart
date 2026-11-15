import 'package:permission_handler/permission_handler.dart';
import 'package:watch_together/utils/logger.dart';

class PermissionsManager with Loggable {
  static final PermissionsManager _instance = PermissionsManager._internal();
  factory PermissionsManager() => _instance;
  PermissionsManager._internal();

  Future<bool> requestLocalNetworkPermission() async {
    if (await Permission.localNetwork.isGranted) return true;
    
    final status = await Permission.localNetwork.request();
    logInfo('Local network permission: $status');
    return status.isGranted;
  }

  Future<bool> requestMicrophonePermission() async {
    if (await Permission.microphone.isGranted) return true;
    
    final status = await Permission.microphone.request();
    logInfo('Microphone permission: $status');
    return status.isGranted;
  }

  Future<bool> requestCameraPermission() async {
    if (await Permission.camera.isGranted) return true;
    
    final status = await Permission.camera.request();
    logInfo('Camera permission: $status');
    return status.isGranted;
  }

  Future<bool> requestStoragePermission() async {
    if (await Permission.storage.isGranted) return true;
    
    final status = await Permission.storage.request();
    logInfo('Storage permission: $status');
    return status.isGranted;
  }

  Future<bool> requestMediaLibraryPermission() async {
    if (await Permission.photos.isGranted) return true;
    
    final status = await Permission.photos.request();
    logInfo('Photos permission: $status');
    return status.isGranted;
  }

  Future<bool> requestBluetoothPermission() async {
    if (await Permission.bluetooth.isGranted) return true;
    
    final status = await Permission.bluetooth.request();
    logInfo('Bluetooth permission: $status');
    return status.isGranted;
  }

  Future<bool> requestNotificationPermission() async {
    if (await Permission.notification.isGranted) return true;
    
    final status = await Permission.notification.request();
    logInfo('Notification permission: $status');
    return status.isGranted;
  }

  Future<bool> requestNearbyWifiDevicesPermission() async {
    if (await Permission.nearbyWifiDevices.isGranted) return true;
    
    final status = await Permission.nearbyWifiDevices.request();
    logInfo('Nearby WiFi devices permission: $status');
    return status.isGranted;
  }

  Future<Map<Permission, PermissionStatus>> requestAllEssentialPermissions() async {
    final permissions = [
      Permission.localNetwork,
      Permission.microphone,
      Permission.camera,
      Permission.storage,
      Permission.photos,
      Permission.bluetooth,
      Permission.notification,
    ];
    
    final statuses = await permissions.request();
    logInfo('Essential permissions: $statuses');
    return statuses;
  }

  Future<Map<Permission, PermissionStatus>> requestVideoPermissions() async {
    final permissions = [
      Permission.storage,
      Permission.photos,
      Permission.videos,
    ];
    
    return await permissions.request();
  }

  Future<Map<Permission, PermissionStatus>> requestVoiceChatPermissions() async {
    final permissions = [
      Permission.microphone,
      Permission.bluetooth,
      Permission.bluetoothConnect,
    ];
    
    return await permissions.request();
  }

  Future<bool> checkPermission(Permission permission) async {
    return await permission.isGranted;
  }

  Future<bool> isPermanentlyDenied(Permission permission) async {
    return await permission.isPermanentlyDenied;
  }

  Future<void> openAppSettings() async {
    await openAppSettings();
  }

  Future<void> showPermissionRationale(
    BuildContext context,
    Permission permission,
    String rationale,
  ) async {
    // This would show a custom dialog explaining why the permission is needed
    // Implementation depends on UI framework
  }

  String getPermissionDescription(Permission permission) {
    switch (permission) {
      case Permission.localNetwork:
        return 'Required to discover and connect to other devices on your Wi-Fi network for synchronized playback.';
      case Permission.microphone:
        return 'Required for voice chat during watch parties. You can mute/unmute anytime.';
      case Permission.camera:
        return 'Required to scan QR codes for joining watch parties.';
      case Permission.storage:
        return 'Required to select videos from your device storage.';
      case Permission.photos:
        return 'Required to access videos in your photo library.';
      case Permission.videos:
        return 'Required to access videos in your media library.';
      case Permission.bluetooth:
        return 'Required for Bluetooth audio output to headphones/speakers.';
      case Permission.bluetoothConnect:
        return 'Required to connect to Bluetooth audio devices.';
      case Permission.notification:
        return 'Required to show notifications when friends join/leave or control playback.';
      case Permission.nearbyWifiDevices:
        return 'Required for enhanced local network discovery on Android 13+.';
      default:
        return 'This permission is required for app functionality.';
    }
  }
}

class PermissionStatusInfo {
  final Permission permission;
  final PermissionStatus status;
  final String description;
  final bool isRequired;

  PermissionStatusInfo({
    required this.permission,
    required this.status,
    required this.description,
    required this.isRequired,
  });

  String get statusText {
    switch (status) {
      case PermissionStatus.granted:
        return 'Granted';
      case PermissionStatus.denied:
        return 'Denied';
      case PermissionStatus.permanentlyDenied:
        return 'Permanently Denied';
      case PermissionStatus.restricted:
        return 'Restricted';
      case PermissionStatus.limited:
        return 'Limited';
      case PermissionStatus.provisional:
        return 'Provisional';
    }
  }

  bool get isGranted => status == PermissionStatus.granted;
  bool get canRequest => status != PermissionStatus.permanentlyDenied;
}