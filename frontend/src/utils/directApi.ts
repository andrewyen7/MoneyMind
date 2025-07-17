/**
 * Direct API client to bypass any URL typos
 * This is a temporary solution until the server-side issue is fixed
 */

import axios from 'axios';
import { BudgetFormData, BudgetFilters } from '../services/budgetService';

const API_BASE_URL = 'https://moneymind-g1po.onrender.com/api';

export const directApi = {
  // Get budgets with spending data
  async getBudgets(filters: BudgetFilters = {}) {
    try {
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/budgets`,
        params: filters,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.budgets;
    } catch (error: any) {
      console.error('Direct API - Get budgets error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  },
  
  // Get budget summary
  async getBudgetSummary(period: 'monthly' | 'yearly' = 'monthly') {
    try {
      const response = await axios({
        method: 'get',
        url: `${API_BASE_URL}/budgets/summary`,
        params: { period },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.summary;
    } catch (error: any) {
      console.error('Direct API - Get budget summary error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch budget summary');
    }
  },
  
  // Create budget - bypassing the budgets1 typo
  async createBudget(data: BudgetFormData) {
    try {
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/budgets`, // Explicitly use /budgets NOT /budgets1
        data,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Direct API - Budget creation error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  },
  
  // Update budget
  async updateBudget(id: string, data: Partial<BudgetFormData>) {
    try {
      const response = await axios({
        method: 'put',
        url: `${API_BASE_URL}/budgets/${id}`,
        data,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Direct API - Budget update error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  },
  
  // Delete budget
  async deleteBudget(id: string) {
    try {
      const response = await axios({
        method: 'delete',
        url: `${API_BASE_URL}/budgets/${id}`,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Direct API - Budget deletion error:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  }
};