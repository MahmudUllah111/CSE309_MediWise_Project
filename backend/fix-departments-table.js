import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDepartmentsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if departments table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'departments'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Departments table does not exist yet. It will be created during sync.');
      process.exit(0);
    }

    // Get current columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'departments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    
    console.log('\n📋 Current columns in departments table:');
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
          ALTER TABLE departments 
          RENAME COLUMN "createdAt" TO created_at;
        `);
        console.log('   ✅ Renamed createdAt to created_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename createdAt:', error.message);
        // Try to add created_at if rename fails
        try {
          await sequelize.query(`
            ALTER TABLE departments 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
          `);
          console.log('   ✅ Added created_at column');
        } catch (addError) {
          console.log('   ❌ Could not add created_at:', addError.message);
        }
      }
    } else if (!hasCreatedAt && !hasCreated_at) {
      console.log('   ⚠️  Neither createdAt nor created_at exists. Adding created_at...');
      try {
        await sequelize.query(`
          ALTER TABLE departments 
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
          ALTER TABLE departments 
          RENAME COLUMN "updatedAt" TO updated_at;
        `);
        console.log('   ✅ Renamed updatedAt to updated_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename updatedAt:', error.message);
        // Try to add updated_at if rename fails
        try {
          await sequelize.query(`
            ALTER TABLE departments 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
          `);
          console.log('   ✅ Added updated_at column');
        } catch (addError) {
          console.log('   ❌ Could not add updated_at:', addError.message);
        }
      }
    } else if (!hasUpdatedAt && !hasUpdated_at) {
      console.log('   ⚠️  Neither updatedAt nor updated_at exists. Adding updated_at...');
      try {
        await sequelize.query(`
          ALTER TABLE departments 
          ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
        `);
        console.log('   ✅ Added updated_at column');
      } catch (error) {
        console.log('   ❌ Could not add updated_at:', error.message);
      }
    } else if (hasUpdated_at) {
      console.log('   ✅ updated_at column exists');
    }

    // Final check
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'departments'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Final columns in departments table:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Departments table fix completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing departments table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

fixDepartmentsTable();







