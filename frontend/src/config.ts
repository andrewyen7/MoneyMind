/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
  // Always use localhost for development
  BASE_URL: 'http://localhost:3000/api',
  // Request configuration
  REQUEST_CONFIG: {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
};