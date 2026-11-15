import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Platform } from 'react-native';
import { Surface, TextInput, Button, Avatar, Chip, ListItem, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { identityService } from '../services/IdentityService';
import { launchImageLibrary } from 'react-native-image-picker';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser, currentDevice } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [status, setStatus] = useState(currentUser?.status || '');
  const [avatar, setAvatar] = useState<string | null>(currentUser?.avatar || null);

  const userId = route.params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  const user = userId ? useAppStore.getState().conversations.flatMap(c => c.participants).find(p => p.userId === userId) : currentUser;

  const saveProfile = async () => {
    if (!isOwnProfile) return;
    
    try {
      await identityService.updateUserProfile({ name, status });
      setEditing(false);
      Alert.alert('Saved', 'Profile updated successfully');
    } catch (error) {
      console.error('[ProfileScreen] Failed to save:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const pickAvatar = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.assets?.[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[ProfileScreen] Failed to pick avatar:', error);
    }
  };

  if (!user && !currentUser) {
    return null;
  }

  const displayUser = user || currentUser!;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {isOwnProfile && (
          <Button
            mode={editing ? 'contained' : 'text'}
            onPress={() => setEditing(!editing)}
            color="#00A884"
            style={styles.editButton}
          >
            {editing ? 'Done' : 'Edit'}
          </Button>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.avatarSection}>
            <Avatar.Image
              size={100}
              source={{ uri: avatar || displayUser.avatar }}
              onPress={isOwnProfile && editing ? pickAvatar : undefined}
            >
              <Text style={styles.largeAvatarText}>{displayUser.name.charAt(0).toUpperCase()}</Text>
            </Avatar.Image>
            {isOwnProfile && editing && (
              <Text style={styles.avatarHint}>Tap to change photo</Text>
            )}
          </View>

          {editing ? (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                autoCapitalize="words"
              />
              <TextInput
                label="Status"
                value={status}
                onChangeText={setStatus}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />
              <View style={styles.saveActions}>
                <Button mode="text" onPress={() => { setEditing(false); setName(displayUser.name); setStatus(displayUser.status); }}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveProfile} color="#00A884">
                  Save
                </Button>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>{displayUser.name}</Text>
              <Text style={styles.profileStatus}>{displayUser.status || 'Hey there! I am using WiFiTalk.'}</Text>
              
              <View style={styles.badges}>
                <Chip style={styles.badge}>
                  {displayUser.wifitalkId}
                </Chip>
                {isOwnProfile && currentDevice && (
                  <Chip style={styles.badge}>
                    {currentDevice.platform} • {currentDevice.appVersion}
                  </Chip>
                )}
              </View>
            </>
          )}
        </Surface>

        {isOwnProfile && (
          <Surface style={styles.sectionCard} elevation={1}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <ListItem
              title="WiFiTalk ID"
              description={displayUser.wifitalkId}
              leading={<Text style={styles.leadingIcon}>🆔</Text>}
            />
            <Divider style={styles.divider} />
            <ListItem
              title="Phone Number"
              description={displayUser.phoneNumber || 'Not linked'}
              leading={<Text style={styles.leadingIcon}>📞</Text>}
              trailing={<Text style={styles.chevron}>›</Text>}
              onPress={() => {}}
            />
            <Divider style={styles.divider} />
            <ListItem
              title="Encryption Key"
              description="View your public key fingerprint"
              leading={<Text style={styles.leadingIcon}>🔐</Text>}
              trailing={<Text style={styles.chevron}>›</Text>}
              onPress={() => {
                Alert.alert('Public Key Fingerprint', identityService.generateFingerprint(displayUser.publicKey));
              }}
            />
          </Surface>
        )}

        <Surface style={styles.sectionCard} elevation={1}>
          <Text style={styles.sectionTitle}>Device Info</Text>
          {currentDevice && (
            <>
              <ListItem
                title="Device Name"
                description={currentDevice.name}
                leading={<Text style={styles.leadingIcon}>📱</Text>}
              />
              <Divider style={styles.divider} />
              <ListItem
                title="Platform"
                description={`${currentDevice.platform} ${currentDevice.platformVersion}`}
                leading={<Text style={styles.leadingIcon}>⚙️</Text>}
              />
              <Divider style={styles.divider} />
              <ListItem
                title="App Version"
                description={currentDevice.appVersion}
                leading={<Text style={styles.leadingIcon}>📦</Text>}
              />
              <Divider style={styles.divider} />
              <ListItem
                title="Local IP"
                description={currentDevice.localIp}
                leading={<Text style={styles.leadingIcon}>🌐</Text>}
              />
              <Divider style={styles.divider} />
              <ListItem
                title="Network Segment"
                description={currentDevice.networkSegment}
                leading={<Text style={styles.leadingIcon}>📡</Text>}
              />
              <Divider style={styles.divider} />
              <ListItem
                title="Capabilities"
                description={Object.entries(currentDevice.capabilities).filter(([_, v]) => v).map(([k]) => k).join(', ')}
                leading={<Text style={styles.leadingIcon}>⚡</Text>}
              />
            </>
          )}
        </Surface>

        {isOwnProfile && (
          <Surface style={styles.dangerZone} elevation={1}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <ListItem
              title="Log Out"
              description="Sign out of WiFiTalk on this device"
              leading={<Text style={styles.leadingIcon}>🚪</Text>}
              titleStyle={styles.dangerText}
              onPress={() => Alert.alert('Log Out', 'Are you sure you want to log out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: () => {} },
              ])}
            />
            <Divider style={styles.divider} />
            <ListItem
              title="Delete Account"
              description="Permanently delete your WiFiTalk account"
              leading={<Text style={styles.leadingIcon}>🗑️</Text>}
              titleStyle={styles.dangerText}
              onPress={() => Alert.alert('Delete Account', 'This action cannot be undone. All your data will be permanently deleted.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} },
              ])}
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111B21' },
  editButton: { marginRight: 8 },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  profileCard: { borderRadius: 16, backgroundColor: '#FFF', padding: 20, alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  largeAvatarText: { fontSize: 40, fontWeight: '600', color: '#FFF' },
  avatarHint: { fontSize: 12, color: '#667781', marginTop: 8 },
  profileName: { fontSize: 24, fontWeight: '600', color: '#111B21', marginTop: 8 },
  profileStatus: { fontSize: 15, color: '#667781', marginTop: 4, textAlign: 'center', paddingHorizontal: 16 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { fontSize: 11 },
  input: { marginTop: 16, marginBottom: 8 },
  saveActions: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
  sectionCard: { borderRadius: 16, backgroundColor: '#FFF', overflow: 'hidden' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#667781', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F5F5' },
  divider: { marginHorizontal: 16 },
  leadingIcon: { fontSize: 24, marginRight: 4 },
  chevron: { fontSize: 20, color: '#8696A0', fontWeight: '300' },
  dangerZone: { borderRadius: 16, backgroundColor: '#FFF', overflow: 'hidden', marginTop: 8 },
  dangerTitle: { fontSize: 14, fontWeight: '600', color: '#D32F2F', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FDEDEC' },
  dangerText: { color: '#D32F2F' },
});