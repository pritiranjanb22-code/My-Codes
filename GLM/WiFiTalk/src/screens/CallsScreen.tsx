import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { ListItem, Avatar, IconButton, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { formatDistanceToNow } from 'date-fns';

export default function CallsScreen() {
  const navigation = useNavigation();
  const { callHistory } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload call history
    setRefreshing(false);
  };

  const renderCall = ({ item }: { item: any }) => {
    const isOutgoing = item.initiatorId === 'current';
    const isMissed = item.status === 'missed';
    const isVideo = item.type === 'video' || item.type === 'group_video';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Call', { callId: item.id })}
        style={styles.callItem}
      >
        <Avatar.Image size={56} source={{ uri: item.avatar }}>
          <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase() || '?'}</Text>
        </Avatar.Image>
        
        <View style={styles.callContent} flex={1}>
          <View style={styles.callHeader}>
            <Text style={styles.callName}>{item.name || 'Unknown'}</Text>
            <Text style={[
              styles.callTime,
              isMissed && styles.missedTime
            ]}>
              {formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}
            </Text>
          </View>
          
          <View style={styles.callFooter}>
            <View style={styles.callStatusRow}>
              {isOutgoing && <IconButton icon="call-made" size={16} color="#00A884" style={styles.icon} />}
              {!isOutgoing && <IconButton icon="call-received" size={16} color="#00A884" style={styles.icon} />}
              {isMissed && <IconButton icon="call-missed" size={16} color="#D32F2F" style={styles.icon} />}
              <Text style={[
                styles.callType,
                isMissed && styles.missedType
              ]}>
                {isVideo ? '📹 Video' : '📞 Voice'}
                {item.type.includes('group') ? ' • Group' : ''}
              </Text>
            </View>
            
            {item.duration > 0 && (
              <Text style={styles.callDuration}>
                {formatDuration(item.duration)}
              </Text>
            )}
          </View>
        </View>

        <IconButton
          icon={isVideo ? 'video' : 'phone'}
          onPress={() => {}}
          color="#00A884"
          size={28}
          style={styles.callButton}
        />
      </TouchableOpacity>
    );
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
        <IconButton icon="phone-plus" onPress={() => {}} color="#00A884" />
      </View>

      <FlatList
        data={callHistory}
        renderItem={renderCall}
        keyExtractor={(item) => item.id}
        refreshControl={
          <ActivityIndicator
            style={styles.refreshControl}
            animating={refreshing}
            color="#00A884"
          />
        }
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No calls yet</Text>
            <Text style={styles.emptySubtext}>Start a voice or video call with your contacts</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111B21' },
  callItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF' },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  callContent: { flex: 1, marginLeft: 12, minWidth: 0 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  callName: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  callTime: { fontSize: 12, color: '#8696A0' },
  missedTime: { color: '#D32F2F', fontWeight: '500' },
  callFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  callStatusRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 4, padding: 0 },
  callType: { fontSize: 13, color: '#667781' },
  missedType: { color: '#D32F2F', fontWeight: '500' },
  callDuration: { fontSize: 13, color: '#667781' },
  callButton: { marginLeft: 8, padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '500', color: '#667781', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8696A0', textAlign: 'center' },
  listContent: { paddingBottom: 20 },
  refreshControl: { marginTop: 10 },
});