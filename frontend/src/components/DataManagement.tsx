import React, { useState } from 'react';
import { useSuccessToast, useErrorToast } from './shared/Toast';
import LoadingSpinner from './shared/LoadingSpinner';
import DataExporter from '../utils/export';
import DataImporter, { ImportResult } from '../utils/import';
import transactionService, { TransactionFormData } from '../services/transactionService';
import budgetService, { BudgetFormData } from '../services/budgetService';

interface DataManagementProps {
  onClose: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isLoading, setIsLoading] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult<any> | null>(null);
  
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();

  // Export functions
  const handleExportTransactions = async (format: 'csv' | 'json') => {
    try {
      setIsLoading(true);
      const { transactions } = await transactionService.getTransactions({ limit: 10000 });
      
      await DataExporter.exportTransactions(transactions, {
        format,
        includeMetadata: true
      });
      
      showSuccess('Export Successful', `Transactions exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      showError('Export Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBudgets = async (format: 'csv' | 'json') => {
    try {
      setIsLoading(true);
      const budgets = await budgetService.getBudgets();
      
      await DataExporter.exportBudgets(budgets, {
        format,
        includeMetadata: true
      });
      
      showSuccess('Export Successful', `Budgets exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      showError('Export Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsLoading(true);
      const [{ transactions }, budgets] = await Promise.all([
        transactionService.getTransactions({ limit: 10000 }),
        budgetService.getBudgets()
      ]);
      
      await DataExporter.exportAllData(transactions, budgets);
      
      showSuccess('Export Successful', 'Complete backup exported successfully');
    } catch (error: any) {
      showError('Export Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Import functions
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>, type: 'transactions' | 'budgets') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const content = await DataImporter.readFile(file);
      let result: ImportResult<any>;

      if (type === 'transactions') {
        if (file.name.endsWith('.csv')) {
          result = DataImporter.importTransactionsFromCSV(content);
        } else {
          result = DataImporter.importTransactionsFromJSON(content);
        }
      } else {
        result = DataImporter.importBudgetsFromJSON(content);
      }

      setImportResults(result);

      if (result.success && result.data.length > 0) {
        // Process the import
        await processImport(result.data, type);
      }
    } catch (error: any) {
      showError('Import Failed', error.message);
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const processImport = async (data: any[], type: 'transactions' | 'budgets') => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const item of data) {
        try {
          if (type === 'transactions') {
            await transactionService.createTransaction(item as TransactionFormData);
          } else {
            await budgetService.createBudget(item as BudgetFormData);
          }
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        showSuccess(
          'Import Completed',
          `Successfully imported ${successCount} ${type}${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        );
      }

      if (errorCount > 0 && successCount === 0) {
        showError('Import Failed', `Failed to import any ${type}`);
      }
    } catch (error: any) {
      showError('Import Failed', error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Data
            </button>
          </nav>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <LoadingSpinner size="lg" text="Processing..." />
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Export Options</h4>
              
              {/* Transactions Export */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Transactions</h5>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExportTransactions('csv')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportTransactions('json')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              {/* Budgets Export */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Budgets</h5>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleExportBudgets('csv')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportBudgets('json')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              {/* Complete Backup */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-3">Complete Backup</h5>
                <button
                  onClick={handleExportAll}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Export Everything
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Exports all transactions and budgets in a single JSON file
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Import Options</h4>
              
              {/* Transactions Import */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Import Transactions</h5>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => handleFileImport(e, 'transactions')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Supports CSV and JSON formats. CSV should have columns: Date, Description, Amount, Type, Category, Notes
                </p>
              </div>

              {/* Budgets Import */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-900 mb-3">Import Budgets</h5>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileImport(e, 'budgets')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Supports JSON format only
                </p>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Import Results</h5>
                  
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{importResults.summary.total}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.summary.successful}</div>
                      <div className="text-sm text-gray-500">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.summary.failed}</div>
                      <div className="text-sm text-gray-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{importResults.summary.skipped}</div>
                      <div className="text-sm text-gray-500">Skipped</div>
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h6 className="font-medium text-red-800 mb-2">Errors:</h6>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResults.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {importResults.errors.length > 5 && (
                          <li>• ... and {importResults.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {importResults.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                      <h6 className="font-medium text-yellow-800 mb-2">Warnings:</h6>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {importResults.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
