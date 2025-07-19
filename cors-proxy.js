const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes with specific configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Create proxy middleware
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '' // remove /proxy prefix
  },
  onProxyReq: (proxyReq) => {
    // Remove problematic headers
    proxyReq.removeHeader('cache-control');
    proxyReq.removeHeader('pragma');
    proxyReq.removeHeader('expires');
  }
});

// Use the proxy for all requests
app.use('/proxy', apiProxy);

// Start the proxy server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`Use http://localhost:${PORT}/proxy/api/... instead of http://localhost:3000/api/...`);
});