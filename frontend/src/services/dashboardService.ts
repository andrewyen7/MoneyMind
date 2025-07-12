import api from '../utils/api';

export interface DashboardData {
  transactions: any[];
  stats: {
    income: { total: number; count: number; avgAmount: number };
    expense: { total: number; count: number; avgAmount: number };
    netIncome: number;
  };
  budgets: any[];
  lastUpdate: number;
}

export interface UpdateCheckResult {
  hasUpdates: boolean;
  lastUpdate: number;
}

const dashboardService = {
  /**
   * Get dashboard data
   */
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await api.get('/dashboard/data');
      return response.data;
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