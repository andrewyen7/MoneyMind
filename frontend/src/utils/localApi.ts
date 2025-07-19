/**
 * Local API client that forces connections to localhost
 */

import axios from 'axios';
import { BudgetFormData, BudgetFilters } from '../services/budgetService';

// Force the URL to be localhost:3000
const API_BASE_URL = 'http://localhost:3000/api';

// Request config with cache busting
const requestConfig = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

export const localApi = {
  // Get budgets with spending data
  async getBudgets(filters: BudgetFilters = {}) {
    try {
      console.log('Local API - Getting budgets from localhost');
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/budgets`,
        params: filters,
        ...requestConfig
      });
      
      return response.data.budgets;
    } catch (error: any) {
      console.error('Local API - Get budgets error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  },
  
  // Get budget summary
  async getBudgetSummary(period: 'monthly' | 'yearly' = 'monthly') {
    try {
      console.log('Local API - Getting budget summary from localhost');
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/budgets/summary`,
        params: { period },
        ...requestConfig
      });
      
      return response.data.summary;
    } catch (error: any) {
      console.error('Local API - Get budget summary error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budget summary');
    }
  },
  
  // Create budget
  async createBudget(data: BudgetFormData) {
    try {
      console.log('Local API - Creating budget on localhost');
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/budgets`,
        data,
        ...requestConfig
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Local API - Budget creation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  },
  
  // Update budget
  async updateBudget(id: string, data: Partial<BudgetFormData>) {
    try {
      console.log('Local API - Updating budget on localhost');
      const response = await axios({
        method: 'put',
        url: `${API_BASE_URL}/budgets/${id}`,
        data,
        ...requestConfig
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Local API - Budget update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  },
  
  // Delete budget
  async deleteBudget(id: string) {
    try {
      console.log('Local API - Deleting budget on localhost');
      const response = await axios({
        method: 'delete',
        url: `${API_BASE_URL}/budgets/${id}`,
        ...requestConfig
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Local API - Budget deletion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  },

  // Get dashboard data
  async getDashboardData() {
    try {
      console.log('Local API - Getting dashboard data from localhost');
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/dashboard/data`,
        ...requestConfig
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Local API - Dashboard data error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
};