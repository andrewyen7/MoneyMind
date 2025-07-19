const Category = require('../models/Category');
const User = require('../models/User');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    
    // Initialize default categories
    await Category.initializeDefaults();
    
    // Create Andrew's user if it doesn't exist
    const andrewUser = await User.findOne({ email: 'andrewyen8@gmail.com' });
    if (!andrewUser) {
      const newUser = new User({
        username: 'andrewyen8',
        email: 'andrewyen8@gmail.com',
        password: 'YenYiHua@69',
        firstName: 'Andrew',
        lastName: 'Yen'
      });
      await newUser.save();
      console.log('Andrew user created in database');
    } else {
      console.log('Andrew user already exists');
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
