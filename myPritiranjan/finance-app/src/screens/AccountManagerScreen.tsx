import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField, Modal, SelectField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { Account } from '@/types';
import { generateId } from '@/utils/helpers';
import { ACCOUNT_TYPES, CURRENCY_SYMBOL } from '@/constants';

type AccountManagerNavProp = NativeStackNavigationProp<RootStackParamList, 'AccountManager'>;

export const AccountManagerScreen = () => {
  const navigation = useNavigation<AccountManagerNavProp>();
  const route = useRoute<{ params?: { accountId?: string } }>();
  const { accounts, addAccount, updateAccount, deleteAccount, adjustAccountBalance } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const accountId = route.params?.accountId;
  const isSingleAccount = !!accountId;
  const displayAccounts = isSingleAccount ? accounts.filter((a) => a.id === accountId) : accounts.filter((a) => a.isActive);

  const handleSubmit = (values: any) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, values);
    } else {
      addAccount({
        id: generateId('acc_'),
        ...values,
        balance: parseFloat(values.balance) || 0,
        isActive: true,
      });
    }
    setShowAddModal(false);
    setEditingAccount(null);
  };

  const handleDelete = (account: Account) => {
    Alert.alert('Delete Account', `Delete "${account.name}"? This will also delete all associated transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(account.id) },
    ]);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setShowAddModal(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setShowAddModal(true);
  };

  if (isSingleAccount && displayAccounts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {!isSingleAccount && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Accounts</Text>
            <Text style={styles.headerSubtitle}>Manage your financial accounts</Text>
          </View>
          <Button title="Add Account" onPress={openAddModal} variant="primary" fullWidth={false} icon="add" />
        </View>
      )}

      {displayAccounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="card-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptySubtitle}>Add your first account to start tracking</Text>
            <Button title="Add Account" onPress={openAddModal} variant="primary" fullWidth={false} style={styles.emptyButton} />
          </Card>
        </View>
      ) : (
        <View style={styles.accountList}>
          {displayAccounts.map((account) => (
            <TouchableOpacity
              key={account.id}
              style={styles.accountItem}
              onPress={() => !isSingleAccount && openEditModal(account)}
              activeOpacity={0.8}
            >
              <View style={[styles.accountIcon, { backgroundColor: account.color + '20' }]}>
                <Ionicons name={account.icon} size={24} color={account.color} />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>{account.type.replace('_', ' ')}</Text>
              </View>
              <View style={styles.accountBalanceContainer}>
                <Text style={[styles.accountBalance, { color: account.balance >= 0 ? '#2ECC71' : '#E74C3C' }]}>
                  {CURRENCY_SYMBOL}{account.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {!isSingleAccount && (
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={(e) => { e.stopPropagation(); handleDelete(account); }}
                  >
                    <Ionicons name="trash" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isSingleAccount && (
        <Modal
          visible={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingAccount(null); }}
          title={editingAccount ? 'Edit Account' : 'Add Account'}
        >
          <AccountForm
            editingAccount={editingAccount}
            onSubmit={handleSubmit}
            onClose={() => { setShowAddModal(false); setEditingAccount(null); }}
          />
        </Modal>
      )}
    </ScrollView>
  );
};

const AccountForm = ({ editingAccount, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    name: editingAccount?.name || '',
    type: editingAccount?.type || 'bank',
    balance: editingAccount?.balance?.toString() || '',
    color: editingAccount?.color || '#3498DB',
    icon: editingAccount?.icon || 'building-2',
    currency: editingAccount?.currency || 'INR',
  });

  useEffect(() => {
    if (editingAccount) {
      setFormData({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: editingAccount.balance.toString(),
        color: editingAccount.color,
        icon: editingAccount.icon,
        currency: editingAccount.currency,
      });
    }
  }, [editingAccount]);

  return (
    <View style={styles.form}>
      <InputField
        label="Account Name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="e.g., HDFC Savings"
      />
      <SelectField
        label="Account Type"
        value={formData.type}
        options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon, color: t.color }))}
        onChange={(value) => setFormData({ ...formData, type: value })}
        renderOption={(option) => (
          <View style={styles.optionRow}>
            <Ionicons name={option.icon || 'banknote'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
            <Text style={styles.optionText}>{option.label}</Text>
          </View>
        )}
      />
      <InputField
        label="Initial Balance"
        value={formData.balance}
        onChangeText={(text) => setFormData({ ...formData, balance: text.replace(/[^0-9.]/g, '') })}
        placeholder="0.00"
        keyboardType="decimal-pad"
        leftElement={<Text style={styles.currencyPrefix}>{CURRENCY_SYMBOL}</Text>}
      />
      <View style={styles.colorGrid}>
        <Text style={styles.gridLabel}>Color</Text>
        <View style={styles.colorPicker}>
          {ACCOUNT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.colorOption, formData.color === type.color && styles.colorOptionSelected]}
              onPress={() => setFormData({ ...formData, color: type.color, icon: type.icon })}
            >
              <View style={[styles.colorSwatch, { backgroundColor: type.color }]} />
              <Ionicons name={type.icon} size={18} color="#fff" style={styles.colorIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.formActions}>
        <Button title="Cancel" variant="outline" onPress={onClose} fullWidth />
        <Button title={editingAccount ? 'Update' : 'Create'} onPress={() => onSubmit(formData)} fullWidth />
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
  accountList: { gap: 12 },
  accountItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  accountIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  accountInfo: { flex: 1, gap: 2 },
  accountName: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  accountType: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  accountBalanceContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountBalance: { fontSize: 16, fontWeight: '700' },
  deleteIcon: { padding: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 50 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 12, width: '80%' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  emptyButton: { marginTop: 8 },
  form: { gap: 16 },
  currencyPrefix: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginRight: 8 },
  colorGrid: { gap: 8 },
  gridLabel: { fontSize: 13, fontWeight: '500', color: '#666', marginBottom: 8 },
  colorPicker: { flexDirection: 'row', gap: 12 },
  colorOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: 'transparent', backgroundColor: '#F8F9FA' },
  colorOptionSelected: { borderColor: '#1A1A2E', backgroundColor: '#fff' },
  colorSwatch: { width: 24, height: 24, borderRadius: 6 },
  colorIcon: { marginLeft: -20, zIndex: 1 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 24 },
  optionText: { fontSize: 16, color: '#1A1A2E' },
});