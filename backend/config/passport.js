const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  // Local Strategy
  passport.use(new LocalStrategy({
    usernameField: 'email', // Use email as username field
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      // Find user by email or username
      const user = await User.findByEmailOrUsername(email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return done(null, false, { message: 'Account is deactivated' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).select('-password');
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
