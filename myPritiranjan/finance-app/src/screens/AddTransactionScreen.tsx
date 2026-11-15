import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, ToastAndroid } from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';

import { InputField, Button, Card, Modal, SelectField } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { Account, Category, TransactionType, PaymentMode } from '@/types';
import { formatDate, generateId, getCategorySuggestions, parseCurrencyInput, CURRENCY_SYMBOL } from '@/utils/helpers';
import { PAYMENT_MODES, RECURRING_FREQUENCIES } from '@/constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AddTransactionNavProp = NativeStackNavigationProp<RootStackParamList, 'AddTransaction'>;
type AddTransactionRouteProp = { params?: { transactionId?: string; type?: TransactionType } };

const validationSchema = Yup.object().shape({
  type: Yup.string().oneOf(['income', 'expense', 'transfer']).required('Type is required'),
  accountId: Yup.string().required('Account is required'),
  categoryId: Yup.string().required('Category is required'),
  amount: Yup.string().required('Amount is required').test('positive', 'Amount must be greater than 0', (value) => {
    if (!value) return false;
    const num = parseCurrencyInput(value);
    return num > 0;
  }),
  note: Yup.string().max(200, 'Note too long'),
  paymentMode: Yup.string().oneOf(['cash', 'upi', 'card', 'bank_transfer']).required('Payment mode is required'),
  date: Yup.number().required('Date is required'),
  transferToAccountId: Yup.string().when('type', {
    is: 'transfer',
    then: () => Yup.string().required('Destination account is required'),
  }),
});

const defaultValues = {
  type: 'expense' as TransactionType,
  accountId: '',
  categoryId: '',
  amount: '',
  note: '',
  paymentMode: 'upi' as PaymentMode,
  date: Date.now(),
  transferToAccountId: '',
  isRecurring: false,
  recurringFrequency: 'monthly' as const,
  recurringStartDate: Date.now(),
  recurringEndDate: 0,
  recurringReminderDays: 1,
  tags: [] as string[],
};

export const AddTransactionScreen = () => {
  const navigation = useNavigation<AddTransactionNavProp>();
  const route = useRoute<AddTransactionRouteProp>();
  const { params } = route;
  
  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    adjustAccountBalance,
  } = useFinanceStore();

  const isEditing = !!params?.transactionId;
  const initialType = params?.type || 'expense';

  const filteredAccounts = accounts.filter((a) => a.isActive);
  const incomeCategories = categories.filter((c) => c.type === 'income' && c.isDefault);
  const expenseCategories = categories.filter((c) => c.type === 'expense' && c.isDefault);
  const transferCategories = categories.filter((c) => c.type === 'expense');

  const [showRecurring, setShowRecurring] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<Category[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const formik = useFormik({
    initialValues: {
      ...defaultValues,
      type: initialType,
      accountId: filteredAccounts[0]?.id || '',
      categoryId: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const amount = parseCurrencyInput(values.amount);
        const transactionData = {
          id: isEditing ? params!.transactionId! : generateId('txn_'),
          accountId: values.accountId,
          categoryId: values.categoryId,
          type: values.type,
          amount,
          currency: 'INR',
          note: values.note.trim(),
          paymentMode: values.paymentMode,
          date: values.date,
          transferToAccountId: values.type === 'transfer' ? values.transferToAccountId : undefined,
          isRecurring: values.isRecurring,
          tags: values.tags,
        };

        if (isEditing) {
          await updateTransaction(params!.transactionId!, transactionData);
          if (Platform.OS === 'android') ToastAndroid.show('Transaction updated', ToastAndroid.SHORT);
        } else {
          await addTransaction(transactionData);
          if (Platform.OS === 'android') ToastAndroid.show('Transaction added', ToastAndroid.SHORT);
        }

        if (values.isRecurring && values.recurringFrequency) {
          // Recurring transaction creation would go here
        }

        navigation.goBack();
      } catch (error) {
        console.error('Failed to save transaction:', error);
        Alert.alert('Error', 'Failed to save transaction. Please try again.');
      }
    },
  });

  useEffect(() => {
    if (isEditing && params?.transactionId) {
      // Load existing transaction for editing
      // This would require a getTransaction method in the store
    }
    
    // Set default account and category based on type
    const defaultAccount = filteredAccounts[0];
    if (defaultAccount && !formik.values.accountId) {
      formik.setFieldValue('accountId', defaultAccount.id);
    }
    
    const defaultCategory = initialType === 'income' 
      ? incomeCategories[0] 
      : expenseCategories[0];
    if (defaultCategory && !formik.values.categoryId) {
      formik.setFieldValue('categoryId', defaultCategory.id);
    }
  }, [isEditing, initialType]);

  useEffect(() => {
    const suggestions = getCategorySuggestions(
      formik.values.note,
      formik.values.type === 'income' ? incomeCategories : expenseCategories
    );
    setSuggestedCategories(suggestions);
  }, [formik.values.note, formik.values.type]);

  const handleTypeChange = useCallback((type: TransactionType) => {
    formik.setFieldValue('type', type);
    formik.setFieldValue('categoryId', '');
    formik.setFieldValue('transferToAccountId', '');
    
    const defaultCategory = type === 'income' ? incomeCategories[0] : expenseCategories[0];
    if (defaultCategory) {
      formik.setFieldValue('categoryId', defaultCategory.id);
    }
  }, [formik, incomeCategories, expenseCategories]);

  const handleAmountChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      formik.setFieldValue('amount', parts[0] + '.' + parts.slice(1).join(''));
    } else {
      formik.setFieldValue('amount', cleaned);
    }
  }, [formik]);

  const getCategoriesForType = (type: TransactionType) => {
    if (type === 'income') return incomeCategories;
    if (type === 'transfer') return transferCategories;
    return expenseCategories;
  };

  const currentCategories = getCategoriesForType(formik.values.type);
  const selectedCategory = currentCategories.find((c) => c.id === formik.values.categoryId);
  const selectedAccount = filteredAccounts.find((a) => a.id === formik.values.accountId);
  const transferAccounts = filteredAccounts.filter((a) => a.id !== formik.values.accountId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.typeCard}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeButtons}>
            {(['income', 'expense', 'transfer'] as TransactionType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formik.values.type === type && styles.typeButtonActive,
                ]}
                onPress={() => handleTypeChange(type)}
              >
                <Ionicons
                  name={
                    type === 'income' ? 'arrow-down-circle' :
                    type === 'expense' ? 'arrow-up-circle' : 'swap-horizontal'
                  }
                  size={24}
                  color={formik.values.type === type ? '#fff' : type === 'income' ? '#2ECC71' : type === 'expense' ? '#E74C3C' : '#3498DB'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    formik.values.type === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <SelectField
                label="Account"
                value={formik.values.accountId}
                options={filteredAccounts.map((a) => ({
                  value: a.id,
                  label: a.name,
                  icon: a.icon,
                  color: a.color,
                }))}
                onChange={(value) => formik.setFieldValue('accountId', value)}
                placeholder="Select account"
                error={formik.touched.accountId && formik.errors.accountId}
                renderOption={(option) => (
                  <View style={styles.optionRow}>
                    <Ionicons name={option.icon || 'banknote'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
                    <Text style={styles.optionText}>{option.label}</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.halfWidth}>
              <SelectField
                label="Category"
                value={formik.values.categoryId}
                options={currentCategories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: c.icon,
                  color: c.color,
                }))}
                onChange={(value) => formik.setFieldValue('categoryId', value)}
                placeholder="Select category"
                error={formik.touched.categoryId && formik.errors.categoryId}
                renderOption={(option) => (
                  <View style={styles.optionRow}>
                    <Ionicons name={option.icon || 'help'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
                    <Text style={styles.optionText}>{option.label}</Text>
                  </View>
                )}
              />
            </View>
          </View>

          {suggestedCategories.length > 0 && formik.values.note && (
            <View style={styles.suggestions}>
              <Text style={styles.suggestionLabel}>Suggested categories:</Text>
              <View style={styles.suggestionChips}>
                {suggestedCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.suggestionChip, { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                    onPress={() => formik.setFieldValue('categoryId', cat.id)}
                  >
                    <Ionicons name={cat.icon} size={14} color={cat.color} style={styles.chipIcon} />
                    <Text style={[styles.chipText, { color: cat.color }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <InputField
            label="Amount"
            value={formik.values.amount}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftElement={<Text style={styles.currencyPrefix}>{CURRENCY_SYMBOL}</Text>}
            error={formik.touched.amount && formik.errors.amount}
          />

          <InputField
            label="Note (optional)"
            value={formik.values.note}
            onChangeText={(text) => formik.setFieldValue('note', text)}
            placeholder="What was this for?"
            multiline
            numberOfLines={3}
          />

          <SelectField
            label="Payment Mode"
            value={formik.values.paymentMode}
            options={PAYMENT_MODES.map((p) => ({ value: p.value, label: p.label, icon: p.icon }))}
            onChange={(value) => formik.setFieldValue('paymentMode', value)}
            placeholder="Select payment mode"
            error={formik.touched.paymentMode && formik.errors.paymentMode}
            renderOption={(option) => (
              <View style={styles.optionRow}>
                <Ionicons name={option.icon || 'card'} size={20} color="#666" style={styles.optionIcon} />
                <Text style={styles.optionText}>{option.label}</Text>
              </View>
            )}
          />

          <InputField
            label="Date"
            value={formatDate(formik.values.date, 'dd MMM yyyy')}
            onChangeText={() => {}}
            placeholder="Select date"
            leftElement={
              <TouchableOpacity onPress={() => {}}>
                <Ionicons name="calendar" size={22} color="#888" />
              </TouchableOpacity>
            }
            disabled
          />

          {formik.values.type === 'transfer' && (
            <SelectField
              label="Transfer To"
              value={formik.values.transferToAccountId}
              options={transferAccounts.map((a) => ({
                value: a.id,
                label: a.name,
                icon: a.icon,
                color: a.color,
              }))}
              onChange={(value) => formik.setFieldValue('transferToAccountId', value)}
              placeholder="Select destination account"
              error={formik.touched.transferToAccountId && formik.errors.transferToAccountId}
              renderOption={(option) => (
                <View style={styles.optionRow}>
                  <Ionicons name={option.icon || 'banknote'} size={20} color={option.color || '#666'} style={styles.optionIcon} />
                  <Text style={styles.optionText}>{option.label}</Text>
                </View>
              )}
            />
          )}
        </Card>

        <Card>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Recurring Transaction</Text>
              <Text style={styles.toggleSubtitle}>Automatically repeat this transaction</Text>
            </View>
            <View style={styles.switchContainer}>
              <View
                style={[
                  styles.switchTrack,
                  formik.values.isRecurring && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    formik.values.isRecurring && styles.switchThumbActive,
                  ]}
                />
              </View>
            </View>
          </View>
          {formik.values.isRecurring && (
            <View style={styles.recurringFields}>
              <SelectField
                label="Frequency"
                value={formik.values.recurringFrequency}
                options={RECURRING_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))}
                onChange={(value) => formik.setFieldValue('recurringFrequency', value)}
              />
              <InputField
                label="Start Date"
                value={formatDate(formik.values.recurringStartDate, 'dd MMM yyyy')}
                onChangeText={() => {}}
                disabled
              />
              <InputField
                label="End Date (optional)"
                value={formik.values.recurringEndDate ? formatDate(formik.values.recurringEndDate, 'dd MMM yyyy') : 'Never'}
                onChangeText={() => {}}
                disabled
              />
              <View style={styles.reminderRow}>
                <Text style={styles.reminderLabel}>Remind me</Text>
                <View style={styles.reminderInput}>
                  <InputField
                    label=""
                    value={String(formik.values.recurringReminderDays)}
                    onChangeText={(text) => formik.setFieldValue('recurringReminderDays', parseInt(text) || 1)}
                    keyboardType="numeric"
                    style={styles.reminderNumberInput}
                  />
                  <Text style={styles.reminderDaysText}>day(s) before</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {isEditing && (
          <View style={styles.deleteButtonContainer}>
            <Button
              title="Delete Transaction"
              variant="danger"
              onPress={() => {
                Alert.alert(
                  'Delete Transaction',
                  'Are you sure you want to delete this transaction? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        // Delete logic would go here
                        navigation.goBack();
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={isEditing ? 'Update Transaction' : 'Add Transaction'}
          onPress={() => formik.handleSubmit()}
          loading={formik.isSubmitting}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  typeCard: { marginBottom: 16 },
  typeButtons: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButtonActive: { borderWidth: 0 },
  typeButtonText: { fontSize: 14, fontWeight: '500', color: '#666' },
  typeButtonTextActive: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  suggestions: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  suggestionLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  suggestionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipIcon: { marginRight: 2 },
  chipText: { fontSize: 12, fontWeight: '500' },
  currencyPrefix: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', marginRight: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  toggleSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  switchContainer: { padding: 4 },
  switchTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
  },
  switchTrackActive: { backgroundColor: '#6C63FF' },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginLeft: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: { marginLeft: 26 },
  recurringFields: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderLabel: { fontSize: 14, color: '#333', fontWeight: '500' },
  reminderInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reminderNumberInput: { width: 60 },
  reminderDaysText: { fontSize: 14, color: '#666' },
  deleteButtonContainer: { marginTop: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionIcon: { width: 24 },
  optionText: { fontSize: 16, color: '#1A1A2E' },
});

import { StyleSheet, TouchableOpacity, Text } from 'react-native';