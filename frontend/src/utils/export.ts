import { Transaction } from '../services/transactionService';
import { Budget } from '../services/budgetService';

export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  includeMetadata?: boolean;
}

export class DataExporter {
  // Export transactions to CSV
  static exportTransactionsToCSV(transactions: Transaction[]): string {
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Type',
      'Category',
      'Notes',
      'Created At'
    ];

    const rows = transactions.map(transaction => [
      new Date(transaction.date).toLocaleDateString(),
      `"${transaction.description.replace(/"/g, '""')}"`,
      transaction.amount.toString(),
      transaction.type,
      `"${transaction.category.name.replace(/"/g, '""')}"`,
      transaction.notes ? `"${transaction.notes.replace(/"/g, '""')}"` : '',
      new Date(transaction.createdAt).toLocaleString()
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export transactions to JSON
  static exportTransactionsToJSON(transactions: Transaction[], includeMetadata = true): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'transactions',
      count: transactions.length,
      data: transactions.map(transaction => ({
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: {
          name: transaction.category.name,
          type: transaction.category.type,
          icon: transaction.category.icon,
          color: transaction.category.color
        },
        notes: transaction.notes,
        ...(includeMetadata && {
          id: transaction._id,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        })
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Export budgets to CSV
  static exportBudgetsToCSV(budgets: Budget[]): string {
    const headers = [
      'Name',
      'Category',
      'Amount',
      'Period',
      'Start Date',
      'End Date',
      'Alert Threshold',
      'Spent',
      'Remaining',
      'Status',
      'Notes'
    ];

    const rows = budgets.map(budget => [
      `"${budget.name.replace(/"/g, '""')}"`,
      `"${budget.category.name.replace(/"/g, '""')}"`,
      budget.amount.toString(),
      budget.period,
      new Date(budget.startDate).toLocaleDateString(),
      new Date(budget.endDate).toLocaleDateString(),
      budget.alertThreshold.toString(),
      (budget.spent || 0).toString(),
      (budget.remaining || budget.amount).toString(),
      budget.status || 'unknown',
      budget.notes ? `"${budget.notes.replace(/"/g, '""')}"` : ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Export budgets to JSON
  static exportBudgetsToJSON(budgets: Budget[], includeMetadata = true): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'budgets',
      count: budgets.length,
      data: budgets.map(budget => ({
        name: budget.name,
        category: {
          name: budget.category.name,
          type: budget.category.type,
          icon: budget.category.icon,
          color: budget.category.color
        },
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate,
        endDate: budget.endDate,
        alertThreshold: budget.alertThreshold,
        notes: budget.notes,
        ...(includeMetadata && {
          id: budget._id,
          spent: budget.spent,
          remaining: budget.remaining,
          status: budget.status,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt
        })
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Download file
  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Generate filename with timestamp
  static generateFilename(prefix: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${format}`;
  }

  // Export transactions with options
  static async exportTransactions(
    transactions: Transaction[],
    options: ExportOptions
  ): Promise<void> {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (options.format === 'csv') {
      content = this.exportTransactionsToCSV(transactions);
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
    } else {
      content = this.exportTransactionsToJSON(transactions, options.includeMetadata);
      mimeType = 'application/json;charset=utf-8;';
      extension = 'json';
    }

    const filename = this.generateFilename('transactions', extension);
    this.downloadFile(content, filename, mimeType);
  }

  // Export budgets with options
  static async exportBudgets(
    budgets: Budget[],
    options: ExportOptions
  ): Promise<void> {
    let content: string;
    let mimeType: string;
    let extension: string;

    if (options.format === 'csv') {
      content = this.exportBudgetsToCSV(budgets);
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
    } else {
      content = this.exportBudgetsToJSON(budgets, options.includeMetadata);
      mimeType = 'application/json;charset=utf-8;';
      extension = 'json';
    }

    const filename = this.generateFilename('budgets', extension);
    this.downloadFile(content, filename, mimeType);
  }

  // Export all data
  static async exportAllData(
    transactions: Transaction[],
    budgets: Budget[],
    format: 'json' = 'json'
  ): Promise<void> {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      type: 'complete_backup',
      data: {
        transactions: transactions.map(t => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: {
            name: t.category.name,
            type: t.category.type,
            icon: t.category.icon,
            color: t.category.color
          },
          notes: t.notes
        })),
        budgets: budgets.map(b => ({
          name: b.name,
          category: {
            name: b.category.name,
            type: b.category.type,
            icon: b.category.icon,
            color: b.category.color
          },
          amount: b.amount,
          period: b.period,
          startDate: b.startDate,
          endDate: b.endDate,
          alertThreshold: b.alertThreshold,
          notes: b.notes
        }))
      },
      summary: {
        transactionCount: transactions.length,
        budgetCount: budgets.length,
        totalIncome: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        totalBudgeted: budgets.reduce((sum, b) => sum + b.amount, 0)
      }
    };

    const content = JSON.stringify(exportData, null, 2);
    const filename = this.generateFilename('moneymind_backup', 'json');
    this.downloadFile(content, filename, 'application/json;charset=utf-8;');
  }
}

export default DataExporter;
