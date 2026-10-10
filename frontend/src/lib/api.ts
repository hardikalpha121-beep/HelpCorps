import axios from 'axios';

let workingBaseUrl = '';

export function getBaseUrl() {
  if (workingBaseUrl) return workingBaseUrl;

  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem('helpcorps_api_url');
    if (cached) {
      workingBaseUrl = cached;
      return cached;
    }
    const host = window.location.hostname || 'localhost';
    // If NEXT_PUBLIC_API_BASE_URL is set, prioritize it
    if (envUrl) {
      return envUrl;
    }
    return `http://${host}:5008`;
  }
  return envUrl ?? 'http://localhost:5008';
}

export function setWorkingBaseUrl(url: string) {
  workingBaseUrl = url;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('helpcorps_api_url', url);
  }
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // send httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach access token and dynamic host on every request ─────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getBaseUrl();
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auto-refresh on 401 & Auto-port fallback (5008 <-> 5004) on network failure ─
let refreshing = false;
api.interceptors.response.use(
  (res) => {
    // If request succeeded, lock in the working URL
    if (res.config.baseURL && res.config.baseURL !== workingBaseUrl) {
      setWorkingBaseUrl(res.config.baseURL);
    }
    return res;
  },
  async (error) => {
    const original = error.config;

    // 1. Port fallback if server is running on 5004 instead of 5008 or vice-versa
    if (!error.response && original && !original._portRetried) {
      original._portRetried = true;
      const current = original.baseURL || getBaseUrl();
      let alternate = '';
      if (current.includes(':5008')) {
        alternate = current.replace(':5008', ':5004');
      } else if (current.includes(':5004')) {
        alternate = current.replace(':5004', ':5008');
      }

      if (alternate) {
        try {
          original.baseURL = alternate;
          const retryRes = await axios(original);
          setWorkingBaseUrl(alternate);
          api.defaults.baseURL = alternate;
          return retryRes;
        } catch {
          // Both failed, proceed to error rejection
        }
      }
    }

    // 2. Token refresh on 401
    if (error.response?.status === 401 && !original._retry && !refreshing) {
      original._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(`${getBaseUrl()}/api/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        refreshing = false;
        return api(original);
      } catch {
        refreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          const p = window.location.pathname;
          if (!p.startsWith('/auth') && !p.startsWith('/volunteer-portal')) {
            window.location.href = '/auth';
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────
export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  mobile?: string;
  city?: string;
  age?: number;
  disabilityType?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const auth = {
  register: (body: RegisterInput) => api.post('/api/auth/register', body),
  login: (body: LoginInput) => api.post('/api/auth/login', body),
  logout: () => api.post('/api/auth/logout'),
};

export const users = {
  getMe: () => api.get('/api/users/me'),
  updateMe: (body: Partial<RegisterInput & { profilePhoto?: string }>) => api.patch('/api/users/me', body),
  deleteMe: (body: { password: string }) => api.delete('/api/users/me', { data: body }),
  exportData: () => api.get('/api/users/me/export'),
};

// ─────────────────────────────────────────────────────────────────────────
// HELP REQUESTS
// ─────────────────────────────────────────────────────────────────────────
export interface CreateHelpRequestInput {
  category: string;
  subCategory?: string;
  serviceType?: string;
  description: string;
  location: { latitude: number; longitude: number };
  address?: string;
}

export const helpRequests = {
  list: (params?: Record<string, unknown>) => api.get('/api/help-requests', { params }),
  myRequests: () => api.get('/api/help-requests/my'),
  assigned: () => api.get('/api/help-requests/assigned'),
  getById: (id: string) => api.get(`/api/help-requests/${id}`),
  create: (body: CreateHelpRequestInput) => api.post('/api/help-requests', body),
  accept: (id: string) => api.patch(`/api/help-requests/${id}/accept`),
  complete: (id: string) => api.patch(`/api/help-requests/${id}/complete`),
  cancel: (id: string) => api.patch(`/api/help-requests/${id}/cancel`),
  rate: (id: string, body: { rating: number; feedback?: string }) =>
    api.patch(`/api/help-requests/${id}/rate`, body),
};

// ─────────────────────────────────────────────────────────────────────────
// VOLUNTEERS
// ─────────────────────────────────────────────────────────────────────────
export interface RegisterVolunteerInput {
  skills: string[];
  availability: {
    days: string[];
    hours: { start: string; end: string } | string[];
  };
  preferredCategories: string[];
  location: { latitude: number; longitude: number };
  address?: string;
}

export const volunteers = {
  list: (params?: Record<string, unknown>) => api.get('/api/volunteers', { params }),
  nearby: (params: { latitude: number; longitude: number; maxDistance?: number }) =>
    api.get('/api/volunteers/nearby', { params }),
  getById: (id: string) => api.get(`/api/volunteers/${id}`),
  myProfile: () => api.get('/api/volunteers/profile/me'),
  register: (body: RegisterVolunteerInput) => api.post('/api/volunteers/register', body),
  update: (id: string, body: Partial<RegisterVolunteerInput> & { activeStatus?: string }) =>
    api.patch(`/api/volunteers/${id}`, body),
};

// ─────────────────────────────────────────────────────────────────────────
// WOMEN SAFETY
// ─────────────────────────────────────────────────────────────────────────
export interface InstantHelpInput {
  location: { latitude: number; longitude: number };
  address?: string;
  description?: string;
  shareLocation?: boolean;
}

export const womenSafety = {
  instantHelp: (body: InstantHelpInput) => api.post('/api/women-safety/instant-help', body),
  activeAlerts: () => api.get('/api/women-safety/active-alerts'),
  myAlerts: () => api.get('/api/women-safety/my-alerts'),
  respond: (id: string) => api.patch(`/api/women-safety/${id}/respond`),
  resolve: (id: string) => api.patch(`/api/women-safety/${id}/resolve`),
};

// ─────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────
export const admin = {
  dashboardStats: () => api.get('/api/admin/dashboard-stats'),
  volunteers: (params?: { page?: number; limit?: number }) =>
    api.get('/api/admin/volunteers', { params }),
  kindnessScores: () => api.get('/api/admin/kindness-scores'),
  updateVolunteer: (id: string, body: { isVerified?: boolean; activeStatus?: string }) =>
    api.patch(`/api/admin/volunteers/${id}`, body),
};

// ─────────────────────────────────────────────────────────────────────────
// KINDNESS POINTS
// ─────────────────────────────────────────────────────────────────────────
export const kindness = {
  myTransactions: () => api.get('/api/kindness/my-transactions'),
  leaderboard: () => api.get('/api/kindness/leaderboard'),
};

// ─────────────────────────────────────────────────────────────────────────
// AI CHATBOT (OpenRouter)
// ─────────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatPayload {
  message: string;
  history?: ChatMessage[];
  location?: { latitude: number; longitude: number };
  bookVolunteerId?: string;
  bookingServiceType?: string;
}

export interface ChatResponseData {
  reply: string;
  volunteers?: Array<{
    id: string;
    name: string;
    city: string;
    skills: string[];
    rating: number;
    kindnessScore: number;
    address: string;
  }>;
  booking?: {
    bookingId: string;
    volunteerName: string;
    volunteerId: string;
    skills: string[];
    rating: number;
    category: string;
    status: string;
    message: string;
  };
}

export const ai = {
  chat: (payload: ChatPayload) => api.post<{ success: boolean; data: ChatResponseData }>('/api/chat', payload),
};

