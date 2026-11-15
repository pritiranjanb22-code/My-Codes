import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, CATEGORIES, ORDER_STATUS_LABELS } from '../../constants';
import { useAuthStore, useProductStore, useCartStore, useOrderStore, useShopStore } from '../../store';
import { useProducts, useCart, useOrders, useShop } from '../../hooks/useApi';
import { Button, Card, Badge, Avatar } from '../../components/common';
import { Product, Category, Order } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { fetchProducts, fetchCategories, fetchFeaturedProducts, isLoading: productsLoading } = useProducts();
  const { fetchSettings, isLoading: shopLoading } = useShop();
  const { items: cartItems, itemCount } = useCartStore();
  const { orders, fetchOrders } = useOrders();
  const { fetchFeaturedProducts: fetchFeatured } = useProducts();
  const [refreshing, setRefreshing] = useState(false);
  const [shopSettings, setShopSettings] = useState<any>(null);

  const featuredProducts = useProductStore((state) => state.featuredProducts);
  const categories = useProductStore((state) => state.categories);
  const recentOrders = orders.slice(0, 3);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProducts({ page: 1, limit: 10, isFeatured: true }),
      fetchCategories(),
      fetchFeatured(8),
      fetchOrders(1, 5),
      fetchSettings(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryProducts', { categoryId: category.id, categoryName: category.name });
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleViewAllOrders = () => {
    navigation.navigate('Orders');
  };

  const handleViewAllCategories = () => {
    navigation.navigate('Categories');
  };

  const handleViewAllProducts = () => {
    navigation.navigate('Categories');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const user = useAuthStore((state) => state.user);
  const cartCount = useCartStore((state) => state.itemCount);

  if (productsLoading || shopLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          progressViewOffset={60}
        />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}, {user?.fullName?.split(' ')[0] || 'Guest'}</Text>
            <Text style={styles.location}>📍 {shopSettings?.shopAddress?.split(',')[0] || 'Your Location'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
            <View style={styles.cartIconContainer}>
              <MaterialCommunityIcons name="cart-outline" size={26} color={COLORS.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cartText}>Cart</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
        <Ionicons name="search-outline" size={22} color={COLORS.textLight} style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search for products, brands...</Text>
      </TouchableOpacity>

      {/* Shop Info Banner */}
      {shopSettings && (
        <View style={styles.shopBanner}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{shopSettings.shopName || 'Fresh Mart Grocery'}</Text>
            <Text style={styles.shopTagline}>📞 {shopSettings.shopPhone || '+91-9876543210'} • ⏰ {shopSettings.shopOpeningHours || '8 AM - 10 PM'}</Text>
          </View>
          <View style={styles.shopOffer}>
            <Text style={styles.offerText}>FREE DELIVERY on orders above ₹{shopSettings.freeDeliveryThreshold || 500}</Text>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={handleViewAllCategories}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories.length > 0 ? categories : CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        keyExtractor={(item) => item.id || item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress(item as Category)}>
            <View style={styles.categoryIcon}>
              <Text style={styles.categoryIconText}>{item.icon || '📦'}</Text>
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Featured Products */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Popular Products</Text>
          <Badge text="Hot" variant="danger" size="sm" />
        </View>
        <TouchableOpacity onPress={handleViewAllProducts}>
          <Text style={styles.seeAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={featuredProducts}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => handleProductPress(item)}>
            <View style={styles.productImageContainer}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImagePlaceholder, { backgroundColor: COLORS.background }]}>
                  <Ionicons name="fast-food-outline" size={32} color={COLORS.textLight} />
                </View>
              )}
              {item.discountPercentage > 0 && (
                <Badge text={`${item.discountPercentage}% OFF`} variant="danger" size="sm" style={styles.discountBadge} />
              )}
              {item.stockStatus === 'low_stock' && (
                <Badge text="Low Stock" variant="warning" size="sm" style={{ ...styles.discountBadge, top: 36 }} />
              )}
              {item.stockStatus === 'out_of_stock' && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productUnit} numberOfLines={1}>{item.brand || ''} • {item.unit}</Text>
              <View style={styles.productPriceRow}>
                <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
                {item.mrpPrice && item.mrpPrice > item.sellingPrice && (
                  <Text style={styles.productMrp}>{formatCurrency(item.mrpPrice)}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={handleViewAllOrders}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={recentOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.orderCard} onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdLabel}>Order #{item.orderNumber.slice(-6)}</Text>
                    <Badge 
                      text={ORDER_STATUS_LABELS[item.status] || item.status} 
                      variant={
                        item.status === 'delivered' ? 'success' :
                        item.status === 'cancelled' ? 'danger' :
                        item.status === 'out_for_delivery' ? 'warning' : 'info'
                      } 
                      size="sm" 
                    />
                  </View>
                  <Text style={styles.orderDate}>{formatDate(item.createdAt, 'DD MMM YYYY')}</Text>
                </View>
                <View style={styles.orderItemsPreview}>
                  {item.items.slice(0, 2).map((orderItem) => (
                    <View key={orderItem.id} style={styles.orderItemPreview}>
                      <Text style={styles.orderItemName}>{orderItem.productName}</Text>
                      <Text style={styles.orderItemQty}>×{orderItem.quantity} {orderItem.unit}</Text>
                    </View>
                  ))}
                  {item.items.length > 2 && (
                    <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>
                  )}
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>{formatCurrency(item.totalAmount)}</Text>
                  <Button
                    title={item.status === 'delivered' ? 'Order Again' : 'Track Order'}
                    variant={item.status === 'delivered' ? 'outline' : 'primary'}
                    onPress={() => item.status === 'delivered' 
                      ? navigation.navigate('Cart') 
                      : navigation.navigate('OrderTracking', { orderId: item.id })}
                    fullWidth={false}
                    style={{ height: 36, paddingHorizontal: 16 }}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Empty State for Orders */}
      {recentOrders.length === 0 && orders.length === 0 && !isLoading && (
        <Card style={styles.emptyOrdersCard}>
          <Ionicons name="bag-handle-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Start shopping to see your orders here</Text>
          <Button title="Start Shopping" onPress={() => navigation.navigate('Categories')} variant="primary" fullWidth={false} style={{ marginTop: SPACING.md }} />
        </Card>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  headerLeft: { flex: 1 },
  greetingContainer: { gap: 2 },
  greeting: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  location: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  iconButton: { padding: SPACING.xs, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  cartButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '10' },
  cartIconContainer: { position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { fontSize: 10, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  cartText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.primary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.md,
  },
  searchIcon: { marginLeft: SPACING.xs },
  searchPlaceholder: { fontSize: FONT_SIZES.md, color: COLORS.textLight, flex: 1 },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md,
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  shopTagline: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  shopOffer: { paddingHorizontal: SPACING.md },
  offerText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.round },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  seeAll: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  categoryList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  categoryCard: { alignItems: 'center', width: 80, gap: SPACING.xs },
  categoryIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  categoryIconText: { fontSize: 28 },
  categoryName: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, textAlign: 'center' },
  productList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  productCard: { width: 160, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, overflow: 'hidden', ...SHADOWS.sm },
  productImageContainer: { position: 'relative', height: 140 },
  productImage: { width: '100%', height: '100%' },
  productImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  discountBadge: { position: 'absolute', top: 8, left: 8, zIndex: 1 },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  productInfo: { padding: SPACING.md, gap: 4 },
  productName: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, lineHeight: 18 },
  productUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xs },
  productPrice: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  productMrp: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, textDecorationLine: 'line-through' },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  orderIdContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  orderIdLabel: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  orderDate: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  orderItemsPreview: { gap: SPACING.xs, marginBottom: SPACING.md },
  orderItemPreview: { flexDirection: 'row', justifyContent: 'space-between' },
  orderItemName: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  orderItemQty: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  moreItems: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: SPACING.xs },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderTotal: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  emptyOrdersCard: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md, marginHorizontal: SPACING.lg, marginTop: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
});

import { ActivityIndicator } from 'react-native';