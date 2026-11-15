import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, UNITS } from '../../constants';
import { useProductStore, useCartStore } from '../../store';
import { useProducts, useCart } from '../../hooks/useApi';
import { Button, Badge, Card, InputField } from '../../components/common';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params: { productId: string } }>();
  const { productId } = route.params;
  
  const { fetchProductById, isLoading: productLoading } = useProducts();
  const { addToCart } = useCart();
  const { setCurrentProduct } = useProductStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(productId);
        if (data) {
          setProduct(data);
          setCurrentProduct(data);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      }
    };
    loadProduct();
  }, [productId, fetchProductById]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    const minQty = product?.minOrderQuantity || 1;
    const maxQty = product?.maxOrderQuantity || 99;
    const stock = product?.stockQuantity || 0;
    
    if (newQuantity < minQty) return;
    if (newQuantity > maxQty) return;
    if (newQuantity > stock) return;
    
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id, quantity, product);
      navigation.navigate('Cart');
    } catch (error) {
      console.error('Add to cart failed:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id, quantity, product);
      navigation.navigate('Checkout');
    } catch (error) {
      console.error('Buy now failed:', error);
    }
  };

  if (productLoading && !product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Product not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} variant="primary" fullWidth={false} />
      </View>
    );
  }

  const images = product.imagesUrls && product.imagesUrls.length > 0 
    ? product.imagesUrls 
    : product.imageUrl 
      ? [product.imageUrl] 
      : [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={productLoading}
            onRefresh={() => fetchProductById(productId)}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Product Images */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.mainImageContainer}
            onPress={() => setShowImageViewer(true)}
          >
            {images.length > 0 ? (
              <Image source={{ uri: images[selectedImage] }} style={styles.mainImage} resizeMode="contain" />
            ) : (
              <View style={[styles.mainImagePlaceholder, { backgroundColor: COLORS.background }]}>
                <Ionicons name="fast-food-outline" size={64} color={COLORS.textLight} />
              </View>
            )}
            {product.stockStatus === 'out_of_stock' && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
            {product.stockStatus === 'low_stock' && (
              <Badge text="Only few left!" variant="warning" size="sm" style={styles.stockBadge} />
            )}
          </TouchableOpacity>

          {images.length > 1 && (
            <FlatList
              data={images}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailList}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.thumbnail,
                    selectedImage === index && styles.thumbnailSelected,
                  ]}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image source={{ uri: item }} style={styles.thumbnailImage} resizeMode="cover" />
                </TouchableOpacity>
              )}
            />
          )}

          {/* Product Badges */}
          <View style={styles.badgesRow}>
            {product.discountPercentage > 0 && (
              <Badge text={`${product.discountPercentage}% OFF`} variant="danger" size="md" />
            )}
            {product.isFeatured && (
              <Badge text="Popular" variant="warning" size="sm" />
            )}
            {product.stockStatus === 'low_stock' && (
              <Badge text="Low Stock" variant="warning" size="sm" />
            )}
            {product.stockStatus === 'out_of_stock' && (
              <Badge text="Out of Stock" variant="danger" size="sm" />
            )}
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <View style={styles.brandRow}>
              {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
              <Text style={styles.category}>{product.category?.name || 'General'}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>{formatCurrency(product.sellingPrice)}</Text>
            {product.mrpPrice && product.mrpPrice > product.sellingPrice && (
              <>
                <Text style={styles.mrpPrice}>{formatCurrency(product.mrpPrice)}</Text>
                <Badge text={`${product.discountPercentage}% OFF`} variant="danger" size="sm" />
              </>
            )}
            <Text style={styles.unitPrice}>/ {product.unit}</Text>
          </View>

          {/* Stock Status */}
          <View style={styles.stockStatus}>
            <View style={[
              styles.stockIndicator,
              product.stockStatus === 'in_stock' ? styles.inStock : 
              product.stockStatus === 'low_stock' ? styles.lowStock : styles.outStock
            ]} />
            <Text style={[
              styles.stockText,
              product.stockStatus === 'in_stock' ? styles.inStockText : 
              product.stockStatus === 'low_stock' ? styles.lowStockText : styles.outStockText
            ]}>
              {product.stockStatus === 'in_stock' ? 'In Stock' : 
               product.stockStatus === 'low_stock' ? `Only ${product.stockQuantity} ${product.unit} left` : 'Out of Stock'}
            </Text>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Unit</Text>
                <Text style={styles.detailValue}>{product.unit}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Min Order</Text>
                <Text style={styles.detailValue}>{product.minOrderQuantity} {product.unit}</Text>
              </View>
              {product.maxOrderQuantity && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Max Order</Text>
                  <Text style={styles.detailValue}>{product.maxOrderQuantity} {product.unit}</Text>
                </View>
              )}
              {product.brand && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Brand</Text>
                  <Text style={styles.detailValue}>{product.brand}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity Selector & Add to Cart */}
          {product.stockStatus !== 'out_of_stock' && (
            <View style={styles.actionSection}>
              <View style={styles.quantitySelector}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(-1)}
                    disabled={quantity <= (product.minOrderQuantity || 1)}
                  >
                    <MaterialCommunityIcons name="minus" size={24} color={quantity <= (product.minOrderQuantity || 1) ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.maxOrderQuantity || product.stockQuantity || 99)}
                  >
                    <MaterialCommunityIcons name="plus" size={24} color={quantity >= (product.maxOrderQuantity || product.stockQuantity || 99) ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actionButtons} style={{ marginTop: SPACING.md }}>
                <Button
                  title="Add to Cart"
                  onPress={handleAddToCart}
                  variant="outline"
                  fullWidth
                  icon="cart-outline"
                />
                <Button
                  title="Buy Now"
                  onPress={handleBuyNow}
                  fullWidth
                  icon="flash-outline"
                  style={{ marginTop: SPACING.md }}
                />
              </View>
            </View>
          )}

          {product.stockStatus === 'out_of_stock' && (
            <View style={styles.outOfStockAction}>
              <Ionicons name="sad-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.outOfStockTitle}>Currently Unavailable</Text>
              <Text style={styles.outOfStockMessage}>We'll notify you when it's back in stock</Text>
              <Button title="Notify Me" variant="outline" fullWidth={false} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Bar for Mobile */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <Text style={styles.bottomPrice}>{formatCurrency(product.sellingPrice * quantity)}</Text>
          <View style={styles.bottomActions}>
            <Button
              title="Add to Cart"
              onPress={handleAddToCart}
              variant="outline"
              fullWidth={false}
              icon="cart-outline"
              style={{ width: 140 }}
            />
            <Button
              title="Buy Now"
              onPress={handleBuyNow}
              fullWidth={false}
              icon="flash-outline"
              style={{ width: 140 }}
            />
          </View>
        </View>
      </View>

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <View style={styles.imageViewer}>
          <TouchableOpacity style={styles.imageViewerClose} onPress={() => setShowImageViewer(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImage}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setSelectedImage(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.imageViewerImage} resizeMode="contain" />
            )}
            keyExtractor={(_, index) => index.toString()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
  errorTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, textAlign: 'center' },
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollContent: { paddingBottom: 120 },
  imageSection: { backgroundColor: COLORS.surface },
  mainImageContainer: { height: 300, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  mainImage: { width: '100%', height: '100%' },
  mainImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  outOfStockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  outOfStockText: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: '#fff' },
  stockBadge: { position: 'absolute', top: SPACING.md, right: SPACING.md },
  thumbnailList: { paddingHorizontal: SPACING.lg, gap: SPACING.md },
  thumbnail: { width: 80, height: 80, borderRadius: BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbnailSelected: { borderColor: COLORS.primary },
  thumbnailImage: { width: '100%', height: '100%' },
  badgesRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, flexWrap: 'wrap' },
  infoSection: { padding: SPACING.lg, backgroundColor: COLORS.surface, marginTop: SPACING.md },
  infoHeader: { gap: SPACING.xs },
  productName: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xs },
  brand: { fontSize: FONT_SIZES.md, color: COLORS.primary, fontWeight: FONT_WEIGHTS.medium },
  category: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md, flexWrap: 'wrap' },
  currentPrice: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  mrpPrice: { fontSize: FONT_SIZES.lg, color: COLORS.textLight, textDecorationLine: 'line-through' },
  unitPrice: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginLeft: SPACING.xs },
  stockStatus: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  stockIndicator: { width: 10, height: 10, borderRadius: 5 },
  inStock: { backgroundColor: COLORS.success },
  lowStock: { backgroundColor: COLORS.warning },
  outStock: { backgroundColor: COLORS.error },
  stockText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium },
  inStockText: { color: COLORS.success },
  lowStockText: { color: COLORS.warning },
  outStockText: { color: COLORS.error },
  descriptionSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, marginBottom: SPACING.md },
  descriptionText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, lineHeight: 24 },
  detailsSection: { marginTop: SPACING.lg, paddingHorizontal: SPACING.lg },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  detailItem: { flex: 1, minWidth: '45%', backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  detailLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, marginTop: 2 },
  actionSection: { padding: SPACING.lg, backgroundColor: COLORS.surface, marginTop: SPACING.md },
  quantitySelector: { marginBottom: SPACING.md },
  quantityLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, marginBottom: SPACING.sm },
  quantityControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  quantityButton: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  quantityValue: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text, minWidth: 40, textAlign: 'center' },
  actionButtons: { gap: SPACING.md },
  outOfStockAction: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md, backgroundColor: COLORS.surface, marginTop: SPACING.md, borderRadius: BORDER_RADIUS.xl, marginHorizontal: SPACING.lg },
  outOfStockTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  outOfStockMessage: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.md, paddingBottom: SPACING.xl },
  bottomBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 600, marginHorizontal: 'auto' },
  bottomPrice: { fontSize: FONT_SIZES.xl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  bottomActions: { flexDirection: 'row', gap: SPACING.md },
  imageViewer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 1000 },
  imageViewerClose: { position: 'absolute', top: 50, right: 20, zIndex: 1001 },
  imageViewerImage: { width: '100%', height: '100%' },
});

import { ActivityIndicator } from 'react-native';