import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  phone?: string;
  role: 'VENDEUR' | 'MODERATEUR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
    // Listen for session expired events from ApiService
    window.addEventListener('sessionExpired', () => {
      this.logout();
    });
  }

  private loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  async register(email: string, password: string, username?: string, phone?: string): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/register', {
        email,
        password,
        username,
        phone
      });

      this.setSession(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/login', {
        email,
        password
      });

      this.setSession(response);
      return response;
    } catch (error) {
      throw error;
    }
  }

  private setSession(authResponse: AuthResponse) {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  // Handle session expiration
  handleSessionExpired() {
    this.logout();
    // Redirect will be handled by API service
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser?.role || '');
  }

  async verifyToken(): Promise<void> {
    try {
      // Make a simple authenticated request to verify token
      // Use GET /products which requires authentication
      await this.apiService.get('/products?limit=1');
    } catch (error) {
      // If request fails, token is invalid
      throw error;
    }
  }
}
