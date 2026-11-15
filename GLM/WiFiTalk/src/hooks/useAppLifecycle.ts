import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { discoveryService } from '../services/DiscoveryService';
import { identityService } from '../services/IdentityService';
import { walkieTalkieService } from '../services/WalkieTalkieService';
import { transportService } from '../services/TransportService';

export function useAppLifecycle() {
  const { currentUser, currentDevice, setCurrentDevice, isAuthenticated } = useAppStore();

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        if (currentDevice) {
          identityService.setOnlineStatus(true);
          discoveryService.start();
          walkieTalkieService.initialize();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        if (currentDevice) {
          identityService.setOnlineStatus(false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [currentDevice, currentUser]);
}

export function useNetworkMonitor() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/generate_204', { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeout);
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, []);

  return { networkInfo, isConnected };
}

export function usePeerConnection(peerId: string) {
  const [connection, setConnection] = useState<any>(null);
  const { currentUser } = useAppStore();

  useEffect(() => {
    const conn = transportService.getConnection(peerId);
    setConnection(conn);

    const unsubscribe = transportService.on('connectionChange', (info: any) => {
      if (info.peerId === peerId) {
        setConnection(info);
      }
    });

    return () => unsubscribe();
  }, [peerId]);

  return connection;
}

export function useMessages(conversationId: string, limit = 50) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addMessage, updateMessage } = useAppStore();

  useEffect(() => {
    let mounted = true;
    
    const loadMessages = async () => {
      try {
        const db = require('../db/DatabaseService').databaseService;
        const msgs = await db.getMessages(conversationId, limit);
        if (mounted) {
          setMessages(msgs);
          setLoading(false);
        }
      } catch (error) {
        console.error('[useMessages] Failed to load:', error);
        if (mounted) setLoading(false);
      }
    };

    loadMessages();

    const unsubscribeReceived = addMessage((msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    const unsubscribeUpdated = updateMessage((msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
      }
    });

    return () {
      mounted = false;
      unsubscribeReceived();
      unsubscribeUpdated();
    };
  }, [conversationId, limit, addMessage, updateMessage]);

  return { messages, loading, setMessages };
}

export function useWalkieTalkie() {
  const { 
    channels, 
    activeChannelId, 
    isTransmitting, 
    isListening, 
    currentSpeaker,
    setActiveChannel,
    setTransmitting,
    setListening,
    setCurrentSpeaker,
    addChannel,
    updateChannel
  } = useAppStore();

  useEffect(() => {
    const unsubscribeStarted = walkieTalkieService.onTransmissionStarted(({ speakerId }) => {
      setTransmitting(true);
      setCurrentSpeaker(speakerId);
    });
    const unsubscribeStopped = walkieTalkieService.onTransmissionStopped(({ speakerId }) => {
      setTransmitting(false);
      setCurrentSpeaker(null);
    });
    const unsubscribeSpeaker = walkieTalkieService.onSpeakerStarted(({ speakerId }) => {
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

  return {
    channels,
    activeChannel: channels.find(c => c.id === activeChannelId),
    isTransmitting,
    isListening,
    currentSpeaker,
    startTransmitting: walkieTalkieService.startTransmitting,
    stopTransmitting: walkieTalkieService.stopTransmitting,
    startListening: walkieTalkieService.startListening,
    stopListening: walkieTalkieService.stopListening,
    joinChannel: walkieTalkieService.joinChannel,
    leaveChannel: walkieTalkieService.leaveChannel,
    createChannel: walkieTalkieService.createChannel,
  };
}