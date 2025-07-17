/**
 * Utility functions for formatting data
 */

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Get status color
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'good':
      return '#10B981'; // green
    case 'warning':
      return '#F59E0B'; // yellow
    case 'over':
      return '#EF4444'; // red
    default:
      return '#6B7280'; // gray
  }
};

// Get status text
export const getStatusText = (status: string): string => {
  switch (status) {
    case 'good':
      return 'On Track';
    case 'warning':
      return 'Near Limit';
    case 'over':
      return 'Over Budget';
    default:
      return 'Unknown';
  }
};

// Calculate days remaining in budget period
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Get period display text
export const getPeriodDisplayText = (period: string): string => {
  switch (period) {
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    default:
      return period;
  }
};