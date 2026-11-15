import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { Surface, Button, TextInput, Chip, Divider, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { pairingService } from '../services/PairingService';
import { identityService } from '../services/IdentityService';
import { discoveryService } from '../services/DiscoveryService';
import QRCode from 'react-native-qrcode-svg';

export default function PairingScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<'receive' | 'scan' | 'code'>('receive');
  const [myQRData, setMyQRData] = useState<string>('');
  const [myPairingCode, setMyPairingCode] = useState<string>('');
  const [scannedData, setScannedData] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState('');
  const [pairingRequest, setPairingRequest] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateMyPairingData();
    loadIncomingRequests();
    
    const unsubscribe = pairingService.onIncomingPairingRequest((request: any) => {
      setIncomingRequests(prev => [...prev, request]);
      setPairingRequest(request);
    });
    
    return () => unsubscribe();
  }, []);

  const generateMyPairingData = async () => {
    setGenerating(true);
    try {
      const request = await pairingService.createPairingRequest();
      setMyQRData(request.qrData);
      setMyPairingCode(request.code);
    } catch (error) {
      console.error('[PairingScreen] Failed to generate pairing data:', error);
    } finally {
      setGenerating(false);
    }
  };

  const loadIncomingRequests = async () => {
    const requests = pairingService.getPendingRequests();
    setIncomingRequests(requests);
  };

  const handleScanResult = async (data: string) => {
    setScannedData(data);
    const request = await pairingService.processQRCode(data);
    if (request) {
      setPairingRequest(request);
      setMode('code');
    }
  };

  const handleAccept = async () => {
    if (!pairingRequest) return;
    
    try {
      await pairingService.acceptPairing(pairingRequest.id);
      Alert.alert('Success', 'Device paired successfully!');
      setPairingRequest(null);
      setMode('receive');
      loadIncomingRequests();
    } catch (error) {
      console.error('[PairingScreen] Failed to accept pairing:', error);
      Alert.alert('Error', 'Failed to pair device');
    }
  };

  const handleReject = async () => {
    if (!pairingRequest) return;
    
    try {
      await pairingService.rejectPairing(pairingRequest.id);
      setPairingRequest(null);
      loadIncomingRequests();
    } catch (error) {
      console.error('[PairingScreen] Failed to reject pairing:', error);
    }
  };

  const handleEnterCode = async () => {
    if (!enteredCode.trim()) return;
    
    const request = await pairingService.processPairingCode(enteredCode.trim().toUpperCase());
    if (request) {
      setPairingRequest(request);
      setMode('code');
    } else {
      Alert.alert('Invalid Code', 'The pairing code is invalid or expired');
    }
  };

  const handleAcceptIncoming = async (requestId: string) => {
    try {
      await pairingService.acceptPairing(requestId);
      Alert.alert('Success', 'Device paired successfully!');
      loadIncomingRequests();
    } catch (error) {
      console.error('[PairingScreen] Failed to accept incoming:', error);
    }
  };

  const handleRejectIncoming = async (requestId: string) => {
    try {
      await pairingService.rejectPairing(requestId);
      loadIncomingRequests();
    } catch (error) {
      console.error('[PairingScreen] Failed to reject incoming:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    // Would use Clipboard API
    Alert.alert('Copied', 'Pairing code copied to clipboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pair Device</Text>
      </View>

      <View style={styles.modeTabs}>
        <Button
          mode={mode === 'receive' ? 'contained' : 'outlined'}
          onPress={() => setMode('receive')}
          color="#00A884"
          style={styles.modeTab}
        >
          📱 Receive
        </Button>
        <Button
          mode={mode === 'scan' ? 'contained' : 'outlined'}
          onPress={() => setMode('scan')}
          color="#00A884"
          style={styles.modeTab}
        >
          📷 Scan QR
        </Button>
        <Button
          mode={mode === 'code' ? 'contained' : 'outlined'}
          onPress={() => setMode('code')}
          color="#00A884"
          style={styles.modeTab}
        >
          🔢 Enter Code
        </Button>
      </View>

      {mode === 'receive' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {generating ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator size="large" color="#00A884" />
              <Text style={styles.loadingText}>Generating pairing code...</Text>
            </View>
          ) : (
            <View style={styles.pairingCard}>
              <Text style={styles.cardTitle}>Your Pairing Code</Text>
              <Text style={styles.cardSubtitle}>Share this with another WiFiTalk user</Text>
              
              <Surface style={styles.qrContainer} elevation={2}>
                {myQRData && (
                  <QRCode
                    value={myQRData}
                    size={256}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                    level="M"
                  />
                )}
              </Surface>
              
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Pairing Code</Text>
                <View style={styles.codeDisplay}>
                  <Text style={styles.codeText}>{myPairingCode}</Text>
                  <Button
                    mode="text"
                    onPress={() => copyToClipboard(myPairingCode)}
                    icon="content-copy"
                    color="#00A884"
                    style={styles.copyButton}
                  >
                    Copy
                  </Button>
                </View>
              </View>
              
              <Text style={styles.instructions}>
                Ask the other person to open WiFiTalk → Pair Device → Scan QR or Enter Code
              </Text>
              
              <Button
                mode="outlined"
                onPress={generateMyPairingData}
                color="#00A884"
                style={styles.regenerateButton}
              >
                🔄 Generate New Code
              </Button>
            </View>
          )}
        </ScrollView>
      )}

      {mode === 'scan' && (
        <View style={styles.scanContainer}>
          <View style={styles.scanFrame}>
            <View style={styles.scanCorners}>
              <View style={styles.corner} />
              <View style={styles.corner} />
              <View style={styles.corner} />
              <View style={styles.corner} />
            </View>
            <Text style={styles.scanInstruction}>Point camera at QR code</Text>
          </View>
          <Text style={styles.scanHint}>
            The QR code contains a secure invitation with device identity and encryption keys
          </Text>
          
          <Button
            mode="contained"
            onPress={() => {
              // Would launch camera scanner
              Alert.alert('Scanner', 'Camera scanner would open here');
            }}
            color="#00A884"
            style={styles.scanButton}
          >
            📷 Open Scanner
          </Button>
        </View>
      )}

      {mode === 'code' && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {pairingRequest ? (
            <View style={styles.incomingCard}>
              <Text style={styles.cardTitle}>Incoming Pairing Request</Text>
              
              <View style={styles.requestInfo}>
                <Avatar.Image size={64} source={{ uri: pairingRequest.avatar }}>
                  <Text style={styles.avatarText}>{pairingRequest.fromUserName.charAt(0).toUpperCase()}</Text>
                </Avatar.Image>
                <View style={styles.requestDetails}>
                  <Text style={styles.requestName}>{pairingRequest.fromUserName}</Text>
                  <Text style={styles.requestId}>{pairingRequest.fromUserId}</Text>
                  <Text style={styles.requestFingerprint}>
                    Fingerprint: {identityService.generateFingerprint(pairingRequest.fromPublicKey).substring(0, 20)}...
                  </Text>
                </View>
              </View>
              
              <View style={styles.requestActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleReject()}
                  color="#D32F2F"
                  style={styles.rejectButton}
                >
                  Decline
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAccept}
                  color="#00A884"
                  style={styles.acceptButton}
                >
                  Accept
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.enterCodeCard}>
              <Text style={styles.cardTitle}>Enter Pairing Code</Text>
              <Text style={styles.cardSubtitle}>Enter the 6-digit code from the other device</Text>
              
              <TextInput
                label="Pairing Code"
                value={enteredCode}
                onChangeText={setEnteredCode}
                mode="outlined"
                style={styles.codeInput}
                placeholder="ABC123"
                maxLength={6}
                autoCapitalize="characters"
              />
              
              <Button
                mode="contained"
                onPress={handleEnterCode}
                color="#00A884"
                disabled={enteredCode.length !== 6}
                style={styles.submitButton}
              >
                Verify & Pair
              </Button>
            </View>
          )}
        </ScrollView>
      )}

      {incomingRequests.length > 0 && (
        <View style={styles.incomingSection}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          <View style={styles.requestList}>
            {incomingRequests.map((req: any) => (
              <Surface key={req.id} style={styles.incomingItem} elevation={1}>
                <View style={styles.incomingItemInfo}>
                  <Text style={styles.incomingItemName}>{req.fromUserName}</Text>
                  <Text style={styles.incomingItemMeta}>{req.fromUserId} • {formatDistance(req.createdAt)}</Text>
                </View>
                <View style={styles.incomingItemActions}>
                  <Button
                    mode="text"
                    onPress={() => handleRejectIncoming(req.id)}
                    color="#D32F2F"
                  >
                    Decline
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => handleAcceptIncoming(req.id)}
                    color="#00A884"
                  >
                    Accept
                  </Button>
                </View>
              </Surface>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const formatDistance = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111B21' },
  modeTabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  modeTab: { flex: 1 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 20 },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#667781' },
  pairingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#111B21', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#667781', textAlign: 'center', marginBottom: 20 },
  qrContainer: { alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#FFF', marginBottom: 20 },
  codeContainer: { alignItems: 'center', marginBottom: 20 },
  codeLabel: { fontSize: 13, color: '#667781', marginBottom: 8 },
  codeDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeText: { fontSize: 32, fontWeight: '700', letterSpacing: 8, color: '#111B21', fontFamily: 'monospace' },
  copyButton: { paddingHorizontal: 8 },
  instructions: { fontSize: 13, color: '#667781', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  regenerateButton: { marginTop: 8 },
  scanContainer: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 256, height: 256, position: 'relative', marginBottom: 24 },
  scanCorners: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  corner: { position: 'absolute', width: 30, height: 30, borderWidth: 4, borderColor: '#00A884' },
  scanInstruction: { position: 'absolute', bottom: -30, left: 0, right: 0, textAlign: 'center', fontSize: 14, color: '#FFF', backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 8, borderRadius: 8 },
  scanHint: { fontSize: 13, color: '#667781', textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },
  scanButton: { width: '100%', maxWidth: 300 },
  incomingCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
  requestInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarText: { fontSize: 24, fontWeight: '600', color: '#FFF' },
  requestDetails: { flex: 1, marginLeft: 16 },
  requestName: { fontSize: 18, fontWeight: '600', color: '#111B21' },
  requestId: { fontSize: 13, color: '#667781', marginTop: 2 },
  requestFingerprint: { fontSize: 11, color: '#8696A0', marginTop: 4, fontFamily: 'monospace' },
  requestActions: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1 },
  acceptButton: { flex: 1 },
  enterCodeCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, elevation: 2 },
  codeInput: { marginTop: 16, marginBottom: 20, fontSize: 24, textAlign: 'center', letterSpacing: 8 },
  submitButton: { marginTop: 8 },
  incomingSection: { paddingHorizontal: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#667781', marginBottom: 12 },
  requestList: { gap: 8 },
  incomingItem: { padding: 16, borderRadius: 12 },
  incomingItemInfo: { flex: 1 },
  incomingItemName: { fontSize: 16, fontWeight: '500', color: '#111B21' },
  incomingItemMeta: { fontSize: 12, color: '#667781', marginTop: 2 },
  incomingItemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});