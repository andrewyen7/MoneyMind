// Middleware to check if user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ 
    success: false, 
    message: 'Access denied. Please log in to continue.' 
  });
};

// Middleware to check if user is not authenticated (for login/register routes)
const ensureNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.status(400).json({ 
    success: false, 
    message: 'You are already logged in.' 
  });
};

// Middleware to check if user is admin (for future use)
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin privileges required.' 
  });
};

module.exports = {
  ensureAuthenticated,
  ensureNotAuthenticated,
  ensureAdmin
};
