import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import Header from './shared/Header';
import dashboardService from '../services/dashboardService';
import axios from 'axios';
import { API_CONFIG } from '../config';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    
    // Use API_CONFIG for environment-aware URL
    axios.get(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/dashboard/data`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        console.log('Dashboard data loaded:', response.data);
        setDashboard(response.data);
        setError(null);
      })
      .catch(e => {
        console.error('Dashboard data error:', e);
        setError('Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  // Pie Chart Data (Spending by Category)
  const pieData = dashboard?.categorySpending ? {
    labels: dashboard.categorySpending
      .filter((c: any) => c.category && c.category.name) // Filter out items with undefined category
      .map((c: any) => c.category.name || 'Uncategorized'),
    datasets: [
      {
        data: dashboard.categorySpending
          .filter((c: any) => c.category && c.category.name) // Filter out items with undefined category
          .map((c: any) => c.total),
        backgroundColor: dashboard.categorySpending
          .filter((c: any) => c.category && c.category.name) // Filter out items with undefined category
          .map((c: any) => c.category.color || '#8884d8'),
        borderWidth: 1,
      },
    ],
  } : null;
  
  // Log pie chart data for debugging
  console.log('Pie Chart Data:', pieData);

  // Bar Chart Data (Monthly Income vs Expenses)
  const barData = dashboard?.monthlySummary ? {
    labels: dashboard.monthlySummary.map((m: any) => m.month),
    datasets: [
      {
        label: 'Income',
        data: dashboard.monthlySummary.map((m: any) => {
          // Log the income value for debugging
          console.log(`Month: ${m.month}, Income: ${m.income}`);
          return m.income;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      },
      {
        label: 'Expenses',
        data: dashboard.monthlySummary.map((m: any) => m.expenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Net Income',
        data: dashboard.monthlySummary.map((m: any) => m.net),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      },
    ],
  } : null;
  
  // Log bar chart data for debugging
  console.log('Bar Chart Data:', barData);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="text-center py-16">Loading dashboard...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
          ) : dashboard ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <span className="text-green-600 font-bold">Total Income</span>
                  <span className="text-2xl font-semibold">${dashboard.stats.income.total.toLocaleString()}</span>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <span className="text-red-600 font-bold">Total Expenses</span>
                  <span className="text-2xl font-semibold">${dashboard.stats.expense.total.toLocaleString()}</span>
                </div>
                <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                  <span className="text-orange-600 font-bold">Net Income</span>
                  <span className="text-2xl font-semibold">${dashboard.stats.netIncome.toLocaleString()}</span>
                </div>
              </div>
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
                  {pieData && pieData.labels.length > 0 ? (
                    <Pie data={pieData} />
                  ) : (
                    <div className="text-center text-gray-400">No expense data</div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Monthly Income vs Expenses</h3>
                  {barData && barData.labels.length > 0 ? (
                    <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                  ) : (
                    <div className="text-center text-gray-400">No monthly data</div>
                  )}
                </div>
              </div>
              {/* User Info */}
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">User Information</h3>
                <div className="text-left space-y-2">
                  <p><strong>Username:</strong> {state.user?.username}</p>
                  <p><strong>Email:</strong> {state.user?.email}</p>
                  <p><strong>Name:</strong> {state.user?.firstName} {state.user?.lastName}</p>
                  <p><strong>Member since:</strong> {state.user?.createdAt ? new Date(state.user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
