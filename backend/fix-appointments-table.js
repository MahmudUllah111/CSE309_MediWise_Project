import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAppointmentsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if appointments table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'appointments'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Appointments table does not exist yet. It will be created during sync.');
      process.exit(0);
    }

    // Check existing columns - get actual column names from database
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'appointments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    const columnNamesLower = columns.map(col => col.column_name.toLowerCase());
    
    console.log('\n📋 Current columns in appointments table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check what columns we need (based on model)
    const requiredColumns = {
      // Check for patientId (camelCase) or patient_id (snake_case)
      patientId: { camelCase: 'patientId', snakeCase: 'patient_id', type: 'UUID', nullable: false },
      doctorId: { camelCase: 'doctorId', snakeCase: 'doctor_id', type: 'UUID', nullable: false },
      appointmentDate: { camelCase: 'appointmentDate', snakeCase: 'appointment_date', type: 'DATE', nullable: false },
      appointmentTime: { camelCase: 'appointmentTime', snakeCase: 'appointment_time', type: 'TIME', nullable: false },
      dateTime: { camelCase: 'dateTime', snakeCase: 'date_time', type: 'TIMESTAMP', nullable: false },
      status: { camelCase: 'status', snakeCase: 'status', type: 'VARCHAR', nullable: true },
      reason: { camelCase: 'reason', snakeCase: 'reason', type: 'TEXT', nullable: true },
    };

    console.log('\n🔍 Checking column naming convention...');
    
    // Detect naming convention
    let usesCamelCase = false;
    let usesSnakeCase = false;
    
    if (columnNames.includes('patientId') || columnNames.includes('doctorId')) {
      usesCamelCase = true;
      console.log('   ✅ Database uses CAMELCASE column names');
    }
    if (columnNames.includes('patient_id') || columnNames.includes('doctor_id')) {
      usesSnakeCase = true;
      console.log('   ✅ Database uses SNAKE_CASE column names');
    }

    if (!usesCamelCase && !usesSnakeCase) {
      console.log('   ⚠️  Could not detect naming convention. Checking both...');
    }

    // Check for missing columns and add them
    console.log('\n🔧 Fixing columns...');
    
    for (const [key, col] of Object.entries(requiredColumns)) {
      const hasCamelCase = columnNames.includes(col.camelCase);
      const hasSnakeCase = columnNames.includes(col.snakeCase);
      
      if (!hasCamelCase && !hasSnakeCase) {
        // Column doesn't exist - add it based on detected convention
        const columnName = usesSnakeCase ? col.snakeCase : col.camelCase;
        const sqlType = col.type === 'UUID' ? 'UUID' : 
                       col.type === 'DATE' ? 'DATE' : 
                       col.type === 'TIME' ? 'TIME' : 
                       col.type === 'TIMESTAMP' ? 'TIMESTAMP' : 
                       col.type === 'TEXT' ? 'TEXT' : 
                       col.type === 'VARCHAR' ? 'VARCHAR(255)' : 'TEXT';
        
        try {
          const quotedName = usesSnakeCase ? col.snakeCase : `"${col.camelCase}"`;
          await sequelize.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS ${quotedName} ${sqlType}${col.nullable ? '' : ' NOT NULL'};
          `);
          console.log(`   ✅ Added column: ${columnName}`);
        } catch (error) {
          console.error(`   ❌ Error adding column ${columnName}:`, error.message);
        }
      } else if (hasCamelCase && usesSnakeCase) {
        // Has camelCase but should be snake_case - rename it
        console.log(`   ⚠️  Column ${col.camelCase} exists but should be ${col.snakeCase}. Consider renaming.`);
      } else if (hasSnakeCase && usesCamelCase) {
        // Has snake_case but should be camelCase - rename it
        console.log(`   ⚠️  Column ${col.snakeCase} exists but should be ${col.camelCase}. Consider renaming.`);
      } else {
        console.log(`   ✅ Column exists: ${hasCamelCase ? col.camelCase : col.snakeCase}`);
      }
    }

    // Check for date_time column specifically
    const hasDateTime = columnNames.includes('date_time') || columnNamesLower.includes('date_time');
    if (!hasDateTime) {
      try {
        await sequelize.query(`
          ALTER TABLE appointments 
          ADD COLUMN IF NOT EXISTS date_time TIMESTAMP NOT NULL DEFAULT NOW();
        `);
        console.log('   ✅ Added date_time column');
      } catch (error) {
        console.error('   ❌ Error adding date_time column:', error.message);
      }
    }

    // Final check - show all columns again
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

    console.log('\n✅ Appointments table fix completed!');
    console.log('\n💡 Note: If you see column naming mismatches, you may need to:');
    console.log('   1. Update the Sequelize model field mappings');
    console.log('   2. Or rename database columns to match the model');
    console.log('   3. Or update database config underscored setting');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing appointments table:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

fixAppointmentsTable();





