/**
 * API Redirect Script
 * This script intercepts all API calls to moneymind-g1po.onrender.com and redirects them to localhost:3000
 */

console.log('API Redirect Script loaded');

// Create a proxy for XMLHttpRequest
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
  // Check if the URL contains the production domain
  if (typeof url === 'string' && url.includes('moneymind-g1po.onrender.com')) {
    // Replace with localhost
    url = url.replace('https://moneymind-g1po.onrender.com', 'http://localhost:3000');
    console.log('XHR redirected to:', url);
  }
  return originalXHROpen.call(this, method, url, async, user, password);
};

// Create a proxy for fetch
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  if (typeof input === 'string' && input.includes('moneymind-g1po.onrender.com')) {
    // Replace with localhost
    input = input.replace('https://moneymind-g1po.onrender.com', 'http://localhost:3000');
    console.log('Fetch redirected to:', input);
  }
  return originalFetch.call(this, input, init);
};

// Override axios if it exists (will be loaded later)
document.addEventListener('DOMContentLoaded', function() {
  // Wait for axios to be loaded
  const checkAxios = setInterval(function() {
    if (window.axios) {
      clearInterval(checkAxios);
      
      // Override axios defaults
      window.axios.defaults.baseURL = 'http://localhost:3000/api';
      
      // Override axios create
      const originalCreate = window.axios.create;
      window.axios.create = function(config) {
        if (config && config.baseURL && config.baseURL.includes('moneymind-g1po.onrender.com')) {
          config.baseURL = 'http://localhost:3000/api';
          console.log('Axios baseURL redirected to localhost');
        }
        return originalCreate.call(this, config);
      };
      
      console.log('Axios overridden to use localhost');
    }
  }, 100);
});

console.log('API Redirect Script: All API calls to moneymind-g1po.onrender.com will be redirected to localhost:3000');