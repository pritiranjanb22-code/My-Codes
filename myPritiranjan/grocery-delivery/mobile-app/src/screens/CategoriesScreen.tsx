import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, CATEGORIES } from '../../constants';
import { useProductStore } from '../../store';
import { useProducts } from '../../hooks/useApi';
import { Card, Badge } from '../../components/common';
import { Category } from '../../types';
import { useNavigation } from '@react-navigation/native';

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const { fetchCategories, isLoading } = useProducts();
  const { categories, setCategories } = useProductStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchCategories();
      if (data) setCategories(data);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    onRefresh();
  }, []);

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('CategoryProducts', { categoryId: category.id, categoryName: category.name });
  };

  if (isLoading && categories.length === 0) {
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
        />
      }
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>All Categories</Text>
        <Text style={styles.subtitle}>Explore our product categories</Text>
      </View>

      <FlatList
        data={categories.length > 0 ? categories : CATEGORIES}
        numColumns={2}
        columnWrapperStyle={styles.categoryGrid}
        keyExtractor={(item) => item.id || item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress(item as Category)}>
            <View style={styles.categoryImageContainer}>
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryIconText}>{item.icon || '📦'}</Text>
              </View>
              {item.productCount && item.productCount > 0 && (
                <Badge text={`${item.productCount} items`} variant="info" size="sm" style={styles.countBadge} />
              )}
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  categoryGrid: { justifyContent: 'space-between' },
  categoryCard: { 
    flex: 1, 
    aspectRatio: 1, 
    borderRadius: BORDER_RADIUS.xl, 
    backgroundColor: COLORS.surface, 
    overflow: 'hidden', 
    ...SHADOWS.sm,
    padding: SPACING.md,
  },
  categoryImageContainer: { position: 'relative', alignItems: 'center', marginBottom: SPACING.md },
  categoryIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  categoryIconText: { fontSize: 32 },
  countBadge: { position: 'absolute', bottom: -8, right: -8 },
  categoryName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, textAlign: 'center' },
  separator: { height: SPACING.lg },
});

import { ActivityIndicator } from 'react-native';