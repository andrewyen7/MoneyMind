/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
  // Use VITE_API_URL for all environments
  BASE_URL: import.meta.env.VITE_API_URL,
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