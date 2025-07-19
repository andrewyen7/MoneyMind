const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use the same connection logic as your main app
    const mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/moneymind';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for user creation');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Create Andrew's user account
async function createAndrewUser() {
  try {
    await connectDB();
    
    const email = 'andrewyen8@gmail.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('User with this email already exists');
      console.log('User:', {
        email: existingUser.email,
        username: existingUser.username,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName
      });
      process.exit(0);
    }
    
    // Create new user with your credentials
    const newUser = new User({
      username: 'andrewyen8',
      email: email,
      password: 'YenYiHua@69', // Your password from the screenshot
      firstName: 'Andrew',
      lastName: 'Yen'
    });
    
    await newUser.save();
    console.log('Andrew user created successfully!');
    console.log('Email: ' + email);
    console.log('Password: YenYiHua@69');
    console.log('You can now log in with these credentials');
    process.exit(0);
  } catch (error) {
    console.error('Error creating Andrew user:', error);
    process.exit(1);
  }
}

createAndrewUser();
