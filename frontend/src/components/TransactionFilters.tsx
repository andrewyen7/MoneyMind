import React, { useState, useEffect } from 'react';
import transactionService, { Category, TransactionFilters } from '../services/transactionService';

interface TransactionFiltersProps {
  onFiltersChange: (filters: TransactionFilters) => void;
  currentFilters: TransactionFilters;
}

const TransactionFiltersComponent: React.FC<TransactionFiltersProps> = ({
  onFiltersChange,
  currentFilters
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(currentFilters);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await transactionService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: TransactionFilters = {
      page: 1,
      limit: 20,
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return !!(
      localFilters.type ||
      localFilters.category ||
      localFilters.startDate ||
      localFilters.endDate ||
      localFilters.search
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={localFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={localFilters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={localFilters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            handleFilterChange('startDate', today);
            handleFilterChange('endDate', today);
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
        >
          Today
        </button>
        
        <button
          onClick={() => {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            handleFilterChange('startDate', weekAgo.toISOString().split('T')[0]);
            handleFilterChange('endDate', today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
        >
          Last 7 days
        </button>
        
        <button
          onClick={() => {
            const today = new Date();
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            handleFilterChange('startDate', monthAgo.toISOString().split('T')[0]);
            handleFilterChange('endDate', today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
        >
          Last 30 days
        </button>
        
        <button
          onClick={() => {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            handleFilterChange('startDate', firstDay.toISOString().split('T')[0]);
            handleFilterChange('endDate', lastDay.toISOString().split('T')[0]);
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
        >
          This month
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {localFilters.type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {localFilters.type}
                <button
                  onClick={() => handleFilterChange('type', undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {categories.find(c => c._id === localFilters.category)?.name}
                <button
                  onClick={() => handleFilterChange('category', undefined)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {(localFilters.startDate || localFilters.endDate) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Date: {localFilters.startDate || '...'} to {localFilters.endDate || '...'}
                <button
                  onClick={() => {
                    handleFilterChange('startDate', undefined);
                    handleFilterChange('endDate', undefined);
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {localFilters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Search: "{localFilters.search}"
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFiltersComponent;
