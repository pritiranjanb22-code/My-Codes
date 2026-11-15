import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField, Modal, SelectField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { Budget, Category } from '@/types';
import { generateId } from '@/utils/helpers';
import { BUDGET_PERIODS, CURRENCY_SYMBOL, CHART_COLORS } from '@/constants';
import { getMonthStart, getMonthEnd, getYearStart, getYearEnd, calculateBudgetProgress, getBudgetStatus } from '@/utils/helpers';

type BudgetManagerNavProp = NativeStackNavigationProp<RootStackParamList, 'BudgetManager'>;

export const BudgetManagerScreen = () => {
  const navigation = useNavigation<BudgetManagerNavProp>();
  const route = useRoute<{ params?: { budgetId?: string } }>();
  const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const budgetId = route.params?.budgetId;
  const isSingleBudget = !!budgetId;
  const displayBudgets = isSingleBudget ? budgets.filter((b) => b.id === budgetId) : budgets;

  const now = new Date();
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const budgetData = displayBudgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId && t.date >= budget.startDate && t.date <= budget.endDate)
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = calculateBudgetProgress(spent, budget.amount);
    const status = getBudgetStatus(spent, budget.amount, budget.alertThreshold);
    return { budget, category, spent, progress, status };
  });

  const handleSubmit = (values: any) => {
    const period = values.period || 'monthly';
    const start = period === 'monthly' ? getMonthStart(new Date(values.startDate)) : getYearStart(new Date(values.startDate));
    const end = period === 'monthly' ? getMonthEnd(new Date(values.startDate)) : getYearEnd(new Date(values.startDate));

    if (editingBudget) {
      updateBudget(editingBudget.id, { amount: values.amount, alertThreshold: values.alertThreshold });
    } else {
      addBudget({
        id: generateId('budget_'),
        categoryId: values.categoryId,
        amount: values.amount,
        spent: 0,
        period,
        startDate: start,
        endDate: end,
        alertThreshold: values.alertThreshold || 0.8,
        isActive: true,
      });
    }
    setShowAddModal(false);
    setEditingBudget(null);
  };

  const handleDelete = (budget: Budget) => {
    Alert.alert('Delete Budget', `Delete budget for "${categories.find((c) => c.id === budget.categoryId)?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(budget.id) },
    ]);
  };

  const openAddModal = () => {
    setEditingBudget(null);
    setShowAddModal(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setShowAddModal(true);
  };

  if (isSingleBudget && displayBudgets.length === 0) {
    return <View style={styles.container}><Text style={styles.notFound}>Budget not found</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {!isSingleBudget && (
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Budgets</Text>
            <Text style={styles.headerSubtitle}>Track your spending limits</Text>
          </View>
          <Button title="Add Budget" onPress={openAddModal} variant="primary" fullWidth={false} icon="add" />
        </View>
      )}

      {budgetData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No budgets set</Text>
            <Text style={styles.emptySubtitle}>Create a budget to control your spending</Text>
            {!isSingleBudget && <Button title="Create Budget" onPress={openAddModal} variant="primary" fullWidth={false} style={styles.emptyButton} />}
          </Card>
        </View>
      ) : (
        <View style={styles.budgetList}>
          {budgetData.map(({ budget, category, spent, progress, status }) => (
            <TouchableOpacity
              key={budget.id}
              style={styles.budgetItem}
              onPress={() => !isSingleBudget && openEditModal(budget)}
              activeOpacity={0.8}
            >
              <View style={[styles.budgetIcon, { backgroundColor: category?.color + '20' }]}>
                <Ionicons name={category?.icon || 'help'} size={22} color={category?.color || '#666'} />
              </View>
              <View style={styles.budgetInfo} style={{ flex: 1 }}>
                <Text style={styles.budgetCategoryName}>{category?.name}</Text>
                <View style={styles.budgetMetaRow}>
                  <Text style={[styles.budgetPeriod, { color: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#888' }]}>
                    {status === 'exceeded' ? 'Over budget' : status === 'warning' ? 'Near limit' : 'On track'}
                  </Text>
                  <Text style={styles.budgetPeriod}>{budget.period === 'monthly' ? 'Monthly' : 'Yearly'}</Text>
                </View>
                <View style={styles.miniProgress}>
                  <View
                    style={{
                      ...styles.miniProgressFill,
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#2ECC71',
                    }}
                  />
                </View>
              </View>
              <View style={styles.budgetAmounts}>
                <Text style={[styles.budgetSpent, { color: status === 'exceeded' ? '#E74C3C' : '#1A1A2E' }]}>
                  {CURRENCY_SYMBOL}{spent.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.budgetTotal}>/ {CURRENCY_SYMBOL}{budget.amount.toLocaleString('en-IN')}</Text>
                <Text style={[styles.budgetPercent, { color: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#2ECC71' }]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isSingleBudget && (
        <Modal
          visible={showAddModal}
          onClose={() => { setShowAddModal(false); setEditingBudget(null); }}
          title={editingBudget ? 'Edit Budget' : 'Add Budget'}
        >
          <BudgetForm
            editingBudget={editingBudget}
            categories={expenseCategories}
            onSubmit={handleSubmit}
            onClose={() => { setShowAddModal(false); setEditingBudget(null); }}
          />
        </Modal>
      )}
    </ScrollView>
  );
};

const BudgetForm = ({ editingBudget, categories, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    categoryId: editingBudget?.categoryId || categories[0]?.id || '',
    amount: editingBudget?.amount?.toString() || '',
    period: editingBudget?.period || 'monthly',
    alertThreshold: editingBudget?.alertThreshold || 0.8,
    startDate: editingBudget?.startDate || Date.now(),
  });

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        categoryId: editingBudget.categoryId,
        amount: editingBudget.amount.toString(),
        period: editingBudget.period,
        alertThreshold: editingBudget.alertThreshold,
        startDate: editingBudget.startDate,
      });
    }
  }, [editingBudget]);

  return (
    <View style={styles.form}>
      <SelectField
        label="Category"
        value={formData.categoryId}
        options={categories.map((c: Category) => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))}
        onChange={(value) => setFormData({ ...formData, categoryId: value })}
        renderOption={(option) => (
          <View style={styles.optionRow}>
            <Ionicons name={option.icon || 'help'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
            <Text style={styles.optionText}>{option.label}</Text>
          </View>
        )}
      />
      <InputField
        label="Budget Amount"
        value={formData.amount}
        onChangeText={(text) => setFormData({ ...formData, amount: text.replace(/[^0-9.]/g, '') })}
        placeholder="0.00"
        keyboardType="decimal-pad"
        leftElement={<Text style={styles.currencyPrefix}>{CURRENCY_SYMBOL}</Text>}
      />
      <SelectField
        label="Period"
        value={formData.period}
        options={BUDGET_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        onChange={(value) => setFormData({ ...formData, period: value })}
      />
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Alert me at {Math.round(formData.alertThreshold * 100)}% of budget</Text>
        <View style={styles.slider}>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${formData.alertThreshold * 100}%` }]} />
            <View style={[styles.sliderThumb, { left: `${formData.alertThreshold * 100}%` }]} />
          </View>
        </View>
      </View>
      <View style={styles.formActions}>
        <Button title="Cancel" variant="outline" onPress={onClose} fullWidth />
        <Button title={editingBudget ? 'Update' : 'Create'} onPress={() => onSubmit(formData)} fullWidth />
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
  budgetList: { gap: 12 },
  budgetItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  budgetIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetInfo: { flex: 1, gap: 6 },
  budgetCategoryName: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  budgetMetaRow: { flexDirection: 'row', gap: 12 },
  budgetPeriod: { fontSize: 12, color: '#888' },
  miniProgress: { height: 4, borderRadius: 2, backgroundColor: '#F0F0F0' },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  budgetAmounts: { alignItems: 'flex-end', gap: 2 },
  budgetSpent: { fontSize: 16, fontWeight: '700' },
  budgetTotal: { fontSize: 13, color: '#888' },
  budgetPercent: { fontSize: 13, fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 50 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 12, width: '80%' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  emptyButton: { marginTop: 8 },
  form: { gap: 16 },
  currencyPrefix: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginRight: 8 },
  sliderContainer: { marginTop: 8 },
  sliderLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  slider: { height: 40 },
  sliderTrack: { height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', position: 'relative' },
  sliderFill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 2, backgroundColor: '#6C63FF' },
  sliderThumb: { position: 'absolute', top: -10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#6C63FF', marginLeft: -12 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 24 },
  optionText: { fontSize: 16, color: '#1A1A2E' },
});