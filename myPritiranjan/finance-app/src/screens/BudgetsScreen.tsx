import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button, InputField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatDate, getMonthStart, getMonthEnd, calculateBudgetProgress, getBudgetStatus } from '@/utils/helpers';
import { CURRENCY_SYMBOL, CHART_COLORS, BUDGET_PERIODS } from '@/constants';
import { VictoryPie, VictoryChart, VictoryTheme, VictoryBar, VictoryAxis, VictoryLine, VictoryLabel, VictoryScatter } from 'victory-native';

type BudgetsNavProp = NativeStackNavigationProp<RootStackParamList, 'Budgets'>;

export const BudgetsScreen = () => {
  const navigation = useNavigation<BudgetsNavProp>();
  const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget, loadBudgets } = useFinanceStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  const now = new Date();
  const monthStart = getMonthStart(now);
  const monthEnd = getMonthEnd(now);

  const activeBudgets = budgets.filter((b) => b.isActive && b.startDate <= now.getTime() && b.endDate >= now.getTime());

  const budgetData = activeBudgets.map((budget) => {
    const category = categories.find((c) => c.id === budget.categoryId);
    const spent = transactions
      .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId && t.date >= budget.startDate && t.date <= budget.endDate)
      .reduce((sum, t) => sum + t.amount, 0);
    const progress = calculateBudgetProgress(spent, budget.amount);
    const status = getBudgetStatus(spent, budget.amount, budget.alertThreshold);
    return { budget, category, spent, progress, status };
  });

  const totalBudgeted = budgetData.reduce((sum, b) => sum + b.budget.amount, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowAddModal(true);
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setShowAddModal(true);
  };

  const handleSubmitBudget = (values: any) => {
    const category = categories.find((c) => c.id === values.categoryId);
    const period = values.period || 'monthly';
    const start = period === 'monthly' ? getMonthStart(new Date(values.startDate)) : getYearStart(new Date(values.startDate));
    const end = period === 'monthly' ? getMonthEnd(new Date(values.startDate)) : getYearEnd(new Date(values.startDate));

    if (editingBudget) {
      updateBudget(editingBudget.budget.id, { amount: values.amount, alertThreshold: values.alertThreshold });
    } else {
      addBudget({
        id: `budget_${Date.now()}`,
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
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
        <Button title="Add Budget" onPress={handleAddBudget} variant="primary" fullWidth={false} icon="add" style={styles.addButton} />
      </View>

      <Card style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>This Month Overview</Text>
        </View>
        <View style={styles.overviewProgress}>
          <View style={styles.circularProgress}>
            <View style={[styles.progressRing, { borderColor: overallProgress >= 100 ? '#E74C3C' : overallProgress >= 80 ? '#F39C12' : '#2ECC71' }]}>
              <Text style={styles.progressText}>{overallProgress.toFixed(0)}%</Text>
            </View>
          </View>
          <View style={styles.overviewStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Budgeted</Text>
              <Text style={styles.statValue}>{formatCurrency(totalBudgeted)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Spent</Text>
              <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={[styles.statValue, { color: totalSpent > totalBudgeted ? '#E74C3C' : '#2ECC71' }]}>
                {formatCurrency(Math.max(0, totalBudgeted - totalSpent))}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {budgetData.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="pie-chart-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No budgets set</Text>
          <Text style={styles.emptySubtitle}>Create a budget to track your spending</Text>
          <Button title="Create Budget" onPress={handleAddBudget} variant="primary" fullWidth={false} style={styles.emptyButton} />
        </Card>
      ) : (
        <View style={styles.budgetList}>
          {budgetData.map(({ budget, category, spent, progress, status }) => (
            <Card key={budget.id} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetCategory}>
                  <View style={[styles.categoryIcon, { backgroundColor: category?.color + '20' }]}>
                    <Ionicons name={category?.icon || 'help'} size={20} color={category?.color || '#666'} />
                  </View>
                  <View>
                    <Text style={styles.budgetCategoryName}>{category?.name}</Text>
                    <Text style={styles.budgetPeriod}>{budget.period === 'monthly' ? 'Monthly' : 'Yearly'} budget</Text>
                  </View>
                </View>
                <View style={styles.budgetAmounts}>
                  <Text style={[styles.budgetSpent, { color: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#666' }]}>
                    {formatCurrency(spent)}
                  </Text>
                  <Text style={styles.budgetTotal}>/ {formatCurrency(budget.amount)}</Text>
                </View>
              </View>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={{
                      ...styles.progressFill,
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#2ECC71',
                    }}
                  />
                </View>
                <Text style={[styles.progressPercent, { color: status === 'exceeded' ? '#E74C3C' : status === 'warning' ? '#F39C12' : '#2ECC71' }]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.budgetActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleEditBudget({ budget, category })}>
                  <Ionicons name="create" size={18} color="#666" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.actionButtonDanger]} onPress={() => {
                  Alert.alert('Delete Budget', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(budget.id) },
                  ]);
                }}>
                  <Ionicons name="trash" size={18} color="#FF6B6B" />
                  <Text style={styles.actionTextDanger}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      )}

      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingBudget ? 'Edit Budget' : 'Add Budget'}
      >
        <BudgetForm
          editingBudget={editingBudget}
          categories={categories.filter((c) => c.type === 'expense')}
          onSubmit={handleSubmitBudget}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </ScrollView>
  );
};

const BudgetForm = ({ editingBudget, categories, onSubmit, onClose }: any) => {
  const [formData, setFormData] = useState({
    categoryId: editingBudget?.category?.id || categories[0]?.id || '',
    amount: editingBudget?.budget.amount || '',
    period: editingBudget?.budget.period || 'monthly',
    alertThreshold: editingBudget?.budget.alertThreshold || 0.8,
    startDate: editingBudget?.budget.startDate || Date.now(),
  });

  return (
    <View style={styles.form}>
      <SelectField
        label="Category"
        value={formData.categoryId}
        options={categories.map((c: any) => ({ value: c.id, label: c.name, icon: c.icon, color: c.color }))}
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
      <SelectField
        label="Period"
        value={formData.period}
        options={BUDGET_PERIODS.map((p) => ({ value: p.value, label: p.label }))}
        onChange={(value) => setFormData({ ...formData, period: value })}
      />
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Alert at {Math.round(formData.alertThreshold * 100)}%</Text>
        <View style={styles.slider}>
          <View style={[styles.sliderTrack, { width: '100%' }]}>
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
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  addButton: { paddingHorizontal: 16 },
  overviewCard: { marginBottom: 24 },
  overviewHeader: { marginBottom: 16 },
  overviewTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E' },
  overviewProgress: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  circularProgress: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  progressRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  progressText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  overviewStats: { flex: 1, flexDirection: 'row', gap: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#888' },
  statValue: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginTop: 2 },
  emptyCard: { alignItems: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  emptyButton: { marginTop: 8 },
  budgetList: { gap: 12 },
  budgetCard: { padding: 16 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  budgetCategory: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  budgetCategoryName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  budgetPeriod: { fontSize: 12, color: '#888' },
  budgetAmounts: { alignItems: 'flex-end' },
  budgetSpent: { fontSize: 18, fontWeight: '700' },
  budgetTotal: { fontSize: 14, color: '#888' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPercent: { fontSize: 13, fontWeight: '600', width: 40 },
  budgetActions: { flexDirection: 'row', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButtonDanger: { opacity: 0.8 },
  actionText: { fontSize: 13, color: '#666', fontWeight: '500' },
  actionTextDanger: { color: '#FF6B6B' },
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

import { SelectField } from '@/components/common/InputField';
import { getYearStart, getYearEnd } from '@/utils/helpers';
import { useState } from 'react';