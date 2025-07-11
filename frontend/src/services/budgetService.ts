import api from '../utils/api';
import { Category } from './transactionService';

export interface Budget {
  _id: string;
  userId: string;
  category: Category;
  name: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  alertThreshold: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Calculated fields from aggregation
  spent?: number;
  remaining?: number;
  percentageUsed?: number;
  isOverBudget?: boolean;
  isNearLimit?: boolean;
  status?: 'good' | 'warning' | 'over';
  transactionCount?: number;
}

export interface BudgetFormData {
  name: string;
  category: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertThreshold?: number;
  notes?: string;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  overBudgetCount: number;
  warningCount: number;
  goodCount: number;
}

export interface BudgetFilters {
  period?: 'monthly' | 'yearly';
  includeInactive?: boolean;
}

class BudgetService {
  // Get budgets with spending data
  async getBudgets(filters: BudgetFilters = {}): Promise<Budget[]> {
    try {
      const response = await api.get('/budgets', { params: filters });
      return response.data.budgets;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budgets');
    }
  }

  // Get budget summary
  async getBudgetSummary(period: 'monthly' | 'yearly' = 'monthly'): Promise<BudgetSummary> {
    try {
      const response = await api.get('/budgets/summary', { params: { period } });
      return response.data.summary;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget summary');
    }
  }

  // Get budget by ID
  async getBudget(id: string): Promise<Budget> {
    try {
      const response = await api.get(`/budgets/${id}`);
      return response.data.budget;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
  }

  // Create budget
  async createBudget(budgetData: BudgetFormData): Promise<Budget> {
    try {
      const response = await api.post('/budgets', budgetData);
      return response.data.budget;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
  }

  // Update budget
  async updateBudget(id: string, budgetData: Partial<BudgetFormData>): Promise<Budget> {
    try {
      const response = await api.put(`/budgets/${id}`, budgetData);
      return response.data.budget;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
  }

  // Delete budget
  async deleteBudget(id: string): Promise<void> {
    try {
      await api.delete(`/budgets/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'good':
        return '#10B981'; // green
      case 'warning':
        return '#F59E0B'; // yellow
      case 'over':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  }

  // Helper method to get status text
  getStatusText(status: string): string {
    switch (status) {
      case 'good':
        return 'On Track';
      case 'warning':
        return 'Near Limit';
      case 'over':
        return 'Over Budget';
      default:
        return 'Unknown';
    }
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Helper method to calculate days remaining in budget period
  getDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Helper method to get period display text
  getPeriodDisplayText(period: string): string {
    switch (period) {
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      default:
        return period;
    }
  }

  // Helper method to calculate suggested budget based on historical spending
  async getSuggestedBudget(categoryId: string, period: 'monthly' | 'yearly'): Promise<number> {
    try {
      // This would require additional API endpoint to analyze historical spending
      // For now, return a placeholder
      return 0;
    } catch (error: any) {
      throw new Error('Failed to calculate suggested budget');
    }
  }
}

export default new BudgetService();
