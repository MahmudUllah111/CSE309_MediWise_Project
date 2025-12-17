import dotenv from 'dotenv';
import sequelize from './config/database.js';

dotenv.config();

const checkPrescriptionsSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Check actual column names in prescriptions table
    const [columns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'prescriptions'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Actual columns in prescriptions table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check if diagnosis column exists
    const hasDiagnosis = columns.some(col => col.column_name === 'diagnosis');
    console.log(`\n🔍 Diagnosis column exists: ${hasDiagnosis ? '✅ YES' : '❌ NO'}`);
    
    if (!hasDiagnosis) {
      console.log('\n🔧 Adding missing diagnosis column...');
      try {
        await sequelize.query(`
          ALTER TABLE prescriptions
          ADD COLUMN IF NOT EXISTS diagnosis TEXT;
        `);
        console.log('✅ Added diagnosis column');
      } catch (error) {
        console.error('❌ Error adding diagnosis column:', error.message);
      }
    }
    
    console.log('\n✅ Schema check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
};

checkPrescriptionsSchema();






