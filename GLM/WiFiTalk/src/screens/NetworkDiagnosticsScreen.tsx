import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Surface, Button, Chip, Divider, Accordion } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { networkDiagnosticsService } from '../services/NetworkDiagnosticsService';
import { discoveryService } from '../services/DiscoveryService';
import { identityService } from '../services/IdentityService';
import { formatDistanceToNow } from 'date-fns';

export default function NetworkDiagnosticsScreen() {
  const navigation = useNavigation();
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [topology, setTopology] = useState<any>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [expandedPeer, setExpandedPeer] = useState<string | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setRunningTests(true);
    setTestResults([]);
    
    try {
      const diag = await networkDiagnosticsService.runFullDiagnostics();
      setDiagnostics(diag);
      
      const topo = await networkDiagnosticsService.getNetworkTopology();
      setTopology(topo);
      
      // Run individual tests
      await runIndividualTests();
    } catch (error) {
      console.error('[Diagnostics] Failed to run diagnostics:', error);
    } finally {
      setRunningTests(false);
    }
  };

  const runIndividualTests = async () => {
    const tests = [
      { name: 'Internet Connectivity', fn: () => testInternet() },
      { name: 'LAN Connectivity', fn: () => testLAN() },
      { name: 'Peer Discovery', fn: () => testDiscovery() },
      { name: 'Multicast Support', fn: () => testMulticast() },
      { name: 'Direct Connection', fn: () => testDirectConnection() },
      { name: 'NAT Detection', fn: () => testNAT() },
      { name: 'IPv6 Support', fn: () => testIPv6() },
    ];

    for (const test of tests) {
      const start = Date.now();
      try {
        const result = await test.fn();
        setTestResults(prev => [...prev, {
          name: test.name,
          status: result ? 'pass' : 'fail',
          duration: Date.now() - start,
          details: result?.details || '',
        }]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          name: test.name,
          status: 'fail',
          duration: Date.now() - start,
          details: error instanceof Error ? error.message : 'Unknown error',
        }]);
      }
    }
  };

  const testInternet = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch('https://www.google.com/generate_204', { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return { success: true };
    } catch {
      clearTimeout(timeout);
      return { success: false, details: 'Cannot reach internet' };
    }
  };

  const testLAN = async () => {
    const networkInfo = await networkDiagnosticsService.getNetworkInfo();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      await fetch(`http://${networkInfo.gateway}`, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      return { success: true };
    } catch {
      clearTimeout(timeout);
      return { success: false, details: 'Cannot reach gateway' };
    }
  };

  const testDiscovery = () => {
    const peers = discoveryService.getPeers();
    return { success: peers.length > 0, details: `${peers.length} peers discovered` };
  };

  const testMulticast = async () => {
    const networkInfo = await networkDiagnosticsService.getNetworkInfo();
    return { success: networkInfo.multicastSupported, details: networkInfo.multicastSupported ? 'Multicast supported' : 'Multicast blocked' };
  };

  const testDirectConnection = () => {
    const peers = discoveryService.getPeers();
    const connected = peers.some(p => p.reachable);
    return { success: connected, details: connected ? 'Direct connections available' : 'No direct connections' };
  };

  const testNAT = async () => {
    const networkInfo = await networkDiagnosticsService.getNetworkInfo();
    return { success: networkInfo.natType !== 'strict', details: `NAT Type: ${networkInfo.natType || 'unknown'}` };
  };

  const testIPv6 = async () => {
    const networkInfo = await networkDiagnosticsService.getNetworkInfo();
    return { success: !!networkInfo.ipv6, details: networkInfo.ipv6 ? 'IPv6 available' : 'IPv6 not available' };
  };

  const runPeerTest = async (peerId: string) => {
    const result = await networkDiagnosticsService.testConnectionToPeer(peerId);
    if (result) {
      Alert.alert(
        `Test: ${result.name}`,
        `Ping: ${result.ping >= 0 ? `${result.ping}ms` : 'Failed'}\n` +
        `Connection: ${result.connectionType}\n` +
        `Quality: ${result.quality}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'pass') return '✅';
    if (status === 'fail') return '❌';
    return '⏳';
  };

  const getStatusColor = (status: string) => {
    if (status === 'pass') return '#00A884';
    if (status === 'fail') return '#D32F2F';
    return '#FF9800';
  };

  if (!diagnostics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A884" />
        <Text style={styles.loadingText}>Running diagnostics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerCard} elevation={2}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.pageTitle}>Network Diagnostics</Text>
            <Text style={styles.pageSubtitle}>
              Local IP: {diagnostics.localIp} • Gateway: {diagnostics.gateway}
            </Text>
          </View>
          <Button
            mode={runningTests ? 'text' : 'contained'}
            onPress={runDiagnostics}
            disabled={runningTests}
            color="#00A884"
            style={styles.runButton}
          >
            {runningTests ? 'Running...' : 'Run Tests'}
          </Button>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Test Results</Text>
        <Divider />
        <FlatList
          data={testResults}
          renderItem={({ item }) => (
            <View style={styles.testRow}>
              <Text style={styles.testIcon}>{getStatusIcon(item.status)}</Text>
              <View style={styles.testInfo} flex={1}>
                <Text style={styles.testName}>{item.name}</Text>
                <Text style={[styles.testDetails, { color: getStatusColor(item.status) }]}>
                  {item.status === 'pass' ? 'PASS' : 'FAIL'} • {item.duration}ms
                  {item.details && ` • ${item.details}`}
                </Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.name}
          ListEmptyComponent={
            <Text style={styles.noTests}>Run diagnostics to see test results</Text>
          }
        />
      </Surface>

      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Network Overview</Text>
        <Divider />
        <View style={styles.overviewGrid}>
          {[
            { label: 'Internet', value: diagnostics.internet ? '🟢 Connected' : '🔴 Disconnected', color: diagnostics.internet ? '#00A884' : '#D32F2F' },
            { label: 'LAN', value: diagnostics.lan ? '🟢 Connected' : '🔴 Disconnected', color: diagnostics.lan ? '#00A884' : '#D32F2F' },
            { label: 'Discovery', value: diagnostics.peerDiscovery ? '🟢 Active' : '🔴 Inactive', color: diagnostics.peerDiscovery ? '#00A884' : '#D32F2F' },
            { label: 'Direct Conn.', value: diagnostics.directConnection ? '🟢 Available' : '🔴 Unavailable', color: diagnostics.directConnection ? '#00A884' : '#D32F2F' },
            { label: 'Multicast', value: diagnostics.multicast ? '🟢 Supported' : '🔴 Blocked', color: diagnostics.multicast ? '#00A884' : '#D32F2F' },
            { label: 'IPv6', value: diagnostics.ipv6 ? '🟢 Available' : '🔴 Unavailable', color: diagnostics.ipv6 ? '#00A884' : '#D32F2F' },
            { label: 'NAT Type', value: diagnostics.natType?.toUpperCase() || 'UNKNOWN', color: '#00A884' },
            { label: 'Reachable', value: `${diagnostics.reachablePeers} peers`, color: '#00A884' },
          ].map((item, i) => (
            <View key={i} style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>{item.label}</Text>
              <Text style={[styles.overviewValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </Surface>

      {topology && (
        <Surface style={styles.card} elevation={2}>
          <Text style={styles.cardTitle}>Network Topology</Text>
          <Divider />
          <View style={styles.topologyInfo}>
            <Text style={styles.topologyRow}>
              <Text style={styles.topologyLabel}>Local IP:</Text>
              <Text style={styles.topologyValue}>{topology.network?.localIp}</Text>
            </Text>
            <Text style={styles.topologyRow}>
              <Text style={styles.topologyLabel}>Gateway:</Text>
              <Text style={styles.topologyValue}>{topology.network?.gateway}</Text>
            </Text>
            <Text style={styles.topologyRow}>
              <Text style={styles.topologyLabel}>Network:</Text>
              <Text style={styles.topologyValue}>{topology.network?.networkRange}</Text>
            </Text>
            <Text style={styles.topologyRow}>
              <Text style={styles.topologyLabel}>NAT Type:</Text>
              <Text style={styles.topologyValue}>{topology.network?.natType}</Text>
            </Text>
          </View>
          
          <Text style={styles.subTitle}>Connected Devices ({topology.devices?.length || 0})</Text>
          <FlatList
            data={topology.devices || []}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setExpandedPeer(expandedPeer === item.id ? null : item.id)}
                style={[
                  styles.topoDevice,
                  expandedPeer === item.id && styles.topoDeviceExpanded
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.topoDeviceHeader}>
                  <View style={styles.topoDeviceIcon}>
                    {item.isRelay ? '🔄' : '📱'}
                  </View>
                  <View style={styles.topoDeviceInfo} flex={1}>
                    <Text style={styles.topoDeviceName}>{item.name}</Text>
                    <Text style={styles.topoDeviceIP}>{item.ip}</Text>
                  </View>
                  <View style={styles.topoDeviceStatus}>
                    <Chip
                      style={[
                        styles.statusChipSmall,
                        item.reachable ? styles.chipOnline : styles.chipOffline
                      ]}
                    >
                      {item.reachable ? '🟢' : '🔴'}
                    </Chip>
                  </View>
                </View>
                
                {expandedPeer === item.id && (
                  <View style={styles.topoDeviceDetails}>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Segment:</Text> <Text>{item.networkSegment}</Text></Text>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Method:</Text> <Text>{item.discoveryMethod}</Text></Text>
                    <Text style={styles.detailRow}><Text style={styles.detailLabel}>Capabilities:</Text> <Text>{Object.entries(item.capabilities).filter(([_, v]) => v).map(([k]) => k).join(', ')}</Text></Text>
                    <TouchableOpacity
                      onPress={() => runPeerTest(item.id)}
                      style={styles.testPeerButton}
                    >
                      <Text style={styles.testPeerButtonText}>Test Connection</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
          
          {topology.connections?.length > 0 && (
            <>
              <Text style={styles.subTitle}>Active Connections ({topology.connections.length})</Text>
              <FlatList
                data={topology.connections}
                renderItem={({ item }) => (
                  <View style={styles.connectionRow}>
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionPeer}>{item.peerId}</Text>
                      <Text style={styles.connectionDetails}>
                        {item.transport} • {item.status} • {item.quality}
                      </Text>
                    </View>
                    <View style={styles.connectionStats}>
                      <Text style={styles.connectionStat}>↑ {(item.bytesSent / 1024).toFixed(1)} KB</Text>
                      <Text style={styles.connectionStat}>↓ {(item.bytesReceived / 1024).toFixed(1)} KB</Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.peerId}
              />
            </>
          )}
        </Surface>
      )}

      <Surface style={styles.card} elevation={2}>
        <Text style={styles.cardTitle}>Troubleshooting</Text>
        <Divider />
        <View style={styles.troubleshooting}>
          <Text style={styles.troubleshootItem}>
            <Text style={styles.troubleshootBullet}>•</Text>
            <Text>If peers are unreachable, check router settings: AP Isolation, Client Isolation, Firewall rules</Text>
          </Text>
          <Text style={styles.troubleshootItem}>
            <Text style={styles.troubleshootBullet}>•</Text>
            <Text>Multicast blocked? Enable IGMP Snooping on managed switches</Text>
          </Text>
          <Text style={styles.troubleshootItem}>
            <Text style={styles.troubleshootBullet}>•</Text>
            <Text>Different subnets? Verify inter-VLAN routing is configured</Text>
          </Text>
          <Text style={styles.troubleshootItem}>
            <Text style={styles.troubleshootBullet}>•</Text>
            <Text>Strict NAT? Enable UPnP or configure port forwarding for port 8484</Text>
          </Text>
          <Text style={styles.troubleshootItem}>
            <Text style={styles.troubleshootBullet}>•</Text>
            <Text>Use "Manual Peer" to connect directly by IP if discovery fails</Text>
          </Text>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#667781' },
  headerCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: '#FFF' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111B21' },
  pageSubtitle: { fontSize: 13, color: '#667781', marginTop: 4 },
  runButton: { marginTop: 8 },
  card: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFF', overflow: 'hidden' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111B21', paddingHorizontal: 16, paddingVertical: 12 },
  testRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F0F2F5' },
  testIcon: { fontSize: 20, marginRight: 12 },
  testInfo: { flex: 1, minWidth: 0 },
  testName: { fontSize: 14, fontWeight: '500', color: '#111B21' },
  testDetails: { fontSize: 12, marginTop: 2 },
  noTests: { padding: 24, textAlign: 'center', color: '#667781' },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  overviewItem: { width: '48%', alignItems: 'center', padding: 12, backgroundColor: '#F5F5F5', borderRadius: 12 },
  overviewLabel: { fontSize: 12, color: '#667781', textAlign: 'center', marginBottom: 4 },
  overviewValue: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  topologyInfo: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  topologyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topologyLabel: { fontSize: 13, color: '#667781' },
  topologyValue: { fontSize: 13, fontWeight: '500', color: '#111B21' },
  subTitle: { fontSize: 14, fontWeight: '600', color: '#111B21', paddingHorizontal: 16, paddingTop: 8, marginBottom: 8 },
  topoDevice: { padding: 16, borderBottomWidth: 1, borderColor: '#F0F2F5' },
  topoDeviceExpanded: { backgroundColor: '#F5F5F5' },
  topoDeviceHeader: { flexDirection: 'row', alignItems: 'center' },
  topoDeviceIcon: { fontSize: 24, marginRight: 12 },
  topoDeviceInfo: { flex: 1, minWidth: 0 },
  topoDeviceName: { fontSize: 15, fontWeight: '500', color: '#111B21' },
  topoDeviceIP: { fontSize: 12, color: '#667781' },
  topoDeviceStatus: { marginLeft: 8 },
  statusChipSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  topoDeviceDetails: { paddingTop: 12, borderTopWidth: 1, borderColor: '#E9EDEF', marginTop: 12, gap: 6 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap' },
  detailLabel: { fontSize: 12, color: '#667781', fontWeight: '500', marginRight: 4 },
  testPeerButton: { marginTop: 8, paddingVertical: 8, backgroundColor: '#E0F2F1', borderRadius: 8, alignItems: 'center' },
  testPeerButtonText: { fontSize: 13, fontWeight: '600', color: '#00A884' },
  connectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F0F2F5' },
  connectionInfo: { flex: 1 },
  connectionPeer: { fontSize: 14, fontWeight: '500', color: '#111B21' },
  connectionDetails: { fontSize: 12, color: '#667781' },
  connectionStats: { flexDirection: 'row', gap: 16 },
  connectionStat: { fontSize: 12, color: '#667781', fontWeight: '500' },
  troubleshooting: { padding: 16, gap: 12 },
  troubleshootItem: { flexDirection: 'row', flexWrap: 'wrap', fontSize: 13, color: '#667781', lineHeight: 20 },
  troubleshootBullet: { fontWeight: 'bold', marginRight: 8, color: '#00A884' },
});