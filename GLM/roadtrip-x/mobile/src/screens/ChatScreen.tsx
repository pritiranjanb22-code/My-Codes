import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatRelativeTime, getTimeAgo } from '@/utils/helpers';

type Props = RootStackScreenProps<'Chat'>;

export default function ChatScreen({ navigation }: Props) {
  const { currentTrip, messages, isConnected, unreadCount, resetUnreadCount, addMessage } = useAppStore();
  const [newMessage, setNewMessage] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    resetUnreadCount();
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    addMessage({
      id: `msg-${Date.now()}`,
      tripId: currentTrip?.id || '',
      userId: useAppStore.getState().user?.id || '',
      user: useAppStore.getState().user!,
      type: 'text',
      content: newMessage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewMessage('');
    setTimeout(scrollToBottom, 100);
  };

  if (!currentTrip) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Ionicons name="chatbubbles" size={64} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyText}>Select a trip to start chatting</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('TripDetail', { tripId: currentTrip.id })}>
            <Avatar name={currentTrip.name} size="md" source={{ uri: currentTrip.startLocation.name }} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{currentTrip.name}</Text>
            <Text style={styles.headerSubtitle}>
              {isConnected ? '🟢 Online' : '🔴 Offline'} • {useAppStore.getState().members.length} members
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('TripSettings', { tripId: currentTrip.id })}>
          <Ionicons name="settings" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} isOwn={item.userId === useAppStore.getState().user?.id} />}
        ListEmptyComponent={<EmptyChat />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        inverted
      />

      {/* Typing Indicator */}
      {useAppStore.getState().isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>
            {useAppStore.getState().typingUsers.map((id) => useAppStore.getState().members.find(m => m.userId === id)?.user.name).join(', ')} typing...
          </Text>
        </View>
      )}

      {/* Attachment Options */}
      {showAttachments && (
        <View style={styles.attachmentsPanel}>
          <View style={styles.attachmentsGrid}>
            {[
              { id: 'camera', label: 'Camera', icon: 'camera', color: '#45B7D1' },
              { id: 'gallery', label: 'Gallery', icon: 'image', color: '#4ECDC4' },
              { id: 'location', label: 'Location', icon: 'location', color: '#F8B500' },
              { id: 'expense', label: 'Expense', icon: 'cash', color: '#9B59B6' },
              { id: 'poll', label: 'Poll', icon: 'bar-chart', color: '#E74C3C' },
              { id: 'voice', label: 'Voice', icon: 'mic', color: '#2ECC71' },
            ].map((item) => (
              <TouchableOpacity key={item.id} style={styles.attachmentItem} onPress={() => handleAttachment(item.id)}>
                <View style={[styles.attachmentIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.attachmentLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity onPress={() => setShowAttachments(!showAttachments)} style={styles.attachButton}>
          <Ionicons name={showAttachments ? 'close' : 'add'} size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={2000}
            onFocus={() => setShowAttachments(false)}
          />
        </View>
        <TouchableOpacity onPress={handleSendMessage} disabled={!newMessage.trim()} style={styles.sendButton}>
          <Ionicons name="send" size={24} color={newMessage.trim() ? COLORS.accent : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function handleAttachment(type: string) {
  console.log('Attachment:', type);
}

const EmptyChat = () => (
  <View style={styles.emptyChat}>
    <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textMuted} />
    <Text style={styles.emptyChatTitle}>No Messages Yet</Text>
    <Text style={styles.emptyChatText}>Start the conversation with your trip mates</Text>
  </View>
);

const MessageBubble = ({ message, isOwn }: any) => {
  const isSystem = message.type === 'system';
  const isExpense = message.type === 'expense';
  const isPoll = message.type === 'poll';
  const isLocation = message.type === 'location';
  const isVoice = message.type === 'voice';
  const isImage = message.type === 'image';

  if (isSystem) {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemMessageText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageContainer, isOwn && styles.messageOwn]}>
      {!isOwn && (
        <Avatar name={message.user.name} size="xs" style={styles.messageAvatar} />
      )}
      <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
        <View style={styles.messageHeader}>
          {!isOwn && <Text style={styles.messageSender}>{message.user.name}</Text>}
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>{getTimeAgo(message.createdAt)}</Text>
        </View>

        {isExpense && (
          <ExpenseMessageCard expenseId={message.expenseId} />
        )}

        {isPoll && (
          <PollMessageCard pollId={message.pollId} />
        )}

        {isLocation && (
          <LocationMessageCard location={message.location} />
        )}

        {isVoice && (
          <VoiceMessageCard duration={message.voiceDuration} />
        )}

        {isImage && message.mediaUrl && (
          <ImageMessageCard url={message.mediaUrl} />
        )}

        {!isExpense && !isPoll && !isLocation && !isVoice && !isImage && (
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>{message.content}</Text>
        )}
      </View>
      {isOwn && <View style={styles.messageAvatarSpacer} />}
    </View>
  );
};

const ExpenseMessageCard = ({ expenseId }: any) => (
  <Card style={styles.messageCard} variant="outlined">
    <CardContent>
      <View style={styles.messageCardHeader}>
        <Ionicons name="cash" size={18} color={COLORS.accent} />
        <Text style={styles.messageCardTitle}>Expense Shared</Text>
      </View>
      <Text style={styles.messageCardText}>Tap to view expense details</Text>
    </CardContent>
  </Card>
);

const PollMessageCard = ({ pollId }: any) => (
  <Card style={styles.messageCard} variant="outlined">
    <CardContent>
      <View style={styles.messageCardHeader}>
        <Ionicons name="bar-chart" size={18} color={COLORS.accent} />
        <Text style={styles.messageCardTitle}>New Poll</Text>
      </View>
      <Text style={styles.messageCardText}>Tap to vote</Text>
    </CardContent>
  </Card>
);

const LocationMessageCard = ({ location }: any) => (
  <Card style={styles.messageCard} variant="outlined">
    <CardContent>
      <View style={styles.messageCardHeader}>
        <Ionicons name="location" size={18} color={COLORS.accent} />
        <Text style={styles.messageCardTitle}>Location Shared</Text>
      </View>
      <Text style={styles.messageCardText}>{location?.name || 'Shared location'}</Text>
    </CardContent>
  </Card>
);

const VoiceMessageCard = ({ duration }: any) => (
  <View style={styles.voiceMessage}>
    <TouchableOpacity style={styles.voicePlayButton}>
      <Ionicons name="play" size={24} color={COLORS.white} />
    </TouchableOpacity>
    <View style={styles.voiceWaveform}>
      {[1, 2, 3, 4, 5].map((_, i) => (
        <View key={i} style={styles.voiceBar} />
      ))}
    </View>
    <Text style={styles.voiceDuration}>{duration ? formatDuration(duration) : '0:00'}</Text>
  </View>
);

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const ImageMessageCard = ({ url }: any) => (
  <TouchableOpacity style={styles.imageMessage}>
    <Image source={{ uri: url }} style={styles.imageMessageImage} />
  </TouchableOpacity>
);

import { Image } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  messagesContainer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.medium,
    width: '100%',
    maxWidth: 320,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyChatTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyChatText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    maxWidth: '85%',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    marginTop: 4,
  },
  messageAvatarSpacer: {
    width: 32,
  },
  messageBubble: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  messageSender: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.accent,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: COLORS.white,
  },
  messageCard: {
    marginTop: SPACING.sm,
  },
  messageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  messageCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageCardText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceWaveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    flex: 1,
    height: 24,
  },
  voiceBar: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
  },
  voiceDuration: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    minWidth: 40,
  },
  imageMessage: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  imageMessageImage: {
    width: 200,
    height: 150,
  },
  typingIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  typingText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  attachmentsPanel: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  attachmentItem: {
    alignItems: 'center',
    width: 70,
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  attachmentLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButton: {
    padding: SPACING.xs,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
  },
  sendButton: {
    padding: SPACING.xs,
  },
  systemMessage: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
  },
  systemMessageText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});