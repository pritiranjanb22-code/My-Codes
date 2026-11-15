import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatRelativeTime } from '@/utils/helpers';

type Props = RootStackScreenProps<'Notifications'>;

export default function NotificationsScreen({ navigation }: Props) {
  const { notifications, markNotificationRead, markAllNotificationsRead, getUnreadNotificationsCount } = useAppStore();
  const unreadCount = getUnreadNotificationsCount();

  const groupedNotifications = groupNotificationsByDate(notifications);

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptyText}>You're all caught up!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllNotificationsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={groupedNotifications}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <View style={styles.notificationGroup}>
            <Text style={styles.groupDate}>{item.date}</Text>
            {item.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => {
                  markNotificationRead(notification.id);
                  handleNotificationPress(notification);
                }}
              />
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function groupNotificationsByDate(notifications: any[]) {
  const groups: Record<string, any[]> = {};
  notifications.forEach((n) => {
    const date = new Date(n.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  return Object.entries(groups).map(([date, notifications]) => ({ date, notifications }));
}

function handleNotificationPress(notification: any) {
  console.log('Notification pressed:', notification);
}

const NotificationItem = ({ notification, onPress }: any) => (
  <TouchableOpacity style={[styles.notificationItem, !notification.isRead && styles.notificationUnread]} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.notificationIcon}>
      <Ionicons name={getNotificationIcon(notification.type)} size={20} color={getNotificationColor(notification.type)} />
    </View>
    <View style={styles.notificationContent}>
      <Text style={[styles.notificationTitle, !notification.isRead && styles.notificationTitleBold]}>{notification.title}</Text>
      <Text style={styles.notificationBody}>{notification.body}</Text>
      <Text style={styles.notificationTime}>{formatRelativeTime(notification.createdAt)}</Text>
    </View>
    {!notification.isRead && <View style={styles.unreadDot} />}
  </TouchableOpacity>
);

function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    member_joined: 'person-add',
    member_left: 'person-remove',
    expense_added: 'cash',
    expense_updated: 'cash',
    settlement_created: 'swap',
    payment_received: 'card',
    you_owe: 'alert',
    member_far: 'location',
    fuel_stop_recommended: 'gas-station',
    emergency_triggered: 'alert-circle',
    budget_alert: 'warning',
    poll_created: 'bar-chart',
    trip_started: 'play',
    trip_ended: 'stop',
    destination_reached: 'flag',
    vehicle_updated: 'car',
    location_sharing_started: 'location',
    location_sharing_stopped: 'location-off',
  };
  return icons[type] || 'notifications';
}

function getNotificationColor(type: string): string {
  const colors: Record<string, string> = {
    emergency_triggered: COLORS.error,
    you_owe: COLORS.warning,
    member_far: COLORS.warning,
    budget_alert: COLORS.warning,
    expense_added: '#45B7D1',
    settlement_created: '#2ECC71',
    payment_received: '#2ECC71',
  };
  return colors[type] || COLORS.accent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  notificationGroup: {
    marginBottom: SPACING.lg,
  },
  groupDate: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginLeft: SPACING.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  notificationUnread: {
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.accent}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  notificationTitleBold: {
    fontWeight: FONT_WEIGHTS.bold,
  },
  notificationBody: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 16,
  },
});