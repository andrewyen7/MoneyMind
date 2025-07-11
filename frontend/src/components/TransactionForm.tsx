import React, { useState, useEffect } from 'react';
import transactionService, { Category, TransactionFormData } from '../services/transactionService';

interface TransactionFormProps {
  onSubmit: (data: TransactionFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TransactionFormData>;
  isLoading?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: 0,
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: [],
    ...initialData
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Load categories when component mounts or type changes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const fetchedCategories = await transactionService.getCategories(formData.type);
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
  }, [formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type,
      category: '' // Reset category when type changes
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!formData.category) {
      setError('Category is required');
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Transaction' : 'Add New Transaction'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`px-4 py-2 rounded-md font-medium ${
                formData.type === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`px-4 py-2 rounded-md font-medium ${
                formData.type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
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

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
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
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tags (Optional)
          </label>
          <div className="mt-1 flex flex-wrap gap-2 mb-2">
            {formData.tags?.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
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
            {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
