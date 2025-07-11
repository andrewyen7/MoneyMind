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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
  title?: string;
}

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ 
  data, 
  title = "Monthly Income vs Expenses" 
}) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map(item => item.income),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Expenses',
        data: data.map(item => item.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Net Income',
        data: data.map(item => item.net),
        backgroundColor: data.map(item => 
          item.net >= 0 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(245, 158, 11, 0.8)'
        ),
        borderColor: data.map(item => 
          item.net >= 0 ? 'rgba(59, 130, 246, 1)' : 'rgba(245, 158, 11, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

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
            return `${label}: $${value.toFixed(2)}`;
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
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return '$' + value;
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No monthly data available</p>
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
      
      {/* Summary below chart */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <span className="block text-gray-500">Avg Income</span>
            <span className="font-medium text-green-600">
              ${data.length > 0 ? (data.reduce((sum, item) => sum + item.income, 0) / data.length).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-gray-500">Avg Expenses</span>
            <span className="font-medium text-red-600">
              ${data.length > 0 ? (data.reduce((sum, item) => sum + item.expenses, 0) / data.length).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-gray-500">Avg Net</span>
            <span className={`font-medium ${
              data.length > 0 && (data.reduce((sum, item) => sum + item.net, 0) / data.length) >= 0 
                ? 'text-blue-600' 
                : 'text-yellow-600'
            }`}>
              ${data.length > 0 ? (data.reduce((sum, item) => sum + item.net, 0) / data.length).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrendsChart;
