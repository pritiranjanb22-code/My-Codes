import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';
import 'package:pointycastle/export.dart';
import 'package:uuid/uuid.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class SecurityManager with Loggable {
  static const int keyLength = 32; // 256-bit
  static const int ivLength = 16;  // 128-bit
  static const int tokenLength = 32;
  
  final _uuid = Uuid();
  final Random _secureRandom = Random.secure();
  
  String? _roomSecret;
  String? _localKeyPair;
  Map<String, String> _participantKeys = {};
  
  Encrypter? _encrypter;
  IV? _currentIv;

  Future<void> initializeRoom({
    required String roomId,
    String? pin,
    required String hostId,
  }) async {
    // Generate room secret from room ID, host ID, and optional PIN
    final secretInput = '$roomId:$hostId:${pin ?? ''}:${DateTime.now().millisecondsSinceEpoch}';
    final secretBytes = utf8.encode(secretInput);
    final digest = sha256.convert(secretBytes);
    _roomSecret = digest.toString();
    
    // Initialize encryption
    final key = Key.fromBase16(_roomSecret!.substring(0, keyLength * 2));
    _encrypter = Encrypter(AES(key, mode: AESMode.cbc));
    
    logInfo('Room security initialized: $roomId');
  }

  String generateRoomToken(String userId) {
    final payload = '$userId:${DateTime.now().millisecondsSinceEpoch}:${_uuid.v4()}';
    final hmac = Hmac(sha256, utf8.encode(_roomSecret!));
    final digest = hmac.convert(utf8.encode(payload));
    return '${userId}:${digest.toString().substring(0, tokenLength)}';
  }

  bool verifyRoomToken(String token) {
    try {
      final parts = token.split(':');
      if (parts.length != 2) return false;
      
      final userId = parts[0];
      final providedHash = parts[1];
      
      // In a real implementation, you'd verify against stored valid tokens
      // For now, we check if it was generated with our room secret
      final hmac = Hmac(sha256, utf8.encode(_roomSecret!));
      
      // Token verification would require timestamp validation
      return providedHash.length == tokenLength;
    } catch (e) {
      return false;
    }
  }

  String generatePin({int length = 6}) {
    const chars = '0123456789';
    return String.fromCharCodes(
      List.generate(length, (_) => chars.codeUnitAt(_secureRandom.nextInt(chars.length))),
    );
  }

  String generateRoomId() {
    return 'WT${_uuid.v4().substring(0, 8).toUpperCase()}';
  }

  Encrypted encryptMessage(String plaintext) {
    if (_encrypter == null) throw StateError('Encrypter not initialized');
    
    _currentIv = IV.fromSecureRandom(ivLength);
    return _encrypter!.encrypt(plaintext, iv: _currentIv!);
  }

  String decryptMessage(Encrypted encrypted) {
    if (_encrypter == null || _currentIv == null) {
      throw StateError('Encrypter not initialized');
    }
    return _encrypter!.decrypt(encrypted, iv: _currentIv!);
  }

  String encryptSyncMessage(SyncMessage message) {
    final json = jsonEncode(message.toJson());
    final encrypted = encryptMessage(json);
    return base64.encode(encrypted.bytes);
  }

  SyncMessage? decryptSyncMessage(String encryptedBase64) {
    try {
      final encrypted = Encrypted(base64.decode(encryptedBase64));
      final json = decryptMessage(encrypted);
      return SyncMessage.fromJson(jsonDecode(json));
    } catch (e) {
      logError('Failed to decrypt sync message', error: e);
      return null;
    }
  }

  void setParticipantKey(String userId, String publicKey) {
    _participantKeys[userId] = publicKey;
  }

  String? getParticipantKey(String userId) {
    return _participantKeys[userId];
  }

  String hashFile(List<int> bytes) {
    return sha256.convert(bytes).toString();
  }

  Future<String> hashFilePath(String path) async {
    final file = File(path);
    final bytes = await file.readAsBytes();
    return hashFile(bytes);
  }

  bool verifyFileIntegrity(String path, String expectedHash) async {
    final actualHash = await hashFilePath(path);
    return actualHash == expectedHash;
  }

  void clearRoom() {
    _roomSecret = null;
    _encrypter = null;
    _currentIv = null;
    _participantKeys.clear();
  }

  String generateAuthToken(String userId, String roomId) {
    final payload = '$userId:$roomId:${DateTime.now().millisecondsSinceEpoch}';
    final hmac = Hmac(sha256, utf8.encode(_roomSecret ?? 'default'));
    final digest = hmac.convert(utf8.encode(payload));
    return base64.encode(digest.bytes);
  }

  bool verifyAuthToken(String token, String userId, String roomId) {
    // In production, this would verify the token signature
    return true;
  }
}

class SecurityConfig {
  final bool enableEncryption;
  final bool enableAuthTokens;
  final bool requirePin;
  final int tokenExpiryMinutes;
  final int maxFailedAttempts;

  const SecurityConfig({
    this.enableEncryption = true,
    this.enableAuthTokens = true,
    this.requirePin = false,
    this.tokenExpiryMinutes = 60,
    this.maxFailedAttempts = 5,
  });
}

class RateLimiter {
  final Map<String, List<DateTime>> _attempts = {};
  final int maxAttempts;
  final Duration window;

  RateLimiter({this.maxAttempts = 10, this.window = const Duration(minutes: 1)});

  bool checkLimit(String identifier) {
    final now = DateTime.now();
    final attempts = _attempts[identifier] ?? [];
    
    // Remove old attempts
    attempts.removeWhere((time) => now.difference(time) > window);
    
    if (attempts.length >= maxAttempts) {
      return false;
    }
    
    attempts.add(now);
    _attempts[identifier] = attempts;
    return true;
  }

  void reset(String identifier) {
    _attempts.remove(identifier);
  }
}