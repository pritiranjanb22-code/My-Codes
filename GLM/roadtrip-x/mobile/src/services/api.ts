import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAppStore } from '@/store';
import { API_URL } from '@/constants';

class ApiService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAppStore.getState().token;
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
            const newToken = await this.refreshToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            useAppStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const response = await this.client.post('/auth/refresh');
      const { token } = response.data;
      useAppStore.getState().setToken(token);
      return token;
    })();

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  // Auth
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async logout() {
    await this.client.post('/auth/logout');
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: Partial<{ name: string; avatar: string; phone: string }>) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  // Trips
  async createTrip(data: {
    name: string;
    description?: string;
    startLocation: { latitude: number; longitude: number; address?: string; name?: string };
    endLocation: { latitude: number; longitude: number; address?: string; name?: string };
    startDate: string;
    endDate?: string;
    budget?: number;
    currency?: string;
  }) {
    const response = await this.client.post('/trips', data);
    return response.data;
  }

  async getTrips() {
    const response = await this.client.get('/trips');
    return response.data;
  }

  async getTrip(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}`);
    return response.data;
  }

  async updateTrip(tripId: string, data: Partial<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: string;
  }>) {
    const response = await this.client.put(`/trips/${tripId}`, data);
    return response.data;
  }

  async deleteTrip(tripId: string) {
    await this.client.delete(`/trips/${tripId}`);
  }

  async joinTrip(tripId: string, code?: string) {
    const response = await this.client.post(`/trips/${tripId}/join`, { code });
    return response.data;
  }

  async leaveTrip(tripId: string) {
    await this.client.post(`/trips/${tripId}/leave`);
  }

  async inviteToTrip(tripId: string, data: { emails?: string[]; phones?: string[] }) {
    const response = await this.client.post(`/trips/${tripId}/invite`, data);
    return response.data;
  }

  async getTripCode(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/code`);
    return response.data;
  }

  async generateQrCode(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/qr`);
    return response.data;
  }

  // Members
  async getTripMembers(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/members`);
    return response.data;
  }

  async updateMemberRole(tripId: string, memberId: string, role: string) {
    const response = await this.client.put(`/trips/${tripId}/members/${memberId}/role`, { role });
    return response.data;
  }

  async removeMember(tripId: string, memberId: string) {
    await this.client.delete(`/trips/${tripId}/members/${memberId}`);
  }

  async updateMemberVehicle(tripId: string, memberId: string, vehicleId: string | null) {
    const response = await this.client.put(`/trips/${tripId}/members/${memberId}/vehicle`, { vehicleId });
    return response.data;
  }

  // Vehicles
  async createVehicle(tripId: string, data: {
    name: string;
    registrationNumber: string;
    fuelType: string;
    tankCapacity: number;
    currentMileage: number;
    driverId: string;
    passengerIds: string[];
  }) {
    const response = await this.client.post(`/trips/${tripId}/vehicles`, data);
    return response.data;
  }

  async getTripVehicles(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/vehicles`);
    return response.data;
  }

  async updateVehicle(tripId: string, vehicleId: string, data: Partial<{
    name: string;
    registrationNumber: string;
    fuelType: string;
    tankCapacity: number;
    currentMileage: number;
    driverId: string;
    passengerIds: string[];
    fuelLevel: number;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/vehicles/${vehicleId}`, data);
    return response.data;
  }

  async deleteVehicle(tripId: string, vehicleId: string) {
    await this.client.delete(`/trips/${tripId}/vehicles/${vehicleId}`);
  }

  async updateVehicleFuelLevel(tripId: string, vehicleId: string, fuelLevel: number) {
    const response = await this.client.put(`/trips/${tripId}/vehicles/${vehicleId}/fuel`, { fuelLevel });
    return response.data;
  }

  // Itinerary
  async createItineraryStop(tripId: string, data: {
    order: number;
    name: string;
    location: { latitude: number; longitude: number; address?: string; name?: string };
    arrivalTime?: string;
    departureTime?: string;
    duration?: number;
    notes?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/itinerary`, data);
    return response.data;
  }

  async getTripItinerary(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/itinerary`);
    return response.data;
  }

  async updateItineraryStop(tripId: string, stopId: string, data: Partial<{
    order: number;
    name: string;
    location: { latitude: number; longitude: number; address?: string; name?: string };
    arrivalTime: string;
    departureTime: string;
    duration: number;
    notes: string;
    isCompleted: boolean;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/itinerary/${stopId}`, data);
    return response.data;
  }

  async deleteItineraryStop(tripId: string, stopId: string) {
    await this.client.delete(`/trips/${tripId}/itinerary/${stopId}`);
  }

  async reorderItinerary(tripId: string, stops: { id: string; order: number }[]) {
    const response = await this.client.put(`/trips/${tripId}/itinerary/reorder`, { stops });
    return response.data;
  }

  // Expenses
  async createExpense(tripId: string, data: {
    amount: number;
    currency: string;
    category: string;
    description: string;
    paidBy: string;
    participants: { userId: string; amount: number; percentage?: number; shares?: number }[];
    splitType: string;
    receiptUrl?: string;
    vehicleId?: string;
    stopId?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/expenses`, data);
    return response.data;
  }

  async getTripExpenses(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/expenses`);
    return response.data;
  }

  async updateExpense(tripId: string, expenseId: string, data: Partial<{
    amount: number;
    category: string;
    description: string;
    participants: { userId: string; amount: number; percentage?: number; shares?: number }[];
    splitType: string;
    receiptUrl: string;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/expenses/${expenseId}`, data);
    return response.data;
  }

  async deleteExpense(tripId: string, expenseId: string) {
    await this.client.delete(`/trips/${tripId}/expenses/${expenseId}`);
  }

  async getTripSettlements(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/settlements`);
    return response.data;
  }

  async createSettlement(tripId: string, data: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
    paymentReference?: string;
    paymentScreenshot?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/settlements`, data);
    return response.data;
  }

  async updateSettlement(tripId: string, settlementId: string, data: Partial<{
    status: string;
    paymentMethod: string;
    paymentReference: string;
    paymentScreenshot: string;
    confirmedBy: string;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/settlements/${settlementId}`, data);
    return response.data;
  }

  async getTripWallet(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/wallet`);
    return response.data;
  }

  async addWalletContribution(tripId: string, data: { userId: string; amount: number; description: string }) {
    const response = await this.client.post(`/trips/${tripId}/wallet/contribute`, data);
    return response.data;
  }

  // Fuel
  async createFuelEntry(tripId: string, data: {
    vehicleId: string;
    fuelType: string;
    amount: number;
    litres: number;
    pricePerLitre: number;
    odometer: number;
    mileage: number;
    paidBy: string;
    receiptUrl?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/fuel`, data);
    return response.data;
  }

  async getTripFuelEntries(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/fuel`);
    return response.data;
  }

  async updateFuelEntry(tripId: string, entryId: string, data: Partial<{
    fuelType: string;
    amount: number;
    litres: number;
    pricePerLitre: number;
    odometer: number;
    mileage: number;
    receiptUrl: string;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/fuel/${entryId}`, data);
    return response.data;
  }

  async deleteFuelEntry(tripId: string, entryId: string) {
    await this.client.delete(`/trips/${tripId}/fuel/${entryId}`);
  }

  // Toll
  async createTollEntry(tripId: string, data: {
    vehicleId: string;
    amount: number;
    location: { latitude: number; longitude: number; address?: string; name?: string };
    name: string;
    paidBy: string;
    receiptUrl?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/toll`, data);
    return response.data;
  }

  async getTripTollEntries(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/toll`);
    return response.data;
  }

  async updateTollEntry(tripId: string, entryId: string, data: Partial<{
    amount: number;
    location: { latitude: number; longitude: number; address?: string; name?: string };
    name: string;
    receiptUrl: string;
  }>) {
    const response = await this.client.put(`/trips/${tripId}/toll/${entryId}`, data);
    return response.data;
  }

  async deleteTollEntry(tripId: string, entryId: string) {
    await this.client.delete(`/trips/${tripId}/toll/${entryId}`);
  }

  // Checklists
  async createChecklist(tripId: string, data: { name: string; items: { text: string }[] }) {
    const response = await this.client.post(`/trips/${tripId}/checklists`, data);
    return response.data;
  }

  async getTripChecklists(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/checklists`);
    return response.data;
  }

  async updateChecklist(tripId: string, checklistId: string, data: Partial<{
    name: string;
    items: { id?: string; text: string; isCompleted: boolean; completedBy?: string }[];
  }>) {
    const response = await this.client.put(`/trips/${tripId}/checklists/${checklistId}`, data);
    return response.data;
  }

  async deleteChecklist(tripId: string, checklistId: string) {
    await this.client.delete(`/trips/${tripId}/checklists/${checklistId}`);
  }

  // Messages
  async getTripMessages(tripId: string, params?: { limit?: number; offset?: number; before?: string }) {
    const response = await this.client.get(`/trips/${tripId}/messages`, { params });
    return response.data;
  }

  async sendMessage(tripId: string, data: {
    type: string;
    content: string;
    mediaUrl?: string;
    voiceDuration?: number;
    location?: { latitude: number; longitude: number; address?: string; name?: string };
    expenseId?: string;
    pollId?: string;
    replyToId?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/messages`, data);
    return response.data;
  }

  async updateMessage(tripId: string, messageId: string, data: { content: string }) {
    const response = await this.client.put(`/trips/${tripId}/messages/${messageId}`, data);
    return response.data;
  }

  async deleteMessage(tripId: string, messageId: string) {
    await this.client.delete(`/trips/${tripId}/messages/${messageId}`);
  }

  // Polls
  async createPoll(tripId: string, data: { question: string; options: string[] }) {
    const response = await this.client.post(`/trips/${tripId}/polls`, data);
    return response.data;
  }

  async getTripPolls(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/polls`);
    return response.data;
  }

  async votePoll(tripId: string, pollId: string, optionId: string) {
    const response = await this.client.post(`/trips/${tripId}/polls/${pollId}/vote`, { optionId });
    return response.data;
  }

  async closePoll(tripId: string, pollId: string) {
    const response = await this.client.post(`/trips/${tripId}/polls/${pollId}/close`);
    return response.data;
  }

  async deletePoll(tripId: string, pollId: string) {
    await this.client.delete(`/trips/${tripId}/polls/${pollId}`);
  }

  // Media
  async uploadMedia(tripId: string, data: {
    type: 'photo' | 'video';
    file: FormData;
    location?: { latitude: number; longitude: number; address?: string; name?: string };
    stopId?: string;
    day: number;
  }) {
    const response = await this.client.post(`/trips/${tripId}/media`, data.file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getTripMedia(tripId: string, params?: { day?: number; stopId?: string }) {
    const response = await this.client.get(`/trips/${tripId}/media`, { params });
    return response.data;
  }

  async deleteMedia(tripId: string, mediaId: string) {
    await this.client.delete(`/trips/${tripId}/media/${mediaId}`);
  }

  // Emergency
  async triggerEmergency(tripId: string, data: {
    type: string;
    location: { latitude: number; longitude: number; address?: string; name?: string };
    description?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/emergency`, data);
    return response.data;
  }

  async getTripEmergencies(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/emergency`);
    return response.data;
  }

  async resolveEmergency(tripId: string, emergencyId: string) {
    const response = await this.client.post(`/trips/${tripId}/emergency/${emergencyId}/resolve`);
    return response.data;
  }

  async getNearbyEmergencyServices(location: { latitude: number; longitude: number }) {
    const response = await this.client.get('/emergency/nearby', { params: location });
    return response.data;
  }

  // Location
  async updateLocation(tripId: string, data: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    batteryLevel?: number;
    vehicleId?: string;
  }) {
    const response = await this.client.post(`/trips/${tripId}/location`, data);
    return response.data;
  }

  async getTripLocations(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/location`);
    return response.data;
  }

  async startLocationSharing(tripId: string, data: { mode: string; expiresAt?: string }) {
    const response = await this.client.post(`/trips/${tripId}/location/share`, data);
    return response.data;
  }

  async stopLocationSharing(tripId: string) {
    await this.client.post(`/trips/${tripId}/location/stop`);
  }

  // Budget
  async setTripBudget(tripId: string, data: { totalBudget: number; perPersonBudget?: number; alertThreshold?: number }) {
    const response = await this.client.post(`/trips/${tripId}/budget`, data);
    return response.data;
  }

  async getTripBudget(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/budget`);
    return response.data;
  }

  async updateTripBudget(tripId: string, data: Partial<{ totalBudget: number; perPersonBudget: number; alertThreshold: number }>) {
    const response = await this.client.put(`/trips/${tripId}/budget`, data);
    return response.data;
  }

  // Notifications
  async getNotifications(params?: { limit?: number; offset?: number }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    await this.client.put(`/notifications/${notificationId}/read`);
  }

  async markAllNotificationsRead() {
    await this.client.put('/notifications/read-all');
  }

  // AI Assistant
  async askAI(tripId: string, question: string, context?: any) {
    const response = await this.client.post(`/trips/${tripId}/ai/ask`, { question, context });
    return response.data;
  }

  async parseExpenseFromText(tripId: string, text: string) {
    const response = await this.client.post(`/trips/${tripId}/ai/parse-expense`, { text });
    return response.data;
  }

  async scanReceipt(tripId: string, imageUri: string) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);
    const response = await this.client.post(`/trips/${tripId}/ai/scan-receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getSmartSuggestions(tripId: string, location: { latitude: number; longitude: number }) {
    const response = await this.client.get(`/trips/${tripId}/ai/suggestions`, { params: location });
    return response.data;
  }

  // Trip Recap
  async getTripRecap(tripId: string) {
    const response = await this.client.get(`/trips/${tripId}/recap`);
    return response.data;
  }

  async exportTripData(tripId: string, format: 'pdf' | 'csv' | 'image') {
    const response = await this.client.get(`/trips/${tripId}/export`, { params: { format }, responseType: 'blob' });
    return response.data;
  }

  // Smart Suggestions
  async getRouteSuggestions(tripId: string, origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) {
    const response = await this.client.post(`/trips/${tripId}/suggestions/route`, { origin, destination });
    return response.data;
  }

  async getStopSuggestions(tripId: string, location: { latitude: number; longitude: number }, type?: string) {
    const response = await this.client.get(`/trips/${tripId}/suggestions/stops`, { params: { ...location, type } });
    return response.data;
  }

  // Health Check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();