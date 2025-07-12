import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import LoadingSpinner, { StatCardSkeleton, ChartSkeleton } from './shared/LoadingSpinner';
import { ErrorDisplay } from './shared/ErrorBoundary';
import { useErrorToast } from './shared/Toast';
import SpendingPieChart from './charts/SpendingPieChart';
import MonthlyTrendsChart from './charts/MonthlyTrendsChart';
import BudgetProgressChart from './charts/BudgetProgressChart';
import transactionService, { Transaction, TransactionStats } from '../services/transactionService';
import budgetService, { Budget, BudgetSummary } from '../services/budgetService';

const EnhancedDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      
      const [
        transactionsData,
        statsData,
        budgetsData,
        budgetSummaryData
      ] = await Promise.all([
        transactionService.getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        transactionService.getTransactionStats(),
        budgetService.getBudgets({ period: 'monthly' }),
        budgetService.getBudgetSummary('monthly')
      ]);
      
      setTransactions(transactionsData.transactions);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Prepare data for spending pie chart
  const getSpendingByCategory = () => {
    const categorySpending: { [key: string]: { amount: number; color: string; icon: string; name: string } } = {};
    
    transactions
      .filter(t => t.type === 'expense')
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

  // Prepare data for monthly trends (mock data for now)
  const getMonthlyTrends = () => {
    // In a real app, this would come from an API endpoint
    return [
      { month: 'Jan', income: 3500, expenses: 2800, net: 700 },
      { month: 'Feb', income: 3500, expenses: 3200, net: 300 },
      { month: 'Mar', income: 3500, expenses: 2600, net: 900 },
      { month: 'Apr', income: 3500, expenses: 3100, net: 400 },
      { month: 'May', income: 3500, expenses: 2900, net: 600 },
      { month: 'Jun', income: 3500, expenses: 3000, net: 500 },
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Create date in local timezone to avoid timezone offset issues
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Auto-refresh when component becomes visible (user returns from other pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      loadDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

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
