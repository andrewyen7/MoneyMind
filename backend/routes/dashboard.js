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
    const transactionsRaw = await Transaction.find({ 
      userId: req.user._id,
      isActive: true 
    })
    .populate('category', 'name icon color type')
    .sort({ date: -1 })
    .limit(5);
    
    // Fix date display by formatting as YYYY-MM-DD
    const transactions = transactionsRaw.map(t => {
      const transaction = t.toObject();
      const date = new Date(transaction.date);
      transaction.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return transaction;
    });
    
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

    // --- New Aggregations ---
    // 1. Aggregate category spending (expenses only)
    const categorySpending = await Transaction.aggregate([
      { $match: { userId: req.user._id, isActive: true, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          category: {
            _id: '$category._id',
            name: '$category.name',
            icon: '$category.icon',
            color: '$category.color'
          },
          total: 1
        }
      }
    ]);

    // 2. Aggregate monthly summary (income/expense/net per month)
    const monthlyRaw = await Transaction.aggregate([
      { $match: { userId: req.user._id, isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);
    // Format monthly summary as array of { month, income, expenses, net }
    const monthlySummaryMap = {};
    monthlyRaw.forEach(item => {
      const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!monthlySummaryMap[monthKey]) {
        monthlySummaryMap[monthKey] = { month: monthKey, income: 0, expenses: 0, net: 0 };
      }
      if (item._id.type === 'income') {
        monthlySummaryMap[monthKey].income = item.total;
      } else if (item._id.type === 'expense') {
        monthlySummaryMap[monthKey].expenses = item.total;
      }
      monthlySummaryMap[monthKey].net = (monthlySummaryMap[monthKey].income || 0) - (monthlySummaryMap[monthKey].expenses || 0);
    });
    const monthlySummary = Object.values(monthlySummaryMap).sort((a, b) => a.month.localeCompare(b.month));

    // Update last update timestamp for this user
    userLastUpdates[userId] = Date.now();
    
    res.json({
      success: true,
      transactions,
      stats: formattedStats,
      budgets,
      lastUpdate: userLastUpdates[userId],
      categorySpending,
      monthlySummary
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