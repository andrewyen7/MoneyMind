/**
// API configuration
export const API_CONFIG = {
  // Use backend service URL for production, localhost for development
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://moneymind-g1po.onrender.com/api' 
    : 'http://localhost:3000/api',lication configuration
 */

// API configuration
export const API_CONFIG = {
  // Use backend service URL for production, localhost for development
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://moneymind-backend.onrender.com/api' 
    : 'http://localhost:3000/api',
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