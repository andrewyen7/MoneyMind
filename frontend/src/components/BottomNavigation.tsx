import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      id: 'transactions',
      label: 'Trans.',
      path: '/transactions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'stats',
      label: 'Stats',
      path: '/expense-analytics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'accounts',
      label: 'Accounts',
      path: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      id: 'more',
      label: 'More',
      path: '/budgets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700">
      <div className="flex">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`flex-1 flex flex-col items-center py-2 px-1 ${
              isActive(item.path)
                ? 'text-red-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="mb-1">
              {item.icon}
            </div>
            <span className="text-xs font-medium">
              {item.label}
            </span>
            {isActive(item.path) && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
