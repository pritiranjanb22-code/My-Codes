import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ListItem, Avatar, IconButton, Surface, Chip, Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { discoveryService } from '../services/DiscoveryService';
import { networkDiagnosticsService } from '../services/NetworkDiagnosticsService';
import { identityService } from '../services/IdentityService';
import { formatDistanceToNow } from 'date-fns';

export default function NetworkScreen() {
  const navigation = useNavigation();
  const { peers, networkInfo, isDiscovering, setNetworkInfo } = useAppStore();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [topology, setTopology] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<any>(null);

  useEffect(() => {
    loadNetworkInfo();
    loadDiagnostics();
    loadTopology();
    
    const interval = setInterval(() => {
      loadNetworkInfo();
      loadDiagnostics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNetworkInfo = async () => {
    try {
      const info = await networkDiagnosticsService.getNetworkInfo();
      setNetworkInfo(info);
    } catch (error) {
      console.error('[NetworkScreen] Failed to load network info:', error);
    }
  };

  const loadDiagnostics = async () => {
    try {
      const diag = await networkDiagnosticsService.runFullDiagnostics();
      setDiagnostics(diag);
    } catch (error) {
      console.error('[NetworkScreen] Failed to run diagnostics:', error);
    }
  };

  const loadTopology = async () => {
    try {
      const topo = await networkDiagnosticsService.getNetworkTopology();
      setTopology(topo);
    } catch (error) {
      console.error('[NetworkScreen] Failed to load topology:', error);
    }
  };

  const renderPeer = ({ item }: { item: any }) => {
    const isCurrentUser = item.userId === identityService.getCurrentUserId();
    
    return (
      <TouchableOpacity
        onPress={() => setSelectedPeer(item)}
        style={styles.peerItem}
        activeOpacity={0.8}
      >
        <Avatar.Image size={48} source={{ uri: item.avatar }}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </Avatar.Image>
        
        <View style={styles.peerInfo} flex={1}>
          <View style={styles.peerHeader}>
            <Text style={styles.peerName}>{item.name} {isCurrentUser && '(You)'}</Text>
            <Chip
              style={[
                styles.statusChip,
                item.reachable ? styles.chipOnline : styles.chipOffline
              ]}
            >
              {item.reachable ? '🟢 Online' : '🔴 Offline'}
            </Chip>
          </View>
          
          <View style={styles.peerDetails}>
            <Text style={styles.peerDetail}>
              📱 {item.ip} • {item.networkSegment}
            </Text>
            <Text style={styles.peerDetail}>
              🔍 {item.discoveryMethod} • {item.latency ? `${item.latency}ms` : 'N/A'}
            </Text>
            <Text style={styles.peerDetail}>
              {item.isRelay ? '🔄 Relay Node' : '📡 Direct'}
            </Text>
          </View>
        </View>

        <IconButton icon="chevron-right" onPress={(e) => { e.stopPropagation(); setSelectedPeer(item); }} />
      </TouchableOpacity>
    );
  };

  const renderStat = (label: string, value: string, color?: string) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={
      <ActivityIndicator animating={loading} color="#00A884" style={styles.refreshControl} />
    } onRefresh={async () => {
      setLoading(true);
      await loadNetworkInfo();
      await loadDiagnostics();
      await loadTopology();
      setLoading(false);
    }}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <Chip
            style={[styles.statusChip, networkInfo?.internetReachable ? styles.chipOnline : styles.chipOffline]}
          >
            {networkInfo?.internetReachable ? '🌐 Internet' : '🌐 Offline'}
          </Chip>
        </View>
        
        <View style={styles.networkInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Local IP</Text>
            <Text style={styles.infoValue}>{networkInfo?.localIp || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gateway</Text>
            <Text style={styles.infoValue}>{networkInfo?.gateway || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Network</Text>
            <Text style={styles.infoValue}>{networkInfo?.networkRange || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NAT Type</Text>
            <Text style={styles.infoValue}>{networkInfo?.natType || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>IPv6</Text>
            <Text style={styles.infoValue}>{networkInfo?.ipv6 ? 'Available' : 'Not available'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Diagnostics</Text>
        {diagnostics && (
          <View style={styles.diagnosticsGrid}>
            {renderStat('Internet', diagnostics.internet ? '🟢 Connected' : '🔴 Disconnected', diagnostics.internet ? '#00A884' : '#D32F2F')}
            {renderStat('LAN', diagnostics.lan ? '🟢 Connected' : '🔴 Disconnected', diagnostics.lan ? '#00A884' : '#D32F2F')}
            {renderStat('Discovery', diagnostics.peerDiscovery ? '🟢 Active' : '🔴 Inactive', diagnostics.peerDiscovery ? '#00A884' : '#D32F2F')}
            {renderStat('Multicast', diagnostics.multicast ? '🟢 Supported' : '🔴 Blocked', diagnostics.multicast ? '#00A884' : '#D32F2F')}
            {renderStat('Direct Conn.', diagnostics.directConnection ? '🟢 Available' : '🔴 Unavailable', diagnostics.directConnection ? '#00A884' : '#D32F2F')}
            {renderStat('IPv6', diagnostics.ipv6 ? '🟢 Available' : '🔴 Unavailable', diagnostics.ipv6 ? '#00A884' : '#D32F2F')}
            {renderStat('Reachable Peers', `${diagnostics.reachablePeers}`, '#00A884')}
            {renderStat('NAT Type', diagnostics.natType?.toUpperCase() || 'UNKNOWN', '#00A884')}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discovered Devices</Text>
          <Text style={styles.sectionSubtitle}>{peers.length} devices</Text>
        </View>
        
        <FlatList
          data={peers}
          renderItem={renderPeer}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No devices discovered</Text>
              <Text style={styles.emptySubtext}>Pull to refresh or check network settings</Text>
            </View>
          }
          contentContainerStyle={styles.peerList}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          <Button mode="outlined" onPress={() => navigation.navigate('Diagnostics')} style={styles.actionButton}>
            📊 Full Diagnostics
          </Button>
          <Button mode="outlined" onPress={() => navigation.navigate('Pairing')} style={styles.actionButton}>
            📱 Pair New Device
          </Button>
          <Button mode="outlined" onPress={loadTopology} style={styles.actionButton}>
            🗺️ Network Map
          </Button>
          <Button mode="outlined" onPress={() => discoveryService.addManualPeer('192.168.1.100')} style={styles.actionButton}>
            ➕ Manual Peer
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingBottom: 20 },
  section: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 16, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111B21' },
  sectionSubtitle: { fontSize: 13, color: '#667781' },
  statusChip: { fontSize: 11 },
  chipOnline: { backgroundColor: '#E8F5E9' },
  chipOffline: { backgroundColor: '#FFEBEE' },
  networkInfo: { gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#667781' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111B21' },
  diagnosticsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  statCard: { width: '48%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#667781', textAlign: 'center', marginTop: 2 },
  peerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F0F2F5' },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  peerInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  peerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  peerName: { fontSize: 15, fontWeight: '500', color: '#111B21', flex: 1 },
  peerDetails: { gap: 2 },
  peerDetail: { fontSize: 12, color: '#667781' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#667781', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#8696A0', textAlign: 'center' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { width: '48%', paddingVertical: 12 },
  refreshControl: { marginTop: 10 },
});