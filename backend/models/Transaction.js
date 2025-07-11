const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['income', 'expense'],
      message: 'Transaction type must be either income or expense'
    },
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [999999999.99, 'Amount is too large'],
    validate: {
      validator: function(value) {
        // Check if amount has at most 2 decimal places
        return Number.isInteger(value * 100);
      },
      message: 'Amount can have at most 2 decimal places'
    }
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [1, 'Description cannot be empty'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    index: true,
    validate: {
      validator: function(value) {
        // Don't allow future dates beyond tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        return value <= tomorrow;
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function() {
        return this.isRecurring;
      }
    },
    interval: {
      type: Number,
      min: 1,
      max: 365,
      default: 1,
      required: function() {
        return this.isRecurring;
      }
    },
    endDate: {
      type: Date,
      validate: {
        validator: function(value) {
          return !value || value > this.date;
        },
        message: 'End date must be after transaction date'
      }
    }
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.amount.toFixed(2);
});

// Virtual for month/year grouping
transactionSchema.virtual('monthYear').get(function() {
  return `${this.date.getFullYear()}-${String(this.date.getMonth() + 1).padStart(2, '0')}`;
});

// Static method to get user's transactions with filtering and pagination
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
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
  } = options;

  // Build query
  const query = { userId, isActive: true };

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

  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate skip
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('category', 'name icon color type')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = function(userId, startDate, endDate) {
  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true
  };

  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.date.$lte = end;
    }
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// Instance method to soft delete
transactionSchema.methods.softDelete = function() {
  this.isActive = false;
  return this.save();
};

// Pre-save middleware to round amount to 2 decimal places
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    this.amount = Math.round(this.amount * 100) / 100;
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
