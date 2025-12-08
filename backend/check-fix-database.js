import dotenv from 'dotenv';
import sequelize from './config/database.js';

dotenv.config();

const checkAndFixDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // 1. Check foreign key constraints
    console.log('🔍 Checking foreign key constraints...');
    const [constraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass 
      AND contype = 'f';
    `);

    console.log('\n📋 Foreign Key Constraints on appointments table:');
    constraints.forEach(c => {
      console.log(`   - ${c.constraint_name}`);
      console.log(`     Table: ${c.table_name}`);
      console.log(`     References: ${c.referenced_table}`);
      console.log(`     Definition: ${c.constraint_definition}\n`);
    });

    // 2. Check if patientId exists in users table
    console.log('🔍 Checking users table...');
    const [users] = await sequelize.query(`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'patient' 
      ORDER BY created_at DESC 
      LIMIT 10;
    `);
    
    console.log(`\n📋 Found ${users.length} patients in users table:`);
    users.forEach((u, i) => {
      console.log(`   ${i + 1}. ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`);
    });

    // 3. Check appointments table structure
    console.log('\n🔍 Checking appointments table columns...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      AND column_name IN ('patient_id', 'patientId', 'doctor_id')
      ORDER BY column_name;
    `);

    console.log('\n📋 Relevant columns in appointments table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // 4. Check if there are any orphaned appointments
    console.log('\n🔍 Checking for orphaned appointments...');
    const [orphaned] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id::text
      WHERE u.id IS NULL;
    `);

    console.log(`\n⚠️  Orphaned appointments (patient_id not in users): ${orphaned[0]?.count || 0}`);

    // 5. Check which column has the foreign key
    const patientIdFk = constraints.find(c => 
      c.constraint_definition.includes('patient_id') || 
      c.constraint_definition.includes('patientId')
    );

    if (patientIdFk) {
      console.log(`\n✅ Foreign key found: ${patientIdFk.constraint_name}`);
      console.log(`   Definition: ${patientIdFk.constraint_definition}`);
      
      // Extract the column name from constraint
      const columnMatch = patientIdFk.constraint_definition.match(/\(([^)]+)\)/);
      const fkColumn = columnMatch ? columnMatch[1].replace(/"/g, '') : null;
      console.log(`   Column: ${fkColumn}`);
    }

    // 6. Verify patient exists before insert (sample check)
    if (users.length > 0) {
      const samplePatientId = users[0].id;
      console.log(`\n🔍 Testing if patient exists: ${samplePatientId}`);
      
      const [exists] = await sequelize.query(`
        SELECT EXISTS(
          SELECT 1 FROM users WHERE id = :patientId
        ) as exists;
      `, {
        replacements: { patientId: samplePatientId },
        type: sequelize.QueryTypes.SELECT,
      });

      console.log(`   Patient exists: ${exists[0]?.exists || false}`);
    }

    console.log('\n✅ Database check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

checkAndFixDatabase();




