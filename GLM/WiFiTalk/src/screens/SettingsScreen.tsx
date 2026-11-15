import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, Alert, StyleSheet, Platform } from 'react-native';
import { Surface, ListItem, Button, TextInput, Chip, Divider, Avatar, Menu, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { identityService } from '../services/IdentityService';
import { databaseService } from '../db/DatabaseService';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { currentUser, currentDevice, settings, setSettings, saveSettings, loadSettings } = useAppStore();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editStatus, setEditStatus] = useState(currentUser?.status || '');
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    try {
      // Calculate storage usage
      const info = await calculateStorage();
      setStorageInfo(info);
    } catch (error) {
      console.error('[Settings] Failed to load storage info:', error);
    }
  };

  const calculateStorage = async () => {
    // Placeholder - would use RNFS to calculate actual storage
    return {
      total: 0,
      used: 0,
      free: 0,
      breakdown: { photos: 0, videos: 0, documents: 0, voice: 0, cache: 0, database: 0 },
    };
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    
    try {
      await identityService.updateUserProfile({
        name: editName,
        status: editStatus,
      });
      setShowProfileEdit(false);
    } catch (error) {
      console.error('[Settings] Failed to save profile:', error);
    }
  };

  const toggleSetting = (path: string, value: boolean) => {
    const keys = path.split('.');
    const newSettings = { ...settings };
    let obj: any = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      obj[keys[i]] = { ...obj[keys[i]] };
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    saveSettings();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Surface style={styles.sectionCard} elevation={1}>
        {children}
      </Surface>
    </View>
  );

  const renderSwitchItem = (title: string, description: string, path: string, value: boolean) => (
    <ListItem
      title={title}
      description={description}
      trailing={
        <Switch
          value={value}
          onValueChange={(v) => toggleSetting(path, v)}
          color="#00A884"
        />
      }
    />
  );

  const renderNavigationItem = (title: string, description: string, onPress: () => void, icon?: string) => (
    <ListItem
      title={title}
      description={description}
      leading={icon ? <Text style={styles.leadingIcon}>{icon}</Text> : undefined}
      trailing={<Text style={styles.chevron}>›</Text>}
      onPress={onPress}
    />
  );

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <ScrollView style={styles.container}>
      {currentUser && (
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.profileHeader}>
            <Avatar.Image size={72} source={{ uri: currentUser.avatar }}>
              <Text style={styles.avatarText}>{currentUser.name.charAt(0).toUpperCase()}</Text>
            </Avatar.Image>
            <View style={styles.profileInfo} flex={1}>
              {showProfileEdit ? (
                <>
                  <TextInput
                    label="Name"
                    value={editName}
                    onChangeText={setEditName}
                    mode="outlined"
                    style={styles.editInput}
                  />
                  <TextInput
                    label="Status"
                    value={editStatus}
                    onChangeText={setEditStatus}
                    mode="outlined"
                    style={styles.editInput}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.editActions}>
                    <Button mode="text" onPress={() => setShowProfileEdit(false)}>Cancel</Button>
                    <Button mode="contained" onPress={saveProfile} color="#00A884">Save</Button>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>{currentUser.name}</Text>
                  <Text style={styles.profileStatus}>{currentUser.status}</Text>
                  <View style={styles.profileBadges}>
                    <Chip style={styles.badge}>
                      {currentUser.wifitalkId}
                    </Chip>
                    <Chip style={styles.badge}>
                      {currentDevice?.platform || 'Unknown'}
                    </Chip>
                  </View>
                </>
              )}
            </View>
            <Menu
              anchor={
                <Button
                  mode="text"
                  onPress={() => {}}
                  icon={showProfileEdit ? 'check' : 'pencil'}
                  color="#00A884"
                />
              }
            >
              <Menu.Item
                onPress={() => setShowProfileEdit(!showProfileEdit)}
                title={showProfileEdit ? 'Done Editing' : 'Edit Profile'}
              />
            </Menu>
          </View>
        </Surface>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          <ListItem
            title="WiFiTalk ID"
            description={currentUser?.wifitalkId || 'Not set'}
            leading={<Text style={styles.leadingIcon}>🆔</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Phone Number"
            description={currentUser?.phoneNumber || 'Not linked'}
            leading={<Text style={styles.leadingIcon}>📞</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Linked Devices"
            description={`${currentUser ? 1 : 0} device(s)`}
            leading={<Text style={styles.leadingIcon}>📱</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('LinkedDevices')}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {renderSwitchItem(
            'Discoverable on Network',
            'Allow nearby WiFiTalk users to see you',
            'privacy.discoverable',
            settings.privacy.discoverable
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Show Online Status',
            'Let contacts see when you\'re online',
            'privacy.showOnlineStatus',
            settings.privacy.showOnlineStatus
          )}
          <Divider style={styles.divider} />
          <ListItem
            title="Last Seen"
            description={settings.privacy.showLastSeen}
            leading={<Text style={styles.leadingIcon}>👁️</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Read Receipts',
            'Show blue ticks when messages are read',
            'privacy.readReceipts',
            settings.privacy.readReceipts
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Two-Factor Authentication',
            'Require PIN for new device login',
            'security.twoFactorAuth',
            settings.security.twoFactorAuth
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'App Lock',
            'Lock WiFiTalk with biometric/PIN',
            'security.lockApp',
            settings.security.lockApp
          )}
          <Divider style={styles.divider} />
          <ListItem
            title="Blocked Contacts"
            description="Manage blocked users"
            leading={<Text style={styles.leadingIcon}>🚫</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('BlockedContacts')}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {renderSwitchItem(
            'Prefer Local Network',
            'Use direct Wi-Fi connections when possible',
            'network.preferLocal',
            settings.network.preferLocal
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Allow Relay Nodes',
            'Route through trusted relay devices',
            'network.allowRelay',
            settings.network.allowRelay
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Allow Internet Fallback',
            'Use internet when local network unavailable',
            'network.allowInternet',
            settings.network.allowInternet
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'mDNS Discovery',
            'Discover peers via multicast DNS',
            'network.mdnsEnabled',
            settings.network.mdnsEnabled
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'UDP Broadcast',
            'Discover peers via UDP broadcast',
            'network.udpBroadcastEnabled',
            settings.network.udpBroadcastEnabled
          )}
          <Divider style={styles.divider} />
          <ListItem
            title="Relay Nodes"
            description="Manage trusted relay devices"
            leading={<Text style={styles.leadingIcon}>🔄</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('RelayNodes')}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {renderSwitchItem(
            'Enable Notifications',
            'Receive push notifications',
            'notifications.enabled',
            settings.notifications.enabled
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Message Notifications',
            'Notify for new messages',
            'notifications.messages',
            settings.notifications.messages
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Call Notifications',
            'Notify for incoming calls',
            'notifications.calls',
            settings.notifications.calls
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Walkie-Talkie Alerts',
            'Notify when someone speaks',
            'notifications.walkieTalkie',
            settings.notifications.walkieTalkie
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Sound',
            'Play notification sounds',
            'notifications.sound',
            settings.notifications.sound
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Vibration',
            'Vibrate on notifications',
            'notifications.vibration',
            settings.notifications.vibration
          )}
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calls</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {renderSwitchItem(
            'Auto Answer',
            'Automatically answer incoming calls',
            'calls.autoAnswer',
            settings.calls.autoAnswer
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Video Enabled by Default',
            'Start calls with video on',
            'calls.videoEnabled',
            settings.calls.videoEnabled
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Speaker On by Default',
            'Use speakerphone for calls',
            'calls.speakerDefault',
            settings.calls.speakerDefault
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Noise Cancellation',
            'Reduce background noise',
            'calls.noiseCancellation',
            settings.calls.noiseCancellation
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Low Data Mode',
            'Reduce call quality to save bandwidth',
            'calls.lowDataMode',
            settings.calls.lowDataMode
          )}
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Walkie-Talkie</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {renderSwitchItem(
            'Hold to Talk',
            'Press and hold button to transmit',
            'walkieTalkie.holdToTalk',
            settings.walkieTalkie.holdToTalk
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Tap to Lock',
            'Tap once to start, tap again to stop',
            'walkieTalkie.tapToLock',
            settings.walkieTalkie.tapToLock
          )}
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Voice Activation (VAD)',
            'Automatically transmit when you speak',
            'walkieTalkie.voiceActivation',
            settings.walkieTalkie.voiceActivation
          )}
          <Divider style={styles.divider} />
          <ListItem
            title="Audio Quality"
            description={settings.walkieTalkie.audioQuality}
            leading={<Text style={styles.leadingIcon}>🎙️</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage & Data</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          {storageInfo && (
            <View style={styles.storageInfo}>
              <Text style={styles.storageTotal}>
                Total: {formatBytes(storageInfo.total)} • Used: {formatBytes(storageInfo.used)} • Free: {formatBytes(storageInfo.free)}
              </Text>
              <View style={styles.storageBreakdown}>
                {Object.entries(storageInfo.breakdown).map(([key, value]) => (
                  <View key={key} style={styles.storageItem}>
                    <Text style={styles.storageItemLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <Text style={styles.storageItemValue}>{formatBytes(value as number)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <Divider style={styles.divider} />
          <ListItem
            title="Clear Cache"
            description="Remove temporary files without deleting messages"
            leading={<Text style={styles.leadingIcon}>🗑️</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => Alert.alert('Clear Cache', 'This will remove temporary files. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', onPress: () => {} },
            ])}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Backup & Restore"
            description="Manage local backups"
            leading={<Text style={styles.leadingIcon}>💾</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('Backup')}
          />
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Auto-download Media on Wi-Fi',
            'Automatically download photos and videos',
            'storage.autoDownloadOnWifi',
            settings.storage.autoDownloadOnWifi
          )}
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          <ListItem
            title="Theme"
            description={settings.appearance.theme}
            leading={<Text style={styles.leadingIcon}>🎨</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Font Size"
            description={settings.appearance.fontSize}
            leading={<Text style={styles.leadingIcon}>📝</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Chat Wallpaper"
            description="Set custom background"
            leading={<Text style={styles.leadingIcon}>🖼️</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          {renderSwitchItem(
            'Show Timestamps',
            'Show time for each message',
            'appearance.showTimestamps',
            settings.appearance.showTimestamps
          )}
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          <ListItem
            title="Network Diagnostics"
            description="Run connectivity tests and view network map"
            leading={<Text style={styles.leadingIcon}>📊</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('Diagnostics')}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Pair New Device"
            description="Scan QR code or enter pairing code"
            leading={<Text style={styles.leadingIcon}>📱</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('Pairing')}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Trusted Devices"
            description="Manage authorized devices"
            leading={<Text style={styles.leadingIcon}>🔐</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('TrustedDevices')}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Export Data"
            description="Export your messages and media"
            leading={<Text style={styles.leadingIcon}>📤</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Debug Logs"
            description="View application logs"
            leading={<Text style={styles.leadingIcon}>📋</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => navigation.navigate('DebugLogs')}
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Surface style={styles.sectionCard} elevation={1}>
          <ListItem
            title="Version"
            description="1.0.0 (Build 1)"
            leading={<Text style={styles.leadingIcon}>📦</Text>}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Open Source Licenses"
            description="View third-party licenses"
            leading={<Text style={styles.leadingIcon}>📄</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Privacy Policy"
            description="Read our privacy policy"
            leading={<Text style={styles.leadingIcon}>🔒</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
          <Divider style={styles.divider} />
          <ListItem
            title="Report a Bug"
            description="Send feedback to developers"
            leading={<Text style={styles.leadingIcon}>🐛</Text>}
            trailing={<Text style={styles.chevron}>›</Text>}
            onPress={() => {}}
          />
        </Surface>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>WiFiTalk — Your Network. Your Chat. Your Calls.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5', paddingBottom: 20 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#667781', marginBottom: 8, paddingHorizontal: 4 },
  sectionCard: { borderRadius: 12, backgroundColor: '#FFF', overflow: 'hidden' },
  divider: { marginHorizontal: 16 },
  profileCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFF', overflow: 'hidden' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#FFF' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 22, fontWeight: '600', color: '#111B21' },
  profileStatus: { fontSize: 14, color: '#667781', marginTop: 4 },
  profileBadges: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: { fontSize: 11 },
  editInput: { marginTop: 8, marginBottom: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
  leadingIcon: { fontSize: 24, marginRight: 4 },
  chevron: { fontSize: 20, color: '#8696A0', fontWeight: '300' },
  storageInfo: { padding: 16 },
  storageTotal: { fontSize: 13, color: '#667781', marginBottom: 12 },
  storageBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  storageItem: { flex: 1, minWidth: '40%', alignItems: 'center', padding: 8, backgroundColor: '#F5F5F5', borderRadius: 8 },
  storageItemLabel: { fontSize: 11, color: '#667781' },
  storageItemValue: { fontSize: 13, fontWeight: '600', color: '#111B21', marginTop: 2 },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#8696A0', textAlign: 'center' },
});