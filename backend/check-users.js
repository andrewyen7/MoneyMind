const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moneymind');
    console.log('Connected to MongoDB');
    
    // Find all users
    const users = await User.find({}, 'username email firstName lastName isActive createdAt');
    
    console.log('\n=== USERS IN DATABASE ===');
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('   ---');
      });
    }
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
