import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, EXPENSE_CATEGORIES, VEHICLE_FUEL_TYPES } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId, calculateSplit } from '@/utils/helpers';

type Props = RootStackScreenProps<'AddExpense'>;

export default function AddExpenseScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId, expenseId } = route.params;
  const { currentTrip, members, vehicles, expenses, updateExpense, addExpense } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : useAppStore.getState().trips.find(t => t.id === tripId);
  const tripMembers = members;
  const tripVehicles = vehicles;
  const isEditing = !!expenseId;
  const existingExpense = isEditing ? expenses.find(e => e.id === expenseId) : null;

  const [formData, setFormData] = useState({
    amount: '',
    category: 'food' as any,
    description: '',
    paidBy: tripMembers[0]?.userId || '',
    participants: tripMembers.map(m => m.userId),
    splitType: 'equal' as const,
    customAmounts: {} as Record<string, number>,
    vehicleId: '',
    stopId: '',
    receiptUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);

  useEffect(() => {
    if (existingExpense) {
      setFormData({
        amount: existingExpense.amount.toString(),
        category: existingExpense.category,
        description: existingExpense.description,
        paidBy: existingExpense.paidBy,
        participants: existingExpense.participants.map(p => p.userId),
        splitType: existingExpense.splitType,
        customAmounts: existingExpense.participants.reduce((acc, p) => {
          acc[p.userId] = p.amount;
          return acc;
        }, {} as Record<string, number>),
        vehicleId: existingExpense.vehicleId || '',
        stopId: existingExpense.stopId || '',
        receiptUrl: existingExpense.receiptUrl || '',
      });
    }
  }, [existingExpense]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleParticipant = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId],
    }));
  };

  const calculateShares = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (amount <= 0 || formData.participants.length === 0) return {};
    
    const shares = calculateSplit(amount, formData.participants.length, formData.splitType, 
      formData.splitType === 'custom' ? Object.values(formData.customAmounts) : undefined
    );
    
    const customAmounts: Record<string, number> = {};
    formData.participants.forEach((userId, index) => {
      customAmounts[userId] = shares[index];
    });
    
    setFormData(prev => ({ ...prev, customAmounts }));
  };

  useEffect(() => {
    calculateShares();
  }, [formData.amount, formData.participants.length, formData.splitType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);
    
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.paidBy) {
      newErrors.paidBy = 'Select who paid';
    }
    if (formData.participants.length === 0) {
      newErrors.participants = 'Select at least one participant';
    }
    if (formData.splitType === 'custom') {
      const totalCustom = Object.values(formData.customAmounts).reduce((a, b) => a + b, 0);
      if (Math.abs(totalCustom - amount) > 0.01) {
        newErrors.customAmounts = `Custom amounts must sum to ${amount}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !trip) return;

    const amount = parseFloat(formData.amount);
    const participants = formData.participants.map(userId => {
      const member = tripMembers.find(m => m.userId === userId);
      return {
        userId,
        user: member?.user!,
        amount: formData.splitType === 'custom' ? formData.customAmounts[userId] : amount / formData.participants.length,
        percentage: formData.splitType === 'percentage' ? 100 / formData.participants.length : undefined,
        shares: formData.splitType === 'shares' ? 1 : undefined,
        isPaid: userId === formData.paidBy,
        paidAt: userId === formData.paidBy ? new Date().toISOString() : undefined,
      };
    });

    const expenseData = {
      id: isEditing ? expenseId! : generateId(),
      tripId: trip.id,
      amount,
      currency: trip.currency,
      category: formData.category,
      description: formData.description,
      paidBy: formData.paidBy,
      paidByUser: tripMembers.find(m => m.userId === formData.paidBy)?.user!,
      participants,
      splitType: formData.splitType,
      receiptUrl: formData.receiptUrl || undefined,
      vehicleId: formData.vehicleId || undefined,
      stopId: formData.stopId || undefined,
      createdAt: isEditing ? existingExpense!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      updateExpense(expenseData);
    } else {
      addExpense(expenseData);
    }
    navigation.goBack();
  };

  const paidByUser = tripMembers.find(m => m.userId === formData.paidBy);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              {/* Amount & Category */}
              <View style={styles.amountCategoryRow}>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <View style={styles.amountInput}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Input
                      value={formData.amount}
                      onChangeText={value => handleChange('amount', value)}
                      error={errors.amount}
                      keyboardType="numeric"
                      placeholder="0"
                      style={styles.amountInputField}
                    />
                  </View>
                </View>
                <View style={styles.categoryInputWrapper}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TouchableOpacity style={styles.categoryButton} onPress={() => setShowSplitOptions(true)}>
                    <View style={styles.categoryButtonContent}>
                      <Text style={styles.categoryIcon}>{EXPENSE_CATEGORIES.find(c => c.id === formData.category)?.icon}</Text>
                      <Text style={styles.categoryText}>{EXPENSE_CATEGORIES.find(c => c.id === formData.category)?.label}</Text>
                      <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Description */}
              <Input
                label="Description"
                placeholder="What was this for?"
                value={formData.description}
                onChangeText={value => handleChange('description', value)}
                error={errors.description}
                autoCapitalize="sentences"
              />

              {/* Paid By */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Paid By</Text>
                <TouchableOpacity style={styles.paidByButton} onPress={() => setShowSplitOptions(true)}>
                  <View style={styles.paidByButtonContent}>
                    <Avatar name={paidByUser?.user.name || 'Select'} size="sm" source={paidByUser?.user.avatar} />
                    <View>
                      <Text style={styles.paidByName}>{paidByUser?.user.name || 'Select payer'}</Text>
                      <Text style={styles.paidBySubtitle}>{tripMembers.length} members</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Split Type */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Split Type</Text>
                <TouchableOpacity style={styles.splitTypeButton} onPress={() => setShowSplitOptions(true)}>
                  <View style={styles.splitTypeButtonContent}>
                    <Text style={styles.splitTypeText}>{getSplitTypeLabel(formData.splitType)}</Text>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Participants */}
              <View style={styles.sectionRow}>
                <View style={styles.participantsHeader}>
                  <Text style={styles.inputLabel}>Split Between ({formData.participants.length})</Text>
                  <TouchableOpacity onPress={() => setShowParticipantPicker(true)}>
                    <Ionicons name="person-add" size={20} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>
                {errors.participants && <Text style={styles.errorText}>{errors.participants}</Text>}
                <View style={styles.participantsList}>
                  {formData.participants.map(userId => {
                    const member = tripMembers.find(m => m.userId === userId);
                    const shareAmount = formData.customAmounts[userId] || 0;
                    return (
                      <ParticipantChip
                        key={userId}
                        member={member!}
                        amount={shareAmount}
                        isPaidBy={userId === formData.paidBy}
                        onRemove={() => toggleParticipant(userId)}
                      />
                    );
                  })}
                </View>
                {formData.participants.length === 0 && (
                  <Text style={styles.noParticipants}>Tap + to add participants</Text>
                )}
              </View>

              {/* Custom Amounts (for custom split) */}
              {formData.splitType === 'custom' && formData.participants.length > 0 && (
                <View style={styles.customAmountsSection}>
                  <Text style={styles.sectionTitle}>Custom Amounts</Text>
                  {formData.participants.map(userId => {
                    const member = tripMembers.find(m => m.userId === userId);
                    return (
                      <View key={userId} style={styles.customAmountRow}>
                        <Avatar name={member?.user.name || ''} size="xs" />
                        <Text style={styles.customAmountName}>{member?.user.name}</Text>
                        <Input
                          value={formData.customAmounts[userId]?.toString() || ''}
                          onChangeText={value => handleChange('customAmounts', { ...formData.customAmounts, [userId]: parseFloat(value) || 0 })}
                          keyboardType="numeric"
                          placeholder="0"
                          style={styles.customAmountInput}
                        />
                      </View>
                    );
                  })}
                  <View style={styles.customAmountTotal}>
                    <Text>Total:</Text>
                    <Text style={styles.customAmountTotalValue}>₹{Object.values(formData.customAmounts).reduce((a, b) => a + b, 0).toFixed(2)}</Text>
                  </View>
                  {errors.customAmounts && <Text style={styles.errorText}>{errors.customAmounts}</Text>}
                </View>
              )}

              {/* Vehicle & Stop (Optional) */}
              <View style={styles.optionalFields}>
                <View style={styles.optionalField}>
                  <Text style={styles.inputLabel}>Vehicle (Optional)</Text>
                  <TouchableOpacity style={styles.optionalButton}>
                    <Text style={styles.optionalButtonText}>
                      {tripVehicles.find(v => v.id === formData.vehicleId)?.name || 'Select vehicle'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.optionalField}>
                  <Text style={styles.inputLabel}>Stop (Optional)</Text>
                  <TouchableOpacity style={styles.optionalButton}>
                    <Text style={styles.optionalButtonText}>
                      {useAppStore.getState().itinerary.find(s => s.id === formData.stopId)?.name || 'Select stop'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Receipt */}
              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Receipt</Text>
                <TouchableOpacity style={styles.receiptButton}>
                  <Ionicons name="camera" size={20} color={COLORS.accent} />
                  <Text style={styles.receiptButtonText}>Attach Receipt</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Split Preview */}
          <Card style={styles.previewCard} variant="outlined">
            <CardContent>
              <Text style={styles.previewTitle}>Split Preview</Text>
              <View style={styles.previewList}>
                {formData.participants.map(userId => {
                  const member = tripMembers.find(m => m.userId === userId);
                  const shareAmount = formData.customAmounts[userId] || (parseFloat(formData.amount) / formData.participants.length) || 0;
                  return (
                    <View key={userId} style={styles.previewRow}>
                      <Avatar name={member?.user.name || ''} size="xs" />
                      <Text style={styles.previewName}>{member?.user.name}</Text>
                      <Text style={[styles.previewAmount, userId === formData.paidBy && styles.previewAmountPaid]}>₹{shareAmount.toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.previewTotal}>
                <Text>Total</Text>
                <Text style={styles.previewTotalAmount}>₹{formData.amount}</Text>
              </View>
            </CardContent>
          </Card>

          <Button
            title={isEditing ? 'Save Changes' : 'Add Expense'}
            onPress={handleSubmit}
            fullWidth
            size="lg"
            style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getSplitTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    equal: 'Equal',
    exact: 'Exact Amounts',
    percentage: 'Percentage',
    shares: 'Shares',
    custom: 'Custom',
  };
  return labels[type] || type;
}

const ParticipantChip = ({ member, amount, isPaidBy, onRemove }: any) => (
  <View style={styles.participantChip}>
    <Avatar name={member.user.name} size="xs" />
    <View style={styles.participantChipInfo}>
      <Text style={styles.participantChipName}>{member.user.name}</Text>
      <Text style={styles.participantChipAmount}>₹{amount.toFixed(2)}</Text>
    </View>
    {isPaidBy && <Text style={styles.paidBadge}>PAID</Text>}
    <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
      <Ionicons name="close" size={14} color={COLORS.textMuted} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
  content: {
    paddingVertical: SPACING.md,
  },
  formCard: {},
  amountCategoryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  amountInputWrapper: {
    flex: 2,
  },
  categoryInputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  amountInputField: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  categoryButton: {
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
  categoryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  paidByButton: {
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
  paidByButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  paidByName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  paidBySubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  splitTypeButton: {
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
  splitTypeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  splitTypeText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  noParticipants: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
  },
  participantChipInfo: {
    flexDirection: 'column',
  },
  participantChipName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: COLORS.text,
  },
  participantChipAmount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
  },
  paidBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: '#2ECC71',
    marginLeft: SPACING.xs,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  customAmountsSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  customAmountName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  customAmountInput: {
    width: 80,
  },
  customAmountTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  customAmountTotalValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  optionalFields: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  optionalField: {
    flex: 1,
  },
  optionalButton: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionalButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
  previewCard: {
    marginTop: SPACING.lg,
  },
  previewTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewList: {
    gap: SPACING.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  previewName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    flex: 1,
  },
  previewAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.text,
  },
  previewAmountPaid: {
    color: '#2ECC71',
  },
  previewTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.md,
  },
  previewTotalAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});