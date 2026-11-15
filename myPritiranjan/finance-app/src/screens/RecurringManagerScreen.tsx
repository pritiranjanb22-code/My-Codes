import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField, Modal, SelectField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { RecurringTransaction, Category, Account } from '@/types';
import { generateId } from '@/utils/helpers';
import { RECURRING_FREQUENCIES, PAYMENT_MODES, CURRENCY_SYMBOL } from '@/constants';
import { formatDate } from '@/utils/helpers';

type RecurringManagerNavProp = NativeStackNavigationProp<RootStackParamList, 'RecurringManager'>;

export const RecurringManagerScreen = () => {
  const navigation = useNavigation<RecurringManagerNavProp>();
  const route = useRoute<{ params?: { recurringId?: string } }>();
  const { recurringTransactions, categories, accounts, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [filterActive, setFilterActive] = useState(true);

  const recurringId = route.params?.recurringId;
  const isSingleRecurring = !!recurringId;
  const displayRecurring = isSingleRecurring
    ? recurringTransactions.filter((r) => r.id === recurringId)
    : recurringTransactions.filter((r) => filterActive ? r.isActive : true);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const allCategories = [...incomeCategories, ...expenseCategories];

  const handleSubmit = (values: any) => {
    const nextDueDate = calculateNextDueDate(values.startDate, values.frequency);
    
    if (editingRecurring) {
      updateRecurringTransaction(editingRecurring.id, { ...values, nextDueDate });
    } else {
      addRecurringTransaction({
        id: generateId('rec_'),
        ...values,
        nextDueDate,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    setShowAddModal(false);
    setEditingRecurring(null);
  };

  const calculateNextDueDate = (startDate: number, frequency: string): number => {
    const date = new Date(startDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date.getTime();
  };

  const handleDelete = (recurring: RecurringTransaction) => {
    Alert.alert('Delete Recurring Transaction', `Delete "${categories.find((c) => c.id === recurring.categoryId)?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecurringTransaction(recurring.id) },
    ]);
  };

  const toggleActive = (recurring: RecurringTransaction) => {
    updateRecurringTransaction(recurring.id, { isActive: !recurring.isActive });
  };

  const openAddModal = () => {
    setEditingRecurring(null);
    setShowAddModal(true);
  };

  const openEditModal = (recurring: RecurringTransaction) => {
    setEditingRecurring(recurring);
    setShowAddModal(true);
  };

  if (isSingleRecurring && displayRecurring.length === 0) {
    return <View style={styles.container}><Text style={styles.notFound}>Recurring transaction not found</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {!isSingleRecurring && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Recurring Transactions</Text>
            <Text style={styles.headerSubtitle}>Automate your regular transactions</Text>
          </View>
          <Button title="Add Recurring" onPress={openAddModal} variant="primary" fullWidth={false} icon="add" />
        </View>
      )}

      {!isSingleRecurring && (
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, filterActive && styles.filterChipActive]} onPress={() => setFilterActive(true)}>
            <Text style={[styles.filterChipText, filterActive && styles.filterChipTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, !filterActive && styles.filterChipActive]} onPress={() => setFilterActive(false)}>
            <Text style={[styles.filterChipText, !filterActive && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
        </View>
      )}

      {displayRecurring.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="repeat-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No recurring transactions</Text>
            <Text style={styles.emptySubtitle}>
              {filterActive ? 'No active recurring transactions' : 'No recurring transactions created'}
            </Text>
            {!isSingleRecurring && <Button title="Add Recurring" onPress={openAddModal} variant="primary" fullWidth={false} style={styles.emptyButton} />}
          </Card>
        </View>
      ) : (
        <View style={styles.recurringList}>
          {displayRecurring.map((recurring) => {
            const category = allCategories.find((c) => c.id === recurring.categoryId);
            const account = accounts.find((a) => a.id === recurring.accountId);
            const isIncome = recurring.type === 'income';
            const isDue = recurring.nextDueDate <= Date.now();
            
            return (
              <TouchableOpacity
                key={recurring.id}
                style={styles.recurringItem}
                onPress={() => !isSingleRecurring && openEditModal(recurring)}
                activeOpacity={0.8}
              >
                <View style={[styles.recurringIcon, { backgroundColor: category?.color + '20' }]}>
                  <Ionicons name={category?.icon || 'help'} size={22} color={category?.color || '#666'} />
                </View>
                <View style={styles.recurringInfo} style={{ flex: 1 }}>
                  <View style={styles.recurringNameRow}>
                    <Text style={styles.recurringCategoryName}>{category?.name}</Text>
                    {isDue && <Text style={styles.dueBadge}>Due Now</Text>}
                  </View>
                  <Text style={styles.recurringMeta}>
                    {account?.name} • {recurring.paymentMode} • {RECURRING_FREQUENCIES.find((f) => f.value === recurring.frequency)?.label}
                  </Text>
                  <Text style={styles.recurringNextDue}>
                    Next: {formatDate(recurring.nextDueDate, 'dd MMM yyyy')}
                  </Text>
                </View>
                <View style={styles.recurringRight}>
                  <Text style={[styles.recurringAmount, { color: isIncome ? '#2ECC71' : '#E74C3C' }]}>
                    {isIncome ? '+' : '-'}{CURRENCY_SYMBOL}{recurring.amount.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.toggleButton, recurring.isActive && styles.toggleButtonActive]}
                    onPress={(e) => { e.stopPropagation(); toggleActive(recurring); }}
                  >
                    <View style={[styles.toggleThumb, recurring.isActive && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!isSingleRecurring && (
        <Modal
          visible={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingRecurring(null); }}
          title={editingRecurring ? 'Edit Recurring' : 'Add Recurring Transaction'}
        >
          <RecurringForm
            editingRecurring={editingRecurring}
            categories={allCategories}
            accounts={accounts.filter((a) => a.isActive)}
            onSubmit={handleSubmit}
            onClose={() => { setShowAddModal(false); setEditingRecurring(null); }}
          />
        </Modal>
      )}
    </ScrollView>
  );
};

const RecurringForm = ({ editingRecurring, categories, accounts, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    type: editingRecurring?.type || 'expense',
    accountId: editingRecurring?.accountId || accounts[0]?.id || '',
    categoryId: editingRecurring?.categoryId || categories[0]?.id || '',
    amount: editingRecurring?.amount?.toString() || '',
    note: editingRecurring?.note || '',
    paymentMode: editingRecurring?.paymentMode || 'upi',
    frequency: editingRecurring?.frequency || 'monthly',
    startDate: editingRecurring?.startDate || Date.now(),
    endDate: editingRecurring?.endDate || 0,
    reminderDaysBefore: editingRecurring?.reminderDaysBefore || 1,
    transferToAccountId: editingRecurring?.transferToAccountId || '',
    tags: editingRecurring?.tags || [],
  });

  useEffect(() => {
    if (editingRecurring) {
      const currentCategories = formData.type === 'income' 
        ? categories.filter((c: Category) => c.type === 'income')
        : categories.filter((c: Category) => c.type === 'expense');
      
      setFormData({
        type: editingRecurring.type,
        accountId: editingRecurring.accountId,
        categoryId: currentCategories.find((c) => c.id === editingRecurring.categoryId)?.id || currentCategories[0]?.id || '',
        amount: editingRecurring.amount.toString(),
        note: editingRecurring.note,
        paymentMode: editingRecurring.paymentMode,
        frequency: editingRecurring.frequency,
        startDate: editingRecurring.startDate,
        endDate: editingRecurring.endDate || 0,
        reminderDaysBefore: editingRecurring.reminderDaysBefore,
        transferToAccountId: editingRecurring.transferToAccountId || '',
        tags: editingRecurring.tags,
      });
    }
  }, [editingRecurring]);

  const currentCategories = formData.type === 'income'
    ? categories.filter((c: Category) => c.type === 'income')
    : categories.filter((c: Category) => c.type === 'expense');

  return (
    <View style={styles.form}>
      <SelectField
        label="Type"
        value={formData.type}
        options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }, { value: 'transfer', label: 'Transfer' }]}
        onChange={(value) => setFormData({ ...formData, type: value, categoryId: '' })}
      />
      <SelectField
        label="Account"
        value={formData.accountId}
        options={accounts.map((a: Account) => ({ value: a.id, label: a.name, icon: a.icon, color: a.color }))}
        onChange={(value) => setFormData({ ...formData, accountId: value })}
        renderOption={(option) => (
          <View style={styles.optionRow}>
            <Ionicons name={option.icon || 'banknote'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
            <Text style={styles.optionText}>{option.label}</Text>
          </View>
        )}
      />
      <SelectField
        label="Category"
        value={formData.categoryId}
        options={currentCategories.map((c: Category) => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))}
        onChange={(value) => setFormData({ ...formData, categoryId: value })}
        renderOption={(option) => (
          <View style={styles.optionRow}>
            <Ionicons name={option.icon || 'help'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
            <Text style={styles.optionText}>{option.label}</Text>
          </View>
        )}
      />
      <InputField
        label="Amount"
        value={formData.amount}
        onChangeText={(text) => setFormData({ ...formData, amount: text.replace(/[^0-9.]/g, '') })}
        placeholder="0.00"
        keyboardType="decimal-pad"
        leftElement={<Text style={styles.currencyPrefix}>{CURRENCY_SYMBOL}</Text>}
      />
      <InputField
        label="Note (optional)"
        value={formData.note}
        onChangeText={(text) => setFormData({ ...formData, note: text })}
        placeholder="Description"
      />
      <SelectField
        label="Payment Mode"
        value={formData.paymentMode}
        options={PAYMENT_MODES.map((p) => ({ value: p.value, label: p.label, icon: p.icon }))}
        onChange={(value) => setFormData({ ...formData, paymentMode: value })}
      />
      <SelectField
        label="Frequency"
        value={formData.frequency}
        options={RECURRING_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
        onChange={(value) => setFormData({ ...formData, frequency: value })}
      />
      <InputField
        label="Start Date"
        value={formatDate(formData.startDate, 'dd MMM yyyy')}
        onChangeText={() => {}}
        disabled
      />
      <View style={styles.reminderRow}>
        <Text style={styles.reminderLabel}>Remind me</Text>
        <View style={styles.reminderInput}>
          <InputField
            label=""
            value={String(formData.reminderDaysBefore)}
            onChangeText={(text) => setFormData({ ...formData, reminderDaysBefore: parseInt(text) || 1 })}
            keyboardType="numeric"
            style={styles.reminderNumberInput}
          />
          <Text style={styles.reminderDaysText}>day(s) before</Text>
        </View>
      </View>
      {formData.type === 'transfer' && (
        <SelectField
          label="Transfer To"
          value={formData.transferToAccountId}
          options={accounts.filter((a: Account) => a.id !== formData.accountId).map((a: Account) => ({ value: a.id, label: a.name, icon: a.icon, color: a.color }))}
          onChange={(value) => setFormData({ ...formData, transferToAccountId: value })}
          renderOption={(option) => (
            <View style={styles.optionRow}>
              <Ionicons name={option.icon || 'banknote'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
              <Text style={styles.optionText}>{option.label}</Text>
            </View>
          )}
        />
      )}
      <View style={styles.formActions}>
        <Button title="Cancel" variant="outline" onPress={onClose} fullWidth />
        <Button title={editingRecurring ? 'Update' : 'Create'} onPress={() => onSubmit(formData)} fullWidth />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 18, color: '#888' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  filterChipActive: { backgroundColor: '#6C63FF' },
  filterChipText: { fontSize: 14, fontWeight: '500', color: '#666' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  recurringList: { gap: 12 },
  recurringItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  recurringIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recurringInfo: { flex: 1, gap: 4 },
  recurringNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recurringCategoryName: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  dueBadge: { fontSize: 10, fontWeight: '600', color: '#fff', backgroundColor: '#E74C3C', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  recurringMeta: { fontSize: 13, color: '#888' },
  recurringNextDue: { fontSize: 12, color: '#666' },
  recurringRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recurringAmount: { fontSize: 16, fontWeight: '700' },
  toggleButton: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0', padding: 2 },
  toggleButtonActive: { backgroundColor: '#6C63FF' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbActive: { marginLeft: 20 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 50 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 12, width: '80%' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  emptyButton: { marginTop: 8 },
  form: { gap: 16 },
  currencyPrefix: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginRight: 8 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  reminderInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderNumberInput: { width: 60 },
  reminderDaysText: { fontSize: 14, color: '#666' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 24 },
  optionText: { fontSize: 16, color: '#1A1A2E' },
});