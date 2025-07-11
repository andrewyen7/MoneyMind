import React, { useState } from 'react';
import { Category } from '../services/transactionService';

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CategoryFormData>;
  isLoading?: boolean;
}

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    icon: '📁',
    color: '#3B82F6',
    ...initialData
  });

  const [error, setError] = useState<string | null>(null);

  // Common icons for categories
  const commonIcons = [
    '💰', '💸', '🍽️', '🚗', '🛍️', '🎬', '⚡', '🏥', '📚', '✈️',
    '🏠', '💼', '💻', '📈', '🎁', '🎯', '🎨', '🎵', '🏋️', '☕',
    '🍕', '🚌', '⛽', '📱', '👕', '💊', '🎪', '🎮', '📖', '🧾'
  ];

  // Common colors
  const commonColors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#6B7280', '#374151', '#1F2937'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Category name must be at least 2 characters long');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim()
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        {initialData ? 'Edit Category' : 'Create New Category'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Category Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter category name"
            required
          />
        </div>

        {/* Category Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Type
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
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
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
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

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-10 gap-2 mb-2">
            {commonIcons.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, icon }))}
                className={`w-8 h-8 text-lg rounded border-2 hover:border-blue-500 ${
                  formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Or enter custom emoji"
          />
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-10 gap-2 mb-2">
            {commonColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded border-2 hover:border-gray-400 ${
                  formData.color === color ? 'border-gray-600' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            className="mt-1 block w-20 h-10 border border-gray-300 rounded-md"
          />
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: formData.color }}
            >
              <span className="text-lg">{formData.icon}</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {formData.name || 'Category Name'}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {formData.type}
              </div>
            </div>
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

export default CategoryForm;
