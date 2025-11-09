// API client for backend communication

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.msg || errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage += ` - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend API at ${API_URL}. Make sure the backend server is running.`
      );
    }
    throw error;
  }
}

// Lessons API
export const lessonsApi = {
  getAll: (category?: string) => {
    const url = category ? `/api/lessons/?category=${category}` : '/api/lessons/';
    return apiRequest<any[]>(url);
  },

  getById: (id: number) => apiRequest<any>(`/api/lessons/${id}`),

  getLesson: (id: number) => apiRequest<any>(`/api/lessons/${id}`),

  getByCategory: (category: string) =>
    apiRequest<any[]>(`/api/lessons/category/${category}`),

  create: (lesson: any) =>
    apiRequest<any>('/api/lessons/', {
      method: 'POST',
      body: JSON.stringify(lesson),
    }),
};

// Progress API
export const progressApi = {
  getUserProgress: (userId: string) =>
    apiRequest<any[]>(`/api/progress/user/${userId}`),

  createOrUpdate: (progress: any) =>
    apiRequest<any>('/api/progress/', {
      method: 'POST',
      body: JSON.stringify(progress),
    }),

  updateProgress: (progress: any) =>
    apiRequest<any>('/api/progress/', {
      method: 'POST',
      body: JSON.stringify(progress),
    }),

  recordSession: (session: any) =>
    apiRequest<any>('/api/progress/session', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  getUserSessions: (userId: string, limit = 50) =>
    apiRequest<any[]>(`/api/progress/sessions/${userId}?limit=${limit}`),

  getUserStats: (userId: string) =>
    apiRequest<any>(`/api/progress/stats/${userId}`),
};

// Settings API
export const settingsApi = {
  getUserSettings: (userId: string) =>
    apiRequest<any>(`/api/settings/user/${userId}`),

  createSettings: (settings: any) =>
    apiRequest<any>('/api/settings/', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  updateSettings: (userId: string, settings: any) =>
    apiRequest<any>(`/api/settings/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Hand Tracking API (server-side)
export const handTrackingApi = {
  processFrame: (frameData: { image_data: string; width?: number; height?: number }) =>
    apiRequest<any>('/api/hand-tracking/process-frame', {
      method: 'POST',
      body: JSON.stringify(frameData),
    }),
};

// Health check
export const healthCheck = () => apiRequest<any>('/health');
