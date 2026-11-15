import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS, INDIAN_STATES } from '../../constants';
import { useAuthStore, useAddressStore } from '../../store';
import { useAddresses } from '../../hooks/useApi';
import { Button, InputField, Badge } from '../../components/common';
import { Address } from '../../types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { validatePhone, validatePincode } from '../../utils/helpers';

export default function AddAddressScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<{ params?: { addressId?: string } }>();
  const { addressId } = route.params || {};
  const isEditing = !!addressId;
  
  const { createAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading } = useAddresses();
  const { addresses, setAddresses, defaultAddress } = useAddressStore();
  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    houseNumber: '',
    street: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    latitude: null,
    longitude: null,
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const address = addresses.find(a => a.id === addressId);
      if (address) {
        setFormData({
          label: address.label,
          fullName: address.fullName,
          phone: address.phone,
          houseNumber: address.houseNumber,
          street: address.street,
          area: address.area,
          landmark: address.landmark || '',
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: address.isDefault,
        });
      }
    }
  }, [addressId, addresses, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!validatePhone(formData.phone)) newErrors.phone = 'Enter valid 10-digit mobile number';
    if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House/Building number is required';
    if (!formData.street.trim()) newErrors.street = 'Street name is required';
    if (!formData.area.trim()) newErrors.area = 'Area/Locality is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'PIN code is required';
    else if (!validatePincode(formData.pincode)) newErrors.pincode = 'Enter valid 6-digit PIN code';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const data = {
        label: formData.label,
        fullName: formData.fullName,
        phone: formData.phone,
        houseNumber: formData.houseNumber,
        street: formData.street,
        area: formData.area,
        landmark: formData.landmark || null,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        isDefault: formData.isDefault,
      };
      
      if (isEditing) {
        await updateAddress(addressId!, data);
      } else {
        await createAddress(data);
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await deleteAddress(addressId!);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete address');
          } finally {
            setDeleting(false);
          }
        }},
      ]
    );
  };

  const handleLabelSelect = (label: string) => {
    setFormData(prev => ({ ...prev, label }));
  };

  const labels = ['Home', 'Work', 'Other'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{isEditing ? 'Edit Address' : 'Add New Address'}</Text>
          <Text style={styles.subtitle}>{isEditing ? 'Update your delivery address' : 'Enter delivery details for your orders'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Type</Text>
          <View style={styles.labelButtons}>
            {labels.map(label => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.labelButton,
                  formData.label === label && styles.labelButtonActive,
                ]}
                onPress={() => handleLabelSelect(label)}
              >
                <Text style={[
                  styles.labelButtonText,
                  formData.label === label && styles.labelButtonTextActive,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <InputField
            label="Full Name *"
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Enter full name"
            icon="account"
            autoCapitalize="words"
            error={errors.fullName}
          />

          <InputField
            label="Mobile Number *"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text.replace(/\D/g, '').slice(0, 10) })}
            placeholder="Enter 10-digit mobile number"
            keyboardType="phone-pad"
            icon="call"
            autoCompleteType="tel"
            error={errors.phone}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <InputField
            label="House/Flat/Building No. *"
            value={formData.houseNumber}
            onChangeText={(text) => setFormData({ ...formData, houseNumber: text })}
            placeholder="e.g., 101, A-Wing, Building Name"
            icon="home"
            error={errors.houseNumber}
          />

          <InputField
            label="Street/Locality *"
            value={formData.street}
            onChangeText={(text) => setFormData({ ...formData, street: text })}
            placeholder="Street name, sector, colony"
            icon="map-marker"
            error={errors.street}
          />

          <InputField
            label="Area/Locality *"
            value={formData.area}
            onChangeText={(text) => setFormData({ ...formData, area: text })}
            placeholder="Area, landmark, nearby place"
            icon="map-marker-radius"
            error={errors.area}
          />

          <InputField
            label="Landmark (Optional)"
            value={formData.landmark}
            onChangeText={(text) => setFormData({ ...formData, landmark: text })}
            placeholder="Nearby landmark for easy location"
            icon="flag"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>City & PIN</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City *"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Enter city name"
                icon="city"
                error={errors.city}
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State *"
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="Select state"
                icon="map"
                error={errors.state}
                rightElement={
                  <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="chevron-down" size={22} color={COLORS.textLight} />
                  </TouchableOpacity>
                }
              />
            </View>
          </View>

          <InputField
            label="PIN Code *"
            value={formData.pincode}
            onChangeText={(text) => setFormData({ ...formData, pincode: text.replace(/\D/g, '').slice(0, 6) })}
            placeholder="6-digit PIN code"
            keyboardType="number-pad"
            icon="pin"
            error={errors.pincode}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location (Optional)</Text>
          <View style={styles.locationRow}>
            <TouchableOpacity style={styles.locationButton} onPress={() => {}}>
              <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
              <Text style={styles.locationButtonText}>Use Current Location</Text>
            </TouchableOpacity>
            {formData.latitude && formData.longitude && (
              <Badge text={`📍 ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`} variant="info" size="sm" />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.checkboxRow,
              formData.isDefault && styles.checkboxRowActive,
            ]}
            onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
          >
            <View style={[
              styles.checkbox,
              formData.isDefault && styles.checkboxChecked,
            ]}>
              {formData.isDefault && <Ionicons name="checkmark" size={20} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Set as default delivery address</Text>
          </TouchableOpacity>
        </View>

        {isEditing && (
          <View style={styles.deleteSection}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Address'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={isEditing ? 'Update Address' : 'Save Address'}
          onPress={handleSubmit}
          loading={submitting}
          fullWidth
          disabled={submitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.lg, paddingBottom: 140 },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: FONT_SIZES.xxxl, fontWeight: FONT_WEIGHTS.bold, color: COLORS.text },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.text, marginBottom: SPACING.md },
  labelButtons: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap' },
  labelButton: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  labelButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  labelButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
  labelButtonTextActive: { color: '#fff', fontWeight: FONT_WEIGHTS.semiBold },
  row: { flexDirection: 'row', gap: SPACING.md },
  halfWidth: { flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  locationButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '10', borderWidth: 1, borderColor: COLORS.primary + '30' },
  locationButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.primary },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background },
  checkboxRowActive: { backgroundColor: COLORS.primary + '10' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text, flex: 1 },
  deleteSection: { marginTop: SPACING.lg },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.error + '10', borderWidth: 1, borderColor: COLORS.error + '30' },
  deleteButtonText: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semiBold, color: COLORS.error },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, padding: SPACING.lg, paddingBottom: SPACING.xl },
});

import { ActivityIndicator } from 'react-native';