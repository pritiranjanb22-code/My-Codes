import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem icon="person" title="Profile" subtitle="Edit your profile" onPress={() => navigation.navigate('Profile')} />
          <SettingsItem icon="lock-closed" title="Security" subtitle="Password, 2FA, sessions" onPress={() => {}} />
          <SettingsItem icon="notifications" title="Notifications" subtitle="Manage notification preferences" onPress={() => navigation.navigate('Notifications')} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <SettingsItem icon="moon" title="Appearance" subtitle="Light, Dark, System" onPress={() => {}} />
          <SettingsItem icon="language" title="Language" subtitle="English (US)" onPress={() => {}} />
          <SettingsItem icon="cash" title="Currency" subtitle="INR (₹)" onPress={() => {}} />
          <SettingsItem icon="map" title="Maps" subtitle="Google Maps" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <SettingsItem icon="location" title="Location Sharing" subtitle="Manage location permissions" onPress={() => {}} />
          <SettingsItem icon="cloud-download" title="Offline Mode" subtitle="Manage offline data" onPress={() => {}} />
          <SettingsItem icon="trash" title="Clear Cache" subtitle="Free up storage space" onPress={() => {}} />
          <SettingsItem icon="document" title="Export Data" subtitle="Download your data" onPress={() => {}} />
          <SettingsItem icon="alert-circle" title="Delete Account" subtitle="Permanently delete your account" onPress={() => {}} variant="danger" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem icon="help-circle" title="Help Center" subtitle="FAQs and guides" onPress={() => {}} />
          <SettingsItem icon="chatbubbles" title="Contact Support" subtitle="Get in touch with us" onPress={() => {}} />
          <SettingsItem icon="bug" title="Report a Bug" subtitle="Help us improve" onPress={() => {}} />
          <SettingsItem icon="heart" title="Rate App" subtitle="Share your feedback" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingsItem icon="information-circle" title="Version" subtitle="1.0.0" />
          <SettingsItem icon="document" title="Terms of Service" subtitle="Read our terms" onPress={() => {}} />
          <SettingsItem icon="shield" title="Privacy Policy" subtitle="Read our policy" onPress={() => {}} />
          <SettingsItem icon="logo-github" title="Open Source" subtitle="View on GitHub" onPress={() => {}} />
        </View>

        <Button title="Sign Out" variant="danger" onPress={() => {}} style={{ marginTop: SPACING.xl, marginBottom: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const SettingsItem = ({ icon, title, subtitle, onPress, variant = 'default' }: any) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.settingsIcon, { backgroundColor: `${variant === 'danger' ? COLORS.error : COLORS.accent}20` }]}>
      <Ionicons name={icon} size={22} color={variant === 'danger' ? COLORS.error : COLORS.accent} />
    </View>
    <View style={styles.settingsText}>
      <Text style={[styles.settingsTitle, variant === 'danger' && styles.settingsTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingsTitleDanger: {
    color: COLORS.error,
  },
  settingsSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});