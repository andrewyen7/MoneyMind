const express = require('express');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();
console.log('✅ Budget routes loaded - should be /api/budgets NOT /api/budgets1');

// @route   GET /api/budgets
// @desc    Get user's budgets with spending data
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { period, includeInactive } = req.query;
    
    const budgets = await Budget.getBudgetsWithSpending(req.user._id, {
      period,
      includeInactive: includeInactive === 'true'
    });
    
    res.json({
      success: true,
      budgets
    });
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budgets'
    });
  }
});

// @route   GET /api/budgets/summary
// @desc    Get budget summary for dashboard
// @access  Private
router.get('/summary', ensureAuthenticated, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const summary = await Budget.getBudgetSummary(req.user._id, period);
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get budget summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget summary'
    });
  }
});

// @route   GET /api/budgets/:id
// @desc    Get a specific budget with spending data
// @access  Private
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('category', 'name icon color type');
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Get spending data for this budget
    const budgetsWithSpending = await Budget.getBudgetsWithSpending(req.user._id);
    const budgetWithSpending = budgetsWithSpending.find(b => b._id.toString() === req.params.id);
    
    res.json({
      success: true,
      budget: budgetWithSpending || budget
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching budget'
    });
  }
});

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const {
      name,
      category,
      amount,
      period,
      startDate,
      alertThreshold,
      notes
    } = req.body;
    
    // Validation
    if (!name || !category || !amount || !period || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, amount, period, and start date are required'
      });
    }
    
    // Verify category exists and belongs to user or is default
    const categoryDoc = await Category.findOne({
      _id: category,
      $or: [
        { isDefault: true },
        { userId: req.user._id }
      ],
      isActive: true,
      type: 'expense' // Budgets are only for expense categories
    });
    
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense category'
      });
    }
    
    // Calculate end date based on period
    const start = new Date(startDate);
    let endDate;
    if (period === 'monthly') {
      // Get the last day of the current month
      endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    } else if (period === 'yearly') {
      endDate = new Date(start.getFullYear(), 11, 31);
    }
    
    console.log('Creating budget with data:', {
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      period,
      startDate: start,
      endDate,
      alertThreshold: alertThreshold || 80
    });

    // Create budget
    const newBudget = new Budget({
      userId: req.user._id,
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      period,
      startDate: start,
      endDate,
      alertThreshold: alertThreshold || 80,
      notes: notes ? notes.trim() : undefined
    });
    
    // Check for overlapping budgets
    const hasOverlap = await newBudget.checkOverlap();
    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'A budget for this category already exists in the specified time period'
      });
    }
    
    await newBudget.save();
    
    // Populate category for response
    await newBudget.populate('category', 'name icon color type');
    
    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: newBudget
    });
  } catch (error) {
    console.error('Create budget error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format provided'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating budget',
      error: error.message
    });
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const {
      name,
      amount,
      period,
      startDate,
      alertThreshold,
      notes,
      isActive
    } = req.body;
    
    // Find budget
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Update fields
    if (name !== undefined) budget.name = name.trim();
    if (amount !== undefined) budget.amount = parseFloat(amount);
    if (period !== undefined) budget.period = period;
    if (startDate !== undefined) budget.startDate = new Date(startDate);
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (notes !== undefined) budget.notes = notes ? notes.trim() : undefined;
    if (isActive !== undefined) budget.isActive = isActive;
    
    // Check for overlapping budgets if dates or period changed
    if (startDate !== undefined || period !== undefined) {
      const hasOverlap = await budget.checkOverlap();
      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'A budget for this category already exists in the specified time period'
        });
      }
    }
    
    await budget.save();
    
    // Populate category for response
    await budget.populate('category', 'name icon color type');
    
    res.json({
      success: true,
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    
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
      message: 'Server error while updating budget'
    });
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget (soft delete)
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    // Find budget
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    // Soft delete
    budget.isActive = false;
    await budget.save();
    
    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting budget'
    });
  }
});

module.exports = router;
