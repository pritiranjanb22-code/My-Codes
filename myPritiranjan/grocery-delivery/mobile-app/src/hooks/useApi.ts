import { useCallback, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { clearAuth } = useAuthStore();

  const execute = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    options?: { onSuccess?: (data: T) => void; onError?: (error: Error) => void; showLoader?: boolean }
  ) => {
    if (options?.showLoader !== false) setIsLoading(true);
    setError(null);

    try {
      const data = await apiCall();
      options?.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const error = err as Error & { status?: number };
      setError(error);
      
      // Handle 401 - token expired, auth store will handle logout
      if (error.status === 401) {
        clearAuth();
      }
      
      options?.onError?.(error);
      throw error;
    } finally {
      if (options?.showLoader !== false) setIsLoading(false);
    }
  }, [clearAuth]);

  return { execute, isLoading, error, setError };
}

// Specific API hooks
export function useAuth() {
  const { execute, isLoading, error } = useApi();
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  const login = useCallback(async (phone: string, password?: string, otp?: string) => {
    return execute(
      () => api.login(phone, password, otp),
      {
        onSuccess: (data) => setAuth(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken }),
      }
    );
  }, [execute, setAuth]);

  const register = useCallback(async (phone: string, name: string, email?: string) => {
    return execute(
      () => api.sendOtp(phone, 'register'),
      {
        onSuccess: () => {}, // OTP sent, user needs to verify
      }
    );
  }, [execute]);

  const verifyOtp = useCallback(async (phone: string, code: string, purpose: 'login' | 'register' | 'forgot_password' = 'login', name?: string, email?: string) => {
    return execute(
      () => api.verifyOtp(phone, code, purpose, name, email),
      {
        onSuccess: (data) => {
          if (data.accessToken) {
            setAuth(data.user, { accessToken: data.accessToken, refreshToken: data.refreshToken });
          }
        },
      }
    );
  }, [execute, setAuth]);

  const logout = useCallback(async () => {
    await execute(() => api.logout());
    clearAuth();
  }, [execute, clearAuth]);

  const forgotPassword = useCallback(async (phone: string) => {
    return execute(() => api.forgotPassword(phone));
  }, [execute]);

  const resetPassword = useCallback(async (phone: string, otp: string, newPassword: string) => {
    return execute(() => api.resetPassword(phone, otp, newPassword));
  }, [execute]);

  return { login, register, verifyOtp, logout, forgotPassword, resetPassword, isLoading, error };
}

export function useProducts() {
  const { execute, isLoading, error } = useApi();
  const { setProducts, setCategories, setFeaturedProducts, setCurrentProduct, setSearchResults, setLoading, setFilters, clearProducts } = useProductStore();

  const fetchProducts = useCallback(async (filters?: any, append = false) => {
    return execute(
      () => api.getProducts(filters),
      {
        onSuccess: (data) => {
          setProducts(data.products || data, append);
          if (data.meta) setFilters({ page: data.meta.page, limit: data.meta.limit });
        },
      }
    );
  }, [execute, setProducts, setFilters]);

  const fetchCategories = useCallback(async () => {
    return execute(
      () => api.getCategories(),
      { onSuccess: setCategories }
    );
  }, [execute, setCategories]);

  const fetchFeaturedProducts = useCallback(async (limit = 10) => {
    return execute(
      () => api.getFeaturedProducts(limit),
      { onSuccess: setFeaturedProducts }
    );
  }, [execute, setFeaturedProducts]);

  const fetchProductById = useCallback(async (id: string) => {
    return execute(
      () => api.getProductById(id),
      { onSuccess: setCurrentProduct }
    );
  }, [execute, setCurrentProduct]);

  const searchProducts = useCallback(async (query: string, limit = 20) => {
    return execute(
      () => api.searchProducts(query, limit),
      { onSuccess: setSearchResults }
    );
  }, [execute, setSearchResults]);

  return { fetchProducts, fetchCategories, fetchFeaturedProducts, fetchProductById, searchProducts, isLoading, error };
}

export function useCart() {
  const { execute, isLoading, error } = useApi();
  const { items, addItem, updateQuantity, removeItem, clearCart, recalculate, itemCount, subtotal } = useCartStore();

  const addToCart = useCallback(async (productId: string, quantity: number, product: any) => {
    return execute(
      () => api.addToCart(productId, quantity),
      {
        onSuccess: (cart) => {
          // Update local cart with server response
          // For now, just add locally
          addItem({
            id: `${productId}-${Date.now()}`,
            productId,
            product,
            quantity,
            subtotal: product.sellingPrice * quantity,
          });
        },
      }
    );
  }, [execute, addItem]);

  const updateCartQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    return execute(
      () => api.updateCartItem(productId, quantity),
      {
        onSuccess: () => updateQuantity(productId, quantity),
      }
    );
  }, [execute, updateQuantity]);

  const removeFromCart = useCallback(async (productId: string) => {
    return execute(
      () => api.removeFromCart(productId),
      { onSuccess: () => removeItem(productId) }
    );
  }, [execute, removeItem]);

  const clearCartItems = useCallback(async () => {
    return execute(
      () => api.clearCart(),
      { onSuccess: clearCart }
    );
  }, [execute, clearCart]);

  const validateCart = useCallback(async () => {
    return execute(
      () => api.validateCart(),
      { showLoader: false }
    );
  }, [execute]);

  return { addToCart, updateCartQuantity, removeFromCart, clearCart: clearCartItems, validateCart, isLoading, error };
}

export function useOrders() {
  const { execute, isLoading, error } = useApi();
  const { setOrders, addOrder, updateOrder, setCurrentOrder, setLoading } = useOrderStore();

  const createOrder = useCallback(async (data: { addressId: string; notes?: string; couponCode?: string }) => {
    return execute(
      () => api.createOrder(data),
      { onSuccess: (order) => addOrder(order) }
    );
  }, [execute, addOrder]);

  const fetchOrders = useCallback(async (page = 1, limit = 20, status?: string) => {
    return execute(
      () => api.getOrders(page, limit, status),
      {
        onSuccess: (data) => {
          setOrders(data.orders || data, data.meta);
        },
      }
    );
  }, [execute, setOrders]);

  const fetchOrderById = useCallback(async (id: string) => {
    return execute(
      () => api.getOrderById(id),
      { onSuccess: setCurrentOrder }
    );
  }, [execute, setCurrentOrder]);

  const submitPaymentConfirmation = useCallback(async (id: string, data: { utrNumber: string; paymentAmount: number; paymentDate: string; paymentScreenshot?: string }) => {
    return execute(
      () => api.submitPaymentConfirmation(id, data),
      { onSuccess: setCurrentOrder }
    );
  }, [execute, setCurrentOrder]);

  const reorder = useCallback(async (id: string) => {
    return execute(
      () => api.reorder(id),
      { onSuccess: () => {} }
    );
  }, [execute]);

  return { createOrder, fetchOrders, fetchOrderById, submitPaymentConfirmation, reorder, isLoading, error };
}

export function useAddresses() {
  const { execute, isLoading, error } = useApi();
  const { setAddresses, addAddress, updateAddress, removeAddress, setDefaultAddress, setLoading } = useAddressStore();

  const fetchAddresses = useCallback(async () => {
    return execute(
      () => api.getAddresses(),
      { onSuccess: setAddresses }
    );
  }, [execute, setAddresses]);

  const createAddress = useCallback(async (data: any) => {
    return execute(
      () => api.createAddress(data),
      { onSuccess: addAddress }
    );
  }, [execute, addAddress]);

  const updateAddressItem = useCallback(async (id: string, data: any) => {
    return execute(
      () => api.updateAddress(id, data),
      { onSuccess: updateAddress }
    );
  }, [execute, updateAddress]);

  const deleteAddress = useCallback(async (id: string) => {
    return execute(
      () => api.deleteAddress(id),
      { onSuccess: () => removeAddress(id) }
    );
  }, [execute, removeAddress]);

  const setDefault = useCallback(async (id: string) => {
    return execute(
      () => api.setDefaultAddress(id),
      { onSuccess: (address) => setDefaultAddress(address) }
    );
  }, [execute, setDefaultAddress]);

  return { fetchAddresses, createAddress, updateAddress: updateAddressItem, deleteAddress, setDefault, isLoading, error };
}

export function useNotifications() {
  const { execute, isLoading, error } = useApi();
  const { setNotifications, addNotification, markAsRead, markAllAsRead, setUnreadCount, setLoading } = useNotificationStore();

  const fetchNotifications = useCallback(async (page = 1, limit = 20, unreadOnly = false) => {
    return execute(
      () => api.getNotifications(page, limit, unreadOnly),
      { onSuccess: (data) => setNotifications(data.notifications || data) }
    );
  }, [execute, setNotifications]);

  const markNotificationsRead = useCallback(async (notificationIds?: string[]) => {
    return execute(
      () => api.markNotificationsRead(notificationIds),
      { onSuccess: () => notificationIds ? markAsRead(notificationIds) : markAllAsRead() }
    );
  }, [execute, markAsRead, markAllAsRead]);

  const fetchUnreadCount = useCallback(async () => {
    return execute(
      () => api.getUnreadNotificationCount(),
      { onSuccess: (data) => setUnreadCount(data.count), showLoader: false }
    );
  }, [execute, setUnreadCount]);

  return { fetchNotifications, markNotificationsRead, fetchUnreadCount, isLoading, error };
}

export function useShop() {
  const { execute, isLoading, error } = useApi();
  const { setSettings, setLoading } = useShopStore();

  const fetchSettings = useCallback(async () => {
    return execute(
      () => api.getShopSettings(),
      { onSuccess: setSettings }
    );
  }, [execute, setSettings]);

  return { fetchSettings, isLoading, error };
}

import { useProductStore } from '../store';