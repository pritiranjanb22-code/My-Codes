import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';

type Props = RootStackScreenProps<'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, setUser, logout } = useAppStore();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileCover} />
          <View style={styles.profileInfo}>
            <Avatar
              name={user?.name || 'User'}
              size="xl"
              source={user?.avatar}
              style={styles.profileAvatar}
            />
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>12</Text>
                <Text style={styles.profileStatLabel}>Trips</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>48</Text>
                <Text style={styles.profileStatLabel}>Expenses</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>3.2K</Text>
                <Text style={styles.profileStatLabel}>Km Traveled</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <Card style={styles.settingsCard} variant="elevated">
            <CardContent>
              <SettingsRow
                icon="person"
                title="Edit Profile"
                subtitle="Update name, photo, phone"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="lock-closed"
                title="Change Password"
                subtitle="Update your password"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="shield"
                title="Two-Factor Auth"
                subtitle="Add extra security"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="key"
                title="Sessions"
                subtitle="Manage active sessions"
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Preferences</Text>
          <Card style={styles.settingsCard} variant="elevated">
            <CardContent>
              <SettingsRow
                icon="notifications"
                title="Trip Notifications"
                subtitle="Get notified about trip updates"
                onPress={() => navigation.navigate('Settings')}
              />
              <Divider />
              <SettingsRow
                icon="location"
                title="Location Sharing"
                subtitle="Default sharing preferences"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="cash"
                title="Default Currency"
                subtitle="INR (₹)"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="car"
                title="Default Vehicle"
                subtitle="Set your preferred vehicle"
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <Card style={styles.settingsCard} variant="elevated">
            <CardContent>
              <SettingsRow
                icon="download"
                title="Export My Data"
                subtitle="Download all your trip data"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="cloud-download"
                title="Offline Data"
                subtitle="Manage cached data"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="trash"
                title="Clear Cache"
                subtitle="Free up storage space"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="alert-circle"
                title="Delete Account"
                subtitle="Permanently delete your account"
                onPress={() => {}}
                variant="danger"
              />
            </CardContent>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={styles.settingsCard} variant="elevated">
            <CardContent>
              <SettingsRow
                icon="information-circle"
                title="App Version"
                subtitle="1.0.0"
              />
              <Divider />
              <SettingsRow
                icon="document"
                title="Terms of Service"
                subtitle="Read our terms"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="shield"
                title="Privacy Policy"
                subtitle="Read our policy"
                onPress={() => {}}
              />
              <Divider />
              <SettingsRow
                icon="logo-github"
                title="Open Source"
                subtitle="View on GitHub"
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>

        <Button
          title="Sign Out"
          variant="danger"
          onPress={() => logout()}
          style={{ marginHorizontal: SPACING.md, marginBottom: SPACING.xxl }}
        />
      </ScrollView>
    </View>
  );
}

const SettingsRow = ({ icon, title, subtitle, onPress, variant = 'default' }: any) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.settingsRowIcon, { backgroundColor: `${variant === 'danger' ? COLORS.error : COLORS.accent}20` }]}>
      <Ionicons name={icon} size={20} color={variant === 'danger' ? COLORS.error : COLORS.accent} />
    </View>
    <View style={styles.settingsRowText}>
      <Text style={[styles.settingsRowTitle, variant === 'danger' && styles.settingsRowTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.settingsRowSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  profileHeader: {
    position: 'relative',
    marginHorizontal: -SPACING.md,
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileCover: {
    height: 120,
    backgroundColor: COLORS.surfaceLight,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  profileAvatar: {
    marginTop: -50,
    marginBottom: SPACING.md,
    borderWidth: 4,
    borderColor: COLORS.background,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.small,
  },
  profileStat: {
    alignItems: 'center',
    flex: 1,
  },
  profileStatValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  profileStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
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
  settingsCard: {},
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  settingsRowIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowText: {
    flex: 1,
  },
  settingsRowTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingsRowTitleDanger: {
    color: COLORS.error,
  },
  settingsRowSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});