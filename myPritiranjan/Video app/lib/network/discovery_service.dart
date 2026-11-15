import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:multicast_dns/multicast_dns.dart';
import 'package:bonjour/bonjour.dart';
import 'package:udp/udp.dart';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class DiscoveryService with Loggable {
  static const String serviceName = '_watchtogether._tcp';
  static const int discoveryPort = 19876;
  static const int mdnsPort = 5353;
  static const Duration discoveryInterval = Duration(seconds: 5);
  static const Duration serviceTimeout = Duration(seconds: 15);

  MDnsClient? _mdnsClient;
  Bonjour? _bonjour;
  UDPReceiver? _udpReceiver;
  UDPSender? _udpSender;
  
  final StreamController<DiscoveredRoom> _roomsController = StreamController.broadcast();
  final Map<String, DiscoveredRoom> _discoveredRooms = {};
  final Map<String, Timer> _roomTimers = {};
  Timer? _discoveryTimer;
  Timer? _announceTimer;
  
  String? _localIp;
  int? _localPort;
  Room? _hostedRoom;
  User? _currentUser;
  bool _isDiscovering = false;
  bool _isHosting = false;

  Stream<DiscoveredRoom> get roomsStream => _roomsController.stream;
  List<DiscoveredRoom> get discoveredRooms => _discoveredRooms.values.toList();
  bool get isDiscovering => _isDiscovering;
  bool get isHosting => _isHosting;

  Future<void> initialize({
    required User currentUser,
    int? preferredPort,
  }) async {
    _currentUser = currentUser;
    _localPort = preferredPort ?? discoveryPort;
    
    await _getLocalIp();
    await _startUdpListener();
    await _startMdns();
    
    logInfo('Discovery service initialized on $_localIp:$_localPort');
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

  Future<void> _startUdpListener() async {
    try {
      _udpReceiver = await UDPReceiver.bind(InternetAddress.anyIPv4, _localPort!);
      _udpSender = UDPSender();
      
      _udpReceiver!.listen((datagram) {
        _handleUdpMessage(datagram);
      });
      
      logInfo('UDP listener started on port $_localPort');
    } catch (e) {
      logError('Failed to start UDP listener', error: e);
    }
  }

  Future<void> _startMdns() async {
    try {
      _mdnsClient = MDnsClient();
      await _mdnsClient!.start();
      
      _bonjour = Bonjour();
      await _bonjour!.ready;
      
      logInfo('mDNS/Bonjour started');
    } catch (e) {
      logError('Failed to start mDNS/Bonjour', error: e);
    }
  }

  void _handleUdpMessage(Datagram datagram) {
    try {
      final message = utf8.decode(datagram.data);
      final data = jsonDecode(message) as Map<String, dynamic>;
      
      if (data['type'] == 'room_announce') {
        _processRoomAnnouncement(data, datagram.address.address);
      }
    } catch (e) {
      logWarning('Failed to parse UDP message', error: e);
    }
  }

  void _processRoomAnnouncement(Map<String, dynamic> data, String senderIp) {
    final roomId = data['roomId'] as String?;
    if (roomId == null || roomId == _hostedRoom?.id) return;

    final room = DiscoveredRoom(
      id: roomId,
      name: data['name'] as String? ?? 'Unknown Room',
      hostName: data['hostName'] as String? ?? 'Unknown',
      hostIp: senderIp,
      port: data['port'] as int? ?? discoveryPort,
      participantCount: data['participantCount'] as int? ?? 0,
      maxParticipants: data['maxParticipants'] as int? ?? 20,
      hasVideo: data['hasVideo'] as bool? ?? false,
      videoName: data['videoName'] as String?,
      isLocked: data['isLocked'] as bool? ?? false,
      discoveredAt: DateTime.now(),
    );

    _updateDiscoveredRoom(room);
  }

  void _updateDiscoveredRoom(DiscoveredRoom room) {
    final existing = _discoveredRooms[room.id];
    
    if (existing != null) {
      _roomTimers[room.id]?.cancel();
    } else {
      _discoveredRooms[room.id] = room;
      _roomsController.add(room);
    }
    
    _roomTimers[room.id] = Timer(serviceTimeout, () {
      _removeDiscoveredRoom(room.id);
    });
  }

  void _removeDiscoveredRoom(String roomId) {
    _discoveredRooms.remove(roomId);
    _roomTimers[roomId]?.cancel();
    _roomTimers.remove(roomId);
  }

  Future<void> startDiscovery() async {
    if (_isDiscovering) return;
    
    _isDiscovering = true;
    _discoveredRooms.clear();
    
    _discoveryTimer = Timer.periodic(discoveryInterval, (_) {
      _sendDiscoveryRequest();
      _cleanupStaleRooms();
    });
    
    _sendDiscoveryRequest();
    _startMdnsDiscovery();
    
    logInfo('Started room discovery');
  }

  Future<void> stopDiscovery() async {
    _isDiscovering = false;
    _discoveryTimer?.cancel();
    _discoveryTimer = null;
    _cleanupStaleRooms();
    logInfo('Stopped room discovery');
  }

  void _sendDiscoveryRequest() {
    if (_udpSender == null || _localIp == null) return;
    
    final message = jsonEncode({
      'type': 'discover_rooms',
      'userId': _currentUser?.id,
      'userName': _currentUser?.name,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
    
    const broadcastAddr = '255.255.255.255';
    _udpSender!.send(
      utf8.encode(message),
      InternetAddress(broadcastAddr),
      port: _localPort!,
    );
  }

  Future<void> _startMdnsDiscovery() async {
    if (_mdnsClient == null) return;
    
    try {
      final services = await _mdnsClient!.lookup(
        serviceName,
        Duration(seconds: 3),
      );
      
      for (final service in services) {
        final roomData = _parseMdnsService(service);
        if (roomData != null) {
          _updateDiscoveredRoom(roomData);
        }
      }
    } catch (e) {
      logWarning('mDNS discovery failed', error: e);
    }
  }

  DiscoveredRoom? _parseMdnsService(Service service) {
    try {
      final txt = service.txtRecord;
      if (txt == null) return null;
      
      return DiscoveredRoom(
        id: txt['roomId'] ?? '',
        name: txt['name'] ?? service.name,
        hostName: txt['hostName'] ?? '',
        hostIp: service.ipAddresses.firstOrNull?.address ?? '',
        port: service.port,
        participantCount: int.tryParse(txt['participantCount'] ?? '0') ?? 0,
        maxParticipants: int.tryParse(txt['maxParticipants'] ?? '20') ?? 20,
        hasVideo: txt['hasVideo'] == 'true',
        videoName: txt['videoName'],
        isLocked: txt['isLocked'] == 'true',
        discoveredAt: DateTime.now(),
      );
    } catch (e) {
      return null;
    }
  }

  void _cleanupStaleRooms() {
    final now = DateTime.now();
    final staleIds = _discoveredRooms.entries
        .where((entry) => now.difference(entry.value.discoveredAt) > serviceTimeout)
        .map((e) => e.key)
        .toList();
    
    for (final id in staleIds) {
      _removeDiscoveredRoom(id);
    }
  }

  Future<void> startHosting(Room room) async {
    if (_isHosting) return;
    
    _hostedRoom = room;
    _isHosting = true;
    
    await _announceRoom();
    
    _announceTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      _announceRoom();
    });
    
    await _registerMdnsService(room);
    
    logInfo('Started hosting room: ${room.id}');
  }

  Future<void> stopHosting() async {
    _isHosting = false;
    _announceTimer?.cancel();
    _announceTimer = null;
    
    await _unregisterMdnsService();
    
    _hostedRoom = null;
    logInfo('Stopped hosting');
  }

  Future<void> _announceRoom() async {
    if (_hostedRoom == null || _udpSender == null || _localIp == null) return;
    
    final message = jsonEncode({
      'type': 'room_announce',
      'roomId': _hostedRoom!.id,
      'name': _hostedRoom!.name,
      'hostName': _currentUser?.name ?? 'Host',
      'port': _localPort,
      'participantCount': _hostedRoom!.participantCount,
      'maxParticipants': _hostedRoom!.maxParticipants,
      'hasVideo': _hostedRoom!.videoInfo != null,
      'videoName': _hostedRoom!.videoInfo?.name,
      'isLocked': _hostedRoom!.pin != null,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
    
    const broadcastAddr = '255.255.255.255';
    _udpSender!.send(
      utf8.encode(message),
      InternetAddress(broadcastAddr),
      port: _localPort!,
    );
  }

  Future<void> _registerMdnsService(Room room) async {
    if (_bonjour == null) return;
    
    try {
      final txtRecord = {
        'roomId': room.id,
        'name': room.name,
        'hostName': _currentUser?.name ?? 'Host',
        'participantCount': room.participantCount.toString(),
        'maxParticipants': room.maxParticipants.toString(),
        'hasVideo': (room.videoInfo != null).toString(),
        'videoName': room.videoInfo?.name ?? '',
        'isLocked': (room.pin != null).toString(),
      };
      
      await _bonjour!.register(
        name: room.id,
        type: serviceName,
        port: _localPort!,
        txt: txtRecord,
      );
      
      logInfo('Registered mDNS service for room: ${room.id}');
    } catch (e) {
      logError('Failed to register mDNS service', error: e);
    }
  }

  Future<void> _unregisterMdnsService() async {
    if (_bonjour == null || _hostedRoom == null) return;
    
    try {
      await _bonjour!.unregister(name: _hostedRoom!.id, type: serviceName);
      logInfo('Unregistered mDNS service');
    } catch (e) {
      logWarning('Failed to unregister mDNS service', error: e);
    }
  }

  Future<void> updateRoomInfo(Room room) async {
    _hostedRoom = room;
    if (_isHosting) {
      await _announceRoom();
      await _registerMdnsService(room);
    }
  }

  void dispose() {
    stopDiscovery();
    stopHosting();
    _discoveryTimer?.cancel();
    _announceTimer?.cancel();
    _udpReceiver?.close();
    _mdnsClient?.stop();
    _bonjour?.dispose();
    _roomsController.close();
    _discoveredRooms.clear();
    _roomTimers.clear();
  }
}

class DiscoveredRoom {
  final String id;
  final String name;
  final String hostName;
  final String hostIp;
  final int port;
  final int participantCount;
  final int maxParticipants;
  final bool hasVideo;
  final String? videoName;
  final bool isLocked;
  final DateTime discoveredAt;

  const DiscoveredRoom({
    required this.id,
    required this.name,
    required this.hostName,
    required this.hostIp,
    required this.port,
    required this.participantCount,
    required this.maxParticipants,
    required this.hasVideo,
    this.videoName,
    required this.isLocked,
    required this.discoveredAt,
  });

  bool get hasSpace => participantCount < maxParticipants;
  
  String get connectionInfo => '$hostIp:$port';
}