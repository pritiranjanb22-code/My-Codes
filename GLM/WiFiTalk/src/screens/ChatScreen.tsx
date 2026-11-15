import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { TextInput, IconButton, Avatar, Surface, Portal, Menu, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GiftedChat, InputToolbar, Message as GiftedMessage, SystemMessage } from 'react-native-gifted-chat';
import { useAppStore } from '../store/useAppStore';
import { messagingService } from '../services/MessagingService';
import { fileTransferService } from '../services/FileTransferService';
import { identityService } from '../services/IdentityService';
import { format } from 'date-fns';
import { nanoid } from 'nanoid';
import { DocumentPicker } from 'react-native-document-picker';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { messages, activeConversationId, addMessage, updateMessage, clearUnread, currentUser } = useAppStore();
  const [giftedMessages, setGiftedMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversationId = route.params?.conversationId;
  const conversation = useAppStore.getState().conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (!conversationId) return;
    
    loadMessages();
    clearUnread(conversationId);
    
    const unsubscribe = messagingService.onMessageReceived(handleNewMessage);
    return () => unsubscribe();
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const db = require('../db/DatabaseService').databaseService;
      const msgs = await db.getMessages(conversationId, 50);
      const gifted = msgs.map(convertToGiftedMessage);
      setGiftedMessages(gifted);
    } catch (error) {
      console.error('[ChatScreen] Failed to load messages:', error);
    }
  };

  const convertToGiftedMessage = (msg: any) => ({
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.timestamp),
    user: {
      _id: msg.senderId,
      name: msg.senderId === currentUser?.id ? 'You' : 'Contact',
      avatar: msg.senderId === currentUser?.id ? currentUser?.avatar : undefined,
    },
    sent: msg.status === 'sent',
    delivered: msg.status === 'delivered',
    read: msg.status === 'read',
    pending: msg.status === 'sending' || msg.status === 'pending',
    system: msg.type === 'system',
    image: msg.type === 'image' ? msg.metadata?.remoteUrl || msg.metadata?.localPath : undefined,
    video: msg.type === 'video' ? msg.metadata?.remoteUrl || msg.metadata?.localPath : undefined,
    audio: msg.type === 'audio' || msg.type === 'voice_note' ? msg.metadata?.remoteUrl || msg.metadata?.localPath : undefined,
    file: msg.type === 'file' || msg.type === 'document' ? {
      name: msg.metadata?.fileName,
      size: msg.metadata?.fileSize,
      uri: msg.metadata?.localPath,
    } : undefined,
  });

  const handleNewMessage = (message: any) => {
    if (message.conversationId === conversationId) {
      const gifted = convertToGiftedMessage(message);
      setGiftedMessages(prev => [...prev, gifted]);
      scrollToBottom();
    }
  };

  const onSend = useCallback(async (messages: any[]) => {
    const message = messages[0];
    setSending(true);
    
    try {
      if (message.image || message.video || message.audio || message.file) {
        // Handle media/file
        await handleMediaMessage(message);
      } else {
        await messagingService.sendMessage(
          conversationId,
          'text',
          message.text
        );
      }
    } catch (error) {
      console.error('[ChatScreen] Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [conversationId]);

  const handleMediaMessage = async (message: any) => {
    // Implementation for media messages
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderCustomMessage = (props: any) => {
    const { currentMessage } = props;
    
    if (currentMessage.file) {
      return renderFileMessage(props);
    }
    
    if (currentMessage.system) {
      return <SystemMessage {...props} />;
    }
    
    return <GiftedMessage {...props} />;
  };

  const renderFileMessage = (props: any) => {
    const { currentMessage } = props;
    const isOutgoing = currentMessage.user._id === currentUser?.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.fileBubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble
        ]}
        onPress={() => {}}
      >
        <View style={styles.fileIcon}>
          <Text style={styles.fileIconText}>📄</Text>
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, isOutgoing ? styles.outgoingText : styles.incomingText]}>
            {currentMessage.file.name}
          </Text>
          <Text style={[styles.fileSize, isOutgoing ? styles.outgoingText : styles.incomingText]}>
            {formatFileSize(currentMessage.file.size)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <IconButton
        icon="attachment"
        onPress={showAttachmentOptions}
        size={24}
        color="#667781"
      />
      <IconButton
        icon="camera"
        onPress={pickImage}
        size={24}
        color="#667781"
      />
      <IconButton
        icon="mic"
        onPress={startVoiceRecording}
        size={24}
        color="#667781"
      />
    </View>
  );

  const showAttachmentOptions = () => {
    Alert.alert('Attach', '', [
      { text: 'Document', onPress: pickDocument },
      { text: 'Photo', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.allFiles] });
      // Handle document
    } catch (error) {
      if ((error as any).code !== 'E_DOCUMENT_PICKER_CANCELLED') {
        console.error('[ChatScreen] Document picker error:', error);
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.assets?.[0]) {
        // Handle image
      }
    } catch (error) {
      console.error('[ChatScreen] Image picker error:', error);
    }
  };

  const startVoiceRecording = () => {
    // Navigate to voice recording screen
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!conversation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A884" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  const otherParticipant = conversation.participants.find(p => p.userId !== currentUser?.id);

  return (
    <GiftedChat
      messages={giftedMessages}
      onSend={onSend}
      user={{ _id: currentUser?.id || '', name: 'You' }}
      renderActions={renderActions}
      renderMessage={renderCustomMessage}
      renderMessageText={(props) => <Text {...props} style={styles.messageText} />}
      renderMessageImage={(props) => <Image {...props} style={styles.messageImage} />}
      renderInputToolbar={(props) => <CustomInputToolbar {...props} />}
      scrollToBottom={true}
      extraData={sending}
      minInputToolbarHeight={56}
      maxInputToolbarHeight={120}
      placeholder="Type a message..."
      textInputProps={{
        autoFocus: false,
        returnKeyType: 'send',
        onSubmitEditing: () => {},
      }}
      keyboardShouldPersistTaps='handled'
      inverted={true}
      listViewProps={{
        ref: flatListRef,
        contentContainerStyle: { paddingHorizontal: 8, paddingBottom: 8 },
      }}
    />
  );
}

function CustomInputToolbar(props: any) {
  return (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      textInputStyle={styles.textInput}
      inputToolbarStyle={styles.inputToolbarInner}
      sendButtonProps={{
        ...props.sendButtonProps,
        style: styles.sendButton,
        children: <Text style={styles.sendButtonText}>Send</Text>,
      }}
    />
  );
}

const styles = {
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#667781' },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageImage: { borderRadius: 12, maxWidth: '70%' },
  inputToolbar: { backgroundColor: '#FFF', borderTopWidth: 0 },
  inputToolbarInner: { paddingHorizontal: 8, paddingVertical: 4 },
  textInput: { backgroundColor: '#F0F2F5', borderRadius: 24, paddingHorizontal: 16, fontSize: 15 },
  sendButton: { backgroundColor: '#00A884', borderRadius: 20, paddingHorizontal: 16 },
  sendButtonText: { color: '#FFF', fontWeight: '600' },
  actionsContainer: { flexDirection: 'row', paddingHorizontal: 8 },
  fileBubble: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, maxWidth: '70%' },
  outgoingBubble: { backgroundColor: '#00A884', alignSelf: 'flex-end' },
  incomingBubble: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#E9EDEF' },
  fileIcon: { marginRight: 10 },
  fileIconText: { fontSize: 24 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500' },
  fileSize: { fontSize: 12, marginTop: 2 },
  outgoingText: { color: '#FFF' },
  incomingText: { color: '#111B21' },
};