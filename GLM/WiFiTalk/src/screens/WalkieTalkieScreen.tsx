import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing, Vibration, Platform } from 'react-native';
import { ListItem, Avatar, IconButton, Surface, Button, Modal, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { walkieTalkieService } from '../services/WalkieTalkieService';
import { identityService } from '../services/IdentityService';

export default function WalkieTalkieScreen() {
  const navigation = useNavigation();
  const { channels, activeChannelId, isTransmitting, isListening, currentSpeaker, addChannel, setActiveChannel, setTransmitting, setListening, setCurrentSpeaker } = useAppStore();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'open' | 'private' | 'emergency'>('open');
  const [holdAnim] = useRef(new Animated.Value(0)).current;
  const [isHolding, setIsHolding] = useState(false);

  useEffect(() => {
    const unsubscribeStarted = walkieTalkieService.onTransmissionStarted(({ speakerId }) => {
      setTransmitting(true);
      setCurrentSpeaker(speakerId);
    });
    const unsubscribeStopped = walkieTalkieService.onTransmissionStopped(({ speakerId }) => {
      setTransmitting(false);
      setCurrentSpeaker(null);
    });
    const unsubscribeSpeaker = walkieTalkieService.onSpeakerStarted(({ speakerId, speakerName }) => {
      setCurrentSpeaker(speakerId);
    });
    const unsubscribeSpeakerStop = walkieTalkieService.onSpeakerStopped(({ speakerId }) => {
      setCurrentSpeaker(null);
    });

    return () => {
      unsubscribeStarted();
      unsubscribeStopped();
      unsubscribeSpeaker();
      unsubscribeSpeakerStop();
    };
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const handleHold = async () => {
    if (!activeChannelId) return;
    
    setIsHolding(true);
    Animated.timing(holdAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      await walkieTalkieService.startTransmitting();
      Vibration.vibrate(50);
    } catch (error) {
      console.error('[WalkieTalkie] Failed to start transmitting:', error);
    }
  };

  const handleRelease = () => {
    setIsHolding(false);
    Animated.timing(holdAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();

    walkieTalkieService.stopTransmitting();
  };

  const handleToggleListen = async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;

    const isCurrentlyListening = channel.members.find(m => m.userId === identityService.getCurrentUserId())?.isListening;
    
    if (isCurrentlyListening) {
      await walkieTalkieService.stopListening(channelId);
      setListening(false);
      setActiveChannel(null);
    } else {
      await walkieTalkieService.startListening(channelId);
      setListening(true);
      setActiveChannel(channelId);
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;
    
    try {
      const channel = await walkieTalkieService.createChannel(newChannelName.trim(), newChannelType);
      addChannel(channel);
      setShowCreateChannel(false);
      setNewChannelName('');
      setNewChannelType('open');
    } catch (error) {
      console.error('[WalkieTalkie] Failed to create channel:', error);
    }
  };

  const renderChannel = ({ item }: { item: any }) => {
    const isActive = activeChannelId === item.id;
    const isMemberListening = item.members.find((m: any) => m.userId === identityService.getCurrentUserId())?.isListening;
    const currentSpeakerName = item.currentSpeaker ? item.members.find((m: any) => m.userId === item.currentSpeaker)?.userId : null;
    const memberCount = item.members.length;
    const listenerCount = item.members.filter((m: any) => m.isListening).length;

    return (
      <TouchableOpacity
        onPress={() => handleToggleListen(item.id)}
        style={[styles.channelItem, isActive && styles.channelItemActive]}
        activeOpacity={0.8}
      >
        <View style={styles.channelIcon}>
          {item.type === 'emergency' ? (
            <Text style={styles.emergencyIcon}>🚨</Text>
          ) : item.type === 'announcement' ? (
            <Text style={styles.announcementIcon}>📢</Text>
          ) : (
            <Text style={styles.channelIconText}>🎙️</Text>
          )}
        </View>
        
        <View style={styles.channelInfo} flex={1}>
          <View style={styles.channelHeader}>
            <Text style={styles.channelName}>{item.name}</Text>
            {item.isPriority && <Text style={styles.priorityBadge}>PRIORITY</Text>}
          </View>
          <View style={styles.channelMeta}>
            <Text style={styles.channelMetaText}>
              {listenerCount}/{memberCount} listening
            </Text>
            {item.currentSpeaker && (
              <Text style={styles.speakingIndicator}>
                🎙 {currentSpeakerName || 'Someone'} speaking...
              </Text>
            )}
          </View>
        </View>

        <IconButton
          icon={isMemberListening ? 'volume-off' : 'volume-high'}
          onPress={(e) => { e.stopPropagation(); handleToggleListen(item.id); }}
          color={isMemberListening ? '#D32F2F' : '#00A884'}
          size={24}
        />
      </TouchableOpacity>
    );
  };

  const renderPTTButton = () => {
    const scale = holdAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.95],
    });

    return (
      <Animated.View
        style={[
          styles.pttButton,
          isTransmitting && styles.pttButtonActive,
          { transform: [{ scale }] }
        ]}
        onTouchStart={handleHold}
        onTouchEnd={handleRelease}
        onTouchCancel={handleRelease}
        onTouchEndCapture={handleRelease}
      >
        <View style={styles.pttInner}>
          <Animated.View
            style={[
              styles.pttMic,
              isTransmitting && styles.pttMicActive
            ]}
          >
            <Text style={styles.pttMicText}>🎙️</Text>
          </Animated.View>
          <Text style={[
            styles.pttLabel,
            isTransmitting && styles.pttLabelActive
          ]}>
            {isTransmitting ? 'RELEASE TO SEND' : 'HOLD TO TALK'}
          </Text>
        </View>
        
        {isTransmitting && (
          <Animated.View style={styles.pttWave}>
            <View style={styles.pttWaveRing} />
            <View style={styles.pttWaveRing} />
            <View style={styles.pttWaveRing} />
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Walkie-Talkie</Text>
        <IconButton
          icon="plus"
          onPress={() => setShowCreateChannel(true)}
          color="#00A884"
        />
      </View>

      <FlatList
        data={channels}
        renderItem={renderChannel}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.channelList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No channels yet</Text>
            <Text style={styles.emptySubtext}>Create a channel to start voice communication</Text>
            <Button mode="contained" onPress={() => setShowCreateChannel(true)} style={styles.createButton}>
              Create Channel
            </Button>
          </View>
        }
      />

      {activeChannel && (
        <View style={styles.activeChannelBar}>
          <View style={styles.activeChannelInfo}>
            <Text style={styles.activeChannelName}>{activeChannel.name}</Text>
            <Text style={styles.activeChannelStatus}>
              {isListening ? '🟢 Listening' : '🔴 Not listening'}
            </Text>
          </View>
          {isTransmitting && (
            <View style={styles.speakingBanner}>
              <Animated.View style={styles.speakingPulse} />
              <Text style={styles.speakingText}>YOU ARE SPEAKING</Text>
            </View>
          )}
        </View>
      )}

      {!activeChannel && (
        <View style={styles.pttDisabled}>
          <Text style={styles.pttDisabledText}>Join a channel to use Push-to-Talk</Text>
        </View>
      )}

      {activeChannel && !isTransmitting && renderPTTButton()}

      <Modal visible={showCreateChannel} onDismiss={() => setShowCreateChannel(false)}>
        <Surface style={styles.modal} elevation={4}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Channel</Text>
            <IconButton icon="close" onPress={() => setShowCreateChannel(false)} />
          </View>
          
          <TextInput
            label="Channel Name"
            value={newChannelName}
            onChangeText={setNewChannelName}
            mode="outlined"
            style={styles.modalInput}
            autoFocus
          />
          
          <Text style={styles.modalSectionTitle}>Channel Type</Text>
          <View style={styles.typeOptions}>
            {(['open', 'private', 'emergency'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewChannelType(type)}
                style={[
                  styles.typeOption,
                  newChannelType === type && styles.typeOptionSelected
                ]}
              >
                <Text style={[
                  styles.typeOptionText,
                  newChannelType === type && styles.typeOptionTextSelected
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <Text style={styles.typeOptionDesc}>
                  {type === 'open' && 'Anyone can join and speak'}
                  {type === 'private' && 'Invite only, admin controls'}
                  {type === 'emergency' && 'Priority channel, interrupts others'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button mode="text" onPress={() => setShowCreateChannel(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateChannel} color="#00A884">
              Create
            </Button>
          </View>
        </Surface>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111B21' },
  channelList: { paddingHorizontal: 16, paddingBottom: activeChannel ? 200 : 100 },
  channelItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E9EDEF' },
  channelItemActive: { borderColor: '#00A884', borderWidth: 2, backgroundColor: '#E0F2F1' },
  channelIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  channelIconText: { fontSize: 20 },
  emergencyIcon: { fontSize: 20 },
  announcementIcon: { fontSize: 20 },
  channelInfo: { flex: 1 },
  channelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  channelName: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  priorityBadge: { fontSize: 10, fontWeight: '700', color: '#D32F2F', backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  channelMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  channelMetaText: { fontSize: 12, color: '#667781' },
  speakingIndicator: { fontSize: 12, color: '#00A884', fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '500', color: '#667781', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8696A0', textAlign: 'center', marginBottom: 16 },
  createButton: { marginTop: 8 },
  activeChannelBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E9EDEF', paddingHorizontal: 16, paddingVertical: 12 },
  activeChannelInfo: { flex: 1 },
  activeChannelName: { fontSize: 16, fontWeight: '600', color: '#111B21' },
  activeChannelStatus: { fontSize: 12, color: '#667781', marginTop: 2 },
  speakingBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A884', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  speakingPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 8 },
  speakingText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  pttDisabled: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', elevation: 4 },
  pttDisabledText: { fontSize: 16, color: '#667781', textAlign: 'center' },
  pttButton: { position: 'absolute', bottom: 24, left: 24, right: 24, height: 140, borderRadius: 20, backgroundColor: '#00A884', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  pttButtonActive: { backgroundColor: '#D32F2F' },
  pttInner: { alignItems: 'center' },
  pttMic: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  pttMicActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  pttMicText: { fontSize: 32 },
  pttLabel: { fontSize: 14, fontWeight: '600', color: '#FFF', letterSpacing: 1 },
  pttLabelActive: { color: '#FFEBEE' },
  pttWave: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  pttWaveRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  modal: { margin: 20, borderRadius: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E9EDEF' },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#111B21' },
  modalInput: { margin: 16, marginTop: 0 },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: '#111B21', marginHorizontal: 16, marginTop: 8 },
  typeOptions: { marginHorizontal: 16, marginTop: 8 },
  typeOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E9EDEF', marginBottom: 8 },
  typeOptionSelected: { borderColor: '#00A884', backgroundColor: '#E0F2F1' },
  typeOptionText: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  typeOptionTextSelected: { color: '#00A884' },
  typeOptionDesc: { fontSize: 12, color: '#667781', marginLeft: 12, flex: 1 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderColor: '#E9EDEF' },
});