import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class StorageManager with Loggable {
  static const String keyNickname = 'nickname';
  static const String keyAvatar = 'avatar';
  static const String keyMaxCacheSize = 'max_cache_size';
  static const String keyThemeMode = 'theme_mode';
  static const String keyVideoQuality = 'video_quality';
  static const String keyAudioDucking = 'audio_ducking';
  static const String keyPushToTalk = 'push_to_talk';
  static const String keyHardwareDecoding = 'hardware_decoding';
  static const String keyAutoResume = 'auto_resume';
  static const String keySyncSensitivity = 'sync_sensitivity';
  static const String keyDownloadedVideos = 'downloaded_videos';
  
  Directory? _appDir;
  Directory? _cacheDir;
  Directory? _videoDir;
  SharedPreferences? _prefs;
  
  int _maxCacheSize = 2 * 1024 * 1024 * 1024; // 2GB default

  Future<void> initialize() async {
    _appDir = await getApplicationDocumentsDirectory();
    _cacheDir = await getTemporaryDirectory();
    _videoDir = Directory('${_appDir!.path}/videos');
    
    if (!await _videoDir!.exists()) {
      await _videoDir!.create(recursive: true);
    }
    
    _prefs = await SharedPreferences.getInstance();
    _maxCacheSize = _prefs?.getInt(keyMaxCacheSize) ?? _maxCacheSize;
    
    logInfo('StorageManager initialized');
    logInfo('App dir: ${_appDir!.path}');
    logInfo('Cache dir: ${_cacheDir!.path}');
    logInfo('Video dir: ${_videoDir!.path}');
  }

  String get videoDirectory => _videoDir!.path;
  String get cacheDirectory => _cacheDir!.path;
  String get appDirectory => _appDir!.path;

  int get maxCacheSize => _maxCacheSize;

  Future<void> setMaxCacheSize(int bytes) async {
    _maxCacheSize = bytes;
    await _prefs?.setInt(keyMaxCacheSize, bytes);
  }

  // Nickname & Avatar
  Future<void> setNickname(String nickname) async {
    await _prefs?.setString(keyNickname, nickname);
  }

  String getNickname() => _prefs?.getString(keyNickname) ?? 'User';

  Future<void> setAvatar(String avatarUrl) async {
    await _prefs?.setString(keyAvatar, avatarUrl);
  }

  String? getAvatar() => _prefs?.getString(keyAvatar);

  // Video Management
  Future<String> getVideoPath(String videoId) async {
    return '${_videoDir!.path}/$videoId';
  }

  Future<bool> hasVideo(String videoId) async {
    final path = await getVideoPath(videoId);
    return await File(path).exists();
  }

  Future<int> getVideoSize(String videoId) async {
    final path = await getVideoPath(videoId);
    final file = File(path);
    if (await file.exists()) {
      return await file.length();
    }
    return 0;
  }

  Future<void> deleteVideo(String videoId) async {
    final path = await getVideoPath(videoId);
    final file = File(path);
    if (await file.exists()) {
      await file.delete();
      logInfo('Deleted video: $videoId');
    }
  }

  Future<List<CachedVideo>> getDownloadedVideos() async {
    final videos = <CachedVideo>[];
    if (await _videoDir!.exists()) {
      final files = _videoDir!.listSync();
      for (final file in files) {
        if (file is File) {
          final stat = await file.stat();
          videos.add(CachedVideo(
            id: file.path.split('/').last,
            path: file.path,
            size: stat.size,
            modified: stat.modified,
          ));
        }
      }
    }
    return videos;
  }

  Future<int> getTotalCacheSize() async {
    int total = 0;
    if (await _videoDir!.exists()) {
      final files = _videoDir!.listSync(recursive: true);
      for (final file in files) {
        if (file is File) {
          total += await file.length();
        }
      }
    }
    return total;
  }

  Future<void> clearCache() async {
    if (await _cacheDir!.exists()) {
      await _cacheDir!.delete(recursive: true);
      await _cacheDir!.create(recursive: true);
    }
    logInfo('Cache cleared');
  }

  Future<void> clearAllVideos() async {
    if (await _videoDir!.exists()) {
      await _videoDir!.delete(recursive: true);
      await _videoDir!.create(recursive: true);
    }
    logInfo('All videos cleared');
  }

  Future<void> enforceCacheLimit() async {
    final videos = await getDownloadedVideos();
    final totalSize = videos.fold<int>(0, (sum, v) => sum + v.size);
    
    if (totalSize > _maxCacheSize) {
      // Sort by last modified (oldest first)
      videos.sort((a, b) => a.modified.compareTo(b.modified));
      
      int currentSize = totalSize;
      for (final video in videos) {
        if (currentSize <= _maxCacheSize) break;
        await deleteVideo(video.id);
        currentSize -= video.size;
        logInfo('Auto-removed old video: ${video.id}');
      }
    }
  }

  // Settings
  Future<void> setThemeMode(String mode) async {
    await _prefs?.setString(keyThemeMode, mode);
  }

  String getThemeMode() => _prefs?.getString(keyThemeMode) ?? 'dark';

  Future<void> setVideoQuality(String quality) async {
    await _prefs?.setString(keyVideoQuality, quality);
  }

  String getVideoQuality() => _prefs?.getString(keyVideoQuality) ?? 'auto';

  Future<void> setAudioDucking(bool enabled) async {
    await _prefs?.setBool(keyAudioDucking, enabled);
  }

  bool getAudioDucking() => _prefs?.getBool(keyAudioDucking) ?? true;

  Future<void> setPushToTalk(bool enabled) async {
    await _prefs?.setBool(keyPushToTalk, enabled);
  }

  bool getPushToTalk() => _prefs?.getBool(keyPushToTalk) ?? false;

  Future<void> setHardwareDecoding(bool enabled) async {
    await _prefs?.setBool(keyHardwareDecoding, enabled);
  }

  bool getHardwareDecoding() => _prefs?.getBool(keyHardwareDecoding) ?? true;

  Future<void> setAutoResume(bool enabled) async {
    await _prefs?.setBool(keyAutoResume, enabled);
  }

  bool getAutoResume() => _prefs?.getBool(keyAutoResume) ?? true;

  Future<void> setSyncSensitivity(String sensitivity) async {
    await _prefs?.setString(keySyncSensitivity, sensitivity);
  }

  String getSyncSensitivity() => _prefs?.getString(keySyncSensitivity) ?? 'normal';

  Future<Map<String, dynamic>> getStorageInfo() async {
    final totalCache = await getTotalCacheSize();
    final videos = await getDownloadedVideos();
    
    return {
      'totalCacheSize': totalCache,
      'maxCacheSize': _maxCacheSize,
      'videoCount': videos.length,
      'availableSpace': await _getAvailableSpace(),
      'videos': videos.map((v) => v.toJson()).toList(),
    };
  }

  Future<int> _getAvailableSpace() async {
    try {
      final stat = await _appDir!.stat();
      // This is approximate - real implementation would use platform channel
      return 1024 * 1024 * 1024; // 1GB placeholder
    } catch (e) {
      return 0;
    }
  }

  Future<void> savePlaybackPosition(String videoId, Duration position) async {
    await _prefs?.setInt('playback_$videoId', position.inMilliseconds);
  }

  Duration getPlaybackPosition(String videoId) {
    final ms = _prefs?.getInt('playback_$videoId') ?? 0;
    return Duration(milliseconds: ms);
  }
}

class CachedVideo {
  final String id;
  final String path;
  final int size;
  final DateTime modified;

  CachedVideo({
    required this.id,
    required this.path,
    required this.size,
    required this.modified,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'path': path,
    'size': size,
    'modified': modified.toIso8601String(),
  };
}