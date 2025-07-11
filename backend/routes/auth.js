const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated, ensureNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', ensureNotAuthenticated, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Check if username is taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await newUser.save();

    // Log the user in automatically after registration
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Registration successful but login failed'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: newUser.toJSON()
      });
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', ensureNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info.message || 'Invalid credentials'
      });
    }
    
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Login failed'
        });
      }
      
      res.json({
        success: true,
        message: 'Login successful',
        user: user.toJSON()
      });
    });
  })(req, res, next);
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', ensureAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', ensureAuthenticated, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// @route   GET /api/auth/check
// @desc    Check if user is authenticated
// @access  Public
router.get('/check', (req, res) => {
  res.json({
    success: true,
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.user : null
  });
});

module.exports = router;
