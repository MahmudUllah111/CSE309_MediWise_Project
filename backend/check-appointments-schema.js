import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAppointmentsSchema = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Check actual column names in appointments table
    const [columns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Actual columns in appointments table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });
    
    // Check for both camelCase and snake_case versions
    const columnNames = columns.map(col => col.column_name);
    const hasPatientId = columnNames.includes('patientId');
    const hasPatient_id = columnNames.includes('patient_id');
    const hasDoctorId = columnNames.includes('doctorId');
    const hasDoctor_id = columnNames.includes('doctor_id');
    
    console.log('\n🔍 Column naming check:');
    console.log(`   patientId (camelCase): ${hasPatientId ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   patient_id (snake_case): ${hasPatient_id ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   doctorId (camelCase): ${hasDoctorId ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   doctor_id (snake_case): ${hasDoctor_id ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Check sample data
    const [sampleData] = await sequelize.query(`
      SELECT * FROM appointments LIMIT 1;
    `);
    
    if (sampleData.length > 0) {
      console.log('\n📋 Sample appointment data keys:');
      console.log('   Keys:', Object.keys(sampleData[0]));
    } else {
      console.log('\n📋 No appointments in database yet');
    }
    
    console.log('\n✅ Schema check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

checkAppointmentsSchema();







