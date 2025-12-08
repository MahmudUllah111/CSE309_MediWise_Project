import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createDoctorsFromUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Get all users with doctor role who don't have doctors table entries
    const [doctorUsers] = await sequelize.query(`
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
    
    console.log(`Found ${doctorUsers.length} doctor users without doctors table entries\n`);

    if (doctorUsers.length === 0) {
      console.log('✅ All doctor users already have entries in doctors table!');
      process.exit(0);
    }

    // Get a default department (or create one if needed)
    const [departments] = await sequelize.query(`
      SELECT id, name FROM departments LIMIT 1;
    `);
    
    let departmentId = null;
    if (departments.length > 0) {
      departmentId = departments[0].id;
      console.log(`Using department: ${departments[0].name} (${departmentId})\n`);
    } else {
      console.log('⚠️  No departments found. Creating a default department...');
      const [newDept] = await sequelize.query(`
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES (gen_random_uuid(), 'General Medicine', 'General Medicine Department', NOW(), NOW())
        RETURNING id, name;
      `);
      departmentId = newDept[0].id;
      console.log(`Created department: ${newDept[0].name} (${departmentId})\n`);
    }

    // Create doctors table entries for each doctor user
    console.log('Creating doctors table entries...\n');
    for (const user of doctorUsers) {
      try {
        const [result] = await sequelize.query(`
          INSERT INTO doctors (
            id,
            user_id,
            department_id,
            status,
            specialization,
            experience,
            consultation_fee,
            is_available,
            daily_appointment_limit,
            appointment_duration,
            available_from,
            available_to,
            available_days,
            created_at,
            updated_at
          )
          VALUES (
            gen_random_uuid(),
            :userId,
            :departmentId,
            'approved',
            'General Medicine',
            0,
            500.00,
            true,
            18,
            30,
            '09:00:00',
            '17:00:00',
            '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]'::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id, user_id, status;
        `, {
          replacements: {
            userId: user.id,
            departmentId: departmentId
          }
        });
        
        console.log(`✅ Created doctor entry for: ${user.name} (${user.email})`);
        console.log(`   Doctor ID: ${result[0].id}, Status: ${result[0].status}\n`);
      } catch (error) {
        console.error(`❌ Error creating doctor for ${user.name}:`, error.message);
        console.error(`   User ID: ${user.id}\n`);
      }
    }

    // Verify created doctors
    console.log('\n📋 Verifying created doctors...');
    const [allDoctors] = await sequelize.query(`
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
    
    console.log(`Total doctors in database: ${allDoctors.length}`);
    allDoctors.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.user_name || 'No user'} - Status: ${doctor.status} - Specialization: ${doctor.specialization || 'N/A'}`);
    });

    console.log('\n✅ Doctors creation completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating doctors:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

createDoctorsFromUsers();





