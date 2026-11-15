import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('admin_access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearAuth();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  private normalizeError(error: AxiosError): Error & { status?: number; code?: string; details?: any } {
    const normalizedError = new Error(
      error.response?.data?.error || error.message || 'An error occurred'
    ) as Error & { status?: number; code?: string; details?: any };

    normalizedError.status = error.response?.status;
    normalizedError.code = error.response?.data?.code;
    normalizedError.details = error.response?.data?.details;

    return normalizedError;
  }

  private async refreshToken() {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await this.client.post('/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', newRefreshToken);
    
    return accessToken;
  }

  private clearAuth() {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
  }

  // Generic methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data.data as T;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data.data as T;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data.data as T;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data.data as T;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data.data as T;
  }

  // Auth
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getProfile() {
    return this.get('/admin/profile');
  }

  // Dashboard
  async getDashboardStats() {
    return this.get('/admin/dashboard');
  }

  // Orders
  async getOrders(params?: any) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.get(`/admin/orders?${searchParams.toString()}`);
  }

  async getOrderById(id: string) {
    return this.get(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    return this.put(`/admin/orders/${id}/status`, { status, notes });
  }

  async cancelOrder(id: string, reason?: string) {
    return this.put(`/admin/orders/${id}/status`, { status: 'cancelled', notes: reason });
  }

  async getPendingPayments(params?: any) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.get(`/admin/orders/pending-payments?${searchParams.toString()}`);
  }

  async verifyPayment(id: string, action: 'confirm' | 'reject', rejectionReason?: string) {
    return this.post(`/admin/orders/${id}/verify-payment`, { action, rejectionReason });
  }

  // Products
  async getProducts(params?: any) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.get(`/admin/products?${searchParams.toString()}`);
  }

  async getProductById(id: string) {
    return this.get(`/admin/products/${id}`);
  }

  async createProduct(data: FormData) {
    return this.client.post('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async updateProduct(id: string, data: FormData) {
    return this.client.put(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async deleteProduct(id: string) {
    return this.delete(`/admin/products/${id}`);
  }

  async updateProductStock(id: string, quantityChange: number, notes?: string) {
    return this.post(`/admin/products/${id}/stock`, { quantityChange, notes });
  }

  async getLowStockProducts() {
    return this.get('/admin/products/low-stock');
  }

  // Categories
  async getCategories() {
    return this.get('/admin/categories');
  }

  async createCategory(data: any) {
    return this.post('/admin/categories', data);
  }

  async updateCategory(id: string, data: any) {
    return this.put(`/admin/categories/${id}`, data);
  }

  async deleteCategory(id: string) {
    return this.delete(`/admin/categories/${id}`);
  }

  // Customers
  async getCustomers(params?: any) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.get(`/admin/customers?${searchParams.toString()}`);
  }

  async getCustomerById(id: string) {
    return this.get(`/admin/customers/${id}`);
  }

  // Delivery
  async getDeliveryPersons() {
    return this.get('/admin/delivery/persons');
  }

  async getDeliveryAssignments(params?: any) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return this.get(`/admin/delivery/assignments?${searchParams.toString()}`);
  }

  async assignDelivery(orderId: string, deliveryPersonId: string) {
    return this.post('/admin/delivery/assign', { orderId, deliveryPersonId });
  }

  async getDeliveryStats() {
    return this.get('/admin/delivery/stats');
  }

  // Reports
  async getSalesReport(params: { from: string; to: string; groupBy?: string }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    return this.get(`/admin/reports/sales?${searchParams.toString()}`);
  }

  async getProductSalesReport(params: { from: string; to: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    return this.get(`/admin/reports/product-sales?${searchParams.toString()}`);
  }

  async getCustomerStats(params: { from: string; to: string }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    return this.get(`/admin/reports/customers?${searchParams.toString()}`);
  }

  async exportSalesCsv(params: { from: string; to: string }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const response = await this.client.get(`/admin/reports/export/sales?${searchParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Settings
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

  // File upload
  async uploadFile(file: File, folder: string = 'products') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    const response = await this.client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }
}

export const api = new ApiService();
export default api;