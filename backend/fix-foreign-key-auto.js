import dotenv from 'dotenv';
import sequelize from './config/database.js';

dotenv.config();

const fixForeignKeyConstraint = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.\n');

    // Step 1: Check current foreign key constraints
    console.log('🔍 Checking current foreign key constraints...');
    const [constraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        conrelid::regclass as table_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass 
      AND contype = 'f'
      AND (conname LIKE '%patient%' OR pg_get_constraintdef(oid) LIKE '%patient%');
    `);

    console.log(`\n📋 Found ${constraints.length} patient-related foreign key constraint(s):`);
    constraints.forEach(c => {
      console.log(`   - ${c.constraint_name}`);
      console.log(`     References: ${c.referenced_table}`);
      console.log(`     Definition: ${c.constraint_definition}\n`);
    });

    // Step 2: Drop old foreign key constraints
    if (constraints.length > 0) {
      console.log('🔧 Dropping old foreign key constraint(s)...');
      for (const constraint of constraints) {
        try {
          await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};`);
          console.log(`   ✅ Dropped: ${constraint.constraint_name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not drop ${constraint.constraint_name}: ${error.message}`);
        }
      }
    }

    // Step 3: Check if patient_id column exists and its type
    console.log('\n🔍 Checking patient_id column...');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      AND column_name = 'patient_id';
    `);

    if (columns.length === 0) {
      console.log('   ⚠️  patient_id column not found!');
      return;
    }

    const patientIdColumn = columns[0];
    console.log(`   Found: patient_id (${patientIdColumn.data_type}, nullable: ${patientIdColumn.is_nullable})`);

    // Step 4: Check if users table exists and has id column
    console.log('\n🔍 Checking users table...');
    const [usersTable] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'id';
    `);

    if (usersTable.length === 0) {
      console.log('   ❌ users table or id column not found!');
      return;
    }

    console.log(`   ✅ users.id exists (${usersTable[0].data_type})`);

    // Step 5: Create new foreign key constraint
    console.log('\n🔧 Creating new foreign key constraint...');
    try {
      // First, try to ensure types match
      if (patientIdColumn.data_type === 'text' && usersTable[0].data_type === 'uuid') {
        console.log('   ⚠️  Type mismatch: patient_id is text, users.id is uuid');
        console.log('   🔧 Attempting to convert patient_id to uuid...');
        try {
          // Update existing data first
          await sequelize.query(`
            UPDATE appointments 
            SET patient_id = patient_id::uuid::text 
            WHERE patient_id IS NOT NULL 
            AND patient_id != '';
          `);
          console.log('   ✅ Updated existing patient_id values');
        } catch (updateError) {
          console.log(`   ⚠️  Could not update existing data: ${updateError.message}`);
        }
      }

      // Create the foreign key constraint
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
      console.log(`   ❌ Error creating foreign key: ${error.message}`);
      
      // If it fails due to type mismatch, try with explicit casting
      if (error.message.includes('type') || error.message.includes('uuid')) {
        console.log('   🔧 Trying alternative approach...');
        try {
          // Drop constraint if it was partially created
          await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;`);
          
          // Try creating with text type (if patient_id is text)
          if (patientIdColumn.data_type === 'text') {
            await sequelize.query(`
              ALTER TABLE appointments
              ADD CONSTRAINT appointments_patient_id_fkey
              FOREIGN KEY (patient_id)
              REFERENCES users(id)
              ON UPDATE CASCADE
              ON DELETE CASCADE;
            `);
            console.log('   ✅ Created foreign key with text type');
          }
        } catch (altError) {
          console.log(`   ❌ Alternative approach failed: ${altError.message}`);
          console.log('\n💡 Manual fix required:');
          console.log('   Run this SQL in your database:');
          console.log('   ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;');
          console.log('   ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;');
        }
      }
    }

    // Step 6: Verify the new constraint
    console.log('\n🔍 Verifying new foreign key constraint...');
    const [newConstraints] = await sequelize.query(`
      SELECT 
        conname as constraint_name,
        confrelid::regclass as referenced_table,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'appointments'::regclass 
      AND contype = 'f'
      AND conname = 'appointments_patient_id_fkey';
    `);

    if (newConstraints.length > 0) {
      console.log('   ✅ Foreign key constraint verified:');
      newConstraints.forEach(c => {
        console.log(`   - ${c.constraint_name}`);
        console.log(`     References: ${c.referenced_table}`);
        console.log(`     Definition: ${c.constraint_definition}`);
      });
    } else {
      console.log('   ⚠️  Foreign key constraint not found after creation');
    }

    console.log('\n✅ Foreign key fix completed!');
    console.log('\n💡 If the constraint was not created, you may need to:');
    console.log('   1. Ensure patient_id column type matches users.id type');
    console.log('   2. Run the SQL manually from fix-fk-sql.sql');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing foreign key:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

fixForeignKeyConstraint();




