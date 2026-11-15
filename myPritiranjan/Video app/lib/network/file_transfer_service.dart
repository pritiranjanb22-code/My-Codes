import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:archive/archive.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class FileTransferService with Loggable {
  static const int chunkSize = 1024 * 1024; // 1MB chunks
  static const int maxConcurrentDownloads = 3;
  static const int maxConcurrentUploads = 5;
  static const Duration requestTimeout = Duration(seconds: 30);
  static const int port = 19877;

  HttpServer? _httpServer;
  final Map<String, FileTransferSession> _activeDownloads = {};
  final Map<String, FileTransferSession> _activeUploads = {};
  final Map<String, StreamController<TransferProgress>> _progressControllers = {};
  
  String? _localIp;
  int _serverPort = port;

  Future<void> initialize() async {
    await _getLocalIp();
    await _startHttpServer();
    logInfo('FileTransferService initialized on $_localIp:$_serverPort');
  }

  Future<void> _getLocalIp() async {
    try {
      final interfaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLoopback: false,
      );
      
      for (final interface in interfaces) {
        for (final addr in interface.addresses) {
          if (!addr.isLoopback && addr.type == InternetAddressType.IPv4) {
            _localIp = addr.address;
            return;
          }
        }
      }
    } catch (e) {
      logError('Failed to get local IP', error: e);
    }
  }

  Future<void> _startHttpServer() async {
    try {
      _httpServer = await HttpServer.bind(InternetAddress.anyIPv4, _serverPort);
      _httpServer!.listen(_handleRequest);
      logInfo('HTTP file server started on port $_serverPort');
    } catch (e) {
      logError('Failed to start HTTP server', error: e);
      rethrow;
    }
  }

  void _handleRequest(HttpRequest request) {
    final path = request.uri.path;
    
    if (path.startsWith('/video/')) {
      _handleVideoRequest(request, path);
    } else if (path.startsWith('/chunk/')) {
      _handleChunkRequest(request, path);
    } else if (path == '/health') {
      request.response
        ..statusCode = HttpStatus.ok
        ..write('OK')
        ..close();
    } else {
      request.response
        ..statusCode = HttpStatus.notFound
        ..close();
    }
  }

  void _handleVideoRequest(HttpRequest request, String path) {
    final videoId = path.replaceFirst('/video/', '');
    final session = _activeUploads[videoId];
    
    if (session == null || session.file == null) {
      request.response
        ..statusCode = HttpStatus.notFound
        ..close();
      return;
    }
    
    _serveFile(request, session.file!);
  }

  void _handleChunkRequest(HttpRequest request, String path) {
    final parts = path.replaceFirst('/chunk/', '').split('/');
    if (parts.length < 2) {
      request.response..statusCode = HttpStatus.badRequest..close();
      return;
    }
    
    final videoId = parts[0];
    final chunkIndex = int.tryParse(parts[1]);
    final session = _activeUploads[videoId];
    
    if (session == null || session.file == null || chunkIndex == null) {
      request.response..statusCode = HttpStatus.notFound..close();
      return;
    }
    
    _serveChunk(request, session.file!, chunkIndex);
  }

  void _serveFile(HttpRequest request, File file) {
    final fileLength = file.lengthSync();
    final rangeHeader = request.headers.value(HttpHeaders.rangeHeader);
    
    if (rangeHeader != null) {
      _serveRange(request, file, fileLength, rangeHeader);
    } else {
      request.response
        ..statusCode = HttpStatus.ok
        ..headers.contentLength = fileLength
        ..headers.contentType = ContentType('video', 'mp4')
        ..addStream(file.openRead())
        ..close();
    }
  }

  void _serveRange(HttpRequest request, File file, int fileLength, String rangeHeader) {
    final rangeMatch = RegExp(r'bytes=(\d+)-(\d*)').firstMatch(rangeHeader);
    if (rangeMatch == null) {
      request.response..statusCode = HttpStatus.rangeNotSatisfiable..close();
      return;
    }
    
    final start = int.parse(rangeMatch.group(1)!);
    final end = rangeMatch.group(2)!.isEmpty 
        ? fileLength - 1 
        : min(int.parse(rangeMatch.group(2)!), fileLength - 1);
    
    final contentLength = end - start + 1;
    
    request.response
      ..statusCode = HttpStatus.partialContent
      ..headers.contentLength = contentLength
      ..headers.add(HttpHeaders.contentRangeHeader, 'bytes $start-$end/$fileLength')
      ..headers.contentType = ContentType('video', 'mp4')
      ..addStream(file.openRead(start, end + 1))
      ..close();
  }

  void _serveChunk(HttpRequest request, File file, int chunkIndex) {
    final start = chunkIndex * chunkSize;
    final fileLength = file.lengthSync();
    final end = min(start + chunkSize - 1, fileLength - 1);
    
    if (start >= fileLength) {
      request.response..statusCode = HttpStatus.notFound..close();
      return;
    }
    
    final contentLength = end - start + 1;
    final hash = _calculateChunkHash(file, start, end);
    
    request.response
      ..statusCode = HttpStatus.ok
      ..headers.contentLength = contentLength
      ..headers.set('X-Chunk-Hash', hash)
      ..headers.set('X-Chunk-Index', chunkIndex.toString())
      ..headers.contentType = ContentType('application', 'octet-stream')
      ..addStream(file.openRead(start, end + 1))
      ..close();
  }

  String _calculateChunkHash(File file, int start, int end) {
    final bytes = file.readAsBytesSync().sublist(start, end + 1);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<FileTransferSession> startDownload({
    required String videoId,
    required String hostIp,
    required int hostPort,
    required VideoInfo videoInfo,
    required String localPath,
    Function(TransferProgress)? onProgress,
  }) async {
    final session = FileTransferSession(
      videoId: videoId,
      hostIp: hostIp,
      hostPort: hostPort,
      videoInfo: videoInfo,
      localPath: localPath,
      totalChunks: (videoInfo.sizeBytes / chunkSize).ceil(),
      status: TransferStatus.downloading,
    );
    
    _activeDownloads[videoId] = session;
    _progressControllers[videoId] = StreamController.broadcast();
    
    if (onProgress != null) {
      _progressControllers[videoId]!.stream.listen(onProgress);
    }
    
    _downloadVideo(session);
    
    return session;
  }

  Future<void> _downloadVideo(FileTransferSession session) async {
    try {
      final client = HttpClient();
      client.connectionTimeout = requestTimeout;
      
      final file = File(session.localPath);
      await file.create(recursive: true);
      final randomAccessFile = file.openSync(mode: FileMode.write);
      
      final totalChunks = session.totalChunks;
      var completedChunks = 0;
      var failedChunks = <int>[];
      
      for (int i = 0; i < maxConcurrentDownloads && i < totalChunks; i++) {
        _downloadChunk(client, session, i, randomAccessFile)
          .then((success) {
            if (success) {
              completedChunks++;
            } else {
              failedChunks.add(i);
            }
            _updateProgress(session, completedChunks, totalChunks);
          });
      }
      
      while (completedChunks + failedChunks.length < totalChunks) {
        await Future.delayed(const Duration(milliseconds: 100));
        
        if (failedChunks.isNotEmpty) {
          final retryChunk = failedChunks.removeAt(0);
          _downloadChunk(client, session, retryChunk, randomAccessFile)
            .then((success) {
              if (success) completedChunks++;
              else failedChunks.add(retryChunk);
              _updateProgress(session, completedChunks, totalChunks);
            });
        }
      }
      
      await randomAccessFile.close();
      client.close();
      
      final verified = await _verifyFile(session);
      if (verified) {
        session.status = TransferStatus.completed;
        _updateProgress(session, totalChunks, totalChunks);
        logInfo('Download completed: ${session.videoId}');
      } else {
        session.status = TransferStatus.failed;
        session.error = 'File verification failed';
        logError('File verification failed for ${session.videoId}');
      }
    } catch (e) {
      session.status = TransferStatus.failed;
      session.error = e.toString();
      logError('Download failed', error: e);
    } finally {
      _activeDownloads.remove(session.videoId);
      await _progressControllers[session.videoId]?.close();
      _progressControllers.remove(session.videoId);
    }
  }

  Future<bool> _downloadChunk(
    HttpClient client,
    FileTransferSession session,
    int chunkIndex,
    RandomAccessFile randomAccessFile,
  ) async {
    try {
      final url = 'http://${session.hostIp}:${session.hostPort}/chunk/${session.videoId}/$chunkIndex';
      final request = await client.getUrl(Uri.parse(url));
      final response = await request.close();
      
      if (response.statusCode != HttpStatus.ok && response.statusCode != HttpStatus.partialContent) {
        return false;
      }
      
      final start = chunkIndex * chunkSize;
      await randomAccessFile.setPosition(start);
      
      await for (final chunk in response) {
        randomAccessFile.writeFromSync(chunk);
      }
      
      final expectedHash = response.headers.value('X-Chunk-Hash');
      if (expectedHash != null) {
        final actualHash = _verifyChunkHash(session.localPath, chunkIndex);
        if (actualHash != expectedHash) {
          logWarning('Chunk hash mismatch for chunk $chunkIndex, retrying...');
          return false;
        }
      }
      
      return true;
    } catch (e) {
      logWarning('Chunk $chunkIndex download failed', error: e);
      return false;
    }
  }

  String _verifyChunkHash(String filePath, int chunkIndex) {
    final file = File(filePath);
    final start = chunkIndex * chunkSize;
    final fileLength = file.lengthSync();
    final end = min(start + chunkSize - 1, fileLength - 1);
    return _calculateChunkHash(file, start, end);
  }

  Future<bool> _verifyFile(FileTransferSession session) async {
    try {
      final file = File(session.localPath);
      if (!await file.exists()) return false;
      
      if (await file.length() != session.videoInfo.sizeBytes) {
        logWarning('File size mismatch');
        return false;
      }
      
      final hash = await _calculateFileHash(file);
      return hash == session.videoInfo.hash;
    } catch (e) {
      logError('File verification error', error: e);
      return false;
    }
  }

  Future<String> _calculateFileHash(File file) async {
    final digest = sha256.convert(await file.readAsBytes());
    return digest.toString();
  }

  void _updateProgress(FileTransferSession session, int completed, int total) {
    session.downloadedChunks = completed;
    session.progress = completed / total;
    
    _progressControllers[session.videoId]?.add(TransferProgress(
      videoId: session.videoId,
      status: session.status,
      progress: session.progress,
      downloadedBytes: completed * chunkSize,
      totalBytes: session.videoInfo.sizeBytes,
      speed: 0, // TODO: calculate speed
      error: session.error,
    ));
  }

  Future<void> startHosting(VideoInfo videoInfo, String localPath) async {
    final session = FileTransferSession(
      videoId: videoInfo.id,
      videoInfo: videoInfo,
      localPath: localPath,
      file: File(localPath),
      totalChunks: (videoInfo.sizeBytes / chunkSize).ceil(),
      status: TransferStatus.hosting,
    );
    
    _activeUploads[videoInfo.id] = session;
    logInfo('Started hosting video: ${videoInfo.name}');
  }

  void stopHosting(String videoId) {
    _activeUploads.remove(videoId);
  }

  Stream<TransferProgress> getProgressStream(String videoId) {
    return _progressControllers[videoId]?.stream ?? const Stream.empty();
  }

  FileTransferSession? getDownloadSession(String videoId) => _activeDownloads[videoId];
  FileTransferSession? getUploadSession(String videoId) => _activeUploads[videoId];

  void dispose() {
    _httpServer?.close(force: true);
    for (final controller in _progressControllers.values) {
      controller.close();
    }
    _activeDownloads.clear();
    _activeUploads.clear();
    _progressControllers.clear();
  }
}

class FileTransferSession {
  final String videoId;
  final String hostIp;
  final int hostPort;
  final VideoInfo videoInfo;
  final String localPath;
  final int totalChunks;
  File? file;
  TransferStatus status;
  double progress = 0.0;
  int downloadedChunks = 0;
  String? error;

  FileTransferSession({
    required this.videoId,
    required this.hostIp,
    required this.hostPort,
    required this.videoInfo,
    required this.localPath,
    required this.totalChunks,
    this.file,
    this.status = TransferStatus.pending,
  });
}

enum TransferStatus { pending, downloading, hosting, completed, failed, paused, cancelled }

class TransferProgress {
  final String videoId;
  final TransferStatus status;
  final double progress;
  final int downloadedBytes;
  final int totalBytes;
  final double speed;
  final String? error;

  const TransferProgress({
    required this.videoId,
    required this.status,
    required this.progress,
    required this.downloadedBytes,
    required this.totalBytes,
    required this.speed,
    this.error,
  });

  String get formattedSpeed {
    if (speed < 1024) return '${speed.toStringAsFixed(1)} B/s';
    if (speed < 1024 * 1024) return '${(speed / 1024).toStringAsFixed(1)} KB/s';
    return '${(speed / (1024 * 1024)).toStringAsFixed(1)} MB/s';
  }
}