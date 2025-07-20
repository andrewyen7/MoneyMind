import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Budget } from '../../services/budgetService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BudgetProgressChartProps {
  budgets: Budget[];
  title?: string;
}

const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({ 
  budgets, 
  title = "Budget Progress" 
}) => {
  const chartData = {
    labels: budgets.map(budget => {
      const categoryName = budget.category.name;
      const periodTitle = budget.periodTitle || (budget.period === 'yearly' ? 'Yearly' : 'Monthly');
      return `${categoryName}\n(${periodTitle})`;
    }),
    datasets: [
      {
        label: 'Budgeted',
        data: budgets.map(budget => budget.amount),
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Spent',
        data: budgets.map(budget => budget.spent || 0),
        backgroundColor: budgets.map(budget => {
          const spent = budget.spent || 0;
          const percentage = (spent / budget.amount) * 100;
          
          if (percentage >= 100) return 'rgba(239, 68, 68, 0.8)'; // Red - over budget
          if (percentage >= budget.alertThreshold) return 'rgba(245, 158, 11, 0.8)'; // Yellow - warning
          return 'rgba(34, 197, 94, 0.8)'; // Green - good
        }),
        borderColor: budgets.map(budget => {
          const spent = budget.spent || 0;
          const percentage = (spent / budget.amount) * 100;
          
          if (percentage >= 100) return 'rgba(239, 68, 68, 1)';
          if (percentage >= budget.alertThreshold) return 'rgba(245, 158, 11, 1)';
          return 'rgba(34, 197, 94, 1)';
        }),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // Calculate a reasonable max value for the chart
  const maxBudget = Math.max(...budgets.map(b => b.amount));
  const maxSpent = Math.max(...budgets.map(b => b.spent || 0));
  const chartMaxValue = Math.ceil(Math.max(maxBudget, maxSpent) * 1.2);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const budgetIndex = context.dataIndex;
            const budget = budgets[budgetIndex];
            
            if (label === 'Spent' && budget) {
              const percentage = ((value / budget.amount) * 100).toFixed(1);
              return `${label}: $${value.toFixed(2)} (${percentage}%)`;
            }
            
            return `${label}: $${value.toFixed(2)}`;
          },
          afterLabel: function(context) {
            if (context.dataset.label === 'Spent') {
              const budgetIndex = context.dataIndex;
              const budget = budgets[budgetIndex];
              const remaining = budget.amount - (budget.spent || 0);
              
              if (remaining < 0) {
                return `Over budget by $${Math.abs(remaining).toFixed(2)}`;
              } else {
                return `Remaining: $${remaining.toFixed(2)}`;
              }
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        max: chartMaxValue,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            const numValue = typeof value === 'number' ? value : 0;
            // Format large numbers more readably
            if (numValue >= 1000) {
              return '$' + (numValue / 1000).toFixed(1) + 'k';
            }
            return '$' + numValue;
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  if (budgets.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No budget data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Legend for status colors */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-center space-x-6 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600">On Track</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-600">Near Limit</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-600">Over Budget</span>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 text-sm mt-4">
          <div className="text-center">
            <span className="block text-gray-500">Total Budgets</span>
            <span className="font-medium">{budgets.length}</span>
          </div>
          <div className="text-center">
            <span className="block text-gray-500">On Track</span>
            <span className="font-medium text-green-600">
              {budgets.filter(b => (b.spent || 0) < b.amount * (b.alertThreshold / 100)).length}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-gray-500">Over Budget</span>
            <span className="font-medium text-red-600">
              {budgets.filter(b => (b.spent || 0) > b.amount).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressChart;
