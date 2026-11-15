import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatDate, getMonthStart, getMonthEnd, groupTransactionsByDate } from '@/utils/helpers';
import { CURRENCY_SYMBOL } from '@/constants';

type TransactionsNavProp = NativeStackNavigationProp<RootStackParamList, 'Transactions'>;

export const TransactionsScreen = () => {
  const navigation = useNavigation<TransactionsNavProp>();
  const { transactions, categories, accounts, deleteTransaction, loadTransactions } = useFinanceStore();
  const [groupedTransactions, setGroupedTransactions] = useState<Record<string, any[]>>({});
  const [selectedFilters, setSelectedFilters] = useState<{ type?: string; accountId?: string; categoryId?: string }>({});

  useEffect(() => {
    const grouped = groupTransactionsByDate(transactions);
    setGroupedTransactions(grouped);
  }, [transactions]);

  const filteredTransactions = transactions.filter((txn) => {
    if (selectedFilters.type && txn.type !== selectedFilters.type) return false;
    if (selectedFilters.accountId && txn.accountId !== selectedFilters.accountId) return false;
    if (selectedFilters.categoryId && txn.categoryId !== selectedFilters.categoryId) return false;
    return true;
  });

  const renderSectionHeader = ({ section }: any) => (
    <Text style={styles.sectionHeader}>{formatDate(section[0].date, 'dd MMMM yyyy')}</Text>
  );

  const renderItem = ({ item }: any) => {
    const category = categories.find((c) => c.id === item.categoryId);
    const account = accounts.find((a) => a.id === item.accountId);
    const isIncome = item.type === 'income';

    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('AddTransaction', { transactionId: item.id })}
        onLongPress={() => {
          Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteTransaction(item.id),
              },
            ]
          );
        }}
      >
        <View style={[styles.transactionIcon, { backgroundColor: category?.color + '20' }]}>
          <Ionicons name={category?.icon || 'help'} size={20} color={category?.color || '#666'} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{category?.name || 'Unknown'}</Text>
          <Text style={styles.transactionMeta}>
            {account?.name} • {item.paymentMode} • {formatDate(item.date, 'HH:mm')}
          </Text>
          {item.note && <Text style={styles.transactionNote}>{item.note}</Text>}
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? '#2ECC71' : '#E74C3C' }]}>
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const sections = Object.entries(groupedTransactions).map(([date, txns]) => ({
    title: date,
    data: txns.filter((txn) => {
      if (selectedFilters.type && txn.type !== selectedFilters.type) return false;
      if (selectedFilters.accountId && txn.accountId !== selectedFilters.accountId) return false;
      if (selectedFilters.categoryId && txn.categoryId !== selectedFilters.categoryId) return false;
      return true;
    }),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterChip} onPress={() => navigation.navigate('AddTransaction')}>
          <Ionicons name="add" size={20} color="#6C63FF" />
          <Text style={styles.filterChipText}>Add</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip} onPress={() => {}}>
          <Ionicons name="funnel" size={20} color="#666" />
          <Text style={styles.filterChipText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip} onPress={() => {}}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.filterChipText}>This Month</Text>
        </TouchableOpacity>
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>
              {transactions.length === 0
                ? "Tap 'Add' to create your first transaction"
                : 'Try adjusting your filters'}
            </Text>
          </Card>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item, index }) => (
            <Card key={item.title} style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>{formatDate(item.data[0].date, 'dd MMMM yyyy')}</Text>
              {item.data.map((txn: any) => (
                <TouchableOpacity
                  key={txn.id}
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('AddTransaction', { transactionId: txn.id })}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: categories.find((c) => c.id === txn.categoryId)?.color + '20' }]}>
                    <Ionicons name={categories.find((c) => c.id === txn.categoryId)?.icon || 'help'} size={20} color={categories.find((c) => c.id === txn.categoryId)?.color || '#666'} />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{categories.find((c) => c.id === txn.categoryId)?.name || 'Unknown'}</Text>
                    <Text style={styles.transactionMeta}>
                      {accounts.find((a) => a.id === txn.accountId)?.name} • {txn.paymentMode} • {formatDate(txn.date, 'HH:mm')}
                    </Text>
                    {txn.note && <Text style={styles.transactionNote}>{txn.note}</Text>}
                  </View>
                  <Text style={[styles.transactionAmount, { color: txn.type === 'income' ? '#2ECC71' : '#E74C3C' }]}>
                    {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Card style={styles.emptyCard}>
                <Ionicons name="funnel-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>No transactions match</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
              </Card>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#333' },
  listContent: { padding: 16, paddingBottom: 100 },
  sectionCard: { marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 8, paddingHorizontal: 4 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  transactionIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1, gap: 2 },
  transactionTitle: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  transactionMeta: { fontSize: 12, color: '#888' },
  transactionNote: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  transactionAmount: { fontSize: 15, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 12, width: '80%' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
});