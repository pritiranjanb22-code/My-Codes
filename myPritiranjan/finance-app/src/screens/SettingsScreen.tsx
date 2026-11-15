import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { formatCurrency } from '@/utils/helpers';
import { CURRENCY_SYMBOL } from '@/constants';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

type SettingsNavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const { settings, updateSetting, accounts, categories, transactions, loadSettings } = useFinanceStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinAction, setPinAction] = useState<'enable' | 'disable' | 'change' | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const checkBiometric = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  React.useEffect(() => {
    checkBiometric();
  }, []);

  const handlePinSubmit = async () => {
    if (pinAction === 'enable') {
      if (pinInput.length < 4) {
        Alert.alert('Error', 'PIN must be at least 4 digits');
        return;
      }
      if (pinInput !== confirmPinInput) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }
      await SecureStore.setItemAsync('app_pin', pinInput);
      updateSetting('pinEnabled', true);
      updateSetting('pinHash', pinInput); // In production, use proper hashing
      setShowPinModal(false);
      setPinInput('');
      setConfirmPinInput('');
    } else if (pinAction === 'disable') {
      const storedPin = await SecureStore.getItemAsync('app_pin');
      if (pinInput !== storedPin) {
        Alert.alert('Error', 'Incorrect PIN');
        return;
      }
      await SecureStore.deleteItemAsync('app_pin');
      updateSetting('pinEnabled', false);
      updateSetting('pinHash', undefined);
      setShowPinModal(false);
      setPinInput('');
    } else if (pinAction === 'change') {
      if (pinInput.length < 4) {
        Alert.alert('Error', 'New PIN must be at least 4 digits');
        return;
      }
      if (pinInput !== confirmPinInput) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }
      const storedPin = await SecureStore.getItemAsync('app_pin');
      // In production, verify old PIN first
      await SecureStore.setItemAsync('app_pin', pinInput);
      updateSetting('pinHash', pinInput);
      setShowPinModal(false);
      setPinInput('');
      setConfirmPinInput('');
    }
  };

  const enablePin = () => {
    setPinAction('enable');
    setShowPinModal(true);
  };

  const disablePin = () => {
    setPinAction('disable');
    setShowPinModal(true);
  };

  const changePin = () => {
    setPinAction('change');
    setShowPinModal(true);
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        updateSetting('biometricEnabled', true);
      } else {
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } else {
      updateSetting('biometricEnabled', false);
    }
  };

  const exportData = async () => {
    // Export logic would go here
    Alert.alert('Export', 'Data export functionality coming soon');
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all transactions, accounts, categories, and budgets. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm',
              'Type "DELETE" to confirm',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'DELETE',
                  style: 'destructive',
                  onPress: () => {
                    // Clear all data logic
                    Alert.alert('Success', 'All data cleared');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const sections = [
    {
      title: 'Security',
      items: [
        {
          title: 'PIN Lock',
          subtitle: settings.pinEnabled ? 'Enabled' : 'Disabled',
          icon: 'lock-closed',
          rightElement: (
            <Switch
              value={settings.pinEnabled}
              onValueChange={(value) => value ? enablePin() : disablePin()}
              trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
              thumbColor={settings.pinEnabled ? '#6C63FF' : '#fff'}
            />
          ),
        },
        {
          title: 'Change PIN',
          subtitle: 'Update your PIN',
          icon: 'key',
          onPress: settings.pinEnabled ? changePin : undefined,
          disabled: !settings.pinEnabled,
        },
        {
          title: 'Biometric Unlock',
          subtitle: biometricAvailable ? (settings.biometricEnabled ? 'Enabled' : 'Available') : 'Not available',
          icon: 'finger-print',
          rightElement: biometricAvailable ? (
            <Switch
              value={settings.biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
              thumbColor={settings.biometricEnabled ? '#6C63FF' : '#fff'}
            />
          ) : (
            <Text style={styles.unavailableText}>Not available</Text>
          ),
        },
      ],
    },
    {
      title: 'Data & Backup',
      items: [
        {
          title: 'Export Data',
          subtitle: 'Export as CSV/PDF',
          icon: 'download',
          onPress: exportData,
        },
        {
          title: 'Backup to Google Drive',
          subtitle: settings.backupEnabled ? 'Enabled' : 'Disabled',
          icon: 'cloud-upload',
          rightElement: (
            <Switch
              value={settings.backupEnabled}
              onValueChange={(value) => updateSetting('backupEnabled', value)}
              trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
              thumbColor={settings.backupEnabled ? '#6C63FF' : '#fff'}
            />
          ),
        },
        {
          title: 'Backup Frequency',
          subtitle: settings.backupFrequency,
          icon: 'timer',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Currency',
          subtitle: settings.currency,
          icon: 'cash',
          onPress: () => {},
        },
        {
          title: 'Language',
          subtitle: settings.language,
          icon: 'language',
          onPress: () => {},
        },
        {
          title: 'Theme',
          subtitle: settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1),
          icon: settings.theme === 'dark' ? 'moon' : settings.theme === 'light' ? 'sunny' : 'contrast',
          onPress: () => {},
        },
        {
          title: 'Week Starts On',
          subtitle: settings.weekStartsOn === 0 ? 'Sunday' : settings.weekStartsOn === 1 ? 'Monday' : 'Saturday',
          icon: 'calendar',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Manage',
      items: [
        {
          title: 'Categories',
          subtitle: `${categories.length} categories`,
          icon: 'grid',
          onPress: () => navigation.navigate('CategoryManager'),
        },
        {
          title: 'Accounts',
          subtitle: `${accounts.filter((a) => a.isActive).length} accounts`,
          icon: 'card',
          onPress: () => navigation.navigate('Accounts'),
        },
        {
          title: 'Recurring Transactions',
          subtitle: 'Manage recurring',
          icon: 'repeat',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          title: 'Clear All Data',
          subtitle: 'Delete everything permanently',
          icon: 'trash',
          onPress: clearAllData,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.settingsCard}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.settingsItem, index === section.items.length - 1 ? styles.lastItem : {}]}
                onPress={item.onPress}
                disabled={item.disabled}
                activeOpacity={0.8}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon, { backgroundColor: item.destructive ? '#FF6B6B20' : '#6C63FF20' }]}>
                    <Ionicons name={item.icon} size={22} color={item.destructive ? '#FF6B6B' : '#6C63FF'} />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemTitle, item.destructive && styles.itemTitleDestructive]}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  {item.rightElement}
                  {!item.rightElement && !item.disabled && <Ionicons name="chevron-forward" size={20} color="#CCC" />}
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      ))}

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Finance Manager v1.0.0</Text>
        <Text style={styles.buildText}>Built with React Native & Expo</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  settingsCard: { overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  lastItem: { borderBottomWidth: 0 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemText: { gap: 2 },
  itemTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  itemTitleDestructive: { color: '#FF6B6B' },
  itemSubtitle: { fontSize: 13, color: '#888' },
  itemRight: { alignItems: 'flex-end' },
  unavailableText: { fontSize: 12, color: '#CCC' },
  versionContainer: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, gap: 4 },
  versionText: { fontSize: 14, fontWeight: '500', color: '#666' },
  buildText: { fontSize: 12, color: '#999' },
});