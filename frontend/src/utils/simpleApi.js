/**
 * Simple API client that doesn't use axios or cache-control headers
 */

// Base URL for all API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Simple fetch wrapper
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default options
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Merge options
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  // Make the request
  const response = await fetch(url, fetchOptions);
  
  // Parse the response
  const data = await response.json();
  
  // Check if the request was successful
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

// API methods
export const simpleApi = {
  // Get budgets
  async getBudgets(period = 'monthly') {
    const data = await fetchApi(`/budgets?period=${period}`);
    return data.budgets || [];
  },
  
  // Get budget summary
  async getBudgetSummary(period = 'monthly') {
    const data = await fetchApi(`/budgets/summary?period=${period}`);
    return data.summary || null;
  },
  
  // Create budget
  async createBudget(budgetData) {
    const data = await fetchApi('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData)
    });
    return data;
  },
  
  // Update budget
  async updateBudget(id, budgetData) {
    const data = await fetchApi(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData)
    });
    return data;
  },
  
  // Delete budget
  async deleteBudget(id) {
    const data = await fetchApi(`/budgets/${id}`, {
      method: 'DELETE'
    });
    return data;
  }
};

export default simpleApi;