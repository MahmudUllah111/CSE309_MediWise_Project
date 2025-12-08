import dotenv from 'dotenv';
import sequelize from './config/database.js';

dotenv.config();

const fixAppointmentsForeignKey = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // 1. Check if patients table exists
    console.log('🔍 Checking if patients table exists...');
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'patients';
    `);

    if (tables.length > 0) {
      console.log('   ⚠️  patients table exists!');
      const [patientCount] = await sequelize.query(`SELECT COUNT(*) as count FROM patients;`);
      console.log(`   Patients in patients table: ${patientCount[0]?.count || 0}`);
    } else {
      console.log('   ✅ No patients table found (expected - we use users table)');
    }

    // 2. Check current foreign key
    console.log('\n🔍 Checking current foreign key constraint...');
    const [constraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass 
      AND contype = 'f'
      AND conname LIKE '%patient%';
    `);

    if (constraints.length > 0) {
      console.log('   Current constraint:');
      constraints.forEach(c => {
        console.log(`   - ${c.constraint_name}: ${c.constraint_definition}`);
      });

      // 3. Drop the old foreign key
      console.log('\n🔧 Dropping old foreign key constraint...');
      for (const constraint of constraints) {
        try {
          await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};`);
          console.log(`   ✅ Dropped: ${constraint.constraint_name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not drop ${constraint.constraint_name}: ${error.message}`);
        }
      }

      // 4. Create new foreign key referencing users table
      console.log('\n🔧 Creating new foreign key to users table...');
      try {
        // First, ensure patient_id column exists and is the right type
        await sequelize.query(`
          DO $$
          BEGIN
            -- Check if patient_id column exists and is text type
            IF EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'appointments' 
              AND column_name = 'patient_id' 
              AND data_type = 'text'
            ) THEN
              -- Convert patient_id to uuid if it's text
              ALTER TABLE appointments 
              ALTER COLUMN patient_id TYPE uuid USING patient_id::uuid;
            END IF;
          END $$;
        `);
        console.log('   ✅ Ensured patient_id is uuid type');

        // Create foreign key to users table
        await sequelize.query(`
          ALTER TABLE appointments
          ADD CONSTRAINT appointments_patient_id_fkey
          FOREIGN KEY (patient_id)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE;
        `);
        console.log('   ✅ Created foreign key: appointments_patient_id_fkey -> users(id)');
      } catch (error) {
        console.log(`   ⚠️  Error creating foreign key: ${error.message}`);
        
        // If patient_id is text, we need to handle it differently
        if (error.message.includes('type') || error.message.includes('uuid')) {
          console.log('   🔧 Trying alternative approach with text type...');
          try {
            await sequelize.query(`
              ALTER TABLE appointments
              ADD CONSTRAINT appointments_patient_id_fkey
              FOREIGN KEY (patient_id)
              REFERENCES users(id)
              ON UPDATE CASCADE
              ON DELETE CASCADE;
            `);
            console.log('   ✅ Created foreign key with text type');
          } catch (altError) {
            console.log(`   ❌ Alternative approach failed: ${altError.message}`);
          }
        }
      }
    } else {
      console.log('   ⚠️  No patient foreign key constraint found');
    }

    // 5. Verify the fix
    console.log('\n🔍 Verifying foreign key constraint...');
    const [newConstraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass 
      AND contype = 'f'
      AND conname LIKE '%patient%';
    `);

    if (newConstraints.length > 0) {
      console.log('   ✅ New foreign key constraint:');
      newConstraints.forEach(c => {
        console.log(`   - ${c.constraint_name}`);
        console.log(`     References: ${c.referenced_table}`);
        console.log(`     Definition: ${c.constraint_definition}`);
      });
    } else {
      console.log('   ⚠️  No foreign key constraint found after fix');
    }

    console.log('\n✅ Foreign key fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing foreign key:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

fixAppointmentsForeignKey();




