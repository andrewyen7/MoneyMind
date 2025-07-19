import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import Header from './shared/Header';
import BudgetForm from './BudgetForm';
import BudgetCard from './BudgetCard';
import { Budget, BudgetFormData, BudgetSummary } from '../services/budgetService';
import { formatCurrency } from '../utils/formatters';
import axios from 'axios';

const BudgetsPage: React.FC = () => {
  const { state } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<'monthly' | 'yearly'>('monthly');

  // Load budgets and summary
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use fetch API with production URLs
      const budgetsResponse = await fetch(`/api/budgets?period=${periodFilter}`, {
        credentials: 'include'
      });
      
      const summaryResponse = await fetch(`/api/budgets/summary?period=${periodFilter}`, {
        credentials: 'include'
      });
      
      // Parse JSON responses
      const budgetsData = await budgetsResponse.json();
      const summaryData = await summaryResponse.json();
      
      console.log('Budgets response:', budgetsData);
      console.log('Summary response:', summaryData);
      
      setBudgets(budgetsData.budgets || []);
      setSummary(summaryData.summary || null);
    } catch (error: any) {
      console.error('Error loading budget data:', error);
      setError(error.message || 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodFilter]);

  const handleCreateBudget = async (data: BudgetFormData) => {
    try {
      setIsSubmitting(true);
      console.log('Creating budget with data:', data);
      
      const response = await axios.post('/api/budgets', data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('Budget created successfully:', result);
      
      setShowForm(false);
      await loadData();
    } catch (error: any) {
      console.error('Budget creation failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBudget = async (data: BudgetFormData) => {
    if (!editingBudget) return;
    
    try {
      setIsSubmitting(true);
      console.log('Updating budget with data:', data);
      
      const response = await axios.put(`/api/budgets/${editingBudget._id}`, data, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = response.data;
      console.log('Budget updated successfully:', result);
      
      setEditingBudget(null);
      setShowForm(false);
      await loadData();
    } catch (error: any) {
      console.error('Budget update failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      console.log('Deleting budget with ID:', id);
      
      const response = await axios.delete(`/api/budgets/${id}`, {
        withCredentials: true
      });
      
      const result = response.data;
      console.log('Budget deleted successfully:', result);
      
      await loadData();
    } catch (error: any) {
      console.error('Budget deletion failed:', error);
      setError(error.message || 'Failed to delete budget');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
            <p className="text-gray-600">Track your spending against your budget goals</p>
          </div>

          {/* Period Filter */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPeriodFilter('monthly')}
                className={`px-4 py-2 rounded-md font-medium ${
                  periodFilter === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Monthly Budgets
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('yearly')}
                className={`px-4 py-2 rounded-md font-medium ${
                  periodFilter === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Yearly Budgets
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">$</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Budgeted
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(summary.totalBudgeted)}
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
                        <span className="text-white font-semibold">↗</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Spent
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(summary.totalSpent)}
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
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">↙</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Remaining
                        </dt>
                        <dd className="text-lg font-medium text-green-600">
                          {formatCurrency(summary.totalRemaining)}
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
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">#</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Budgets
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.budgetCount}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Budget Button */}
          {!showForm && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Budget
              </button>
            </div>
          )}

          {/* Budget Form */}
          {showForm && (
            <div className="mb-6">
              <BudgetForm
                onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
                onCancel={handleCancelForm}
                initialData={editingBudget ? {
                  name: editingBudget.name,
                  category: editingBudget.category._id,
                  amount: editingBudget.amount,
                  period: editingBudget.period,
                  startDate: editingBudget.startDate.split('T')[0],
                  alertThreshold: editingBudget.alertThreshold,
                  notes: editingBudget.notes
                } : undefined}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* Budget Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first budget to track your spending.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget._id}
                  budget={budget}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BudgetsPage;