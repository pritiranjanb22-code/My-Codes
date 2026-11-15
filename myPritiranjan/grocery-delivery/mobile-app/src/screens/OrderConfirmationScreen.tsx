import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, Platform, Clipboard, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { useAuthStore, useOrderStore } from '../../store';
import { useOrders } from '../../hooks/useApi';
import { Button, Card, Badge } from '../../components/common';
import { Order, Payment } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateUpiQrCode } from '../../utils/qrCode';

export default function OrderConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params?: { orderId: string } }>();
  const { orderId } = route.params || {};
  
  const { fetchOrderById, isLoading } = useOrders();
  const { setCurrentOrder } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showUpiApps, setShowUpiApps] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const data = await fetchOrderById(orderId);
      setOrder(data);
      setCurrentOrder(data);
      if (data.payment) {
        setPayment(data.payment);
        if (data.payment.qrCode) {
          setQrCode(data.payment.qrCode);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load order');
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCopyUpi = async () => {
    if (!payment?.upiId) return;
    try {
      await Clipboard.setString(payment.upiId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy UPI ID');
    }
  };

  const handleOpenUpiApp = (appUrl: string) => {
    Linking.openURL(appUrl).catch(() => {
      Alert.alert('Error', 'Could not open payment app');
    });
  };

  const getUpiApps = () => {
    const upiId = payment?.upiId || '';
    const amount = payment?.amount || 0;
    const note = `Order ${order?.orderNumber}`;
    
    return [
      { name: 'GPay', url: `gpay://upi/pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`, icon: 'google' },
      { name: 'PhonePe', url: `phonepe://pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`, icon: 'phone' },
      { name: 'Paytm', url: `paytm://upi/pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`, icon: 'wallet' },
      { name: 'BHIM', url: `bhim://upi/pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`, icon: 'account' },
      { name: 'Amazon Pay', url: `amazonpay://upi/pay?pa=${upiId}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`, icon: 'amazon' },
    ];
  };

  const handlePaymentConfirmed = () => {
    navigation.navigate('PaymentConfirmation', { orderId });
  };

  const handleTrackOrder = () => {
    navigation.navigate('OrderTracking', { orderId });
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  if (isLoading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Order not found</Text>
        <Button title="Back to Orders" onPress={handleViewOrders} variant="primary" fullWidth={false} />
      </View>
    );
  }

  const isPaymentPending = order.paymentStatus === 'pending' || order.paymentStatus === 'verification_pending';
  const canPay = order.paymentStatus === 'pending';
  const isVerifying = order.paymentStatus === 'verification_pending';

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: ORDER_STATUS_COLORS[order.status] + '15', borderColor: ORDER_STATUS_COLORS[order.status] }
        ]}>
          <Ionicons 
            name={getStatusIcon(order.status)} 
            size={28} 
            color={ORDER_STATUS_COLORS[order.status]} 
          />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={[
            styles.statusTitle,
            { color: ORDER_STATUS_COLORS[order.status] }
          ]}>
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </Text>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        </View>
      </View>

      {/* Payment Section - Only show if payment pending */}
      {canPay && payment && (
        <View style={styles.paymentSection}>
          <Card style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
              <Text style={styles.paymentTitle}>Payment Required</Text>
            </View>
            
            <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
            <Text style={styles.paymentSubtitle}>Total amount to be paid</Text>

            {/* UPI ID */}
            <View style={styles.upiIdContainer}>
              <View style={styles.upiIdRow}>
                <View style={styles.upiIdLabel}>
                  <Text style={styles.upiIdLabelText}>UPI ID</Text>
                  <Text style={styles.upiIdValue}>{payment.upiId}</Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyUpi}>
                  <Ionicons name={copyFeedback ? 'checkmark' : 'copy'} size={20} color={copyFeedback ? COLORS.success : COLORS.primary} />
                </TouchableOpacity>
              </View>
              {copyFeedback && <Text style={styles.copiedText}>Copied to clipboard!</Text>}
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>Scan to Pay</Text>
              {qrCode ? (
                <View style={styles.qrCodeWrapper}>
                  <Image source={{ uri: qrCode }} style={styles.qrCode} />
                </View>
              ) : (
                <View style={styles.qrPlaceholder}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}
              <Text style={styles.qrNote}>Scan with any UPI app</Text>
            </View>

            {/* UPI Apps */}
            <View style={styles.upiAppsContainer}>
              <Text style={styles.upiAppsLabel}>Or open directly in:</Text>
              <View style={styles.upiAppsRow}>
                {getUpiApps().map((app) => (
                  <TouchableOpacity
                    key={app.name}
                    style={styles.upiAppButton}
                    onPress={() => handleOpenUpiApp(app.url)}
                  >
                    <View style={styles.upiAppIcon}>
                      <Ionicons name={app.icon} size={24} color="#fff" />
                    </View>
                    <Text style={styles.upiAppName}>{app.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Payment Instructions</Text>
              <View style={styles.instructionsList}>
                <InstructionStep number={1} text="Tap any UPI app above or scan the QR code" />
                <InstructionStep number={2} text={`Pay exactly ${formatCurrency(payment.amount)}`} />
                <InstructionStep number={3} text="Return to this app after payment" />
                <InstructionStep number={4} text="Enter the UPI Transaction ID (UTR) and submit" />
              </View>
            </View>

            {/* Submit Payment Button */}
            <Button
              title="I've Paid - Submit UTR"
              onPress={handlePaymentConfirmed}
              variant="primary"
              fullWidth
              icon="checkmark-circle"
              style={{ marginTop: SPACING.md }}
            />
          </Card>
        </View>
      )}

      {/* Payment Verification Pending */}
      {isVerifying && (
        <View style={styles.verificationSection}>
          <Card style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationIcon}>
                <Ionicons name="time-outline" size={28} color={COLORS.warning} />
              </View>
              <View>
                <Text style={styles.verificationTitle}>Payment Under Verification</Text>
                <Text style={styles.verificationSubtitle}>Our team is verifying your payment. This usually takes a few minutes.</Text>
              </View>
            </View>
            
            {payment?.upiTransactionId && (
              <View style={styles.utrDisplay}>
                <Text style={styles.utrLabel}>Submitted UTR</Text>
                <View style={styles.utrValueContainer}>
                  <Text style={styles.utrValue}>{payment.upiTransactionId}</Text>
                  <TouchableOpacity onPress={handleCopyUpi}>
                    <Ionicons name="copy" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {payment?.paymentScreenshotUrl && (
              <View style={styles.screenshotPreview}>
                <Text style={styles.screenshotLabel}>Payment Screenshot</Text>
                <Image source={{ uri: payment.paymentScreenshotUrl }} style={styles.screenshotImage} />
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Order Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        
        <Card style={styles.orderSummaryCard}>
          <View style={styles.orderSummaryHeader}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt, 'DD MMM YYYY, HH:mm')}</Text>
          </View>

          <FlatList
            data={order.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <View style={styles.orderItemImageContainer}>
                  {item.productImageUrl ? (
                    <Image source={{ uri: item.productImageUrl }} style={styles.orderItemImage} />
                  ) : (
                    <View style={styles.orderItemImagePlaceholder}>
                      <Ionicons name="fast-food-outline" size={20} color={COLORS.textLight} />
                    </View>
                  )}
                </View>
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName}>{item.productName}</Text>
                  <Text style={styles.orderItemMeta}>×{item.quantity} {item.unit} • {formatCurrency(item.unitPrice)} each</Text>
                </View>
                <Text style={styles.orderItemTotal}>{formatCurrency(item.totalPrice)}</Text>
              </View>
            )}
          />

          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>{formatCurrency(order.subtotal)}</Text>
            </View>
            {order.discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>-{formatCurrency(order.discountAmount)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charge</Text>
              <Text style={styles.priceValue}>{order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge)}</Text>
            </View>
            {order.taxAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax</Text>
                <Text style={styles.priceValue}>{formatCurrency(order.taxAmount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
            </View>
          </View>
        </Card>

        {/* Delivery Address */}
        {order.address && (
          <Card style={styles.addressCard}>
            <View style={styles.addressCardHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.primary} />
              <Text style={styles.addressCardTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressName}>{order.address.fullName}</Text>
            <Text style={styles.addressPhone}>{order.address.phone}</Text>
            <Text style={styles.addressFull}>
              {order.address.houseNumber}, {order.address.street}, {order.address.area}
              <Text>&#10;</Text>
              {order.address.city} - {order.address.pincode}, {order.address.state}
            </Text>
          </Card>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {canPay && (
          <Button
            title="Complete Payment"
            onPress={handlePaymentConfirmed}
            variant="primary"
            fullWidth
            icon="cash"
          />
        )}
        
        {isVerifying && (
          <Button
            title="Track Order Status"
            onPress={handleTrackOrder}
            variant="outline"
            fullWidth
            icon="map"
          />
        )}

        {(order.status === 'confirmed' || order.status === 'preparing' || order.status === 'ready_for_delivery' || order.status === 'out_for_delivery') && (
          <Button
            title="Track Order"
            onPress={handleTrackOrder}
            variant="primary"
            fullWidth
            icon="map"
          />
        )}

        {(order.status === 'delivered') && (
          <>
            <Button
              title="Order Again"
              onPress={() => navigation.navigate('Cart')}
              variant="outline"
              fullWidth
              icon="refresh"
            />
            <Button
              title="View All Orders"
              onPress={handleViewOrders}
              variant="primary"
              fullWidth
              icon="list"
            />
          </>
        )}

        {(order.status === 'cancelled') && (
          <Button
            title="View All Orders"
            onPress={handleViewOrders}
            variant="primary"
            fullWidth
            icon="list"
          />
        )}
      </View>
    </ScrollView>
  );
}

const InstructionStep = ({ number, text }: { number: number; text: string }) => (
  <View style={styles.instructionStep}>
    <View style={styles.instructionNumber}>{number}</View>
    <Text style={styles.instructionText}>{text}</Text>
  </View>
);

function getStatusIcon(status: string) {
  switch (status) {
    case 'payment_pending': return 'cash-outline';
    case 'payment_verification_pending': return 'time-outline';
    case 'confirmed': return 'checkmark-circle';
    case 'preparing': return 'restaurant-outline';
    case 'ready_for_delivery': return 'package-outline';
    case 'out_for_delivery': return 'bike-outline';
    case 'delivered': return 'checkmark-done-circle';
    case 'cancelled': return 'close-circle';
    default: return 'help-circle';
  }
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  errorTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  scrollContent: { padding: SPACING.lg, paddingBottom: 140, gap: SPACING.lg },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, ...SHADOWS.sm },
  statusBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  statusTextContainer: { flex: 1 },
  statusTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold },
  orderNumber: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  paymentSection: { marginTop: SPACING.md },
  paymentCard: { padding: SPACING.lg },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  paymentTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  paymentAmount: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs, textAlign: 'center' },
  paymentSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  upiIdContainer: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg },
  upiIdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upiIdLabel: { flex: 1 },
  upiIdLabelText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  upiIdValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, fontFamily: 'monospace' },
  copyButton: { padding: SPACING.xs },
  copiedText: { fontSize: FONT_SIZES.xs, color: COLORS.success, textAlign: 'center', marginTop: SPACING.xs },
  qrContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  qrLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  qrCodeWrapper: { padding: SPACING.md, backgroundColor: '#fff', borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  qrCode: { width: 200, height: 200 },
  qrPlaceholder: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },
  qrNote: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: SPACING.xs, textAlign: 'center' },
  upiAppsContainer: { marginBottom: SPACING.lg },
  upiAppsLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  upiAppsRow: { flexDirection: 'row', gap: SPACING.md },
  upiAppButton: { flex: 1, alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  upiAppIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  upiAppName: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  instructionsCard: { backgroundColor: COLORS.info + '10', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.info + '30' },
  instructionsTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.info, marginBottom: SPACING.md },
  instructionsList: { gap: SPACING.md },
  instructionStep: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
  instructionNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.info, alignItems: 'center', justifyContent: 'center' },
  instructionText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.text, marginTop: 2 },
  verificationSection: { marginTop: SPACING.md },
  verificationCard: { padding: SPACING.lg },
  verificationHeader: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  verificationIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.warning + '15', alignItems: 'center', justifyContent: 'center' },
  verificationTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  verificationSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  utrDisplay: { backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, padding: SPACING.md },
  utrLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  utrValueContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  utrValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, fontFamily: 'monospace', flex: 1 },
  screenshotPreview: { marginTop: SPACING.md },
  screenshotLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.xs },
  screenshotImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md },
  detailsSection: { marginTop: SPACING.md },
  orderSummaryCard: { padding: SPACING.md },
  orderSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  orderSummaryTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  orderDate: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  orderItem: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.md },
  orderItemImageContainer: { width: 60, height: 60, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  orderItemImage: { width: '100%', height: '100%' },
  orderItemImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  orderItemDetails: { flex: 1, gap: 2 },
  orderItemName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  orderItemMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  orderItemTotal: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  priceBreakdown: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
  priceLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  discountLabel: { color: COLORS.success },
  discountValue: { color: COLORS.success },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.md },
  totalLabel: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  totalValue: { fontSize: FONT_SIZES.xxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  addressCard: { padding: SPACING.md, marginTop: SPACING.lg },
  addressCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  addressCardTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  addressName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  addressPhone: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  addressFull: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  actionsSection: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: SPACING.xxl, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.md },
});