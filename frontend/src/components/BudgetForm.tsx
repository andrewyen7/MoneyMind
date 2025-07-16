import React, { useState, useEffect } from 'react';
import transactionService, { Category } from '../services/transactionService';
import { BudgetFormData } from '../services/budgetService';

interface BudgetFormProps {
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<BudgetFormData>;
  isLoading?: boolean;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: initialData?.name || '',
    category: initialData?.category || '',
    amount: initialData?.amount || 0,
    period: initialData?.period || 'monthly',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    alertThreshold: initialData?.alertThreshold || 80,
    notes: initialData?.notes || ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load expense categories when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await transactionService.getCategories('expense');
        setCategories(fetchedCategories);
        
        // If no category is selected and we have categories, select the first one
        if (!formData.category && fetchedCategories.length > 0) {
          setFormData(prev => ({ ...prev, category: fetchedCategories[0]._id }));
        }
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Calculate end date when start date or period changes
  useEffect(() => {
    if (formData.startDate && formData.period) {
      // Parse date parts directly to avoid timezone issues
      const [year, month, day] = formData.startDate.split('-').map(Number);
      let endDate: Date;
      
      if (formData.period === 'monthly') {
        // Get the last day of the same month as start date
        endDate = new Date(year, month, 0); // month is 1-indexed, so this gets last day of that month
      } else {
        // For yearly, end on December 31st of the same year
        endDate = new Date(year, 11, 31);
      }
      
      const endYear = endDate.getFullYear();
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
      const endDay = String(endDate.getDate()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        endDate: `${endYear}-${endMonth}-${endDay}`
      }));
    }
  }, [formData.startDate, formData.period]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Budget name is required');
      return;
    }

    if (formData.amount <= 0) {
      setError('Budget amount must be greater than 0');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    if (!formData.startDate) {
      setError('Start date is required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        notes: formData.notes?.trim() || undefined
      };
      
      // Ensure endDate is set
      if (!submitData.endDate) {
        const start = new Date(submitData.startDate);
        if (submitData.period === 'monthly') {
          submitData.endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString().split('T')[0];
        } else {
          submitData.endDate = new Date(start.getFullYear(), 11, 31).toISOString().split('T')[0];
        }
      }
      
      console.log('Submitting budget data:', submitData);
      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Budget' : 'Create New Budget'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Budget Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Budget Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Monthly Food Budget"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          {loadingCategories ? (
            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              Loading categories...
            </div>
          ) : (
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount and Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Budget Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700">
              Period
            </label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Start Date and End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically calculated based on period
            </p>
          </div>
        </div>

        {/* Alert Threshold */}
        <div>
          <label htmlFor="alertThreshold" className="block text-sm font-medium text-gray-700">
            Alert Threshold ({formData.alertThreshold}%)
          </label>
          <input
            type="range"
            id="alertThreshold"
            name="alertThreshold"
            min="50"
            max="95"
            step="5"
            value={formData.alertThreshold}
            onChange={handleChange}
            className="mt-1 block w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50%</span>
            <span>Get notified when you reach this percentage of your budget</span>
            <span>95%</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any notes about this budget..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (initialData ? 'Update Budget' : 'Create Budget')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
