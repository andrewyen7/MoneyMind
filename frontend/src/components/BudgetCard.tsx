import React from 'react';
import { Budget } from '../services/budgetService';
import budgetService from '../services/budgetService';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (id: string) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const spent = budget.spent || 0;
  const remaining = budget.remaining || budget.amount;
  const percentageUsed = budget.percentageUsed || 0;
  const status = budget.status || 'good';
  
  const statusColor = budgetService.getStatusColor(status);
  const statusText = budgetService.getStatusText(status);
  const daysRemaining = budgetService.getDaysRemaining(budget.endDate);

  const getProgressBarColor = () => {
    if (percentageUsed >= 100) return 'bg-red-500';
    if (percentageUsed >= budget.alertThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressBarWidth = () => {
    return Math.min(percentageUsed, 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: budget.category.color }}
          >
            <span className="text-lg">{budget.category.icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
            <p className="text-sm text-gray-500">{budget.category.name}</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: statusColor }}
          >
            {statusText}
          </span>
          
          {/* Action Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(budget)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-150"
              title="Edit budget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={() => onDelete(budget._id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-150"
              title="Delete budget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Amount Info */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Budgeted</p>
          <p className="text-lg font-semibold text-gray-900">
            {budgetService.formatCurrency(budget.amount)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Spent</p>
          <p className={`text-lg font-semibold ${spent > budget.amount ? 'text-red-600' : 'text-gray-900'}`}>
            {budgetService.formatCurrency(spent)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Remaining</p>
          <p className={`text-lg font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {budgetService.formatCurrency(Math.max(0, remaining))}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${getProgressBarWidth()}%` }}
          ></div>
        </div>
        {percentageUsed >= budget.alertThreshold && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ You've reached {budget.alertThreshold}% of your budget
          </p>
        )}
      </div>

      {/* Additional Info */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className="capitalize">{budgetService.getPeriodDisplayText(budget.period)}</span>
          {budget.transactionCount !== undefined && (
            <span>{budget.transactionCount} transactions</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Period ended'}
          </span>
        </div>
      </div>

      {/* Notes */}
      {budget.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">{budget.notes}</p>
        </div>
      )}

      {/* Over Budget Warning */}
      {budget.isOverBudget && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-red-800">
              You're over budget by {budgetService.formatCurrency(spent - budget.amount)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
