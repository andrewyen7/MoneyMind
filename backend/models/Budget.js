const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [100, 'Budget name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0.01, 'Budget amount must be greater than 0'],
    max: [999999999.99, 'Budget amount is too large'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value * 100);
      },
      message: 'Budget amount can have at most 2 decimal places'
    }
  },
  period: {
    type: String,
    required: [true, 'Budget period is required'],
    enum: {
      values: ['monthly', 'yearly'],
      message: 'Budget period must be either monthly or yearly'
    },
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  alertThreshold: {
    type: Number,
    min: [0, 'Alert threshold cannot be negative'],
    max: [100, 'Alert threshold cannot exceed 100%'],
    default: 80,
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Alert threshold must be a whole number'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
budgetSchema.index({ userId: 1, period: 1, startDate: -1 });
budgetSchema.index({ userId: 1, category: 1, isActive: 1 });
budgetSchema.index({ userId: 1, isActive: 1, endDate: 1 });

// Virtual for budget progress (will be populated by aggregation)
budgetSchema.virtual('spent').get(function() {
  return this._spent || 0;
});

budgetSchema.virtual('remaining').get(function() {
  return Math.max(0, this.amount - (this._spent || 0));
});

budgetSchema.virtual('percentageUsed').get(function() {
  const spent = this._spent || 0;
  return this.amount > 0 ? Math.round((spent / this.amount) * 100) : 0;
});

budgetSchema.virtual('isOverBudget').get(function() {
  return (this._spent || 0) > this.amount;
});

budgetSchema.virtual('isNearLimit').get(function() {
  const percentageUsed = this.percentageUsed;
  return percentageUsed >= this.alertThreshold && percentageUsed < 100;
});

budgetSchema.virtual('status').get(function() {
  if (this.isOverBudget) return 'over';
  if (this.isNearLimit) return 'warning';
  return 'good';
});

// Static method to get user's budgets with spending data
budgetSchema.statics.getBudgetsWithSpending = async function(userId, options = {}) {
  const {
    period,
    isActive = true,
    includeInactive = false
  } = options;

  // Build match stage
  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
  if (!includeInactive) {
    matchStage.isActive = isActive;
  }
  if (period) {
    matchStage.period = period;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $lookup: {
        from: 'transactions',
        let: { 
          budgetCategory: '$category',
          budgetStart: '$startDate',
          budgetEnd: '$endDate',
          budgetUserId: '$userId'
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$budgetUserId'] },
                  { $eq: ['$category', '$$budgetCategory'] },
                  { $eq: ['$type', 'expense'] },
                  { $eq: ['$isActive', true] },
                  { $gte: ['$date', '$$budgetStart'] },
                  { $lte: ['$date', '$$budgetEnd'] }
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
              transactionCount: { $sum: 1 }
            }
          }
        ],
        as: 'spendingData'
      }
    },
    {
      $addFields: {
        spent: {
          $ifNull: [{ $arrayElemAt: ['$spendingData.totalSpent', 0] }, 0]
        },
        transactionCount: {
          $ifNull: [{ $arrayElemAt: ['$spendingData.transactionCount', 0] }, 0]
        }
      }
    },
    {
      $addFields: {
        remaining: { $subtract: ['$amount', '$spent'] },
        percentageUsed: {
          $cond: {
            if: { $gt: ['$amount', 0] },
            then: { $multiply: [{ $divide: ['$spent', '$amount'] }, 100] },
            else: 0
          }
        }
      }
    },
    {
      $addFields: {
        isOverBudget: { $gt: ['$spent', '$amount'] },
        isNearLimit: {
          $and: [
            { $gte: ['$percentageUsed', '$alertThreshold'] },
            { $lt: ['$percentageUsed', 100] }
          ]
        }
      }
    },
    {
      $addFields: {
        status: {
          $cond: {
            if: '$isOverBudget',
            then: 'over',
            else: {
              $cond: {
                if: '$isNearLimit',
                then: 'warning',
                else: 'good'
              }
            }
          }
        }
      }
    },
    {
      $project: {
        spendingData: 0
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get budget summary for a user
budgetSchema.statics.getBudgetSummary = async function(userId, period = 'monthly') {
  const now = new Date();
  let startDate, endDate;

  if (period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  }

  const budgets = await this.getBudgetsWithSpending(userId, { period, isActive: true });
  
  const summary = {
    totalBudgeted: 0,
    totalSpent: 0,
    totalRemaining: 0,
    budgetCount: budgets.length,
    overBudgetCount: 0,
    warningCount: 0,
    goodCount: 0
  };

  budgets.forEach(budget => {
    summary.totalBudgeted += budget.amount;
    summary.totalSpent += budget.spent;
    summary.totalRemaining += Math.max(0, budget.remaining);
    
    if (budget.status === 'over') summary.overBudgetCount++;
    else if (budget.status === 'warning') summary.warningCount++;
    else summary.goodCount++;
  });

  return summary;
};

// Instance method to check if budget overlaps with existing budgets
budgetSchema.methods.checkOverlap = async function() {
  const Budget = this.constructor;
  
  const overlappingBudgets = await Budget.find({
    userId: this.userId,
    category: this.category,
    isActive: true,
    _id: { $ne: this._id },
    $or: [
      {
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.startDate }
      }
    ]
  });

  return overlappingBudgets.length > 0;
};

// Pre-validate middleware to set end date
budgetSchema.pre('validate', function(next) {
  // Auto-set end date based on period if not provided
  if (!this.endDate && this.startDate && this.period) {
    if (this.period === 'monthly') {
      const start = new Date(this.startDate);
      // Get the last day of the same month
      this.endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    } else if (this.period === 'yearly') {
      const start = new Date(this.startDate);
      this.endDate = new Date(start.getFullYear(), 11, 31);
    }
  }

  next();
});

// Pre-save middleware to round amount
budgetSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    this.amount = Math.round(this.amount * 100) / 100;
  }

  next();
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
