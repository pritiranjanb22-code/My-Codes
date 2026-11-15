import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { ListItem, Avatar, IconButton, TextInput, Portal, Surface } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { messagingService } from '../services/MessagingService';
import { discoveryService } from '../services/DiscoveryService';
import { pairingService } from '../services/PairingService';
import { formatDistanceToNow } from 'date-fns';
import { nanoid } from 'nanoid';

export default function ChatsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversations, peers, addConversation, setConversations, activeConversationId, clearUnread } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    loadConversations();
    const unsubscribePeer = discoveryService.onPeerDiscovered(handlePeerDiscovered);
    const unsubscribeMessage = messagingService.onMessageReceived(handleNewMessage);
    
    return () => {
      unsubscribePeer();
      unsubscribeMessage();
    };
  }, []);

  const loadConversations = async () => {
    try {
      const db = require('../db/DatabaseService').databaseService;
      const convs = await db.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('[ChatsScreen] Failed to load conversations:', error);
    }
  };

  const handlePeerDiscovered = (peer: any) => {
    // Auto-create conversation for direct chats if needed
  };

  const handleNewMessage = (message: any) => {
    if (message.conversationId !== activeConversationId) {
      // Handled by store
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, []);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.name || conv.participants[0]?.userId || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderConversation = ({ item }: { item: any }) => {
    const otherParticipant = item.participants.find((p: any) => p.userId !== item.id?.split('-')[1]);
    const name = item.name || otherParticipant?.userId || 'Unknown';
    const lastMessage = item.lastMessage;
    const unreadCount = item.unreadCount || 0;

    return (
      <TouchableOpacity
        onPress={() => {
          clearUnread(item.id);
          navigation.navigate('Chat', { conversationId: item.id });
        }}
        style={styles.conversationItem}
      >
        <Avatar.Image
          size={56}
          source={{ uri: item.avatar || otherParticipant?.avatar }}
          style={styles.avatar}
        >
          {item.type === 'group' ? (
            <Text style={styles.groupAvatarText}>{name.charAt(0).toUpperCase()}</Text>
          ) : (
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          )}
        </Avatar.Image>
        
        <View style={styles.conversationContent} flex={1}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>{name}</Text>
            {lastMessage && (
              <Text style={styles.conversationTime}>
                {formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })}
              </Text>
            )}
          </View>
          
          <View style={styles.conversationFooter}>
            {lastMessage && (
              <Text style={[
                styles.lastMessage,
                unreadCount > 0 && styles.unreadMessage
              ]} numberOfLines={1}>
                {lastMessage.senderId === 'current' ? 'You: ' : ''}
                {lastMessage.type === 'image' ? '📷 Photo' : 
                 lastMessage.type === 'video' ? '📹 Video' :
                 lastMessage.type === 'audio' ? '🎵 Audio' :
                 lastMessage.type === 'voice_note' ? '🎤 Voice message' :
                 lastMessage.type === 'file' ? '📄 File' :
                 lastMessage.content}
              </Text>
            )}
            
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {item.isMuted && (
          <IconButton icon="volume-off" size={24} color="#888" style={styles.muteIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const handleNewChat = () => {
    setShowNewChat(true);
  };

  const handleSelectContact = (peer: any) => {
    setShowNewChat(false);
    messagingService.createDirectConversation(peer.userId).then(conv => {
      addConversation(conv);
      navigation.navigate('Chat', { conversationId: conv.id });
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <IconButton
          icon="magnify"
          onPress={() => {}}
          style={styles.searchButton}
        />
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search chats..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        mode="outlined"
      />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Tap + to start a new conversation</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Portal>
        {showNewChat && (
          <Surface style={styles.modalOverlay} elevation={4}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Chat</Text>
                <IconButton icon="close" onPress={() => setShowNewChat(false)} />
              </View>
              <TextInput
                style={styles.modalSearch}
                placeholder="Search contacts..."
                mode="outlined"
              />
              <FlatList
                data={peers.filter(p => p.reachable)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectContact(item)}
                    style={styles.contactItem}
                  >
                    <Avatar.Image size={48} source={{ uri: item.avatar }}>
                      <Text>{item.name.charAt(0).toUpperCase()}</Text>
                    </Avatar.Image>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactSubtext}>{item.wifitalkId || item.ip}</Text>
                    </View>
                    <Text style={styles.contactStatus}>
                      {item.reachable ? '🟢 Local' : '🔴 Offline'}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
              />
            </View>
          </Surface>
        )}
      </Portal>

      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewChat}
        activeOpacity={0.8}
      >
        <IconButton icon="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111B21' },
  searchButton: { marginLeft: 8 },
  searchInput: { marginHorizontal: 16, marginBottom: 8 },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF' },
  avatar: { marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  groupAvatarText: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  conversationContent: { flex: 1, minWidth: 0 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  conversationName: { fontSize: 16, fontWeight: '500', color: '#111B21', flex: 1 },
  conversationTime: { fontSize: 12, color: '#8696A0', marginLeft: 8 },
  conversationFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMessage: { fontSize: 13, color: '#667781', flex: 1 },
  unreadMessage: { fontWeight: '600', color: '#111B21' },
  unreadBadge: { backgroundColor: '#00A884', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 8 },
  unreadBadgeText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  muteIcon: { marginLeft: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '500', color: '#667781', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8696A0', textAlign: 'center' },
  listContent: { paddingBottom: 100 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#00A884', borderRadius: 28, width: 56, height: 56, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 },
  modalContainer: { backgroundColor: '#FFF', borderRadius: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E9EDEF' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#111B21' },
  modalSearch: { margin: 16, marginTop: 0 },
  modalList: { paddingBottom: 16 },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  contactSubtext: { fontSize: 13, color: '#667781' },
  contactStatus: { fontSize: 12, color: '#00A884' },
};