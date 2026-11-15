import 'dart:io' show Platform;
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:watch_together/utils/logger.dart';

class InitializationService {
  static Future<void> initialize() async {
    AppLogger.i('Initializing WatchTogether...');
    
    await _setupSystemUI();
    await _initializePreferences();
    await _requestEssentialPermissions();
    await _initializeDirectories();
    await _logDeviceInfo();
    
    AppLogger.i('Initialization complete');
  }

  static Future<void> _setupSystemUI() async {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
        systemNavigationBarDividerColor: Colors.transparent,
      ),
    );
    
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  static Future<void> _initializePreferences() async {
    await SharedPreferences.getInstance();
  }

  static Future<void> _requestEssentialPermissions() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      AppLogger.w('No network connectivity detected');
    }
  }

  static Future<void> _initializeDirectories() async {
    final appDir = await getApplicationDocumentsDirectory();
    AppLogger.d('App directory: ${appDir.path}');
    
    final cacheDir = await getTemporaryDirectory();
    AppLogger.d('Cache directory: ${cacheDir.path}');
  }

  static Future<void> _logDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();
    final packageInfo = await PackageInfo.fromPlatform();
    
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      AppLogger.i('Device: ${androidInfo.brand} ${androidInfo.model}');
      AppLogger.i('Android: ${androidInfo.version.release} (SDK ${androidInfo.version.sdkInt})');
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      AppLogger.i('Device: ${iosInfo.name} ${iosInfo.model}');
      AppLogger.i('iOS: ${iosInfo.systemVersion}');
    }
    
    AppLogger.i('App: ${packageInfo.appName} v${packageInfo.version}+${packageInfo.buildNumber}');
  }
}