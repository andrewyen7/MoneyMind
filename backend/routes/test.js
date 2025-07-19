const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Simple test route to check authentication
router.get('/test', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication working!',
    user: req.user,
    session: {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated()
    }
  });
});

module.exports = router;
