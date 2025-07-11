import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import transactionService, { MonthlyExpenseData } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './shared/LoadingSpinner';
import Navigation from './shared/Navigation';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseAnalytics: React.FC = () => {
  const { state } = useAuth();
  const [expenseData, setExpenseData] = useState<MonthlyExpenseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadExpenseData = async (month: number, year: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await transactionService.getExpensesByMonth(month, year);
      setExpenseData(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    loadExpenseData(month, year);
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getChartData = () => {
    if (!expenseData || expenseData.categoryBreakdown.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['#6B7280'],
          borderWidth: 0
        }]
      };
    }

    return {
      labels: expenseData.categoryBreakdown.map(cat => cat.categoryName),
      datasets: [{
        data: expenseData.categoryBreakdown.map(cat => cat.amount),
        backgroundColor: expenseData.categoryBreakdown.map(cat => cat.categoryColor),
        borderWidth: 0,
        cutout: '45%'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const percentage = expenseData?.categoryBreakdown[context.dataIndex]?.percentage || 0;
            return `${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 0
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button
          type="button"
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center flex-1">
          <h1 className="text-lg font-semibold">
            {currentDate.getFullYear()} {currentDate.toLocaleDateString('en-US', { month: 'short' })}.
          </h1>
        </div>

        <button
          type="button"
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="bg-gray-800 px-3 py-1 rounded-lg text-sm ml-2">
          Monthly
        </div>
      </div>

      {/* Income/Expenses Toggle */}
      <div className="flex border-b border-gray-700">
        <button type="button" className="flex-1 py-3 text-gray-400 text-center">
          Income
        </button>
        <button type="button" className="flex-1 py-3 text-white text-center border-b-2 border-red-500">
          Expenses {formatCurrency(expenseData?.totalExpenses || 0)}
        </button>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        <div className="relative h-72 mb-8 flex items-center justify-center">
          <Doughnut data={getChartData()} options={chartOptions} />
          {/* Center text showing total */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(expenseData?.totalExpenses || 0)}
              </div>
              <div className="text-sm text-gray-400">Total</div>
            </div>
          </div>
        </div>

        {/* Category Legend with icons and percentages */}
        <div className="space-y-3">
          {expenseData?.categoryBreakdown.map((category, index) => (
            <div key={category.categoryId} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.categoryColor }}
                />
                <span className="text-lg">{category.categoryIcon}</span>
                <span className="text-sm font-medium">{category.categoryName}</span>
              </div>
              <span className="text-sm text-gray-300 font-medium">
                {category.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="px-4 pb-24">
        {expenseData?.categoryBreakdown.map((category, index) => (
          <div key={category.categoryId} className="flex items-center justify-between py-4 border-b border-gray-800 last:border-b-0">
            <div className="flex items-center space-x-4">
              <div
                className="px-2 py-1 rounded text-xs font-bold text-white min-w-[40px] text-center"
                style={{ backgroundColor: category.categoryColor }}
              >
                {Math.round(category.percentage)}%
              </div>
              <span className="text-xl">{category.categoryIcon}</span>
              <span className="font-medium text-white">{category.categoryName}</span>
            </div>
            <span className="font-bold text-white text-lg">{formatCurrency(category.amount)}</span>
          </div>
        ))}

        {/* Empty state */}
        {(!expenseData?.categoryBreakdown || expenseData.categoryBreakdown.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">No expenses this month</p>
            <p className="text-sm">Add some transactions to see your spending breakdown</p>
          </div>
        )}
      </div>

      </div>
    </div>
  );
};

export default ExpenseAnalytics;
