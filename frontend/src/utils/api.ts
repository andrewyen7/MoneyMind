import axios, { AxiosError, AxiosResponse } from 'axios';
import { ErrorHandler } from './errorHandler';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://moneymind-g1po.onrender.com/api',
  withCredentials: true, // Important for session cookies
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fix for budgets1 typo
const originalGet = api.get;
api.get = function(url, ...args) {
  if (url && url.includes('budgets1')) {
    url = url.replace('budgets1', 'budgets');
  }
  return originalGet.call(this, url, ...args);
};

const originalPost = api.post;
api.post = function(url, ...args) {
  if (url && url.includes('budgets1')) {
    url = url.replace('budgets1', 'budgets');
  }
  return originalPost.call(this, url, ...args);
};

// Override specific endpoints that have issues
const budgetsEndpoint = '/budgets'; // NOT '/budgets1'

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Fix the budgets1 typo by replacing it with budgets
    if (config.url && config.url.includes('budgets1')) {
      config.url = config.url.replace('budgets1', 'budgets');
    }
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
