import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants';
import { useCartStore } from '../../store';
import { useCart } from '../../hooks/useApi';
import { Button, Card, Badge, InputField } from '../../components/common';
import { CartItem, Product } from '../../types';
import { formatCurrency, formatCompactCurrency } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function CartScreen() {
  const navigation = useNavigation<any>();
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
  const { getCart, isLoading } = useCart();
  const [deliveryCharge, setDeliveryCharge] = useState(30);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [validating, setValidating] = useState(false);

  const fetchCart = async () => {
    try {
      const cart = await getCart();
      if (cart?.items) {
        cart.items.forEach((item: any) => {
          // This would sync with local store
        });
        recalculate();
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCartStore },
      ]
    );
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setValidating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (promoCode.toUpperCase() === 'WELCOME10') {
        setDiscount(subtotal * 0.1);
        setShowPromoInput(false);
        Alert.alert('Success', '10% discount applied!');
      } else if (promoCode.toUpperCase() === 'SAVE50') {
        setDiscount(50);
        setShowPromoInput(false);
        Alert.alert('Success', '₹50 discount applied!');
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

  const deliveryChargeFinal = subtotal >= freeDeliveryThreshold ? 0 : deliveryCharge;
  const total = subtotal + deliveryChargeFinal - discount;
  const savings = subtotal >= freeDeliveryThreshold 
    ? deliveryCharge 
    : Math.max(0, freeDeliveryThreshold - subtotal);

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="cart-outline" size={80} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some fresh groceries to get started</Text>
          <Button 
            title="Start Shopping" 
            onPress={() => navigation.navigate('Categories')} 
            variant="primary" 
            fullWidth={false} 
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cartItem} onPress={() => navigation.navigate('ProductDetails', { productId: item.productId })}>
                <View style={styles.itemImageContainer}>
                  {item.product?.imageUrl ? (
                    <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemImagePlaceholder, { backgroundColor: COLORS.background }]}>
                      <Ionicons name="fast-food-outline" size={24} color={COLORS.textLight} />
                    </View>
                  )}
                  {item.product?.stockStatus === 'out_of_stock' && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Unknown Product'}</Text>
                    {item.product?.stockStatus === 'out_of_stock' && (
                      <Badge text="Out of Stock" variant="danger" size="xs" />
                    )}
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
                    onPress={() => handleQuantityChange(item.productId, quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color={quantity <= 1 ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, quantity >= (item.product?.stockQuantity || 99) && styles.quantityButtonDisabled]}
                    onPress={() => handleQuantityChange(item.productId, quantity + 1)}
                    disabled={quantity >= (item.product?.stockQuantity || 99)}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={quantity >= (item.product?.stockQuantity || 99) ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

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

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({itemCount} items)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Charge</Text>
              <Text style={styles.summaryValue}>
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
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Continue to Checkout */}
        <View style={styles.checkoutSection}>
          <Button
            title={`Proceed to Checkout - ${formatCurrency(total)}`}
            onPress={() => navigation.navigate('AddressSelection', { fromCheckout: true })}
            fullWidth
            disabled={items.some(item => item.product?.stockStatus === 'out_of_stock')}
          />
          
          {items.some(item => item.product?.stockStatus === 'out_of_stock') && (
            <Text style={styles.outOfStockWarning}>
              Some items are out of stock. Please remove them to proceed.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 140 },
  itemsSection: { padding: SPACING.md },
  cartItem: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.xl, 
    padding: SPACING.md, 
    marginBottom: SPACING.md, 
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  itemImageContainer: { width: 80, height: 80, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', position: 'relative' },
  itemImage: { width: '100%', height: '100%' },
  itemImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  itemDetails: { flex: 1, gap: SPACING.xs },
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, flex: 1 },
  itemUnit: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  itemPrice: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  itemMrp: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, textDecorationLine: 'line-through' },
  itemQuantity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  quantityButton: { width: 36, height: 36, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  quantityButtonDisabled: { opacity: 0.5 },
  quantityValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, minWidth: 30, textAlign: 'center' },
  promoSection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  promoInputContainer: { flexDirection: 'row', gap: SPACING.md },
  promoButtonText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.primary, paddingHorizontal: SPACING.md },
  removePromo: { paddingVertical: SPACING.md },
  removePromoText: { fontSize: FONT_SIZES.sm, color: COLORS.error, fontWeight: FONT_WEIGHTS.medium },
  promoButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  appliedPromo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  appliedPromoInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  appliedPromoText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  summarySection: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.sm },
  summaryTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.md },
  summaryRows: { gap: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  discountLabel: { color: COLORS.success },
  discountValue: { color: COLORS.success },
  freeDelivery: { color: COLORS.success, fontWeight: FONT_WEIGHTS.bold },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  savingsText: { fontSize: FONT_SIZES.sm, color: COLORS.success, fontWeight: FONT_WEIGHTS.medium },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.lg, paddingTop: SPACING.lg, borderTopWidth: 2, borderTopColor: COLORS.border },
  totalLabel: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  totalValue: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.primary },
  checkoutSection: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  outOfStockWarning: { fontSize: FONT_SIZES.sm, color: COLORS.error, textAlign: 'center', marginTop: SPACING.md },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
});

export { ActivityIndicator } from 'react-native';
export { useState } from 'react';