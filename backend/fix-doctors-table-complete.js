import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDoctorsTableComplete = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if doctors table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'doctors'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Doctors table does not exist yet.');
      process.exit(0);
    }

    // Get current columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'doctors'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    
    console.log('\n📋 Current columns in doctors table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check for timestamp columns
    const hasCreatedAt = columnNames.includes('createdAt');
    const hasCreated_at = columnNames.includes('created_at');
    const hasUpdatedAt = columnNames.includes('updatedAt');
    const hasUpdated_at = columnNames.includes('updated_at');

    console.log('\n🔧 Fixing timestamp columns...\n');

    // Handle createdAt -> created_at
    if (hasCreatedAt && !hasCreated_at) {
      console.log('   ⚠️  Found createdAt but need created_at. Renaming...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          RENAME COLUMN "createdAt" TO created_at;
        `);
        console.log('   ✅ Renamed createdAt to created_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename createdAt:', error.message);
      }
    } else if (!hasCreatedAt && !hasCreated_at) {
      console.log('   ⚠️  Neither createdAt nor created_at exists. Adding created_at...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL;
        `);
        console.log('   ✅ Added created_at column');
      } catch (error) {
        console.log('   ❌ Could not add created_at:', error.message);
      }
    } else if (hasCreated_at) {
      console.log('   ✅ created_at column exists');
    }

    // Handle updatedAt -> updated_at
    if (hasUpdatedAt && !hasUpdated_at) {
      console.log('   ⚠️  Found updatedAt but need updated_at. Renaming...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          RENAME COLUMN "updatedAt" TO updated_at;
        `);
        console.log('   ✅ Renamed updatedAt to updated_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename updatedAt:', error.message);
      }
    } else if (!hasUpdatedAt && !hasUpdated_at) {
      console.log('   ⚠️  Neither updatedAt nor updated_at exists. Adding updated_at...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
        `);
        console.log('   ✅ Added updated_at column');
      } catch (error) {
        console.log('   ❌ Could not add updated_at:', error.message);
      }
    } else if (hasUpdated_at) {
      console.log('   ✅ updated_at column exists');
    }

    // Check for department_id column
    const hasDepartmentId = columnNames.includes('departmentId');
    const hasDepartment_id = columnNames.includes('department_id');

    if (hasDepartmentId && !hasDepartment_id) {
      console.log('   ⚠️  Found departmentId but need department_id. Renaming...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          RENAME COLUMN "departmentId" TO department_id;
        `);
        console.log('   ✅ Renamed departmentId to department_id');
      } catch (error) {
        console.log('   ⚠️  Could not rename departmentId:', error.message);
      }
    } else if (!hasDepartmentId && !hasDepartment_id) {
      console.log('   ⚠️  Neither departmentId nor department_id exists. Adding department_id...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          ADD COLUMN department_id UUID;
        `);
        console.log('   ✅ Added department_id column');
      } catch (error) {
        console.log('   ❌ Could not add department_id:', error.message);
      }
    } else if (hasDepartment_id) {
      console.log('   ✅ department_id column exists');
    }

    // Final check
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'doctors'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Final columns in doctors table:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Doctors table fix completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing doctors table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

fixDoctorsTableComplete();







