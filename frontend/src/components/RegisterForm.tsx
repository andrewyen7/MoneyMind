import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const { state, register, clearError } = useAuth();
  const navigate = useNavigate();

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, []); // Remove clearError from dependencies to prevent infinite loops

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated && !state.isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [state.isAuthenticated, state.isLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Attempting registration with:', {
      username: formData.username,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName
    });

    const success = await register(formData);

    console.log('Registration result:', success);
    console.log('Auth state after registration:', state);

    if (success) {
      console.log('Registration successful, navigating to dashboard');
      navigate('/dashboard', { replace: true });
    } else {
      console.log('Registration failed, staying on register page');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Centered modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-64 mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold text-gray-900 ml-2">MoneyMind</h1>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h2>
          <p className="text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {state.error}
            </div>
          )}

          {/* Name fields - stacked for narrow form */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Show password checkbox */}
          <div className="flex items-center">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show-password" className="ml-2 block text-sm text-gray-700">
              Show password
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={state.isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {state.isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
