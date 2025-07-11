import { TransactionFormData } from '../services/transactionService';
import { BudgetFormData } from '../services/budgetService';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
  };
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  validateData?: boolean;
  dryRun?: boolean;
}

export class DataImporter {
  // Parse CSV content
  static parseCSV(content: string): string[][] {
    const lines = content.split('\n').filter(line => line.trim());
    const result: string[][] = [];
    
    for (const line of lines) {
      const row: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      row.push(current.trim());
      result.push(row);
    }
    
    return result;
  }

  // Validate transaction data
  static validateTransaction(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.description || typeof data.description !== 'string') {
      errors.push('Description is required and must be a string');
    }

    if (!data.amount || isNaN(parseFloat(data.amount))) {
      errors.push('Amount is required and must be a valid number');
    }

    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Type must be either "income" or "expense"');
    }

    if (!data.date) {
      errors.push('Date is required');
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Date must be a valid date');
      }
    }

    if (!data.category || typeof data.category !== 'string') {
      errors.push('Category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate budget data
  static validateBudget(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string');
    }

    if (!data.amount || isNaN(parseFloat(data.amount))) {
      errors.push('Amount is required and must be a valid number');
    }

    if (!data.period || !['monthly', 'yearly'].includes(data.period)) {
      errors.push('Period must be either "monthly" or "yearly"');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    } else {
      const date = new Date(data.startDate);
      if (isNaN(date.getTime())) {
        errors.push('Start date must be a valid date');
      }
    }

    if (!data.category || typeof data.category !== 'string') {
      errors.push('Category is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Import transactions from CSV
  static importTransactionsFromCSV(
    content: string,
    options: ImportOptions = {}
  ): ImportResult<TransactionFormData> {
    const result: ImportResult<TransactionFormData> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };

    try {
      const rows = this.parseCSV(content);
      
      if (rows.length === 0) {
        result.errors.push('No data found in CSV file');
        return result;
      }

      // Assume first row is headers
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const dataRows = rows.slice(1);

      result.summary.total = dataRows.length;

      // Map headers to expected fields
      const fieldMap: { [key: string]: string } = {
        'date': 'date',
        'description': 'description',
        'amount': 'amount',
        'type': 'type',
        'category': 'category',
        'notes': 'notes'
      };

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const transaction: any = {};

        // Map CSV columns to transaction fields
        headers.forEach((header, index) => {
          const field = fieldMap[header];
          if (field && row[index] !== undefined) {
            transaction[field] = row[index];
          }
        });

        // Validate transaction
        const validation = this.validateTransaction(transaction);
        
        if (!validation.isValid) {
          result.errors.push(`Row ${i + 2}: ${validation.errors.join(', ')}`);
          result.summary.failed++;
          continue;
        }

        // Convert and clean data
        const transactionData: TransactionFormData = {
          description: transaction.description.trim(),
          amount: parseFloat(transaction.amount),
          type: transaction.type as 'income' | 'expense',
          date: new Date(transaction.date).toISOString().split('T')[0],
          category: transaction.category.trim(),
          notes: transaction.notes?.trim() || undefined
        };

        result.data.push(transactionData);
        result.summary.successful++;
      }

      result.success = result.summary.successful > 0;
    } catch (error: any) {
      result.errors.push(`Failed to parse CSV: ${error.message}`);
    }

    return result;
  }

  // Import transactions from JSON
  static importTransactionsFromJSON(
    content: string,
    options: ImportOptions = {}
  ): ImportResult<TransactionFormData> {
    const result: ImportResult<TransactionFormData> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };

    try {
      const jsonData = JSON.parse(content);
      let transactions: any[] = [];

      // Handle different JSON formats
      if (Array.isArray(jsonData)) {
        transactions = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        transactions = jsonData.data;
      } else if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
        transactions = jsonData.transactions;
      } else {
        result.errors.push('Invalid JSON format. Expected array of transactions or object with data/transactions property');
        return result;
      }

      result.summary.total = transactions.length;

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Handle nested category object
        if (transaction.category && typeof transaction.category === 'object') {
          transaction.category = transaction.category.name;
        }

        const validation = this.validateTransaction(transaction);
        
        if (!validation.isValid) {
          result.errors.push(`Transaction ${i + 1}: ${validation.errors.join(', ')}`);
          result.summary.failed++;
          continue;
        }

        const transactionData: TransactionFormData = {
          description: transaction.description.trim(),
          amount: parseFloat(transaction.amount),
          type: transaction.type as 'income' | 'expense',
          date: new Date(transaction.date).toISOString().split('T')[0],
          category: transaction.category.trim(),
          notes: transaction.notes?.trim() || undefined
        };

        result.data.push(transactionData);
        result.summary.successful++;
      }

      result.success = result.summary.successful > 0;
    } catch (error: any) {
      result.errors.push(`Failed to parse JSON: ${error.message}`);
    }

    return result;
  }

  // Import budgets from JSON
  static importBudgetsFromJSON(
    content: string,
    options: ImportOptions = {}
  ): ImportResult<BudgetFormData> {
    const result: ImportResult<BudgetFormData> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0
      }
    };

    try {
      const jsonData = JSON.parse(content);
      let budgets: any[] = [];

      // Handle different JSON formats
      if (Array.isArray(jsonData)) {
        budgets = jsonData;
      } else if (jsonData.data && Array.isArray(jsonData.data)) {
        budgets = jsonData.data;
      } else if (jsonData.budgets && Array.isArray(jsonData.budgets)) {
        budgets = jsonData.budgets;
      } else {
        result.errors.push('Invalid JSON format. Expected array of budgets or object with data/budgets property');
        return result;
      }

      result.summary.total = budgets.length;

      for (let i = 0; i < budgets.length; i++) {
        const budget = budgets[i];

        // Handle nested category object
        if (budget.category && typeof budget.category === 'object') {
          budget.category = budget.category.name;
        }

        const validation = this.validateBudget(budget);
        
        if (!validation.isValid) {
          result.errors.push(`Budget ${i + 1}: ${validation.errors.join(', ')}`);
          result.summary.failed++;
          continue;
        }

        const budgetData: BudgetFormData = {
          name: budget.name.trim(),
          category: budget.category.trim(),
          amount: parseFloat(budget.amount),
          period: budget.period as 'monthly' | 'yearly',
          startDate: new Date(budget.startDate).toISOString().split('T')[0],
          alertThreshold: budget.alertThreshold || 80,
          notes: budget.notes?.trim() || undefined
        };

        result.data.push(budgetData);
        result.summary.successful++;
      }

      result.success = result.summary.successful > 0;
    } catch (error: any) {
      result.errors.push(`Failed to parse JSON: ${error.message}`);
    }

    return result;
  }

  // Read file content
  static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
}

export default DataImporter;
