const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const clearUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moneymind');
    console.log('Connected to MongoDB');
    
    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in database`);
    
    if (userCount > 0) {
      // Delete all users
      const result = await User.deleteMany({});
      console.log(`Deleted ${result.deletedCount} users`);
    } else {
      console.log('No users to delete');
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    console.log('All users have been cleared. You can now register fresh.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

clearUsers();
