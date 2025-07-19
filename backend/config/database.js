const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try MongoDB Atlas first, fall back to local MongoDB if that fails
    let uri = process.env.MONGODB_ATLAS_URI;
    let conn;
    
    try {
      console.log('Attempting to connect to MongoDB Atlas...');
      conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('Successfully connected to MongoDB Atlas');
    } catch (atlasError) {
      console.log('Could not connect to MongoDB Atlas, falling back to local MongoDB...');
      uri = process.env.MONGODB_URI;
      conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('Successfully connected to local MongoDB');
    }

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
