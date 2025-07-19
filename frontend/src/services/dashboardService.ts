import api from '../utils/api';
import axios from 'axios';

const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('onrender.com');
const API_BASE_URL = isProduction
  ? 'https://moneymind-g1po.onrender.com/api' 
  : 'http://localhost:3000/api';export interface DashboardData {
  transactions: any[];
  stats: {
    income: { total: number; count: number; avgAmount: number };
    expense: { total: number; count: number; avgAmount: number };
    netIncome: number;
  };
  budgets: any[];
  categorySpending: any[];
  monthlySummary: any[];
  lastUpdate: number;
}

export interface UpdateCheckResult {
  hasUpdates: boolean;
  lastUpdate: number;
}

// Direct API implementation to bypass any issues
const directDashboardApi = {
  /**
   * Get dashboard data directly
   */
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      console.log('Fetching dashboard data directly from API');
      // Use environment-aware API URL
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/dashboard/data`,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          // Add cache-busting headers
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('Dashboard data received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
};

const dashboardService = {
  /**
   * Get dashboard data
   */
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      // Use direct API call to avoid any issues
      return directDashboardApi.getDashboardData();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check if dashboard data has been updated
   */
  checkUpdates: async (lastUpdate: number): Promise<UpdateCheckResult> => {
    try {
      const response = await api.get('/dashboard/check-updates', {
        params: { lastUpdate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Notify server of data update
   */
  notifyUpdate: async (): Promise<void> => {
    try {
      await api.post('/dashboard/notify-update');
    } catch (error) {
      throw error;
    }
  }
};

export default dashboardService;