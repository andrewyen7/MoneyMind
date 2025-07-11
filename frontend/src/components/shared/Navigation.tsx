import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const { state, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Transactions', href: '/transactions', icon: '💳' },
    { name: 'Categories', href: '/categories', icon: '📁' },
    { name: 'Budgets', href: '/budgets', icon: '🎯' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to login page after successful logout
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, navigate to login page
      navigate('/login', { replace: true });
    }
  };

  // Don't render navigation if user is not authenticated
  if (!state.isAuthenticated || !state.user) {
    return null;
  }

  return (
    <>
      {/* Fixed positioned logout button in right-top corner, icon+text */}
      <button
        type="button"
        onClick={handleLogout}
        className="fixed top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg z-[9999] border-2 border-red-500 flex items-center gap-2"
        title="Logout"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">Logout</span>
      </button>

      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 relative">

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">💰 MoneyMind</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* User Menu - Right Side */}
          <div className="flex items-center space-x-6 mr-32">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-base font-bold">
                  {state.user?.firstName?.charAt(0)}{state.user?.lastName?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-base">
                  {state.user?.firstName} {state.user?.lastName}
                </p>
                <p className="text-gray-500 text-sm">{state.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </a>
            ))}
          </div>
          
          {/* Mobile User Section */}
          <div className="pt-4 pb-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center px-5">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {state.user?.firstName?.charAt(0)}{state.user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {state.user?.firstName} {state.user?.lastName}
                </div>
                <div className="text-sm font-medium text-gray-500">{state.user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                type="button"
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navigation;
