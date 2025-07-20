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

// Virtual for budget period title
budgetSchema.virtual('periodTitle').get(function() {
  if (!this.startDate || !this.period) return '';
  
  const startDate = new Date(this.startDate);
  const year = startDate.getFullYear();
  
  if (this.period === 'yearly') {
    return `Year ${year}`;
  } else {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[startDate.getMonth()];
    return `${year} ${month}`;
  }
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
      $addFields: {
        category: '$categoryInfo', // Make categoryInfo available as category
        periodTitle: {
          $cond: {
            if: { $eq: ['$period', 'yearly'] },
            then: {
              $concat: ['Year ', { $toString: { $year: '$startDate' } }]
            },
            else: {
              $let: {
                vars: {
                  month: { $month: '$startDate' },
                  year: { $year: '$startDate' }
                },
                in: {
                  $concat: [
                    { $toString: '$$year' },
                    ' ',
                    {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$$month', 1] }, then: 'January' },
                          { case: { $eq: ['$$month', 2] }, then: 'February' },
                          { case: { $eq: ['$$month', 3] }, then: 'March' },
                          { case: { $eq: ['$$month', 4] }, then: 'April' },
                          { case: { $eq: ['$$month', 5] }, then: 'May' },
                          { case: { $eq: ['$$month', 6] }, then: 'June' },
                          { case: { $eq: ['$$month', 7] }, then: 'July' },
                          { case: { $eq: ['$$month', 8] }, then: 'August' },
                          { case: { $eq: ['$$month', 9] }, then: 'September' },
                          { case: { $eq: ['$$month', 10] }, then: 'October' },
                          { case: { $eq: ['$$month', 11] }, then: 'November' },
                          { case: { $eq: ['$$month', 12] }, then: 'December' }
                        ],
                        default: 'Unknown'
                      }
                    }
                  ]
                }
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
  
  console.log('Starting budget overlap check with data:', {
    period: this.period,
    category: this.category.toString(),
    startDate: this.startDate,
    endDate: this.endDate,
    userId: this.userId.toString()
  });

  try {
    const query = {
      userId: this.userId,
      category: this.category,
      period: this.period, // Only check within the same period type
      isActive: true
    };

    // For same period type, check date overlap
    if (this.period === 'yearly') {
      const year = new Date(this.startDate).getFullYear();
      query.$and = [
        { startDate: { $lte: new Date(year, 11, 31) } },
        { endDate: { $gte: new Date(year, 0, 1) } }
      ];
    } else {
      query.$and = [
        { startDate: { $lte: this.endDate } },
        { endDate: { $gte: this.startDate } }
      ];
    }

    if (this._id) {
      query._id = { $ne: this._id };
    }

    const existingBudget = await Budget.findOne(query).exec();
    
    console.log('Overlap check result:', {
      query,
      hasOverlap: !!existingBudget,
      existingBudgetId: existingBudget?._id
    });

    return !!existingBudget;
  } catch (error) {
    console.error('Error in checkOverlap:', error);
    throw error;
  }
};

// Pre-save middleware to set end date and round amount
budgetSchema.pre('save', function(next) {
  try {
    // Set end date if not provided
    if (!this.endDate && this.startDate && this.period) {
      const start = new Date(this.startDate);
      
      if (this.period === 'monthly') {
        this.endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      } else if (this.period === 'yearly') {
        this.endDate = new Date(start.getFullYear(), 11, 31);
      }
      
      console.log('Set end date in pre-save:', {
        startDate: this.startDate,
        endDate: this.endDate,
        period: this.period
      });
    }

    // Round amount
    if (this.isModified('amount')) {
      this.amount = Math.round(this.amount * 100) / 100;
    }
    
    next();
  } catch (error) {
    console.error('Pre-save error:', error);
    next(error);
  }
});

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
