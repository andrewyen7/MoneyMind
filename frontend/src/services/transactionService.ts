import api from '../utils/api';
import { ErrorHandler, AppError } from '../utils/errorHandler';
import { cache, CacheKeys, invalidateRelatedCaches } from '../utils/cache';
import { performanceMonitor } from '../utils/performance';

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: Category;
  date: string;
  notes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionStats {
  income: {
    total: number;
    count: number;
    avgAmount: number;
  };
  expense: {
    total: number;
    count: number;
    avgAmount: number;
  };
  netIncome: number;
}

export interface MonthlyExpenseData {
  month: string;
  year: number;
  totalExpenses: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }[];
}

export interface ExpenseAnalyticsFilters {
  month: number;
  year: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

class TransactionService {
  // Get categories
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    try {
      const params = type ? { type } : {};
      const response = await api.get('/categories', { params });
      return response.data.categories;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  }

  // Create category
  async createCategory(categoryData: Omit<Category, '_id' | 'userId' | 'isDefault' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data.category;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  }

  // Update category
  async updateCategory(id: string, categoryData: Partial<Omit<Category, '_id' | 'userId' | 'isDefault' | 'isActive' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data.category;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  }

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  }

  // Get transactions with caching
  async getTransactions(filters: TransactionFilters = {}): Promise<{
    transactions: Transaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const cacheKey = CacheKeys.transactions(filters);

    // Check cache first
    const cachedData = cache.get<{
      transactions: Transaction[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(cacheKey);
    if (cachedData && cachedData.transactions && cachedData.pagination) {
      return cachedData;
    }

    try {
      // Use a unique metric name for each call to avoid conflicts
      const metricName = `api-get-transactions-${Date.now()}`;
      performanceMonitor.start(metricName);
      
      const response = await api.get('/transactions', { params: filters });
      const result = {
        transactions: response.data.transactions,
        pagination: response.data.pagination
      };
      
      // End performance measurement
      performanceMonitor.end(metricName);

      // Cache the result for 2 minutes
      cache.set(cacheKey, result, 2 * 60 * 1000);
      return result;
    } catch (error: any) {
      // Error is already handled by the API interceptor
      throw error;
    }
  }

  // Get transaction by ID
  async getTransaction(id: string): Promise<Transaction> {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data.transaction;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transaction');
    }
  }

  // Create transaction
  async createTransaction(transactionData: TransactionFormData): Promise<Transaction> {
    try {
      const response = await api.post('/transactions', transactionData);
      return response.data.transaction;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create transaction');
    }
  }

  // Update transaction
  async updateTransaction(id: string, transactionData: Partial<TransactionFormData>): Promise<Transaction> {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      return response.data.transaction;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update transaction');
    }
  }

  // Delete transaction
  async deleteTransaction(id: string): Promise<void> {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete transaction');
    }
  }

  // Get transaction statistics
  async getTransactionStats(startDate?: string, endDate?: string): Promise<TransactionStats> {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/transactions/stats', { params });
      return response.data.stats;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch transaction statistics');
    }
  }

  // Get monthly expense analytics
  async getMonthlyExpenseAnalytics(filters: ExpenseAnalyticsFilters): Promise<MonthlyExpenseData> {
    try {
      const response = await api.get('/transactions/monthly-expenses', { params: filters });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch monthly expense analytics');
    }
  }

  // Get expense data for a specific month (client-side calculation as fallback)
  async getExpensesByMonth(month: number, year: number): Promise<MonthlyExpenseData> {
    try {
      // Create date range for the month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get transactions for the month
      const { transactions } = await this.getTransactions({
        type: 'expense',
        startDate,
        endDate,
        limit: 1000 // Get all transactions for the month
      });

      // Calculate category breakdown
      const categoryMap = new Map<string, {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        amount: number;
        transactionCount: number;
      }>();

      let totalExpenses = 0;

      transactions.forEach(transaction => {
        const categoryId = transaction.category._id;
        totalExpenses += transaction.amount;

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!;
          existing.amount += transaction.amount;
          existing.transactionCount += 1;
        } else {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName: transaction.category.name,
            categoryIcon: transaction.category.icon,
            categoryColor: transaction.category.color,
            amount: transaction.amount,
            transactionCount: 1
          });
        }
      });

      // Convert to array and calculate percentages
      const categoryBreakdown = Array.from(categoryMap.values()).map(category => ({
        ...category,
        percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      return {
        month: monthNames[month - 1],
        year,
        totalExpenses,
        categoryBreakdown
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch monthly expenses');
    }
  }
}

export default new TransactionService();
