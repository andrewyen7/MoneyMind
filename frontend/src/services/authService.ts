import api from '../utils/api';

// Debug: Log the API base URL
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
const currentUrl = isProduction ? 'https://moneymind-g1po.onrender.com/api' : 'http://localhost:3000/api';
console.log('🔧 AuthService - Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('🌐 AuthService - API URL:', currentUrl);
console.log('🏠 AuthService - Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');

export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  errors?: string[];
}

export interface AuthCheckResponse {
  success: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

class AuthService {
  // Register a new user
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Registration failed');
    }
  }

  // Login user
  async login(loginData: LoginData): Promise<AuthResponse> {
    try {
      console.log('AuthService: Attempting login to API');
      const response = await api.post('/auth/login', loginData);
      console.log('AuthService: Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      if (error.response?.data) {
        console.log('AuthService: Error response data:', error.response.data);
        return error.response.data;
      }
      console.error('AuthService: Network or other error:', error.message);
      return {
        success: false,
        message: 'Network error: Unable to connect to server'
      };
    }
  }

  // Logout user
  async logout(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Logout failed');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Failed to get user data');
    }
  }

  // Check authentication status
  async checkAuth(): Promise<AuthCheckResponse> {
    try {
      const response = await api.get('/auth/check');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Failed to check authentication');
    }
  }
}

export default new AuthService();
