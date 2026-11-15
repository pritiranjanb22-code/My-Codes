import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Vibration, Platform, Alert } from 'react-native';
import { Button, IconButton, Surface, Avatar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { messagingService } from '../services/MessagingService';

interface CallScreenParams {
  callId?: string;
  contactId?: string;
  isVideo?: boolean;
  isIncoming?: boolean;
}

export default function CallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as CallScreenParams;
  const { activeCall, setActiveCall, currentUser } = useAppStore();
  
  const [callState, setCallState] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(params.isVideo !== false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'unstable'>('excellent');
  const [remoteVideoUrl, setRemoteVideoUrl] = useState<string>('');
  
  const durationRef = useRef<NodeJS.Timeout | null>(null);
  const qualityColors = {
    excellent: '#00A884',
    good: '#FF9800',
    poor: '#FF5722',
    unstable: '#D32F2F',
  };

  useEffect(() => {
    if (params.isIncoming) {
      setCallState('ringing');
      Vibration.vibrate([0, 1000, 2000], true);
    } else {
      setCallState('connecting');
      startOutgoingCall();
    }

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
      Vibration.cancel();
      setActiveCall(null);
    };
  }, []);

  const startOutgoingCall = async () => {
    if (params.contactId) {
      try {
        // Would initiate WebRTC call
        setTimeout(() => setCallState('connected'), 2000);
      } catch (error) {
        setCallState('ended');
      }
    }
  };

  const answerCall = () => {
    setCallState('connected');
    startDurationTimer();
    Vibration.cancel();
  };

  const declineCall = () => {
    setCallState('ended');
    Vibration.cancel();
    setTimeout(() => navigation.goBack(), 500);
  };

  const endCall = () => {
    setCallState('ended');
    if (durationRef.current) clearInterval(durationRef.current);
    setTimeout(() => navigation.goBack(), 500);
  };

  const startDurationTimer = () => {
    setDuration(0);
    durationRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const contact = useAppStore.getState().conversations.flatMap(c => c.participants).find(p => p.userId === params.contactId);

  if (callState === 'ended') {
    return (
      <View style={styles.endedContainer}>
        <Text style={styles.endedText}>Call Ended</Text>
        <Text style={styles.endedDuration}>{formatDuration(duration)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {callState === 'connected' && videoEnabled && (
        <View style={styles.videoContainer}>
          {remoteVideoUrl && (
            <View style={styles.remoteVideo}>
              <Text style={styles.remoteVideoPlaceholder}>Remote Video</Text>
            </View>
          )}
          
          <View style={styles.localVideoPreview}>
            <Text style={styles.localVideoText}>Your Video</Text>
          </View>
        </View>
      )}

      {callState !== 'connected' && (
        <View style={styles.connectingOverlay}>
          <Avatar.Image size={120} source={{ uri: contact?.avatar }}>
            <Text style={styles.largeAvatarText}>{contact?.name?.charAt(0).toUpperCase() || '?'}</Text>
          </Avatar.Image>
          <Text style={styles.connectingName}>{contact?.name || 'Unknown'}</Text>
          <Text style={styles.connectingStatus}>
            {callState === 'ringing' ? 'Incoming Call...' : callState === 'connecting' ? 'Connecting...' : 'Ringing...'}
          </Text>
        </View>
      )}

      <View style={styles.bottomControls}>
        <View style={styles.callInfo}>
          <Text style={styles.callDuration}>{formatDuration(duration)}</Text>
          <View style={styles.qualityIndicator}>
            <View style={[styles.qualityDot, { backgroundColor: qualityColors[quality] }]} />
            <Text style={styles.qualityText}>{quality.charAt(0).toUpperCase() + quality.slice(1)}</Text>
          </View>
        </View>

        <View style={styles.controlButtons}>
          <ControlButton
            icon={muted ? 'mic-off' : 'mic'}
            label="Mute"
            active={muted}
            onPress={() => setMuted(!muted)}
            color="#00A884"
          />
          
          {videoEnabled && (
            <ControlButton
              icon={frontCamera ? 'camera-front' : 'camera-rear'}
              label="Flip"
              active={false}
              onPress={() => setFrontCamera(!frontCamera)}
              color="#00A884"
            />
          )}
          
          <ControlButton
            icon={speakerOn ? 'volume-high' : 'volume-off'}
            label="Speaker"
            active={speakerOn}
            onPress={() => setSpeakerOn(!speakerOn)}
            color="#00A884"
          />
          
          <ControlButton
            icon={videoEnabled ? 'video' : 'video-off'}
            label={videoEnabled ? 'Video' : 'Video Off'}
            active={videoEnabled}
            onPress={() => setVideoEnabled(!videoEnabled)}
            color="#00A884"
          />
          
          <ControlButton
            icon="phone-hangup"
            label="End"
            active={false}
            onPress={endCall}
            color="#D32F2F"
            destructive
          />
        </View>
      </View>

      {callState === 'ringing' && (
        <View style={styles.incomingButtons}>
          <Button
            mode="contained"
            onPress={declineCall}
            color="#D32F2F"
            style={styles.incomingButton}
            contentStyle={styles.incomingButtonContent}
          >
            <IconButton icon="phone-hangup" size={28} color="#FFF" />
          </Button>
          <Button
            mode="contained"
            onPress={answerCall}
            color="#00A884"
            style={styles.incomingButton}
            contentStyle={styles.incomingButtonContent}
          >
            <IconButton icon="phone" size={28} color="#FFF" />
          </Button>
        </View>
      )}
    </View>
  );
}

function ControlButton({ icon, label, active, onPress, color, destructive }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.controlButton,
        active && styles.controlButtonActive,
        destructive && styles.controlButtonDestructive
      ]}
    >
      <IconButton icon={icon} size={28} color={active || destructive ? '#FFF' : color} style={styles.controlIcon} />
      <Text style={[
        styles.controlLabel,
        (active || destructive) && styles.controlLabelActive
      ]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  endedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  endedText: { fontSize: 24, fontWeight: '600', color: '#FFF' },
  endedDuration: { fontSize: 18, color: '#AAA', marginTop: 8 },
  videoContainer: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1, backgroundColor: '#111' },
  remoteVideoPlaceholder: { position: 'absolute', top: 20, left: 20, color: '#FFF', fontSize: 16 },
  localVideoPreview: { position: 'absolute', bottom: 160, right: 16, width: 120, height: 160, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#00A884' },
  localVideoText: { color: '#FFF', fontSize: 12 },
  connectingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  largeAvatarText: { fontSize: 48, fontWeight: '600', color: '#FFF' },
  connectingName: { fontSize: 24, fontWeight: '600', color: '#FFF', marginTop: 20 },
  connectingStatus: { fontSize: 16, color: '#AAA', marginTop: 8 },
  bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 20 },
  callInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  callDuration: { fontSize: 18, fontWeight: '600', color: '#FFF', fontFamily: 'monospace' },
  qualityIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qualityDot: { width: 10, height: 10, borderRadius: 5 },
  qualityText: { fontSize: 13, color: '#FFF', fontWeight: '500' },
  controlButtons: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  controlButton: { alignItems: 'center', gap: 6 },
  controlButtonActive: { },
  controlButtonDestructive: { },
  controlIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  controlLabel: { fontSize: 11, color: '#FFF', marginTop: 4 },
  controlLabelActive: { color: '#00A884' },
  incomingButtons: { position: 'absolute', bottom: 120, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  incomingButton: { borderRadius: 36, width: 72, height: 72, padding: 0 },
  incomingButtonContent: { padding: 0 },
});

import { TouchableOpacity } from 'react-native';