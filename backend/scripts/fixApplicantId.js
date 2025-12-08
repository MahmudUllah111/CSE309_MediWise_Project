import sequelize from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixApplicantId = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Manually alter the applicantId column to allow NULL
    console.log('🔄 Fixing applicantId column to allow NULL...');
    await sequelize.query(`
      ALTER TABLE "job_applications" 
      ALTER COLUMN "applicantId" DROP NOT NULL;
    `);
    
    console.log('✅ applicantId column updated to allow NULL!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing column:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

fixApplicantId();

