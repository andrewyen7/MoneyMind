const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a custom user with the provided email
async function createCustomUser() {
  try {
    const email = 'xiu2chen@gmail.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('User with this email already exists');
      process.exit(0);
    }
    
    // Create new user
    const newUser = new User({
      username: 'xiuchen',
      email: email,
      password: 'password123',
      firstName: 'Xiu',
      lastName: 'Chen'
    });
    
    await newUser.save();
    console.log('Custom user created successfully');
    console.log('Email: ' + email);
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating custom user:', error);
    process.exit(1);
  }
}

createCustomUser();