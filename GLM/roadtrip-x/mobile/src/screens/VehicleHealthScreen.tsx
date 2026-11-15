import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, VEHICLE_HEALTH_TYPES } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'VehicleHealth'>;

export default function VehicleHealthScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { vehicleId } = route.params;

  const [healthItems, setHealthItems] = useState<Record<string, string>>({});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Health</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Health Checklist</Text>
        <Card style={styles.listCard} variant="elevated">
          <CardContent>
            {VEHICLE_HEALTH_TYPES.map(type => (
              <HealthItem
                key={type.id}
                type={type}
                status={healthItems[type.id] || 'unknown'}
                onChange={status => setHealthItems(prev => ({ ...prev, [type.id]: status }))}
              />
            ))}
          </CardContent>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton icon="checkmark-circle" label="Mark All Good" color="#2ECC71" onPress={() => {
              const allGood: Record<string, string> = {};
              VEHICLE_HEALTH_TYPES.forEach(t => allGood[t.id] = 'good');
              setHealthItems(allGood);
            }} />
            <ActionButton icon="warning" label="Mark All Warning" color="#F39C12" onPress={() => {
              const allWarning: Record<string, string> = {};
              VEHICLE_HEALTH_TYPES.forEach(t => allWarning[t.id] = 'warning');
              setHealthItems(allWarning);
            }} />
            <ActionButton icon="refresh" label="Reset All" color="#9B59B6" onPress={() => setHealthItems({})} />
          </View>
        </View>

        <Button title="Save Health Check" variant="primary" onPress={() => {}} fullWidth style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }} />
      </View>
    </ScrollView>
  );
}

const HealthItem = ({ type, status, onChange }: any) => {
  const statusOptions = [
    { value: 'good', label: 'Good', color: '#2ECC71', icon: 'checkmark-circle' },
    { value: 'warning', label: 'Warning', color: '#F39C12', icon: 'warning' },
    { value: 'critical', label: 'Critical', color: '#E74C3C', icon: 'alert-circle' },
    { value: 'unknown', label: 'Not Checked', color: COLORS.textMuted, icon: 'help-circle' },
  ];

  return (
    <View style={styles.healthItem}>
      <View style={styles.healthItemLeft}>
        <View style={styles.healthIcon}>
          <Text style={styles.healthIconText}>{type.icon}</Text>
        </View>
        <View>
          <Text style={styles.healthLabel}>{type.label}</Text>
          <Text style={styles.healthStatusText}>{statusOptions.find(s => s.value === status)?.label}</Text>
        </View>
      </View>
      <View style={styles.healthItemRight}>
        {statusOptions.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.statusOption, status === opt.value && styles.statusOptionSelected, { borderColor: opt.color }]}
            onPress={() => onChange(opt.value)}
          >
            <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
            <Text style={[styles.statusOptionLabel, status === opt.value && { color: opt.color }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ActionButton = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={[styles.actionButton, { borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.actionLabel, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
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
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  listCard: {},
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  healthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIconText: {
    fontSize: 18,
  },
  healthLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  healthStatusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  healthItemRight: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.full,
  },
  statusOptionSelected: {
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  section: {
    marginTop: SPACING.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
});