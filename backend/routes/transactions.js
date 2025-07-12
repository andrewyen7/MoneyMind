const express = require('express');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/transactions
// @desc    Get user's transactions with filtering and pagination
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      search,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : undefined;

    // Get transactions
    const transactions = await Transaction.getUserTransactions(req.user._id, {
      type,
      category,
      startDate,
      endDate,
      search,
      tags: parsedTags,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    const formattedTransactions = transactions;

    // Get total count for pagination
    const query = { userId: req.user._id, isActive: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    if (parsedTags && parsedTags.length > 0) {
      query.tags = { $in: parsedTags };
    }

    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
});

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', ensureAuthenticated, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Transaction.getTransactionStats(req.user._id, startDate, endDate);
    
    // Format stats
    const formattedStats = {
      income: { total: 0, count: 0, avgAmount: 0 },
      expense: { total: 0, count: 0, avgAmount: 0 },
      netIncome: 0
    };
    
    stats.forEach(stat => {
      if (stat._id === 'income') {
        formattedStats.income = {
          total: stat.total,
          count: stat.count,
          avgAmount: stat.avgAmount
        };
      } else if (stat._id === 'expense') {
        formattedStats.expense = {
          total: stat.total,
          count: stat.count,
          avgAmount: stat.avgAmount
        };
      }
    });
    
    formattedStats.netIncome = formattedStats.income.total - formattedStats.expense.total;
    
    res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction statistics'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get a specific transaction
// @access  Private
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    }).populate('category', 'name icon color type');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      category,
      date,
      notes,
      tags,
      isRecurring,
      recurringPattern
    } = req.body;
    
    // Validation
    if (!type || !amount || !description || !category || !date) {
      return res.status(400).json({
        success: false,
        message: 'Type, amount, description, category, and date are required'
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
      type: type
    });
    
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for this transaction type'
      });
    }
    
    // Create transaction
    // Fix date handling by parsing date parts directly to avoid timezone issues
    let transactionDate;
    if (date) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        // Create date with year, month (0-indexed), day
        transactionDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        transactionDate = new Date(date);
      }
    } else {
      transactionDate = new Date();
    }
    
    const newTransaction = new Transaction({
      userId: req.user._id,
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: transactionDate,
      notes: notes ? notes.trim() : undefined,
      tags: tags ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring ? recurringPattern : undefined
    });
    
    await newTransaction.save();
    
    // Populate category for response
    await newTransaction.populate('category', 'name icon color type');
    
    // Update dashboard data timestamp for this user
    const { userLastUpdates } = require('../utils/updateTracker');
    userLastUpdates[req.user._id.toString()] = Date.now();
    
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: newTransaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    
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
      message: 'Server error while creating transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      category,
      date,
      notes,
      tags,
      isRecurring,
      recurringPattern
    } = req.body;

    // Find transaction
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // If category is being updated, verify it exists and matches type
    if (category && category !== transaction.category.toString()) {
      const categoryDoc = await Category.findOne({
        _id: category,
        $or: [
          { isDefault: true },
          { userId: req.user._id }
        ],
        isActive: true,
        type: type || transaction.type
      });

      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category for this transaction type'
        });
      }
    }

    // Update fields
    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = parseFloat(amount);
    if (description) transaction.description = description.trim();
    if (category) transaction.category = category;
    
    // Fix date handling by parsing date parts directly to avoid timezone issues
    if (date) {
      const dateParts = date.split('-');
      if (dateParts.length === 3) {
        // Create date with year, month (0-indexed), day
        transaction.date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      } else {
        transaction.date = new Date(date);
      }
    }
    
    if (notes !== undefined) transaction.notes = notes ? notes.trim() : undefined;
    if (tags !== undefined) {
      transaction.tags = tags ? tags.map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    }
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringPattern !== undefined) transaction.recurringPattern = recurringPattern;

    await transaction.save();

    // Populate category for response
    await transaction.populate('category', 'name icon color type');

    // Update dashboard data timestamp for this user
    const { userLastUpdates } = require('../utils/updateTracker');
    userLastUpdates[req.user._id.toString()] = Date.now();

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);

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
      message: 'Server error while updating transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction (soft delete)
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Delete request for transaction ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    // Find transaction
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!transaction) {
      console.log('Transaction not found for deletion');
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    console.log('Transaction found, performing soft delete');
    // Soft delete
    await transaction.softDelete();
    console.log('Transaction deleted successfully');

    // Update dashboard data timestamp for this user
    const { userLastUpdates } = require('../utils/updateTracker');
    userLastUpdates[req.user._id.toString()] = Date.now();

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
});

module.exports = router;
