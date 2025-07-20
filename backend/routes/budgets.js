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

// @route   DELETE /api/budgets/clear-category
// @desc    Clear all budgets for a specific category
// @access  Private
router.delete('/clear-category/:categoryId', ensureAuthenticated, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find and delete all budgets for this category
    const result = await Budget.updateMany(
      {
        userId: req.user._id,
        category: categoryId
      },
      {
        isActive: false
      }
    );
    
    res.json({
      success: true,
      message: `Deactivated ${result.modifiedCount} budgets for the category`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Clear category budgets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing category budgets'
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

// Helper function to clear all budgets
const clearAllBudgets = async (userId) => {
  try {
    const result = await Budget.updateMany(
      { userId, category, isActive: true },
      { $set: { isActive: false } }
    );
    console.log('Deactivated budgets:', result);
    return result.modifiedCount;
  } catch (error) {
    console.error('Error deactivating budgets:', error);
    return 0;
  }
};

// @route   POST /api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
    console.log('Create budget req.body:', req.body);
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

    // Basic validation
    if (!name || !category || !amount || !period || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, amount, period, and start date are all required'
      });
    }

        // Check and parse date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format'
      });
    }

    // Validate category
    console.log('Category validation - Received category:', category);
    console.log('Category validation - User ID:', req.user._id);
    
    const categoryDoc = await Category.findOne({
      _id: category,
      $or: [
        { isDefault: true },
        { userId: req.user._id }
      ],
      isActive: true,
      type: 'expense'
    });
    
    console.log('Category validation - Found category:', categoryDoc);

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense category'
      });
    }

    // Set budget date
    const budgetYear = budgetStartDate.getFullYear();
    const budgetMonth = budgetStartDate.getMonth();
    
    // Set end date
    const budgetEndDate = period === 'yearly'
      ? new Date(budgetYear, 11, 31, 23, 59, 59)
      : new Date(budgetYear, budgetMonth + 1, 0, 23, 59, 59);

    // Create new budget (with manual overlap checking for better control)
    
    // Check for existing budgets of the same period type only
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      category,
      period,
      isActive: true,
      $and: [
        { startDate: { $lte: budgetEndDate } },
        { endDate: { $gte: budgetStartDate } }
      ]
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `A ${period} budget for this category already exists in the specified time period`
      });
    }

    const newBudget = new Budget({
      userId: req.user._id,
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      period,
      startDate: budgetStartDate,
      endDate: budgetEndDate,
      alertThreshold: alertThreshold || 80,
      notes: notes ? notes.trim() : undefined,
      isActive: true
    });

    // Save and populate category information
    await newBudget.save();
    await newBudget.populate('category', 'name icon color type');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budget: newBudget
    });
  } catch (error) {
    console.error('Error occurred while creating budget:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
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
      message: 'Server error occurred while creating budget',
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
