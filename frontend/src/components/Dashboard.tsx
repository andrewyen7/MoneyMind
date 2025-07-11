import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './shared/Navigation';
import Header from './shared/Header';

const Dashboard: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to MoneyMind Dashboard!
              </h2>
              <p className="text-gray-600 mb-4">
                Your personal finance tracker is ready to help you manage your money.
              </p>
              <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">User Information</h3>
                <div className="text-left space-y-2">
                  <p><strong>Username:</strong> {state.user?.username}</p>
                  <p><strong>Email:</strong> {state.user?.email}</p>
                  <p><strong>Name:</strong> {state.user?.firstName} {state.user?.lastName}</p>
                  <p><strong>Member since:</strong> {state.user?.createdAt ? new Date(state.user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                More features coming soon in Sprint 2!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
