import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDoctorsDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Check users with doctor role
    console.log('📋 Checking users with doctor role...');
    const [doctorUsers] = await sequelize.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'doctor'
      ORDER BY name;
    `);
    
    console.log(`Found ${doctorUsers.length} users with doctor role:`);
    doctorUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // Check doctors table
    console.log('\n📋 Checking doctors table...');
    const [doctors] = await sequelize.query(`
      SELECT 
        d.id,
        d.user_id,
        d.status,
        d.specialization,
        u.name as user_name,
        u.email as user_email
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC;
    `);
    
    console.log(`Found ${doctors.length} entries in doctors table:`);
    if (doctors.length === 0) {
      console.log('  ⚠️  No doctors found in doctors table!');
    } else {
      doctors.forEach((doctor, index) => {
        console.log(`  ${index + 1}. ${doctor.user_name || 'No user'} - Status: ${doctor.status} - Specialization: ${doctor.specialization || 'N/A'}`);
      });
    }

    // Check which doctor users don't have entries in doctors table
    console.log('\n📋 Checking doctor users without doctors table entries...');
    const [missingDoctors] = await sequelize.query(`
      SELECT 
        u.id,
        u.name,
        u.email
      FROM users u
      WHERE u.role = 'doctor'
      AND NOT EXISTS (
        SELECT 1 FROM doctors d WHERE d.user_id = u.id
      )
      ORDER BY u.name;
    `);
    
    console.log(`Found ${missingDoctors.length} doctor users without doctors table entries:`);
    if (missingDoctors.length > 0) {
      missingDoctors.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user.id}`);
      });
      console.log('\n⚠️  These doctor users need entries in the doctors table!');
    } else {
      console.log('  ✅ All doctor users have entries in doctors table');
    }

    // Check approved doctors
    console.log('\n📋 Checking approved doctors...');
    const [approvedDoctors] = await sequelize.query(`
      SELECT 
        d.id,
        d.user_id,
        d.status,
        d.specialization,
        d.is_available,
        u.name as user_name,
        u.email as user_email
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.status = 'approved'
      ORDER BY d.created_at DESC;
    `);
    
    console.log(`Found ${approvedDoctors.length} approved doctors:`);
    if (approvedDoctors.length === 0) {
      console.log('  ⚠️  No approved doctors found!');
    } else {
      approvedDoctors.forEach((doctor, index) => {
        console.log(`  ${index + 1}. ${doctor.user_name || 'No user'} - Available: ${doctor.is_available} - Specialization: ${doctor.specialization || 'N/A'}`);
      });
    }

    console.log('\n✅ Database check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

checkDoctorsDatabase();





