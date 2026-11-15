import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, API_CONFIG } from '../constants';
import { ApiResponse } from '../types';

class ApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.clearAuth();
            // Redirect to login would be handled by auth context
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): Error & { code?: string; details?: any; status?: number } {
    const normalizedError = new Error(
      error.response?.data?.error || error.message || 'An error occurred'
    ) as Error & { code?: string; details?: any; status?: number };

    normalizedError.code = error.response?.data?.code;
    normalizedError.details = error.response?.data?.details;
    normalizedError.status = error.response?.status;

    return normalizedError;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
      
      this.refreshTokenPromise = null;
      return accessToken;
    })();

    return this.refreshTokenPromise;
  }

  private async clearAuth() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  }

  // Auth endpoints
  async sendOtp(phone: string, purpose: 'login' | 'register' | 'forgot_password' = 'login') {
    return this.post('/auth/send-otp', { phone, purpose });
  }

  async verifyOtp(phone: string, code: string, purpose: 'login' | 'register' | 'forgot_password' = 'login', name?: string, email?: string, fcmToken?: string) {
    return this.post('/auth/verify-otp', { phone, code, purpose, name, email, fcmToken });
  }

  async login(phone: string, password?: string, otp?: string, fcmToken?: string) {
    return this.post('/auth/login', { phone, password, otp, fcmToken });
  }

  async register(phone: string, name: string, email?: string, fcmToken?: string) {
    // First send OTP, then verify
    await this.sendOtp(phone, 'register');
    // OTP verification handled separately
  }

  async refreshToken(refreshToken: string) {
    return this.post('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken?: string) {
    return this.post('/auth/logout', { refreshToken });
  }

  async forgotPassword(phone: string) {
    return this.post('/auth/forgot-password', { phone });
  }

  async resetPassword(phone: string, otp: string, newPassword: string) {
    return this.post('/auth/reset-password', { phone, otp, newPassword });
  }

  // Customer endpoints
  async getProfile() {
    return this.get('/customer/profile');
  }

  async updateProfile(data: any) {
    return this.put('/customer/profile', data);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.put('/customer/profile/password', { currentPassword, newPassword });
  }

  // Addresses
  async getAddresses() {
    return this.get('/customer/addresses');
  }

  async getDefaultAddress() {
    return this.get('/customer/addresses/default');
  }

  async createAddress(data: any) {
    return this.post('/customer/addresses', data);
  }

  async updateAddress(id: string, data: any) {
    return this.put(`/customer/addresses/${id}`, data);
  }

  async deleteAddress(id: string) {
    return this.delete(`/customer/addresses/${id}`);
  }

  async setDefaultAddress(id: string) {
    return this.put(`/customer/addresses/${id}/default`);
  }

  // Cart
  async getCart() {
    return this.get('/customer/cart');
  }

  async addToCart(productId: string, quantity: number) {
    return this.post('/customer/cart', { productId, quantity });
  }

  async updateCartItem(productId: string, quantity: number) {
    return this.put(`/customer/cart/${productId}`, { quantity });
  }

  async removeFromCart(productId: string) {
    return this.delete(`/customer/cart/${productId}`);
  }

  async clearCart() {
    return this.delete('/customer/cart');
  }

  async validateCart() {
    return this.get('/customer/cart/validate');
  }

  // Orders
  async createOrder(data: { addressId: string; notes?: string; couponCode?: string }) {
    return this.post('/customer/orders', data);
  }

  async getOrders(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    return this.get(`/customer/orders?${params.toString()}`);
  }

  async getOrderById(id: string) {
    return this.get(`/customer/orders/${id}`);
  }

  async submitPaymentConfirmation(id: string, data: { utrNumber: string; paymentAmount: number; paymentDate: string; paymentScreenshot?: string }) {
    return this.post(`/customer/orders/${id}/payment-confirmation`, data);
  }

  async reorder(id: string) {
    return this.post(`/customer/orders/${id}/reorder`);
  }

  // Products
  async getProducts(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    return this.get(`/customer/products?${params.toString()}`);
  }

  async getProductById(id: string) {
    return this.get(`/customer/products/${id}`);
  }

  async searchProducts(query: string, limit = 20) {
    return this.get(`/customer/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getCategories() {
    return this.get('/customer/categories');
  }

  async getFeaturedProducts(limit = 10) {
    return this.get(`/customer/products/featured?limit=${limit}`);
  }

  async getShopSettings() {
    return this.get('/customer/shop-settings');
  }

  // Notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (unreadOnly) params.append('unreadOnly', 'true');
    return this.get(`/customer/notifications?${params.toString()}`);
  }

  async markNotificationsRead(notificationIds?: string[]) {
    return this.put('/customer/notifications/read', { notificationIds });
  }

  async getUnreadNotificationCount() {
    return this.get('/customer/notifications/unread-count');
  }

  // Admin endpoints (for admin dashboard app)
  async getDashboardStats() {
    return this.get('/admin/dashboard');
  }

  async getAllOrders(page = 1, limit = 20, filters?: any) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.get(`/admin/orders?${params.toString()}`);
  }

  async getOrderById(id: string) {
    return this.get(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    return this.put(`/admin/orders/${id}/status`, { status, notes });
  }

  async getPendingPayments(page = 1, limit = 20) {
    return this.get(`/admin/orders/pending-payments?page=${page}&limit=${limit}`);
  }

  async verifyPayment(id: string, action: 'confirm' | 'reject', rejectionReason?: string) {
    return this.post(`/admin/orders/${id}/verify-payment`, { action, rejectionReason });
  }

  // Admin Products
  async adminGetProducts(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.get(`/admin/products?${params.toString()}`);
  }

  async adminCreateProduct(data: FormData) {
    return this.client.post('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async adminUpdateProduct(id: string, data: FormData) {
    return this.client.put(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async adminDeleteProduct(id: string) {
    return this.delete(`/admin/products/${id}`);
  }

  // Admin Categories
  async adminGetCategories() {
    return this.get('/admin/categories');
  }

  async adminCreateCategory(data: any) {
    return this.post('/admin/categories', data);
  }

  async adminUpdateCategory(id: string, data: any) {
    return this.put(`/admin/categories/${id}`, data);
  }

  async adminDeleteCategory(id: string) {
    return this.delete(`/admin/categories/${id}`);
  }

  // Shop Settings
  async getShopSettings() {
    return this.get('/admin/settings');
  }

  async updateShopSettings(data: any) {
    return this.put('/admin/settings', data);
  }

  async getUpiDetails() {
    return this.get('/admin/settings/upi');
  }

  async updateUpiDetails(upiId: string, qrCodeUrl?: string, instructions?: string) {
    return this.put('/admin/settings/upi', { upiId, qrCodeUrl, instructions });
  }

  // Reports
  async getSalesReport(from: string, to: string, groupBy: 'day' | 'week' | 'month' = 'day') {
    return this.get(`/admin/reports/sales?from=${from}&to=${to}&groupBy=${groupBy}`);
  }

  async exportSalesCsv(from: string, to: string) {
    const response = await this.client.get(`/admin/reports/export/sales?from=${from}&to=${to}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const api = new ApiService();
export default api;