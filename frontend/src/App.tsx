import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DashboardProvider } from './contexts/DashboardContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import TransactionsPage from './components/TransactionsPage';
import CategoriesPage from './components/CategoriesPage';
import BudgetsPage from './components/BudgetsPage';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ToastProvider } from './components/shared/Toast';

function App() {
  return (
    <DashboardProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="App">
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <EnhancedDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute>
                        <TransactionsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/categories"
                    element={
                      <ProtectedRoute>
                        <CategoriesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/budgets"
                    element={
                      <ProtectedRoute>
                        <BudgetsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/expense-analytics"
                    element={
                      <ProtectedRoute>
                        <ExpenseAnalytics />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/login" replace />} />

                  {/* Catch all route - redirect to login for unknown routes */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </div>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </DashboardProvider>
  );
}

export default App;
