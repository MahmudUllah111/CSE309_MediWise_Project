import sequelize from '../config/database.js';
import JobApplication from '../models/JobApplication.js';
import dotenv from 'dotenv';

dotenv.config();

const syncJobApplicationsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Force sync the JobApplication table
    console.log('🔄 Syncing JobApplication table...');
    await JobApplication.sync({ alter: true });
    console.log('✅ JobApplication table synced successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

syncJobApplicationsTable();

