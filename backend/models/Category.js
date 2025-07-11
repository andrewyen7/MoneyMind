const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Category type must be either income or expense'
    }
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isDefault; // Only custom categories need userId
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ isDefault: 1, type: 1 });

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    // Income categories
    { name: 'Salary', type: 'income', icon: '💼', color: '#10B981', isDefault: true },
    { name: 'Freelance', type: 'income', icon: '💻', color: '#059669', isDefault: true },
    { name: 'Investment', type: 'income', icon: '📈', color: '#047857', isDefault: true },
    { name: 'Gift', type: 'income', icon: '🎁', color: '#065F46', isDefault: true },
    { name: 'Other Income', type: 'income', icon: '💰', color: '#064E3B', isDefault: true },
    
    // Expense categories
    { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#EF4444', isDefault: true },
    { name: 'Transportation', type: 'expense', icon: '🚗', color: '#F97316', isDefault: true },
    { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#F59E0B', isDefault: true },
    { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#EAB308', isDefault: true },
    { name: 'Bills & Utilities', type: 'expense', icon: '⚡', color: '#84CC16', isDefault: true },
    { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#22C55E', isDefault: true },
    { name: 'Education', type: 'expense', icon: '📚', color: '#06B6D4', isDefault: true },
    { name: 'Travel', type: 'expense', icon: '✈️', color: '#3B82F6', isDefault: true },
    { name: 'Housing', type: 'expense', icon: '🏠', color: '#6366F1', isDefault: true },
    { name: 'Other Expense', type: 'expense', icon: '💸', color: '#8B5CF6', isDefault: true }
  ];
};

// Static method to initialize default categories
categorySchema.statics.initializeDefaults = async function() {
  const defaultCategories = this.getDefaultCategories();
  
  for (const categoryData of defaultCategories) {
    const existingCategory = await this.findOne({ 
      name: categoryData.name, 
      isDefault: true 
    });
    
    if (!existingCategory) {
      await this.create(categoryData);
    }
  }
};

// Instance method to check if category can be deleted
categorySchema.methods.canDelete = function() {
  return !this.isDefault;
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
