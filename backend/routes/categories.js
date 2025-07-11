const express = require('express');
const Category = require('../models/Category');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories (default + user's custom)
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { type } = req.query;
    
    // Build query for default categories and user's custom categories
    const query = {
      $or: [
        { isDefault: true },
        { userId: req.user._id }
      ],
      isActive: true
    };
    
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }
    
    const categories = await Category.find(query)
      .sort({ isDefault: -1, name: 1 });
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

// @route   POST /api/categories
// @desc    Create a new custom category
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    
    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either income or expense'
      });
    }
    
    // Check if user already has a category with this name and type
    const existingCategory = await Category.findOne({
      userId: req.user._id,
      name: name.trim(),
      type,
      isActive: true
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'You already have a category with this name and type'
      });
    }
    
    // Create new category
    const newCategory = new Category({
      name: name.trim(),
      type,
      icon: icon || '📁',
      color: color || '#3B82F6',
      userId: req.user._id,
      isDefault: false
    });
    
    await newCategory.save();
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating category'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a custom category
// @access  Private
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    
    // Find category
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if it's a default category
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify default categories'
      });
    }
    
    // Update fields
    if (name) category.name = name.trim();
    if (icon) category.icon = icon;
    if (color) category.color = color;
    
    await category.save();
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating category'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a custom category
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find category
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if it can be deleted
    if (!category.canDelete()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default categories'
      });
    }
    
    // Soft delete
    category.isActive = false;
    await category.save();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting category'
    });
  }
});

module.exports = router;
