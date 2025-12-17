import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const standardizeAppointmentsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Get current columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    console.log('\n📋 Current columns:', columnNames);

    // Standardize to snake_case (as per model field mappings)
    console.log('\n🔧 Standardizing to SNAKE_CASE...\n');

    // 1. Handle patientId -> patient_id
    if (columnNames.includes('patientId') && columnNames.includes('patient_id')) {
      console.log('⚠️  Both patientId and patient_id exist. Migrating data...');
      try {
        // Copy data from patientId to patient_id if patient_id is empty/null
        await sequelize.query(`
          UPDATE appointments 
          SET patient_id = patientId::text 
          WHERE (patient_id IS NULL OR patient_id = '') AND patientId IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from patientId to patient_id');
      } catch (error) {
        console.log('   ⚠️  Could not migrate patientId data:', error.message);
      }
    }

    // 2. Handle doctorId -> doctor_id (if doctorId exists)
    if (columnNames.includes('doctorId') && columnNames.includes('doctor_id')) {
      console.log('⚠️  Both doctorId and doctor_id exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE appointments 
          SET doctor_id = doctorId::text 
          WHERE (doctor_id IS NULL OR doctor_id = '') AND doctorId IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from doctorId to doctor_id');
      } catch (error) {
        console.log('   ⚠️  Could not migrate doctorId data:', error.message);
      }
    }

    // 3. Handle appointmentDate -> appointment_date
    if (columnNames.includes('appointmentDate') && columnNames.includes('appointment_date')) {
      console.log('⚠️  Both appointmentDate and appointment_date exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE appointments 
          SET appointment_date = appointmentDate 
          WHERE appointment_date IS NULL AND appointmentDate IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from appointmentDate to appointment_date');
      } catch (error) {
        console.log('   ⚠️  Could not migrate appointmentDate data:', error.message);
      }
    }

    // 4. Handle appointmentTime -> appointment_time
    if (columnNames.includes('appointmentTime') && columnNames.includes('appointment_time')) {
      console.log('⚠️  Both appointmentTime and appointment_time exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE appointments 
          SET appointment_time = appointmentTime 
          WHERE appointment_time IS NULL AND appointmentTime IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from appointmentTime to appointment_time');
      } catch (error) {
        console.log('   ⚠️  Could not migrate appointmentTime data:', error.message);
      }
    }

    // 5. Handle createdAt -> created_at
    if (columnNames.includes('createdAt') && columnNames.includes('created_at')) {
      console.log('⚠️  Both createdAt and created_at exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE appointments 
          SET created_at = createdAt 
          WHERE created_at IS NULL AND createdAt IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from createdAt to created_at');
      } catch (error) {
        console.log('   ⚠️  Could not migrate createdAt data:', error.message);
      }
    }

    // 6. Handle updatedAt -> updated_at
    if (columnNames.includes('updatedAt') && columnNames.includes('updated_at')) {
      console.log('⚠️  Both updatedAt and updated_at exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE appointments 
          SET updated_at = updatedAt 
          WHERE updated_at IS NULL AND updatedAt IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from updatedAt to updated_at');
      } catch (error) {
        console.log('   ⚠️  Could not migrate updatedAt data:', error.message);
      }
    }

    // 7. Ensure required snake_case columns exist and are correct type
    console.log('\n🔧 Ensuring required columns exist with correct types...');

    const requiredColumns = [
      { name: 'patient_id', type: 'UUID', nullable: false },
      { name: 'doctor_id', type: 'UUID', nullable: false },
      { name: 'appointment_date', type: 'DATE', nullable: false },
      { name: 'appointment_time', type: 'TIME', nullable: false },
      { name: 'date_time', type: 'TIMESTAMP', nullable: false },
      { name: 'status', type: 'VARCHAR(50)', nullable: false, default: "'pending'" },
      { name: 'reason', type: 'TEXT', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false, default: 'NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false, default: 'NOW()' },
    ];

    for (const col of requiredColumns) {
      const exists = columnNames.includes(col.name);
      if (!exists) {
        try {
          const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
          await sequelize.query(`
            ALTER TABLE appointments 
            ADD COLUMN ${col.name} ${col.type}${col.nullable ? '' : ' NOT NULL'}${defaultClause};
          `);
          console.log(`   ✅ Added column: ${col.name}`);
        } catch (error) {
          console.log(`   ⚠️  Could not add ${col.name}:`, error.message);
        }
      } else {
        console.log(`   ✅ Column exists: ${col.name}`);
      }
    }

    // Final check
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Final columns in appointments table:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Standardization completed!');
    console.log('\n💡 The database now uses SNAKE_CASE columns.');
    console.log('   Your Sequelize model field mappings should work correctly now.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error standardizing appointments table:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

standardizeAppointmentsTable();







