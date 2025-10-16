import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3001'; // Adjust if backend port differs

  constructor() {}

  private async request<T>(
    endpoint: string,
    options: RequestInit & { skipRedirectOn401?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    console.log('API Request:', endpoint, 'Token present:', !!token);

    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Clear invalid token and user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Emit event for AuthService to update state
          window.dispatchEvent(new CustomEvent('sessionExpired'));
          if (!options.skipRedirectOn401) {
            // Redirect to login page only if not skipped
            window.location.href = '/login';
          }
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }

        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // For responses with no content (e.g., 204)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit & { skipRedirectOn401?: boolean }): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit & { skipRedirectOn401?: boolean }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit & { skipRedirectOn401?: boolean }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit & { skipRedirectOn401?: boolean }): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  // Notification methods
  async getNotifications(limit?: number, offset?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.get<any[]>(`/notifications${query}`);
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.get<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.patch<any>(`/notifications/${notificationId}/read`, {});
  }

  async markAllNotificationsAsRead(): Promise<any> {
    return this.patch<any>('/notifications/mark-all-read', {});
  }

  async deleteNotification(notificationId: string): Promise<any> {
    return this.delete<any>(`/notifications/${notificationId}`);
  }

  // User methods
  async getUserProfile(): Promise<any> {
    return this.get<any>('/users/profile');
  }

  async updateUserProfile(data: { username?: string; displayName?: string }): Promise<any> {
    return this.put<any>('/users/profile', data);
  }

  async getUserStats(): Promise<any> {
    return this.get<any>('/users/stats');
  }

  async deactivateUserAccount(): Promise<any> {
    return this.patch<any>('/users/deactivate', {});
  }

  // For file uploads (photos)
  async uploadFile<T>(endpoint: string, file: File, additionalData?: any, options?: RequestInit & { skipRedirectOn401?: boolean }): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('file', file);
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const config: RequestInit = {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Emit event for AuthService to update state
          window.dispatchEvent(new CustomEvent('sessionExpired'));
          if (!options?.skipRedirectOn401) {
            window.location.href = '/login';
          }
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}