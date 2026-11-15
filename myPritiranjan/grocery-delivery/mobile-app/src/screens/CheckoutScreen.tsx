import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, Image, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants';
import { useAuthStore, useCartStore, useAddressStore, useShopStore } from '../../store';
import { useCart, useAddresses, useShop } from '../../hooks/useApi';
import { Button, Card, Badge, InputField } from '../../components/common';
import { CartItem, Address } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params?: { addressId?: string } }>();
  const { addressId: paramAddressId } = route.params || {};
  
  const { 
    items, 
    itemCount, 
    subtotal, 
    updateQuantity, 
    removeItem, 
    clearCart: clearCartStore, 
    validateCart,
    recalculate 
  } = useCartStore();
  const { getCart } = useCart();
  const { fetchAddresses, setDefaultAddress, isLoading: addressesLoading } = useAddresses();
  const { addresses, setAddresses, defaultAddress } = useAddressStore();
  const { fetchSettings, isLoading: shopLoading } = useShop();
  const { settings: shopSettings } = useShopStore();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(paramAddressId || defaultAddress?.id || null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [validating, setValidating] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchData = async () => {
    try {
      await Promise.all([fetchAddresses(), fetchSettings()]);
      const addressData = await getCart();
      if (addressData?.items) {
        recalculate();
      }
    } catch (error) {
      console.error('Failed to fetch checkout data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setValidating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (promoCode.toUpperCase() === 'WELCOME10') {
        setDiscount(Math.round(subtotal * 0.1));
        setShowPromoInput(false);
        Alert.alert('Success', '10% discount applied!');
      } else if (promoCode.toUpperCase() === 'SAVE50') {
        setDiscount(50);
        setShowPromoInput(false);
        Alert.alert('Success', '₹50 discount applied!');
      } else if (promoCode.toUpperCase() === 'FREESHIP') {
        setDiscount(0);
        setShowPromoInput(false);
        Alert.alert('Success', 'Free delivery applied!');
      } else {
        Alert.alert('Invalid Code', 'The promo code is not valid or has expired.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply promo code');
    } finally {
      setValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(0);
    setPromoCode('');
    setShowPromoInput(false);
  };

  const deliveryCharge = shopSettings?.deliveryCharge || 30;
  const freeDeliveryThreshold = shopSettings?.freeDeliveryThreshold || 500;
  const minOrderValue = shopSettings?.minOrderValue || 100;
  
  const deliveryChargeFinal = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
  const total = subtotal + deliveryChargeFinal - discount;
  const savings = subtotal < freeDeliveryThreshold ? freeDeliveryThreshold - subtotal : 0;

  const validateCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return false;
    }
    
    if (subtotal < minOrderValue) {
      Alert.alert('Minimum Order', `Minimum order value is ₹${minOrderValue}`);
      return false;
    }
    
    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please select a delivery address');
      return false;
    }
    
    const outOfStockItems = items.filter(item => item.product?.stockStatus === 'out_of_stock');
    if (outOfStockItems.length > 0) {
      Alert.alert('Out of Stock', 'Some items are no longer available. Please update your cart.');
      return false;
    }
    
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateCheckout()) return;
    
    setPlacingOrder(true);
    try {
      await navigation.navigate('Payment', { 
        addressId: selectedAddressId!,
        totalAmount: total,
        discount,
        deliveryCharge: deliveryChargeFinal,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to proceed to payment');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to proceed to checkout</Text>
          <Button 
            title="Continue Shopping" 
            onPress={() => navigation.navigate('Categories')} 
            variant="primary" 
            fullWidth={false} 
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary ({itemCount} items)</Text>
          
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const quantity = item.quantity;
              return (
                <TouchableOpacity style={styles.cartItem} onPress={() => navigation.navigate('ProductDetails', { productId: item.productId })}>
                  <View style={styles.itemImageContainer}>
                    {item.product?.imageUrl ? (
                      <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemImagePlaceholder, { backgroundColor: COLORS.background }]}>
                        <Ionicons name="fast-food-outline" size={24} color={COLORS.textLight} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Unknown Product'}</Text>
                      {item.product?.stockStatus === 'low_stock' && (
                        <Badge text="Low Stock" variant="warning" size="xs" />
                      )}
                    </View>
                    
                    <Text style={styles.itemUnit}>{item.product?.brand || ''} • {item.product?.unit || 'unit'}</Text>
                    
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemPrice}>{formatCurrency(item.product?.sellingPrice || 0)}</Text>
                      {item.product?.mrpPrice && item.product?.mrpPrice > item.product?.sellingPrice && (
                        <Text style={styles.itemMrp}>{formatCurrency(item.product.mrpPrice)}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.itemQuantity}>
                    <TouchableOpacity
                      style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                      onPress={() => updateQuantity(item.productId, quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <MaterialCommunityIcons name="minus" size={20} color={quantity <= 1 ? COLORS.textLight : COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{quantity}</Text>
                    <TouchableOpacity
                      style={[styles.quantityButton, quantity >= (item.product?.stockQuantity || 99) && styles.quantityButtonDisabled]}
                      onPress={() => updateQuantity(item.productId, quantity + 1)}
                      disabled={quantity >= (item.product?.stockQuantity || 99)}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color={quantity >= (item.product?.stockQuantity || 99) ? COLORS.textLight : COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <Text style={styles.emptyCartText}>No items in cart</Text>
              </View>
            }
          />
          
          {/* Promo Code */}
          <View style={styles.promoSection}>
            {showPromoInput ? (
              <View style={styles.promoInputContainer}>
                <InputField
                  label="Promo Code"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder="Enter promo code"
                  rightElement={
                    <TouchableOpacity onPress={handleApplyPromo} disabled={validating || !promoCode.trim()}>
                      <Text style={styles.promoButtonText}>Apply</Text>
                    </TouchableOpacity>
                  }
                />
                <TouchableOpacity onPress={handleRemovePromo} style={styles.removePromo}>
                  <Text style={styles.removePromoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.promoButton} onPress={() => setShowPromoInput(true)}>
                <Ionicons name="ticket-outline" size={20} color={COLORS.primary} />
                <Text style={styles.promoButtonText}>Apply Promo Code</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            )}

            {discount > 0 && (
              <View style={styles.appliedPromo}>
                <View style={styles.appliedPromoInfo}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  <Text style={styles.appliedPromoText}>Promo applied: <Text style={{ fontWeight: FONT_WEIGHTS.bold }}>-{formatCurrency(discount)}</Text></Text>
                </View>
                <TouchableOpacity onPress={handleRemovePromo}>
                  <Ionicons name="close" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal ({itemCount} items)</Text>
              <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.priceValue, styles.discountValue]}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Charge</Text>
              <Text style={styles.priceValue}>
                {deliveryChargeFinal === 0 ? (
                  <Text style={styles.freeDelivery}>FREE</Text>
                ) : (
                  formatCurrency(deliveryChargeFinal)
                )}
              </Text>
            </View>
            
            {subtotal < freeDeliveryThreshold && (
              <View style={styles.savingsRow}>
                <Ionicons name="gift-outline" size={16} color={COLORS.success} />
                <Text style={styles.savingsText}>Add items worth {formatCurrency(savings)} more for FREE delivery</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {addresses.length > 1 && (
              <TouchableOpacity onPress={() => navigation.navigate('AddressSelection', { fromCheckout: true })}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {addresses.length === 0 ? (
            <TouchableOpacity style={styles.addAddressCard} onPress={() => navigation.navigate('AddAddress', { fromCheckout: true })}>
              <MaterialCommunityIcons name="map-marker-plus" size={24} color={COLORS.primary} />
              <View style={styles.addAddressText}>
                <Text style={styles.addAddressTitle}>Add Delivery Address</Text>
                <Text style={styles.addAddressSubtitle}>Enter your delivery details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : selectedAddress ? (
            <TouchableOpacity style={styles.addressCard} onPress={() => navigation.navigate('AddressSelection', { fromCheckout: true })}>
              <View style={styles.addressIcon}>
                <MaterialCommunityIcons name="home" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.addressInfo} style={{ flex: 1 }}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                  {selectedAddress.isDefault && <Badge text="Default" variant="primary" size="xs" />}
                </View>
                <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                <Text style={styles.addressFull}>{selectedAddress.houseNumber}, {selectedAddress.street}, {selectedAddress.area}, {selectedAddress.city} - {selectedAddress.pincode}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addAddressCard} onPress={() => navigation.navigate('AddAddress', { fromCheckout: true })}>
              <MaterialCommunityIcons name="map-marker-plus" size={24} color={COLORS.primary} />
              <View style={styles.addAddressText}>
                <Text style={styles.addAddressTitle}>Add Delivery Address</Text>
                <Text style={styles.addAddressSubtitle}>Enter your delivery details</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodIcon}>
              <Ionicons name="logo-upi" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>UPI Payment</Text>
              <Text style={styles.paymentMethodSubtitle}>Pay via UPI apps (GPay, PhonePe, Paytm, etc.)</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          </View>
        </View>

        {/* Place Order Button */}
        <View style={styles.placeOrderSection}>
          <Button
            title={`Place Order - ${formatCurrency(total)}`}
            onPress={handlePlaceOrder}
            loading={placingOrder}
            fullWidth
            disabled={placingOrder}
          />
          
          <Text style={styles.secureText}>
            <Ionicons name="lock-closed" size={14} color={COLORS.textLight} />
            {' '}Secure payment • Your data is protected
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 160 },
  summarySection: { padding: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.md },
  cartItem: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.xl, 
    padding: SPACING.md, 
    marginBottom: SPACING.md, 
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  itemImageContainer: { width: 70, height: 70, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  itemDetails: { flex: 1, gap: SPACING.xs },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, flex: 1 },
  itemUnit: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  itemPrice: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  itemMrp: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, textDecorationLine: 'line-through' },
  itemQuantity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  quantityButton: { width: 32, height: 32, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  quantityButtonDisabled: { opacity: 0.5 },
  quantityValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, minWidth: 28, textAlign: 'center' },
  emptyCart: { padding: SPACING.xl, alignItems: 'center' },
  emptyCartText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  promoSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  promoInputContainer: { flexDirection: 'row', gap: SPACING.md },
  promoButtonText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary, paddingHorizontal: SPACING.md },
  removePromo: { paddingVertical: SPACING.md },
  removePromoText: { fontSize: FONT_SIZES.sm, color: COLORS.error, fontWeight: FONT_WEIGHTS.medium },
  promoButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  appliedPromo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  appliedPromoInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  appliedPromoText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  priceBreakdown: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs },
  priceLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  priceValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  discountLabel: { color: COLORS.success },
  discountValue: { color: COLORS.success },
  freeDelivery: { color: COLORS.success, fontWeight: FONT_WEIGHTS.bold },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  savingsText: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: FONT_WEIGHTS.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 2, borderTopColor: COLORS.border },
  totalLabel: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  totalValue: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  addressSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  changeText: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  addAddressCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary + '30' },
  addAddressText: { flex: 1, gap: 2 },
  addAddressTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary },
  addAddressSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  addressIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  addressInfo: { flex: 1, gap: SPACING.xs },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  addressLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  addressName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  addressPhone: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  addressFull: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  paymentSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  paymentMethodCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md },
  paymentMethodIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  paymentMethodInfo: { flex: 1 },
  paymentMethodTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  paymentMethodSubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  placeOrderSection: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  secureText: { textAlign: 'center', marginTop: SPACING.md, fontSize: FONT_SIZES.xs, color: COLORS.textLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
});

export { Image } from 'react-native';
export { InputField } from '../../components/common';
export { useState } from 'react';