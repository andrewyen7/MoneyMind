import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handleApiError(error: any): AppError {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            message: data.message || 'Invalid request. Please check your input.',
            code: 'BAD_REQUEST',
            status,
            details: data.errors || data.details
          };
        
        case 401:
          return {
            message: 'You are not authorized. Please log in again.',
            code: 'UNAUTHORIZED',
            status
          };
        
        case 403:
          return {
            message: 'You do not have permission to perform this action.',
            code: 'FORBIDDEN',
            status
          };
        
        case 404:
          return {
            message: 'The requested resource was not found.',
            code: 'NOT_FOUND',
            status
          };
        
        case 409:
          return {
            message: data.message || 'A conflict occurred. The resource may already exist.',
            code: 'CONFLICT',
            status,
            details: data.details
          };
        
        case 422:
          return {
            message: data.message || 'Validation failed. Please check your input.',
            code: 'VALIDATION_ERROR',
            status,
            details: data.errors || data.details
          };
        
        case 429:
          return {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMITED',
            status
          };
        
        case 500:
          return {
            message: 'An internal server error occurred. Please try again later.',
            code: 'INTERNAL_ERROR',
            status
          };
        
        case 502:
        case 503:
        case 504:
          return {
            message: 'The service is temporarily unavailable. Please try again later.',
            code: 'SERVICE_UNAVAILABLE',
            status
          };
        
        default:
          return {
            message: data.message || `An error occurred (${status}). Please try again.`,
            code: 'UNKNOWN_ERROR',
            status,
            details: data
          };
      }
    } else if (error.request) {
      // Network error
      return {
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  static handleValidationError(errors: string[]): AppError {
    return {
      message: 'Please correct the following errors:',
      code: 'VALIDATION_ERROR',
      details: errors
    };
  }

  static handleFormError(field: string, message: string): AppError {
    return {
      message: `${field}: ${message}`,
      code: 'FORM_ERROR',
      details: { field, message }
    };
  }

  static isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_ERROR',
      'RATE_LIMITED'
    ];
    
    return retryableCodes.includes(error.code || '');
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  }

  static formatErrorMessage(error: AppError): string {
    if (error.details && Array.isArray(error.details)) {
      return `${error.message}\n• ${error.details.join('\n• ')}`;
    }
    
    return error.message;
  }

  static logError(error: AppError, context?: string): void {
    const logData = {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', logData);
    }

    // In production, you might want to send to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // errorTrackingService.captureError(logData);
  }
}

// Hook for handling errors with retry logic
export const useErrorHandler = () => {
  const [retryCount, setRetryCount] = React.useState(0);
  const maxRetries = 3;

  const handleError = React.useCallback((error: any, context?: string) => {
    const appError = ErrorHandler.handleApiError(error);
    ErrorHandler.logError(appError, context);
    return appError;
  }, []);

  const retryOperation = React.useCallback(async (
    operation: () => Promise<any>,
    onError?: (error: AppError) => void
  ) => {
    try {
      const result = await operation();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      const appError = handleError(error);
      
      if (ErrorHandler.isRetryableError(appError) && retryCount < maxRetries) {
        const delay = ErrorHandler.getRetryDelay(retryCount);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          retryOperation(operation, onError);
        }, delay);
      } else {
        setRetryCount(0);
        if (onError) {
          onError(appError);
        }
        throw appError;
      }
    }
  }, [retryCount, maxRetries, handleError]);

  return {
    handleError,
    retryOperation,
    retryCount,
    maxRetries
  };
};

// React import for the hook
import React from 'react';

export default ErrorHandler;
