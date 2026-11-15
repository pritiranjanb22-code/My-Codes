import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, AuthTokens, CartItem, Product, Address, Order, Notification, ShopSettings, Category } from '../types';
import { STORAGE_KEYS } from '../constants';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  recalculate: () => void;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  searchResults: Product[];
  isLoading: boolean;
  filters: {
    categoryId?: string;
    search?: string;
    page: number;
    limit: number;
  };
  setProducts: (products: Product[], append?: boolean) => void;
  setCategories: (categories: Category[]) => void;
  setFeaturedProducts: (products: Product[]) => void;
  setCurrentProduct: (product: Product | null) => void;
  setSearchResults: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setFilters: (filters: Partial<ProductState['filters']>) => void;
  clearProducts: () => void;
}

interface AddressState {
  addresses: Address[];
  defaultAddress: Address | null;
  isLoading: boolean;
  setAddresses: (addresses: Address[]) => void;
  addAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (address: Address) => void;
  setLoading: (loading: boolean) => void;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setOrders: (orders: Order[], pagination?: OrderState['pagination']) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

interface ShopState {
  settings: ShopSettings | null;
  isLoading: boolean;
  setSettings: (settings: ShopSettings) => void;
  setLoading: (loading: boolean) => void;
}

// Secure storage adapter for Zustand
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true, isLoading: false }),
      clearAuth: () => set({ user: null, tokens: null, isAuthenticated: false, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ user: state.user, tokens: state.tokens, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      itemCount: 0,
      subtotal: 0,
      addItem: (item) => {
        const items = [...get().items];
        const existingIndex = items.findIndex((i) => i.productId === item.productId);
        
        if (existingIndex >= 0) {
          items[existingIndex] = { ...items[existingIndex], quantity: items[existingIndex].quantity + item.quantity, subtotal: items[existingIndex].subtotal + item.subtotal };
        } else {
          items.push(item);
        }
        
        set({ items });
        get().recalculate();
      },
      updateQuantity: (productId, quantity) => {
        const items = get().items.map((item) =>
          item.productId === productId ? { ...item, quantity, subtotal: item.product.sellingPrice * quantity } : item
        );
        set({ items });
        get().recalculate();
      },
      removeItem: (productId) => {
        const items = get().items.filter((item) => item.productId !== productId);
        set({ items });
        get().recalculate();
      },
      clearCart: () => set({ items: [], itemCount: 0, subtotal: 0 }),
      recalculate: () => {
        const { items } = get();
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        set({ itemCount, subtotal });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  categories: [],
  featuredProducts: [],
  currentProduct: null,
  searchResults: [],
  isLoading: false,
  filters: { page: 1, limit: 20 },
  setProducts: (products, append = false) => set((state) => ({
    products: append ? [...state.products, ...products] : products,
    isLoading: false,
  })),
  setCategories: (categories) => set({ categories }),
  setFeaturedProducts: (products) => set({ featuredProducts: products }),
  setCurrentProduct: (product) => set({ currentProduct: product }),
  setSearchResults: (products) => set({ searchResults: products }),
  setLoading: (isLoading) => set({ isLoading }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearProducts: () => set({ products: [], searchResults: [], currentProduct: null }),
}));

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      addresses: [],
      defaultAddress: null,
      isLoading: false,
      setAddresses: (addresses) => {
        const defaultAddr = addresses.find((a) => a.isDefault) || null;
        set({ addresses, defaultAddress: defaultAddr });
      },
      addAddress: (address) => set((state) => {
        const addresses = address.isDefault
          ? state.addresses.map((a) => ({ ...a, isDefault: false })).concat(address)
          : [...state.addresses, address];
        return { addresses, defaultAddress: address.isDefault ? address : state.defaultAddress };
      }),
      updateAddress: (address) => set((state) => ({
        addresses: state.addresses.map((a) => (a.id === address.id ? address : a)),
        defaultAddress: state.defaultAddress?.id === address.id ? address : state.defaultAddress,
      })),
      removeAddress: (id) => set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== id),
        defaultAddress: state.defaultAddress?.id === id ? null : state.defaultAddress,
      })),
      setDefaultAddress: (address) => set((state) => ({
        addresses: state.addresses.map((a) => ({ ...a, isDefault: a.id === address.id })),
        defaultAddress: address,
      })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'address-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  setOrders: (orders, pagination) => set({ orders, pagination: pagination || { page: 1, limit: 20, total: 0, totalPages: 0 } }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (order) => set((state) => ({
    orders: state.orders.map((o) => (o.id === order.id ? order : o)),
    currentOrder: state.currentOrder?.id === order.id ? order : state.currentOrder,
  })),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
  })),
  markAsRead: (ids) => set((state) => ({
    notifications: state.notifications.map((n) => (ids.includes(n.id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
    unreadCount: state.notifications.filter((n) => !n.isRead && !ids.includes(n.id)).length,
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
    unreadCount: 0,
  })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useShopStore = create<ShopState>((set) => ({
  settings: null,
  isLoading: false,
  setSettings: (settings) => set({ settings }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Combined store for easy access
export const useStore = () => ({
  auth: useAuthStore(),
  cart: useCartStore(),
  products: useProductStore(),
  addresses: useAddressStore(),
  orders: useOrderStore(),
  notifications: useNotificationStore(),
  shop: useShopStore(),
});