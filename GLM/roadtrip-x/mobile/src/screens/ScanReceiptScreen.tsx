import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'ScanReceipt'>;

export default function ScanReceiptScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;

  const [stage, setStage] = React.useState<'camera' | 'preview' | 'confirm'>('camera');
  const [scannedData, setScannedData] = React.useState(null);

  const mockScannedData = {
    merchant: 'ABC Restaurant',
    amount: 1840,
    date: new Date().toISOString(),
    category: 'food',
    confidence: 0.92,
  };

  const handleScan = () => {
    setScannedData(mockScannedData);
    setStage('preview');
  };

  const handleConfirm = () => {
    setStage('confirm');
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  const handleRetake = () => {
    setStage('camera');
    setScannedData(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Receipt</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {stage === 'camera' && (
          <View style={styles.cameraView}>
            <View style={styles.cameraFrame}>
              <View style={styles.cameraCorners} />
              <View style={styles.cameraCorners} />
              <View style={styles.cameraCorners} />
              <View style={styles.cameraCorners} />
            </View>
            <Text style={styles.cameraInstruction}>Position receipt within the frame</Text>
            <TouchableOpacity style={styles.captureButton} onPress={handleScan}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <Text style={styles.cameraTip}>Tap to capture receipt</Text>
            <Button title="Select from Gallery" variant="outline" onPress={() => {}} style={{ marginTop: SPACING.md, width: '80%' }} />
          </View>
        )}

        {stage === 'preview' && scannedData && (
          <View style={styles.previewView}>
            <Card style={styles.previewCard} variant="elevated">
              <CardContent>
                <View style={styles.previewHeader}>
                  <Ionicons name="checkmark-circle" size={32} color="#2ECC71" />
                  <Text style={styles.previewTitle}>Receipt Scanned Successfully</Text>
                </View>
                <View style={styles.previewDetails}>
                  <DetailRow label="Merchant" value={scannedData.merchant} />
                  <DetailRow label="Amount" value={`₹${scannedData.amount.toLocaleString()}`} />
                  <DetailRow label="Date" value={new Date(scannedData.date).toLocaleDateString()} />
                  <DetailRow label="Category" value={scannedData.category} />
                  <DetailRow label="Confidence" value={`${Math.round(scannedData.confidence * 100)}%`} />
                </View>
                <View style={styles.previewActions}>
                  <Button title="Retake" variant="outline" onPress={handleRetake} />
                  <Button title="Save Expense" onPress={handleConfirm} />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {stage === 'confirm' && (
          <View style={styles.confirmView}>
            <View style={styles.confirmIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#2ECC71" />
            </View>
            <Text style={styles.confirmTitle}>Expense Saved!</Text>
            <Text style={styles.confirmText}>Receipt has been added to your trip expenses</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ label, value }: any) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  cameraView: {
    alignItems: 'center',
  },
  cameraFrame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
  },
  cameraCorners: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  cameraInstruction: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
  },
  cameraTip: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  previewView: {
    width: '100%',
  },
  previewCard: {},
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  previewTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  previewDetails: {
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  previewActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  confirmView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  confirmIcon: {
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});