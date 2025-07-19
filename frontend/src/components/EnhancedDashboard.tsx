import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import LoadingSpinner, { StatCardSkeleton, ChartSkeleton } from './shared/LoadingSpinner';
import { ErrorDisplay } from './shared/ErrorBoundary';
import { useErrorToast } from './shared/Toast';
import SpendingPieChart from './charts/SpendingPieChart';
import MonthlyTrendsChart from './charts/MonthlyTrendsChart';
import BudgetProgressChart from './charts/BudgetProgressChart';
import transactionService, { Transaction, TransactionStats } from '../services/transactionService';
import { Budget, BudgetSummary } from '../services/budgetService';
import axios from 'axios';

// Environment-aware API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3000/api';

const EnhancedDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allExpenseTransactions, setAllExpenseTransactions] = useState<Transaction[]>([]);
  const [allIncomeTransactions, setAllIncomeTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const showError = useErrorToast();

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use direct axios calls with hardcoded localhost URL to avoid any cached URLs
      const [
        recentTransactionsResponse,
        allExpenseTransactionsResponse,
        allIncomeTransactionsResponse,
        statsResponse,
        budgetsResponse,
        budgetSummaryResponse
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/transactions`, { 
          params: { limit: 5, sortBy: 'date', sortOrder: 'desc' },
          withCredentials: true 
        }),
        axios.get(`${API_BASE_URL}/transactions`, { 
          params: { type: 'expense', limit: 1000, sortBy: 'date', sortOrder: 'desc' },
          withCredentials: true 
        }),
        axios.get(`${API_BASE_URL}/transactions`, { 
          params: { type: 'income', limit: 1000, sortBy: 'date', sortOrder: 'desc' },
          withCredentials: true 
        }),
        axios.get(`${API_BASE_URL}/transactions/stats`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/budgets`, { 
          params: { period: 'monthly' },
          withCredentials: true 
        }),
        axios.get(`${API_BASE_URL}/budgets/summary`, { 
          params: { period: 'monthly' },
          withCredentials: true 
        })
      ]);
      
      // Extract data from responses
      const recentTransactionsData = { transactions: recentTransactionsResponse.data.transactions || [] };
      const allExpenseTransactionsData = { transactions: allExpenseTransactionsResponse.data.transactions || [] };
      const allIncomeTransactionsData = { transactions: allIncomeTransactionsResponse.data.transactions || [] };
      const statsData = statsResponse.data.stats;
      const budgetsData = budgetsResponse.data.budgets || [];
      const budgetSummaryData = budgetSummaryResponse.data.summary;
      
      setTransactions(recentTransactionsData.transactions);
      setAllExpenseTransactions(allExpenseTransactionsData.transactions);
      setAllIncomeTransactions(allIncomeTransactionsData.transactions);
      
      console.log('All expense transactions loaded:', allExpenseTransactionsData.transactions.length);
      console.log('All income transactions loaded:', allIncomeTransactionsData.transactions.length);
      console.log('Recent transactions loaded:', recentTransactionsData.transactions.length);
      
      setStats(statsData);
      setBudgets(budgetsData);
      setBudgetSummary(budgetSummaryData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      showError('Dashboard Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const location = useLocation();
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line
  }, [location.pathname]);

  // Prepare data for spending pie chart
  const getSpendingByCategory = () => {
    const categorySpending: { [key: string]: { amount: number; color: string; icon: string; name: string } } = {};
    
    allExpenseTransactions
      .forEach(transaction => {
        const categoryId = transaction.category._id;
        if (!categorySpending[categoryId]) {
          categorySpending[categoryId] = {
            amount: 0,
            color: transaction.category.color,
            icon: transaction.category.icon,
            name: transaction.category.name
          };
        }
        categorySpending[categoryId].amount += transaction.amount;
      });

    return Object.values(categorySpending).map(cat => ({
      category: cat.name,
      amount: cat.amount,
      color: cat.color,
      icon: cat.icon
    }));
  };

  // Prepare data for monthly trends from real transaction data
  const getMonthlyTrends = () => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months of the current year with zero values
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Add all months of the current year
    for (let month = 0; month < 12; month++) {
      const monthKey = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    console.log('Processing transactions for monthly trends...');
    
    // Get all transactions (both income and expense)
    const allTransactions = [...allExpenseTransactions, ...allIncomeTransactions];
    
    // Remove duplicates by ID
    const uniqueTransactions = Array.from(
      new Map(allTransactions.map(item => [item._id, item])).values()
    );
    
    console.log(`Total unique transactions for monthly trends: ${uniqueTransactions.length}`);
    
    // Process all transactions to get real monthly data
    uniqueTransactions.forEach(transaction => {
      if (!transaction || !transaction.date) {
        console.log('Invalid transaction found:', transaction);
        return;
      }
      
      // Parse the date string to get year and month
      const [year, month] = transaction.date.split('T')[0].split('-');
      const monthKey = `${year}-${month}`;
      
      if (monthlyData[monthKey]) {
        if (transaction.type === 'income') {
          console.log(`Adding income: ${transaction.amount} for ${monthKey} - ${transaction.description}`);
          monthlyData[monthKey].income += Number(transaction.amount) || 0;
        } else {
          console.log(`Adding expense: ${transaction.amount} for ${monthKey} - ${transaction.description}`);
          monthlyData[monthKey].expenses += Number(transaction.amount) || 0;
        }
      } else {
        console.log(`Creating new month data for ${monthKey}`);
        monthlyData[monthKey] = {
          income: transaction.type === 'income' ? Number(transaction.amount) || 0 : 0,
          expenses: transaction.type === 'expense' ? Number(transaction.amount) || 0 : 0
        };
      }
    });
    
    console.log('Monthly data after processing:', monthlyData);
    
    // Convert to chart format
    const result = Object.keys(monthlyData).map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      const data = monthlyData[monthKey];
      return {
        month: monthName,
        income: Number(data.income) || 0,
        expenses: Number(data.expenses) || 0,
        net: (Number(data.income) || 0) - (Number(data.expenses) || 0)
      };
    });
    
    console.log('Final monthly trends data:', result);
    return result;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Extract date parts directly from string to avoid timezone conversion
    const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part
    const [year, month, day] = dateStr.split('-');
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 space-y-6">
            <div className="mb-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
            <StatCardSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <ChartSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={loadDashboardData}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Financial Dashboard</h2>
            <p className="text-gray-600">Your complete financial overview</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">↗</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Income
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(stats.income.total)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">↙</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Expenses
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(stats.expense.total)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        stats.netIncome >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                      }`}>
                        <span className="text-white font-semibold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Net Income
                        </dt>
                        <dd className={`text-lg font-medium ${
                          stats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(stats.netIncome)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpendingPieChart data={getSpendingByCategory()} />
            <MonthlyTrendsChart data={getMonthlyTrends()} />
          </div>

          {/* Budget Progress Chart */}
          {budgets.length > 0 && (
            <div className="mb-6">
              <BudgetProgressChart budgets={budgets} />
            </div>
          )}

          {/* Recent Transactions and Budget Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: transaction.category.color }}
                        >
                          {transaction.category.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.date)} • {transaction.category.name}
                          </p>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No transactions yet
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <a href="/transactions" className="text-sm text-blue-600 hover:text-blue-800">
                  View all transactions →
                </a>
              </div>
            </div>

            {/* Budget Summary */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Budget Overview</h3>
              </div>
              {budgetSummary ? (
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Budgeted</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(budgetSummary.totalBudgeted)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Spent</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(budgetSummary.totalSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Remaining</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(budgetSummary.totalRemaining)}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {budgetSummary.goodCount}
                          </div>
                          <div className="text-xs text-gray-500">On Track</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-yellow-600">
                            {budgetSummary.warningCount}
                          </div>
                          <div className="text-xs text-gray-500">Warning</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-red-600">
                            {budgetSummary.overBudgetCount}
                          </div>
                          <div className="text-xs text-gray-500">Over Budget</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No budgets created yet
                </div>
              )}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <a href="/budgets" className="text-sm text-blue-600 hover:text-blue-800">
                  Manage budgets →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EnhancedDashboard;
