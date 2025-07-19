import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import authService, { User, LoginData, RegisterData } from '../services/authService';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// Auth context interface
interface AuthContextType {
  state: AuthState;
  login: (loginData: LoginData) => Promise<boolean>;
  register: (registerData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await authService.checkAuth();
        if (response.success && response.isAuthenticated && response.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: '' });
        }
      } catch (error) {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to check authentication' });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (loginData: LoginData): Promise<boolean> => {
    console.log('AuthContext: Starting login process');
    dispatch({ type: 'AUTH_START' });
    try {
      console.log('AuthContext: Calling authService.login');
      const response = await authService.login(loginData);
      console.log('AuthContext: Login response:', response);
      
      if (response.success && response.user) {
        console.log('AuthContext: Login successful, dispatching AUTH_SUCCESS');
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        return true;
      } else {
        console.log('AuthContext: Login failed:', response.message);
        dispatch({ type: 'AUTH_FAILURE', payload: response.message || 'Login failed' });
        return false;
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      return false;
    }
  };

  // Register function
  const register = async (registerData: RegisterData): Promise<boolean> => {
    console.log('AuthContext: Starting registration process');
    dispatch({ type: 'AUTH_START' });
    try {
      console.log('AuthContext: Calling authService.register');
      const response = await authService.register(registerData);
      console.log('AuthContext: Registration response:', response);

      if (response.success && response.user) {
        console.log('AuthContext: Registration successful, dispatching AUTH_SUCCESS');
        dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
        return true;
      } else {
        console.log('AuthContext: Registration failed:', response);
        const errorMessage = response.errors ? response.errors.join(', ') : response.message;
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout fails on server, clear local state
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Clear error function (memoized to prevent infinite re-renders)
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
