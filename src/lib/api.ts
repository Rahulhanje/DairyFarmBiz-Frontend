// Set your backend URL here or use environment variable
// Temporarily hardcoded for mobile testing
const API_BASE_URL = 'http://192.168.1.12:5000/api/v1';

interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add 10 second timeout (increased for email operations)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const fullUrl = `${this.baseUrl}${endpoint}`;
      console.log('[DEBUG] Fetching:', fullUrl);
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = {
          message: 'An error occurred',
          status: response.status,
        };
        
        try {
          const errorData = await response.json();
          error.message = errorData.message || error.message;
        } catch {
          // Use default error message
        }

        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          // Don't do hard redirect - let React Router handle navigation
        }

        throw error;
      }

      // Backend wraps responses in { success, message, data } or { success, message, data, pagination }
      const jsonResponse = await response.json();
      
      // For paginated responses, return both data and pagination info
      if (jsonResponse.pagination) {
        return {
          data: jsonResponse.data,
          ...jsonResponse.pagination,
        } as T;
      }
      
      return jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw { message: 'Request timeout - backend unreachable', status: 0 };
      }
      throw err;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | undefined>): Promise<T> {
    let url = endpoint;
    if (params) {
      // Filter out undefined and null values
      const filteredParams = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Record<string, string>);
      
      if (Object.keys(filteredParams).length > 0) {
        url = `${endpoint}?${new URLSearchParams(filteredParams).toString()}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  signup: (name: string, email: string, password: string, phone: string, countryCode?: string) =>
    api.post<{ token: string; user: User }>('/auth/signup', { name, email, password, phone, countryCode: countryCode || '+91' }),
  getMe: () => api.get<User>('/auth/me'),
};

// Dashboard API
export const dashboardApi = {
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<DashboardSummary>('/dashboard/summary', params as Record<string, string>),
  getMilkTrends: (params?: { startDate?: string; endDate?: string }) =>
    api.get<MilkTrendsResponse>('/dashboard/milk-trends', params as Record<string, string>),
  getExpenseTrends: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ dateRange: { startDate: string; endDate: string }; trends: TrendData[] }>('/dashboard/expense-trends', params as Record<string, string>),
  getProfitLossTrends: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ dateRange: { startDate: string; endDate: string }; trends: TrendData[] }>('/dashboard/profit-loss-trends', params as Record<string, string>),
  getAnimalStats: () => api.get<AnimalStats>('/dashboard/animal-stats'),
  getBreedingStats: () => api.get<BreedingStats>('/dashboard/breeding-stats'),
};

// Animals API
export const animalsApi = {
  getAll: (params?: { animalType?: string; gender?: string; isSold?: string; isActive?: string; search?: string; page?: string; limit?: string }) =>
    api.get<{ data: Animal[]; total: number; page: number; limit: number; totalPages: number }>('/animals', params as Record<string, string>),
  getById: (id: string) => api.get<Animal>(`/animals/${id}`),
  create: (data: CreateAnimalData) => api.post<Animal>('/animals', data),
  update: (id: string, data: Partial<CreateAnimalData>) => api.put<Animal>(`/animals/${id}`, data),
  sell: (id: string, data: SellAnimalData) => api.patch<Animal>(`/animals/${id}/sell`, data),
  delete: (id: string) => api.delete<void>(`/animals/${id}`),
};

// Milk Rates API
export const milkRatesApi = {
  getAll: () => api.get<MilkRate[]>('/milk-rates'),
  getCurrent: () => api.get<CurrentRates>('/milk-rates/current'),
  lookup: (date: string, animalType: 'cow' | 'buffalo') => 
    api.get<MilkRate>('/milk-rates/by-date', { date, animalType }),
  create: (data: CreateMilkRateData) => api.post<MilkRate>('/milk-rates', data),
  update: (id: string, ratePerLiter: number) => api.put<MilkRate>(`/milk-rates/${id}`, { ratePerLiter }),
  delete: (id: string) => api.delete<void>(`/milk-rates/${id}`),
};

// Milk Collection API
export const milkCollectionApi = {
  getAll: (params?: { startDate?: string; endDate?: string; animalType?: string; session?: string; page?: string; limit?: string }) =>
    api.get<{ data: MilkCollection[]; total: number; page: number; limit: number; totalPages: number }>('/milk-collection', params as Record<string, string>),
  getDailySummary: (date: string) => api.get<DailySummary>('/milk-collection/daily-summary', { date }),
  getByDate: (date: string) => api.get<MilkCollection[]>('/milk-collection/by-date', { date }),
  create: (data: CreateMilkCollectionData) => api.post<MilkCollection>('/milk-collection', data),
  update: (id: string, data: Partial<CreateMilkCollectionData>) => api.put<MilkCollection>(`/milk-collection/${id}`, data),
  delete: (id: string) => api.delete<void>(`/milk-collection/${id}`),
};

// Expenses API
export const expensesApi = {
  getAll: (params?: { startDate?: string; endDate?: string; category?: string; page?: string; limit?: string }) =>
    api.get<{ data: Expense[]; total: number; page: number; limit: number; totalPages: number }>('/expenses', params as Record<string, string>),
  getSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get<ExpenseSummary>('/expenses/summary', params as Record<string, string>),
  create: (data: CreateExpenseData) => api.post<Expense>('/expenses', data),
  update: (id: string, data: Partial<CreateExpenseData>) => api.put<Expense>(`/expenses/${id}`, data),
  delete: (id: string) => api.delete<void>(`/expenses/${id}`),
};

// Breeding API
export const breedingApi = {
  getAll: (params?: { status?: string; animalId?: string; page?: string; limit?: string }) =>
    api.get<{ data: BreedingRecord[]; total: number; page: number; limit: number; totalPages: number }>('/breeding', params as Record<string, string>),
  getById: (id: string) => api.get<BreedingRecord>(`/breeding/${id}`),
  getByAnimal: (animalId: string) => api.get<BreedingRecord[]>(`/breeding/animal/${animalId}`),
  getPendingChecks: () => api.get<BreedingRecord[]>('/breeding/pending-checks'),
  create: (data: CreateBreedingData) => api.post<BreedingRecord>('/breeding', data),
  update: (id: string, data: Partial<CreateBreedingData>) => api.put<BreedingRecord>(`/breeding/${id}`, data),
  updateStatus: (id: string, status: string, deliveryDate?: string, notes?: string) =>
    api.patch<BreedingRecord>(`/breeding/${id}/status`, { status, deliveryDate, notes }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { type?: string; status?: string; page?: string; limit?: string }) =>
    api.get<{ data: Notification[]; total: number; page: number; limit: number; totalPages: number }>('/notifications', params as Record<string, string>),
  create: (data: CreateNotificationData) => api.post<Notification>('/notifications', data),
  update: (id: string, data: Partial<CreateNotificationData>) => api.put<Notification>(`/notifications/${id}`, data),
  cancel: (id: string) => api.patch<Notification>(`/notifications/${id}/cancel`, {}),
  send: (id: string) => api.post<{ sent: boolean; error?: string }>(`/notifications/${id}/send`),
  getStatistics: () => api.get<NotificationStats>('/notifications/statistics'),
  getEmailStatus: () => api.get<EmailStatus>('/notifications/email-status'),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardSummary {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  period: string;
  milk: {
    cow: {
      totalQuantity: number;
      totalAmount: number;
      avgRate: number;
      sessions: {
        morning: { quantity: number; amount: number };
        evening: { quantity: number; amount: number };
      };
    };
    buffalo: {
      totalQuantity: number;
      totalAmount: number;
      avgRate: number;
      sessions: {
        morning: { quantity: number; amount: number };
        evening: { quantity: number; amount: number };
      };
    };
    total: {
      quantity: number;
      amount: number;
    };
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  profitLoss: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  animals: {
    totalCows: number;
    totalBuffaloes: number;
    activeCows: number;
    activeBuffaloes: number;
    soldAnimals: number;
  };
  breeding: {
    totalInseminations: number;
    pendingChecks: number;
    confirmed: number;
    failed: number;
    delivered: number;
  };
}

export interface MilkTrendData {
  date: string;
  cow: { quantity: number; amount: number };
  buffalo: { quantity: number; amount: number };
  total: { quantity: number; amount: number };
}

export interface MilkTrendsResponse {
  dateRange: { startDate: string; endDate: string };
  trends: MilkTrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  cow?: number;
  buffalo?: number;
}

export interface AnimalStats {
  total: number;
  cows: number;
  buffalos: number;
  active: number;
  sold: number;
  male: number;
  female: number;
}

export interface BreedingStats {
  totalInseminations: number;
  pending: number;
  confirmed: number;
  failed: number;
  delivered: number;
}

export interface Animal {
  _id: string;
  serialNumber: string;
  nickName: string;
  animalType: 'cow' | 'buffalo';
  identificationTag?: string;
  breed?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  purchaseDate?: string;
  purchasePrice?: number;
  purchasePlace?: string;
  isSold: boolean;
  isActive: boolean;
  soldDate?: string;
  soldPrice?: number;
  soldTo?: string;
  soldNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnimalData {
  serialNumber: string;
  nickName: string;
  animalType: 'cow' | 'buffalo';
  identificationTag?: string;
  breed?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  purchaseDate?: string;
  purchasePrice?: number;
  purchasePlace?: string;
  notes?: string;
}

export interface SellAnimalData {
  soldDate?: string;
  soldPrice?: number;
  soldTo?: string;
  soldNotes?: string;
}

export interface MilkRate {
  _id: string;
  animalType: 'cow' | 'buffalo';
  ratePerLiter: number;
  effectiveFrom: string;
  createdAt: string;
}

export interface CurrentRates {
  cow: MilkRate | null;
  buffalo: MilkRate | null;
}

export interface CreateMilkRateData {
  animalType: 'cow' | 'buffalo';
  ratePerLiter: number;
  effectiveFrom: string;
}

export interface MilkCollection {
  _id: string;
  date: string;
  session: 'morning' | 'evening';
  animalType: 'cow' | 'buffalo';
  totalMilk: number;
  rateApplied: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilkCollectionData {
  date: string;
  session: 'morning' | 'evening';
  animalType: 'cow' | 'buffalo';
  totalMilk: number;
  notes?: string;
}

export interface DailySummary {
  date: string;
  cowMorning: number;
  cowEvening: number;
  cowTotal: number;
  cowAmount: number;
  buffaloMorning: number;
  buffaloEvening: number;
  buffaloTotal: number;
  buffaloAmount: number;
  grandTotal: number;
  grandAmount: number;
}

export interface Expense {
  _id: string;
  name: string;
  category: 'feed' | 'medicine' | 'labor' | 'equipment' | 'maintenance' | 'transport' | 'other';
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  name: string;
  category: 'feed' | 'medicine' | 'labor' | 'equipment' | 'maintenance' | 'transport' | 'other';
  amount: number;
  date?: string;
  notes?: string;
}

export interface ExpenseSummary {
  total: number;
  byCategory: { category: string; amount: number }[];
}

export interface BreedingRecord {
  _id: string;
  animal: {
    _id: string;
    serialNumber: string;
    nickName: string;
    animalType: 'cow' | 'buffalo';
  };
  inseminationDate: string;
  pregnancyCheckDate: string;
  pregnancyStatus: 'check_pending' | 'pregnant_confirmed' | 'failed' | 'delivered';
  doctorName?: string;
  semenType?: string;
  breed?: string;
  deliveryDate?: string;
  notes?: string;
  notificationSent: boolean;
  statusUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBreedingData {
  animalId: string;
  inseminationDate: string;
  doctorName?: string;
  semenType?: string;
  breed?: string;
  notes?: string;
}

export interface PregnancyStatus {
  id: string;
  inseminationId: string;
  status: string;
  checkDate: string;
  notes?: string;
}

export interface Notification {
  _id: string;
  animal?: string;
  insemination?: string;
  type: 'pregnancy_check' | 'vaccination' | 'breeding_reminder' | 'general';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduledDate: string;
  sentAt?: string;
  isSent: boolean;
  message: string;
  subject?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  type: 'pregnancy_check' | 'vaccination' | 'breeding_reminder' | 'general';
  channel?: 'email' | 'sms' | 'push' | 'in_app';
  message: string;
  subject?: string;
  scheduledDate: string;
  recipientEmail?: string;
}

export interface NotificationStats {
  total: number;
  pending: number;
  sent: number;
  cancelled: number;
}

export interface EmailStatus {
  isActive: boolean;
  lastChecked: string;
}
