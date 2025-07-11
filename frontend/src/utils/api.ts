import axios, { AxiosError, AxiosResponse } from 'axios';
import { ErrorHandler } from './errorHandler';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Important for session cookies
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const appError = ErrorHandler.handleApiError(error);

    // Handle specific error cases
    if (appError.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login';
    }

    // Log the error
    ErrorHandler.logError(appError, 'API Request');

    return Promise.reject(appError);
  }
);

export default api;
