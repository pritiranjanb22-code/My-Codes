import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, INDIAN_STATES } from '../../constants';
import { useAuthStore, useAddressStore } from '../../store';
import { useAddresses } from '../../hooks/useApi';
import { Button, Card, InputField } from '../../components/common';
import { Address } from '../../types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { formatAddress } from '../../utils/helpers';

export default function AddressSelectionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params?: { fromCheckout?: boolean } }>();
  const { fromCheckout } = route.params || {};
  
  const { fetchAddresses, setDefaultAddress, deleteAddress, isLoading } = useAddresses();
  const { addresses, setAddresses, defaultAddress } = useAddressStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id || null);

  useEffect(() => {
    fetchAddresses().then((data) => {
      if (data) setAddresses(data);
    });
  }, []);

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleContinue = () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (selectedAddress) {
      if (fromCheckout) {
        navigation.navigate('Checkout', { addressId: selectedAddress.id });
      } else {
        navigation.goBack();
      }
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(addressId) },
      ]
    );
  };

  const handleSetDefault = (address: Address) => {
    setDefaultAddress(address);
    setSelectedAddressId(address.id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery Address</Text>
          <Text style={styles.subtitle}>Select or add a delivery address</Text>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptySubtitle}>Add your first delivery address</Text>
            <Button title="Add Address" onPress={handleAddAddress} variant="primary" fullWidth={false} style={{ marginTop: SPACING.lg }} />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.addressCard,
                  selectedAddressId === item.id && styles.addressCardSelected,
                ]}
                onPress={() => handleSelectAddress(item.id)}
              >
                <View style={styles.addressContent}>
                  <View style={styles.addressMain}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>{item.label}</Text>
                      {item.isDefault && <Badge text="Default" variant="primary" size="xs" />}
                    </View>
                    <Text style={styles.addressName}>{item.fullName}</Text>
                    <Text style={styles.addressPhone}>{item.phone}</Text>
                    <Text style={styles.addressFull}>{formatAddress(item)}</Text>
                  </View>
                  
                  <View style={styles.addressActions}>
                    {!item.isDefault && (
                      <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleSetDefault(item); }}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.actionText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionButton} onPress={(e) => { e.stopPropagation(); handleEditAddress(item); }}>
                      <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButtonDanger} onPress={(e) => { e.stopPropagation(); handleDeleteAddress(item.id); }}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                      <Text style={styles.actionTextDanger}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {selectedAddressId === item.id && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {fromCheckout && (
          <View style={styles.continueButton}>
            <Button
              title="Continue to Checkout"
              onPress={handleContinue}
              fullWidth
              disabled={!selectedAddressId}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingBottom: fromCheckout ? 140 : SPACING.xxl },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  emptyState: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md, marginTop: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  addressContent: { flexDirection: 'row', gap: SPACING.md },
  addressMain: { flex: 1, gap: SPACING.xs },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  addressLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text },
  addressName: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  addressPhone: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  addressFull: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  addressActions: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.md },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.background },
  actionButtonDanger: { backgroundColor: COLORS.error + '10' },
  actionText: { fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.medium, color: COLORS.textSecondary },
  actionTextDanger: { color: COLORS.error },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
  },
  separator: { height: SPACING.md },
  continueButton: { paddingTop: SPACING.lg },
});

import { ActivityIndicator } from 'react-native';
import { Badge } from '../../components/common';