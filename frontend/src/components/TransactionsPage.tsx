import React, { useState, useEffect } from 'react';
import Navigation from './shared/Navigation';
import Header from './shared/Header';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import TransactionFilters from './TransactionFilters';
import transactionService, { Transaction, TransactionFormData, TransactionStats, TransactionFilters as TFilters } from '../services/transactionService';

const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<TFilters>({
    page: 1,
    limit: 20,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load transactions and stats
  const loadData = async (currentFilters = filters) => {
    try {
      setIsLoading(true);
      setError(null);

      const [transactionsData, statsData] = await Promise.all([
        transactionService.getTransactions(currentFilters),
        transactionService.getTransactionStats(currentFilters.startDate, currentFilters.endDate)
      ]);

      setTransactions(transactionsData.transactions);
      setPagination(transactionsData.pagination);
      setStats(statsData);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: TFilters) => {
    setFilters(newFilters);
    loadData(newFilters);
  };

  const handleCreateTransaction = async (data: TransactionFormData) => {
    try {
      setIsSubmitting(true);
      await transactionService.createTransaction(data);
      setShowForm(false);
      // Immediately reload data to show the new transaction
      await loadData();
    } catch (error: any) {
      throw error; // Let the form handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (data: TransactionFormData) => {
    if (!editingTransaction) return;
    
    try {
      setIsSubmitting(true);
      await transactionService.updateTransaction(editingTransaction._id, data);
      setEditingTransaction(null);
      await loadData(); // Reload data
    } catch (error: any) {
      throw error; // Let the form handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionService.deleteTransaction(id);
      await loadData(); // Reload data
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
                          {formatAmount(stats.income.total)}
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
                          {formatAmount(stats.expense.total)}
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
                          {formatAmount(stats.netIncome)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Filters */}
          <TransactionFilters
            onFiltersChange={handleFiltersChange}
            currentFilters={filters}
          />

          {/* Add Transaction Button */}
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
                Add Transaction
              </button>
            </div>
          )}

          {/* Transaction Form */}
          {showForm && (
            <div className="mb-6">
              <TransactionForm
                onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                onCancel={handleCancelForm}
                initialData={editingTransaction ? {
                  type: editingTransaction.type,
                  amount: editingTransaction.amount,
                  description: editingTransaction.description,
                  category: editingTransaction.category._id,
                  date: (() => {
                    // Ensure date format is YYYY-MM-DD
                    const dateStr = editingTransaction.date;
                    
                    // If it's MM/DD/YYYY format (like 01/07/2025)
                    if (dateStr.includes('/')) {
                      const parts = dateStr.split('/');
                      if (parts.length === 3) {
                        const [month, day, year] = parts;
                        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      }
                    }
                    
                    // If it's ISO format (contains T)
                    if (dateStr.includes('T')) {
                      return dateStr.split('T')[0];
                    }
                    
                    // If it's already YYYY-MM-DD format
                    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      return dateStr;
                    }
                    
                    // Try to parse date and format it
                    try {
                      const date = new Date(dateStr);
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    } catch {
                      return dateStr;
                    }
                  })(),
                  notes: editingTransaction.notes,
                  tags: editingTransaction.tags
                } : undefined}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* Transaction List */}
          <TransactionList
            transactions={transactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            isLoading={isLoading}
          />

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * (filters.limit || 20)) + 1} to{' '}
                {Math.min(pagination.currentPage * (filters.limit || 20), pagination.totalCount)} of{' '}
                {pagination.totalCount} results
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleFiltersChange({ ...filters, page: pagination.currentPage - 1 })}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handleFiltersChange({ ...filters, page: pagination.currentPage + 1 })}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionsPage;
