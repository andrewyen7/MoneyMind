/**
 * CORS Fix Script
 * 
 * This script modifies the server.js file to fix CORS issues
 */

const fs = require('fs');
const path = require('path');

// Path to server.js
const serverPath = path.join(__dirname, 'server.js');

// Read the server.js file
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace the CORS configuration with a more permissive one
const corsConfig = `
// CORS configuration - VERY PERMISSIVE FOR DEVELOPMENT ONLY
app.use((req, res, next) => {
  // Allow requests from any origin in development
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Disable the standard cors middleware to avoid conflicts
// app.use(cors({...}));
`;

// Find the CORS configuration section and replace it
const corsRegex = /\/\/ Middleware\napp\.use\(cors\(\{[\s\S]*?\}\)\);/;
serverContent = serverContent.replace(corsRegex, '// Middleware\n' + corsConfig);

// Write the modified content back to server.js
fs.writeFileSync(serverPath, serverContent);

console.log('CORS configuration updated in server.js');
console.log('Restart your server for changes to take effect');