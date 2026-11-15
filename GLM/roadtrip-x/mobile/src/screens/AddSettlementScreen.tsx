import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS, PAYMENT_METHODS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId, formatCurrency } from '@/utils/helpers';

type Props = RootStackScreenProps<'AddSettlement'>;

export default function AddSettlementScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId, fromUserId, toUserId } = route.params;
  const { members, addSettlement, user } = useAppStore();

  const tripMembers = members;
  const currentUser = tripMembers.find(m => m.userId === user?.id);
  const fromUser = fromUserId ? tripMembers.find(m => m.userId === fromUserId) : currentUser;
  const toUser = toUserId ? tripMembers.find(m => m.userId === toUserId) : null;

  const [formData, setFormData] = useState({
    fromUserId: fromUser?.userId || '',
    toUserId: toUser?.userId || '',
    amount: '',
    paymentMethod: 'upi' as any,
    paymentReference: '',
    paymentScreenshot: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate balance between users
  const calculateBalance = () => {
    if (!fromUser || !toUser) return 0;
    // This would be calculated from expenses - simplified for now
    return 0;
  };

  const balance = calculateBalance();

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);

    if (!formData.fromUserId) newErrors.fromUserId = 'Select who pays';
    if (!formData.toUserId) newErrors.toUserId = 'Select who receives';
    if (formData.fromUserId === formData.toUserId) newErrors.toUserId = 'Cannot settle with yourself';
    if (!formData.amount || isNaN(amount) || amount <= 0) newErrors.amount = 'Enter a valid amount';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const settlement = {
      id: generateId(),
      tripId: tripId!,
      fromUserId: formData.fromUserId,
      fromUser: tripMembers.find(m => m.userId === formData.fromUserId)!.user,
      toUserId: formData.toUserId,
      toUser: tripMembers.find(m => m.userId === formData.toUserId)!.user,
      amount: parseFloat(formData.amount),
      currency: 'INR',
      status: 'pending' as const,
      paymentMethod: formData.paymentMethod,
      paymentReference: formData.paymentReference || undefined,
      paymentScreenshot: formData.paymentScreenshot || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addSettlement(settlement);
    navigation.goBack();
  };

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
          <Text style={styles.headerTitle}>Record Settlement</Text>
        </View>

        <View style={styles.content}>
          {/* Users Selection */}
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <Text style={styles.sectionTitle}>Who is paying whom?</Text>
              
              <View style={styles.usersRow}>
                <TouchableOpacity style={styles.userSelector} onPress={() => {}}>
                  <View style={styles.userSelectorContent}>
                    <Avatar name={fromUser?.user.name || 'Select'} size="md" source={fromUser?.user.avatar} />
                    <View>
                      <Text style={styles.userSelectorLabel}>FROM (Pays)</Text>
                      <Text style={styles.userSelectorName}>{fromUser?.user.name || 'Select payer'}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                <View style={styles.arrowBetween}>
                  <Ionicons name="arrow-forward" size={28} color={COLORS.accent} />
                </View>

                <TouchableOpacity style={styles.userSelector} onPress={() => {}}>
                  <View style={styles.userSelectorContent}>
                    <View>
                      <Text style={styles.userSelectorLabel}>TO (Receives)</Text>
                      <Text style={styles.userSelectorName}>{toUser?.user.name || 'Select receiver'}</Text>
                    </View>
                    <Avatar name={toUser?.user.name || 'Select'} size="md" source={toUser?.user.avatar} />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {errors.fromUserId && <Text style={styles.errorText}>{errors.fromUserId}</Text>}
              {errors.toUserId && <Text style={styles.errorText}>{errors.toUserId}</Text>}
            </CardContent>
          </Card>

          {/* Amount */}
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <Text style={styles.sectionTitle}>Amount</Text>
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
              {balance !== 0 && (
                <Text style={styles.balanceHint}>
                  Suggested: {formatCurrency(Math.abs(balance))} {balance > 0 ? `${fromUser?.user.name} owes ${toUser?.user.name}` : `${toUser?.user.name} owes ${fromUser?.user.name}`}
                </Text>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.map(method => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodButton,
                      formData.paymentMethod === method.id && styles.paymentMethodSelected,
                    ]}
                    onPress={() => handleChange('paymentMethod', method.id)}
                  >
                    <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                    <Text style={[
                      styles.paymentMethodLabel,
                      formData.paymentMethod === method.id && styles.paymentMethodLabelSelected,
                    ]}>{method.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.paymentMethod !== 'cash' && (
                <Input
                  label="Reference/Transaction ID (Optional)"
                  placeholder="UPI ref, bank ref, etc."
                  value={formData.paymentReference}
                  onChangeText={value => handleChange('paymentReference', value)}
                  autoCapitalize="none"
                />
              )}

              <View style={styles.screenshotSection}>
                <Text style={styles.inputLabel}>Payment Screenshot (Optional)</Text>
                <TouchableOpacity style={styles.screenshotButton}>
                  <Ionicons name="camera" size={20} color={COLORS.accent} />
                  <Text style={styles.screenshotButtonText}>Attach Screenshot</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card style={styles.summaryCard} variant="outlined">
            <CardContent>
              <Text style={styles.summaryTitle}>Settlement Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryUser}>
                  <Avatar name={fromUser?.user.name || ''} size="sm" />
                  <Text style={styles.summaryUserName}>{fromUser?.user.name}</Text>
                </View>
                <View style={styles.summaryArrow}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.accent} />
                  <Text style={styles.summaryAmount}>{formatCurrency(parseFloat(formData.amount) || 0)}</Text>
                </View>
                <View style={styles.summaryUser}>
                  <Avatar name={toUser?.user.name || ''} size="sm" />
                  <Text style={styles.summaryUserName}>{toUser?.user.name}</Text>
                </View>
              </View>
              <View style={styles.summaryMeta}>
                <Text>Method: {PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.label}</Text>
                {formData.paymentReference && <Text>Ref: {formData.paymentReference}</Text>}
              </View>
            </CardContent>
          </Card>

          <Button
            title="Record Settlement"
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
  formCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  usersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userSelector: {
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
  userSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  userSelectorLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userSelectorName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  arrowBetween: {
    paddingHorizontal: SPACING.md,
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
    fontSize: FONT_SIZES.xl,
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
  balanceHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    marginTop: SPACING.sm,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentMethodSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  paymentMethodIcon: {
    fontSize: 16,
  },
  paymentMethodLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  paymentMethodLabelSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  screenshotSection: {
    marginTop: SPACING.md,
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  screenshotButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
  summaryCard: {
    marginTop: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryUserName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  summaryArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accent,
  },
  summaryMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});