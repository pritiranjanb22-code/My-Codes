import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Surface, TextInput, Button, Avatar, Chip, ListItem, Divider, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { messagingService } from '../services/MessagingService';
import { discoveryService } from '../services/DiscoveryService';
import { nanoid } from 'nanoid';

export default function CreateGroupScreen() {
  const navigation = useNavigation();
  const { peers } = useAppStore();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const availablePeers = peers.filter(p => p.reachable && p.userId);

  const filteredPeers = availablePeers.filter(peer => {
    if (!searchQuery) return true;
    return peer.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleMember = (peerId: string) => {
    setSelectedMembers(prev => 
      prev.includes(peerId)
        ? prev.filter(id => id !== peerId)
        : [...prev, peerId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    
    if (selectedMembers.length === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setCreating(true);
    try {
      const conversation = await messagingService.createGroupConversation(
        groupName.trim(),
        selectedMembers
      );
      navigation.goBack();
      navigation.navigate('Chat', { conversationId: conversation.id });
    } catch (error) {
      console.error('[CreateGroup] Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Group</Text>
        <IconButton icon="close" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Surface style={styles.inputCard} elevation={1}>
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            mode="outlined"
            style={styles.groupNameInput}
            placeholder="Enter group name"
            autoCapitalize="words"
            maxLength={50}
          />
          
          {selectedMembers.length > 0 && (
            <View style={styles.selectedChips}>
              <Text style={styles.chipsLabel}>{selectedMembers.length} member(s) selected</Text>
              <View style={styles.chipsContainer}>
                {selectedMembers.map(id => {
                  const peer = availablePeers.find(p => p.userId === id);
                  return (
                    <Chip
                      key={id}
                      onClose={() => toggleMember(id)}
                      style={styles.memberChip}
                    >
                      {peer?.name || id}
                    </Chip>
                  );
                })}
              </View>
            </View>
          )}
        </Surface>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Add Members</Text>
          <Text style={styles.sectionSubtitle}>
            {availablePeers.length} available on local network
          </Text>
        </View>

        <TextInput
          label="Search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          mode="outlined"
          style={styles.searchInput}
          placeholder="Search contacts..."
        />

        <FlatList
          data={filteredPeers}
          renderItem={({ item }) => {
            const isSelected = selectedMembers.includes(item.userId);
            return (
              <TouchableOpacity
                onPress={() => toggleMember(item.userId)}
                style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                activeOpacity={0.8}
              >
                <Avatar.Image size={48} source={{ uri: item.avatar }}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </Avatar.Image>
                <View style={styles.memberInfo} flex={1}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberMeta}>
                    {item.wifitalkId || item.ip} • {item.networkSegment}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkContainer}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item.userId}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No devices found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search' : 'No other WiFiTalk users discovered on this network'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.memberList}
        />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          mode="contained"
          onPress={handleCreate}
          disabled={creating || !groupName.trim() || selectedMembers.length === 0}
          color="#00A884"
          style={styles.createButton}
        >
          {creating ? 'Creating...' : `Create Group (${selectedMembers.length + 1})`}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#111B21' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 100 },
  inputCard: { borderRadius: 16, backgroundColor: '#FFF', padding: 16, marginBottom: 16, elevation: 1 },
  groupNameInput: { marginBottom: 16 },
  selectedChips: { marginTop: 8 },
  chipsLabel: { fontSize: 13, color: '#667781', marginBottom: 8 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberChip: { fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111B21' },
  sectionSubtitle: { fontSize: 13, color: '#667781' },
  searchInput: { marginBottom: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F0F2F5' },
  memberItemSelected: { backgroundColor: '#E0F2F1' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  memberInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  memberName: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  memberMeta: { fontSize: 12, color: '#667781', marginTop: 2 },
  checkContainer: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#00A884', justifyContent: 'center', alignItems: 'center' },
  checkMark: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#667781', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#8696A0', textAlign: 'center' },
  memberList: { paddingBottom: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E9EDEF', padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16 },
  createButton: { width: '100%' },
});