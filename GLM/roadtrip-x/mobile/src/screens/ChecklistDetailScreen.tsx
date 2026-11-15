import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'ChecklistDetail'>;

export default function ChecklistDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { checklistId } = route.params;
  const { checklists, addChecklist, updateChecklist } = useAppStore();

  const checklist = checklists.find(c => c.id === checklistId);

  if (!checklist) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Checklist not found</Text></View>;
  }

  const [items, setItems] = useState(checklist.items);
  const [newItem, setNewItem] = useState('');
  const completedCount = items.filter(i => i.isCompleted).length;

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted, completedAt: !item.isCompleted ? new Date().toISOString() : undefined } : item
    ));
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const newItemObj = {
      id: `item-${Date.now()}`,
      checklistId: checklist.id,
      text: newItem,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems(prev => [...prev, newItemObj]);
    setNewItem('');
  };

  const saveChecklist = () => {
    updateChecklist({ ...checklist, items });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{checklist.name}</Text>
        </View>

        <View style={styles.content}>
          {/* Progress */}
          <Card style={styles.progressCard} variant="elevated">
            <CardContent>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>{checklist.name}</Text>
                <Text style={styles.progressCount}>{completedCount}/{items.length}</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%` },
                  ]}
                />
              </View>
            </CardContent>
          </Card>

          {/* Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            <Card style={styles.itemsCard} variant="elevated">
              <CardContent>
                {items.length === 0 ? (
                  <View style={styles.emptyItems}>
                    <Ionicons name="list" size={48} color={COLORS.textMuted} />
                    <Text>No items yet</Text>
                  </View>
                ) : (
                  items.map(item => (
                    <ChecklistItemRow key={item.id} item={item} onToggle={() => toggleItem(item.id)} />
                  ))
                )}
              </CardContent>
            </Card>
          </View>

          {/* Add Item */}
          <View style={styles.addItemSection}>
            <View style={styles.addItemInput}>
              <Input
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Add new item..."
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity onPress={addItem} style={styles.addItemButton}>
                <Ionicons name="add" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <Button title="Save Checklist" onPress={saveChecklist} fullWidth size="lg" style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ChecklistItemRow = ({ item, onToggle }: any) => (
  <TouchableOpacity style={styles.itemRow} onPress={onToggle} activeOpacity={0.8}>
    <View style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]} />
    <Text style={[styles.itemText, item.isCompleted && styles.itemTextCompleted]}>{item.text}</Text>
    {item.completedBy && (
      <Text style={styles.itemCompletedBy}>Done by {item.completedBy}</Text>
    )}
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
  progressCard: {
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  progressTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  progressCount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
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
  itemsCard: {},
  emptyItems: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  itemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  itemCompletedBy: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  addItemSection: {
    marginTop: SPACING.lg,
  },
  addItemInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  addItemButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});