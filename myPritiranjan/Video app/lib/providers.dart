import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:watch_together/network/discovery_service.dart';
import 'package:watch_together/network/file_transfer_service.dart';
import 'package:watch_together/sync/sync_engine.dart';
import 'package:watch_together/video/video_engine.dart';
import 'package:watch_together/voice/voice_chat_service.dart';
import 'package:watch_together/chat/chat_engine.dart';
import 'package:watch_together/room/room_service.dart';
import 'package:watch_together/storage/storage_manager.dart';
import 'package:watch_together/security/security_manager.dart';
import 'package:watch_together/permissions/permissions_manager.dart';
import 'package:watch_together/services/network_service.dart';

final discoveryServiceProvider = Provider<DiscoveryService>((ref) {
  return DiscoveryService();
});

final fileTransferServiceProvider = Provider<FileTransferService>((ref) {
  return FileTransferService();
});

final syncEngineProvider = Provider<SyncEngine>((ref) {
  return SyncEngine();
});

final videoEngineProvider = Provider<VideoEngine>((ref) {
  return VideoEngine();
});

final voiceChatServiceProvider = Provider<VoiceChatService>((ref) {
  return VoiceChatService();
});

final chatEngineProvider = Provider<ChatEngine>((ref) {
  return ChatEngine();
});

final securityManagerProvider = Provider<SecurityManager>((ref) {
  return SecurityManager();
});

final permissionsManagerProvider = Provider<PermissionsManager>((ref) {
  return PermissionsManager();
});

final storageManagerProvider = Provider<StorageManager>((ref) {
  return StorageManager();
});

final networkServiceProvider = Provider<NetworkService>((ref) {
  return NetworkService(
    discoveryService: ref.watch(discoveryServiceProvider),
    fileTransferService: ref.watch(fileTransferServiceProvider),
    syncEngine: ref.watch(syncEngineProvider),
    voiceChatService: ref.watch(voiceChatServiceProvider),
    chatEngine: ref.watch(chatEngineProvider),
    securityManager: ref.watch(securityManagerProvider),
  );
});

final roomServiceProvider = Provider<RoomService>((ref) {
  return RoomService(
    discoveryService: ref.watch(discoveryServiceProvider),
    fileTransferService: ref.watch(fileTransferServiceProvider),
    syncEngine: ref.watch(syncEngineProvider),
    videoEngine: ref.watch(videoEngineProvider),
    voiceChatService: ref.watch(voiceChatServiceProvider),
  );
});

final initializationProvider = FutureProvider<void>((ref) async {
  final storage = ref.watch(storageManagerProvider);
  await storage.initialize();
  
  final discovery = ref.watch(discoveryServiceProvider);
  final fileTransfer = ref.watch(fileTransferServiceProvider);
  final videoEngine = ref.watch(videoEngineProvider);
  await videoEngine.initialize();
});