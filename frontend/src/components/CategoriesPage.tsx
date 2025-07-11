import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import Header from './shared/Header';
import CategoryForm from './CategoryForm';
import transactionService, { Category } from '../services/transactionService';

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

const CategoriesPage: React.FC = () => {
  const { state } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Load categories
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedCategories = await transactionService.getCategories();
      setCategories(fetchedCategories);
      filterCategories(fetchedCategories, typeFilter);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter categories by type
  const filterCategories = (cats: Category[], filter: 'all' | 'income' | 'expense') => {
    if (filter === 'all') {
      setFilteredCategories(cats);
    } else {
      setFilteredCategories(cats.filter(cat => cat.type === filter));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories(categories, typeFilter);
  }, [categories, typeFilter]);

  const handleCreateCategory = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      await transactionService.createCategory(data);
      setShowForm(false);
      await loadCategories();
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return;

    try {
      setIsSubmitting(true);
      await transactionService.updateCategory(editingCategory._id, data);
      setEditingCategory(null);
      setShowForm(false);
      await loadCategories();
    } catch (error: any) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      setError('Cannot edit default categories');
      return;
    }
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      setError('Cannot delete default categories');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    try {
      await transactionService.deleteCategory(category._id);
      await loadCategories();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleTypeFilterChange = (filter: 'all' | 'income' | 'expense') => {
    setTypeFilter(filter);
  };

  // Group categories by default/custom
  const defaultCategories = filteredCategories.filter(cat => cat.isDefault);
  const customCategories = filteredCategories.filter(cat => !cat.isDefault);

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
            <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
            <p className="text-gray-600">Manage your transaction categories</p>
          </div>

          {/* Type Filter */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleTypeFilterChange('all')}
                className={`px-4 py-2 rounded-md font-medium ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Categories
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('income')}
                className={`px-4 py-2 rounded-md font-medium ${
                  typeFilter === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => handleTypeFilterChange('expense')}
                className={`px-4 py-2 rounded-md font-medium ${
                  typeFilter === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Add Category Button */}
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
                Add Custom Category
              </button>
            </div>
          )}

          {/* Category Form */}
          {showForm && (
            <div className="mb-6">
              <CategoryForm
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
                onCancel={handleCancelForm}
                initialData={editingCategory ? {
                  name: editingCategory.name,
                  type: editingCategory.type,
                  icon: editingCategory.icon,
                  color: editingCategory.color
                } : undefined}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* Categories Display */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Custom Categories */}
              {customCategories.length > 0 && (
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Your Custom Categories</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {customCategories.map((category) => (
                      <div key={category._id} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                            style={{ backgroundColor: category.color }}
                          >
                            <span className="text-lg">{category.icon}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{category.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{category.type}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-gray-400 hover:text-blue-600"
                            title="Edit category"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Delete category"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Categories */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Default Categories</h3>
                  <p className="text-sm text-gray-500">These categories are provided by default and cannot be modified</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {defaultCategories.map((category) => (
                    <div key={category._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: category.color }}
                      >
                        <span className="text-sm">{category.icon}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{category.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{category.type}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;
