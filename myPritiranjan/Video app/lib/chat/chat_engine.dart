import 'dart:async';
import 'package:watch_together/models/room_models.dart';
import 'package:watch_together/utils/logger.dart';

class ChatEngine with Loggable {
  final StreamController<ChatMessage> _messagesController = StreamController.broadcast();
  final StreamController<ChatMessage> _outgoingController = StreamController.broadcast();
  
  final List<ChatMessage> _messageHistory = [];
  static const int maxHistory = 500;
  
  String? _roomId;
  String? _localUserId;
  String? _localUserName;
  
  Stream<ChatMessage> get messages => _messagesController.stream;
  Stream<ChatMessage> get outgoingMessages => _outgoingController.stream;
  List<ChatMessage> get history => List.unmodifiable(_messageHistory);

  void initialize({
    required String roomId,
    required String localUserId,
    required String localUserName,
  }) {
    _roomId = roomId;
    _localUserId = localUserId;
    _localUserName = localUserName;
    logInfo('ChatEngine initialized for room $_roomId');
  }

  void sendMessage(String content, {MessageType type = MessageType.text}) {
    final message = ChatMessage.create(
      senderId: _localUserId!,
      senderName: _localUserName!,
      content: content,
      type: type,
    );
    
    _addMessage(message);
    _outgoingController.add(message);
  }

  void receiveMessage(ChatMessage message) {
    if (message.senderId != _localUserId) {
      _addMessage(message);
    }
  }

  void _addMessage(ChatMessage message) {
    _messageHistory.add(message);
    if (_messageHistory.length > maxHistory) {
      _messageHistory.removeAt(0);
    }
    _messagesController.add(message);
  }

  void sendSystemMessage(String content) {
    final message = ChatMessage.create(
      senderId: 'system',
      senderName: 'System',
      content: content,
      type: MessageType.system,
    );
    _addMessage(message);
  }

  void sendNotification(String content, String? actionUser) {
    final message = ChatMessage.create(
      senderId: 'notification',
      senderName: actionUser ?? 'System',
      content: content,
      type: MessageType.notification,
    );
    _addMessage(message);
  }

  void clearHistory() {
    _messageHistory.clear();
  }

  void dispose() {
    _messagesController.close();
    _outgoingController.close();
    _messageHistory.clear();
  }
}

class ChatService with Loggable {
  final ChatEngine _engine = ChatEngine();
  
  ChatEngine get engine => _engine;
  
  void initialize({
    required String roomId,
    required String localUserId,
    required String localUserName,
  }) {
    _engine.initialize(
      roomId: roomId,
      localUserId: localUserId,
      localUserName: localUserName,
    );
  }

  void sendMessage(String content) {
    _engine.sendMessage(content);
  }

  void handleIncomingMessage(ChatMessage message) {
    _engine.receiveMessage(message);
  }

  void dispose() {
    _engine.dispose();
  }
}