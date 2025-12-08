import sequelize from './config/database.js';
import models from './models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const resetDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Dropping and recreating all tables...');
    await sequelize.sync({ force: true });
    console.log('Database tables recreated successfully.');

    // Create default admin user
    await models.User.create({
      name: 'Admin User',
      email: 'admin@mediwise.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1234567890',
    });
    console.log('Default admin user created: admin@mediwise.com / admin123');

    // Create default departments
    await models.Department.bulkCreate([
      { name: 'Cardiology', description: 'Heart and cardiovascular system', icon: '❤️' },
      { name: 'Neurology', description: 'Brain and nervous system', icon: '🧠' },
      { name: 'Orthopedics', description: 'Bones and joints', icon: '🦴' },
      { name: 'Pediatrics', description: 'Children health care', icon: '👶' },
      { name: 'Dermatology', description: 'Skin conditions', icon: '🧴' },
      { name: 'General Medicine', description: 'General health care', icon: '🩺' },
    ]);
    console.log('Default departments created.');

    console.log('Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

resetDatabase();

