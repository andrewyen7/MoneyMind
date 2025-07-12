const express = require('express');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { ensureAuthenticated } = require('../middleware/auth');

const { userLastUpdates } = require('../utils/updateTracker');

const router = express.Router();

// @route   GET /api/dashboard/data
// @desc    Get dashboard data
// @access  Private
router.get('/data', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // Get recent transactions
    const transactions = await Transaction.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .populate('category', 'name icon color type')
    .sort({ date: -1 })
    .limit(5);
    
    // Get transaction stats
    const stats = await Transaction.getTransactionStats(req.user._id);
    
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
    
    // Get budgets
    const budgets = await Budget.find({
      userId: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });
    
    // Update last update timestamp for this user
    userLastUpdates[userId] = Date.now();
    
    res.json({
      success: true,
      transactions,
      stats: formattedStats,
      budgets,
      lastUpdate: userLastUpdates[userId]
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/dashboard/check-updates
// @desc    Check if dashboard data has been updated
// @access  Private
router.get('/check-updates', ensureAuthenticated, (req, res) => {
  const userId = req.user._id.toString();
  const { lastUpdate } = req.query;
  
  // If we have a last update timestamp for this user
  if (userLastUpdates[userId]) {
    // Compare with the client's last update timestamp
    const hasUpdates = !lastUpdate || parseInt(lastUpdate) < userLastUpdates[userId];
    
    res.json({
      success: true,
      hasUpdates,
      lastUpdate: userLastUpdates[userId]
    });
  } else {
    // No updates recorded yet
    userLastUpdates[userId] = Date.now();
    
    res.json({
      success: true,
      hasUpdates: true,
      lastUpdate: userLastUpdates[userId]
    });
  }
});

// @route   POST /api/dashboard/notify-update
// @desc    Notify that data has been updated
// @access  Private
router.post('/notify-update', ensureAuthenticated, (req, res) => {
  const userId = req.user._id.toString();
  userLastUpdates[userId] = Date.now();
  
  res.json({
    success: true,
    message: 'Update notification received',
    lastUpdate: userLastUpdates[userId]
  });
});

module.exports = router;