const Category = require('../models/Category');

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');
    
    // Initialize default categories
    await Category.initializeDefaults();
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;
