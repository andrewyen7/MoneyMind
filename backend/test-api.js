/**
 * Test API Script
 * This script tests the API endpoints directly from Node.js
 */

const axios = require('axios');

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Store cookies between requests
let cookies = '';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add cookies if we have them
    if (cookies) {
      options.headers.Cookie = cookies;
    }

    // Add data if provided
    if (data) {
      options.data = data;
    }

    console.log(`Making ${method} request to ${endpoint}`);
    const response = await axios(options);
    
    // Save cookies for subsequent requests
    if (response.headers['set-cookie']) {
      cookies = response.headers['set-cookie'].join('; ');
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      return error.response.data;
    }
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('=== Testing MoneyMind API ===');
  
  // Test health endpoint
  console.log('\n1. Testing health endpoint');
  const healthResult = await apiRequest('/health');
  console.log('Health result:', healthResult);
  
  // Test login
  console.log('\n2. Testing login with test user');
  const loginResult = await apiRequest('/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
  console.log('Login result:', loginResult);
  
  // Test auth check
  console.log('\n3. Testing auth check');
  const authCheckResult = await apiRequest('/auth/check');
  console.log('Auth check result:', authCheckResult);
  
  // Test getting budgets
  console.log('\n4. Testing budgets endpoint');
  const budgetsResult = await apiRequest('/budgets?period=monthly');
  console.log('Budgets result:', budgetsResult);
  
  // Test dashboard data
  console.log('\n5. Testing dashboard data');
  const dashboardResult = await apiRequest('/dashboard/data');
  console.log('Dashboard result:', dashboardResult);
  
  console.log('\n=== Tests completed ===');
}

// Run the tests
runTests().catch(console.error);