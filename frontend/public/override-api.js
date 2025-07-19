/**
 * This script overrides all API calls to use localhost instead of production
 */

(function() {
  // Override fetch to redirect all API calls to localhost
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('moneymind-g1po.onrender.com')) {
      url = url.replace('https://moneymind-g1po.onrender.com', 'http://localhost:3000');
      console.log('API call redirected to localhost:', url);
    }
    return originalFetch.call(this, url, options);
  };

  // Override XMLHttpRequest to redirect all API calls to localhost
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (typeof url === 'string' && url.includes('moneymind-g1po.onrender.com')) {
      url = url.replace('https://moneymind-g1po.onrender.com', 'http://localhost:3000');
      console.log('XHR call redirected to localhost:', url);
    }
    return originalOpen.call(this, method, url, async, user, password);
  };

  // Override axios if it exists
  if (window.axios) {
    const originalAxiosCreate = window.axios.create;
    window.axios.create = function(config) {
      if (config && config.baseURL && config.baseURL.includes('moneymind-g1po.onrender.com')) {
        config.baseURL = config.baseURL.replace('https://moneymind-g1po.onrender.com', 'http://localhost:3000');
        console.log('Axios baseURL redirected to localhost:', config.baseURL);
      }
      return originalAxiosCreate.call(this, config);
    };
  }

  console.log('API override script loaded - all API calls will be redirected to localhost:3000');
})();