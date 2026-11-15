import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, TRIP_ROLES, TRIP_STATUS, NOTIFICATION_TYPES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/helpers';

type Props = RootStackScreenProps<'TripSettings'>;

export default function TripSettingsScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { currentTrip, trips, members, updateTrip, addTrip } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find(t => t.id === tripId);
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = ['owner', 'admin'].includes(currentUser?.role || '');

  const [tripName, setTripName] = useState(trip?.name || '');
  const [tripDescription, setTripDescription] = useState(trip?.description || '');
  const [tripStatus, setTripStatus] = useState(trip?.status || 'planning');
  const [budget, setBudget] = useState(trip?.budget?.toString() || '');
  const [permissions, setPermissions] = useState({
    membersCanAddExpenses: true,
    membersCanEditItinerary: false,
    membersCanInvitePeople: false,
    membersCanShareLocation: true,
    membersCanUploadPhotos: true,
    membersCanCreatePolls: true,
    membersCanRemoveParticipants: false,
  });

  if (!trip) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Trip not found</Text></View>;
  }

  const handlePermissionChange = (key: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateTrip({
      ...trip,
      name: tripName,
      description: tripDescription,
      status: tripStatus as any,
      budget: budget ? parseFloat(budget) : undefined,
    });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Settings</Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <Card style={styles.formCard} variant="elevated">
          <CardContent>
            <Input
              label="Trip Name"
              value={tripName}
              onChangeText={setTripName}
              placeholder="Enter trip name"
              autoCapitalize="words"
            />
            <Input
              label="Description"
              value={tripDescription}
              onChangeText={setTripDescription}
              placeholder="Add a description"
              multiline
              numberOfLines={3}
            />
            <View style={styles.sectionRow}>
              <Text style={styles.inputLabel}>Status</Text>
              <TouchableOpacity style={styles.statusButton}>
                <Text style={styles.statusButtonText}>{TRIP_STATUS.find(s => s.id === tripStatus)?.label}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Input
              label="Budget (₹)"
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g., 30000"
              keyboardType="numeric"
              leftIcon={<Text style={styles.currencyPrefix}>₹</Text>}
            />
          </CardContent>
        </Card>
      </View>

      {/* Permissions */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Permissions</Text>
          <Card style={styles.permissionsCard} variant="elevated">
            <CardContent>
              <PermissionToggle
                title="Add Expenses"
                description="Allow members to add expenses"
                value={permissions.membersCanAddExpenses}
                onChange={value => handlePermissionChange('membersCanAddExpenses', value)}
              />
              <Divider />
              <PermissionToggle
                title="Edit Itinerary"
                description="Allow members to add/edit stops"
                value={permissions.membersCanEditItinerary}
                onChange={value => handlePermissionChange('membersCanEditItinerary', value)}
              />
              <Divider />
              <PermissionToggle
                title="Invite People"
                description="Allow members to invite others"
                value={permissions.membersCanInvitePeople}
                onChange={value => handlePermissionChange('membersCanInvitePeople', value)}
              />
              <Divider />
              <PermissionToggle
                title="Share Location"
                description="Allow members to share location"
                value={permissions.membersCanShareLocation}
                onChange={value => handlePermissionChange('membersCanShareLocation', value)}
              />
              <Divider />
              <PermissionToggle
                title="Upload Photos"
                description="Allow members to add photos"
                value={permissions.membersCanUploadPhotos}
                onChange={value => handlePermissionChange('membersCanUploadPhotos', value)}
              />
              <Divider />
              <PermissionToggle
                title="Create Polls"
                description="Allow members to create polls"
                value={permissions.membersCanCreatePolls}
                onChange={value => handlePermissionChange('membersCanCreatePolls', value)}
              />
              <Divider />
              <PermissionToggle
                title="Remove Participants"
                description="Allow members to remove others (Admin only)"
                value={permissions.membersCanRemoveParticipants}
                onChange={value => handlePermissionChange('membersCanRemoveParticipants', value)}
              />
            </CardContent>
          </Card>
        </View>
      )}

      {/* Trip Code & QR */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invitation</Text>
        <Card style={styles.inviteCard} variant="elevated">
          <CardContent>
            <View style={styles.inviteItem}>
              <View style={styles.inviteIcon}>
                <Ionicons name="qr-code" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteTitle}>Trip QR Code</Text>
                <Text style={styles.inviteSubtitle}>Scan to join instantly</Text>
              </View>
              <TouchableOpacity onPress={() => {}} style={styles.inviteAction}>
                <Text style={styles.inviteActionText}>View</Text>
              </TouchableOpacity>
            </View>
            <Divider />
            <View style={styles.inviteItem}>
              <View style={styles.inviteIcon}>
                <Ionicons name="key" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteTitle}>Trip Code</Text>
                <Text style={styles.inviteSubtitle}>6-digit code for manual entry</Text>
              </View>
              <TouchableOpacity onPress={() => {}} style={styles.inviteAction}>
                <Text style={styles.inviteActionText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Divider />
            <View style={styles.inviteItem}>
              <View style={styles.inviteIcon}>
                <Ionicons name="link" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.inviteInfo}>
                <Text style={styles.inviteTitle}>Deep Link</Text>
                <Text style={styles.inviteSubtitle}>Share via messaging apps</Text>
              </View>
              <TouchableOpacity onPress={() => {}} style={styles.inviteAction}>
                <Text style={styles.inviteActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.notificationsCard} variant="elevated">
          <CardContent>
            {[
              { key: 'expense_added', label: 'New Expenses', description: 'When someone adds an expense' },
              { key: 'settlement_created', label: 'Settlements', description: 'When a settlement is created' },
              { key: 'budget_alert', label: 'Budget Alerts', description: 'When approaching budget limit' },
              { key: 'member_far', label: 'Member Separation', description: 'When a member falls behind' },
              { key: 'emergency_triggered', label: 'Emergency Alerts', description: 'Critical emergency notifications' },
              { key: 'poll_created', label: 'New Polls', description: 'When a poll is created' },
            ].map(item => (
              <NotificationToggle key={item.key} {...item} />
            ))}
          </CardContent>
        </Card>
      </View>

      {/* Danger Zone */}
      {isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <Card style={styles.dangerCard} variant="outlined">
            <CardContent>
              <DangerAction
                icon="archive"
                title="Archive Trip"
                description="Move trip to archive (read-only)"
                color="#F39C12"
                onPress={() => {}}
              />
              <Divider />
              <DangerAction
                icon="trash"
                title="Delete Trip"
                description="Permanently delete this trip and all data"
                color={COLORS.error}
                onPress={() => {}}
              />
            </CardContent>
          </Card>
        </View>
      )}

      {/* Save Button */}
      {isAdmin && (
        <Button title="Save Changes" onPress={handleSave} fullWidth size="lg" style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }} />
      )}
    </ScrollView>
  );
}

const PermissionToggle = ({ title, description, value, onChange }: any) => (
  <View style={styles.permissionRow}>
    <View style={styles.permissionInfo}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: COLORS.border, true: COLORS.accent }}
      thumbColor={value ? COLORS.accent : COLORS.white}
    />
  </View>
);

const NotificationToggle = ({ key, label, description }: any) => (
  <View style={styles.notificationRow}>
    <View style={styles.notificationInfo}>
      <Text style={styles.notificationTitle}>{label}</Text>
      <Text style={styles.notificationDescription}>{description}</Text>
    </View>
    <Switch
      value={true}
      onValueChange={() => {}}
      trackColor={{ false: COLORS.border, true: COLORS.accent }}
      thumbColor={COLORS.accent}
    />
  </View>
);

const DangerAction = ({ icon, title, description, color, onPress }: any) => (
  <TouchableOpacity style={styles.dangerAction} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.dangerIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={styles.dangerText}>
      <Text style={[styles.dangerTitle, { color }]}>{title}</Text>
      <Text style={styles.dangerDescription}>{description}</Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {},
  currencyPrefix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingRight: SPACING.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  permissionsCard: {},
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  permissionDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inviteCard: {},
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteInfo: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  inviteSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  inviteAction: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
  },
  inviteActionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.white,
  },
  notificationsCard: {},
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  notificationDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dangerCard: {},
  dangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  dangerDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
});