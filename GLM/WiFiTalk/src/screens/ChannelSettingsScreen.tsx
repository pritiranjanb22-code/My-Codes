import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Surface, Button, Switch, ListItem, Divider, TextInput, Chip, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { walkieTalkieService } from '../services/WalkieTalkieService';

export default function ChannelSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { channels, updateChannel } = useAppStore();
  
  const channelId = route.params?.channelId;
  const channel = channels.find(c => c.id === channelId);
  
  const [name, setName] = useState(channel?.name || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [maxSpeakers, setMaxSpeakers] = useState(channel?.settings.maxSpeakers || 3);
  const [priority, setPriority] = useState(channel?.settings.priority || 10);
  const [allowTextChat, setAllowTextChat] = useState(channel?.settings.allowTextChat || true);
  const [recordTransmissions, setRecordTransmissions] = useState(channel?.settings.recordTransmissions || false);
  const [autoJoin, setAutoJoin] = useState(channel?.settings.autoJoin || false);
  const [saving, setSaving] = useState(false);

  if (!channel) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading channel...</Text>
      </View>
    );
  }

  const saveSettings = async () => {
    setSaving(true);
    try {
      await walkieTalkieService.createChannel(
        name,
        channel.type,
        description,
        { maxSpeakers, priority, allowTextChat, recordTransmissions, autoJoin }
      );
      updateChannel(channelId, { name, description });
      Alert.alert('Saved', 'Channel settings updated');
      navigation.goBack();
    } catch (error) {
      console.error('[ChannelSettings] Failed to save:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveChannel = async () => {
    Alert.alert('Leave Channel', 'Are you sure you want to leave this channel?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => {
        walkieTalkieService.leaveChannel(channelId);
        navigation.goBack();
      }},
    ]);
  };

  const handleDeleteChannel = async () => {
    Alert.alert('Delete Channel', 'This will permanently delete the channel for all members. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await walkieTalkieService.deleteChannel(channelId);
        navigation.goBack();
      }},
    ]);
  };

  const renderMember = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => {}}
      style={styles.memberItem}
      activeOpacity={0.8}
    >
      <Avatar.Image size={40} source={{ uri: item.avatar }}>
        <Text style={styles.avatarText}>{item.userId.charAt(0).toUpperCase()}</Text>
      </Avatar.Image>
      <View style={styles.memberInfo} flex={1}>
        <Text style={styles.memberName}>{item.userId === channel.ownerId ? `${item.userId} (Owner)` : item.userId}</Text>
        <Text style={styles.memberRole}>{item.role} • {item.canSpeak ? 'Can speak' : 'Listen only'}</Text>
      </View>
      <IconButton
        icon="menu"
        onPress={() => showMemberOptions(item)}
        size={20}
      />
    </TouchableOpacity>
  );

  const showMemberOptions = (member: any) => {
    Alert.alert(member.userId, '', [
      { text: 'Make Speaker', onPress: () => {} },
      { text: 'Make Listener', onPress: () => {} },
      { text: 'Remove from Channel', style: 'destructive', onPress: () => {} },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channel Settings</Text>
        <Button mode="text" onPress={saveSettings} disabled={saving} color="#00A884">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Basic Info</Text>
          <TextInput
            label="Channel Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />
          <View style={styles.typeRow}>
            <Text style={styles.typeLabel}>Type: {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}</Text>
            <Chip style={styles.typeChip}>
              {channel.isPriority ? '⚡ Priority' : 'Normal'}
            </Chip>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Speaking Permissions</Text>
          <ListItem
            title="Max Concurrent Speakers"
            description={`${maxSpeakers} speaker(s)`}
            leading={<Text style={styles.leadingIcon}>🎙️</Text>}
            trailing={
              <View style={styles.speakerControl}>
                <IconButton icon="minus" onPress={() => setMaxSpeakers(Math.max(1, maxSpeakers - 1))} size={20} />
                <Text style={styles.speakerCount}>{maxSpeakers}</Text>
                <IconButton icon="plus" onPress={() => setMaxSpeakers(Math.min(10, maxSpeakers + 1))} size={20} />
              </View>
            }
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Channel Priority"
            description={priority >= 50 ? 'High (Emergency/Announcement)' : 'Normal'}
            leading={<Text style={styles.leadingIcon}>⚡</Text>}
            trailing={
              <View style={styles.speakerControl}>
                <IconButton icon="minus" onPress={() => setPriority(Math.max(1, priority - 10))} size={20} />
                <Text style={styles.speakerCount}>{priority}</Text>
                <IconButton icon="plus" onPress={() => setPriority(Math.min(100, priority + 10))} size={20} />
              </View>
            }
          />
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Features</Text>
          <ListItem
            title="Allow Text Chat"
            description="Members can send text messages in channel"
            leading={<Text style={styles.leadingIcon}>💬</Text>}
            trailing={
              <Switch
                value={allowTextChat}
                onValueChange={setAllowTextChat}
                color="#00A884"
              />
            }
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Record Transmissions"
            description="Save voice transmissions for later playback"
            leading={<Text style={styles.leadingIcon}>🎙️</Text>}
            trailing={
              <Switch
                value={recordTransmissions}
                onValueChange={setRecordTransmissions}
                color="#00A884"
              />
            }
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Auto Join"
            description="Automatically join when app starts"
            leading={<Text style={styles.leadingIcon}>🔄</Text>}
            trailing={
              <Switch
                value={autoJoin}
                onValueChange={setAutoJoin}
                color="#00A884"
              />
            }
          />
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <Text style={styles.cardTitle}>Members ({channel.members.length})</Text>
          <FlatList
            data={channel.members}
            renderItem={renderMember}
            keyExtractor={(item) => item.userId}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text>No members yet</Text>
              </View>
            }
          />
        </Surface>

        {channel.ownerId === useAppStore.getState().currentUser?.id && (
          <Surface style={styles.dangerCard} elevation={1}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <ListItem
              title="Leave Channel"
              description="You will no longer receive transmissions"
              leading={<Text style={styles.leadingIcon}>🚪</Text>}
              titleStyle={styles.dangerText}
              onPress={handleLeaveChannel}
            />
            <Divider style={styles.divider} />
            <ListItem
              title="Delete Channel"
              description="Permanently delete this channel for everyone"
              leading={<Text style={styles.leadingIcon}>🗑️</Text>}
              titleStyle={styles.dangerText}
              onPress={handleDeleteChannel}
            />
          </Surface>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#111B21' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  card: { borderRadius: 16, backgroundColor: '#FFF', padding: 16, elevation: 1 },
  dangerCard: { borderRadius: 16, backgroundColor: '#FFF', padding: 16, elevation: 1, borderWidth: 1, borderColor: '#FFCDD2' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111B21', marginBottom: 16 },
  dangerTitle: { fontSize: 16, fontWeight: '600', color: '#D32F2F', marginBottom: 16 },
  input: { marginBottom: 12 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  typeLabel: { fontSize: 14, color: '#667781' },
  typeChip: { fontSize: 11 },
  leadingIcon: { fontSize: 24, marginRight: 4 },
  dangerText: { color: '#D32F2F' },
  divider: { marginHorizontal: 16 },
  speakerControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speakerCount: { fontSize: 18, fontWeight: '600', color: '#111B21', minWidth: 30, textAlign: 'center' },
  memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 15, fontWeight: '500', color: '#111B21' },
  memberRole: { fontSize: 12, color: '#667781' },
  emptyState: { padding: 20, alignItems: 'center' },
  loadingText: { flex: 1, textAlign: 'center', marginTop: 100, color: '#667781' },
});