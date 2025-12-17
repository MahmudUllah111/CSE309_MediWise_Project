import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixUsersTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if users table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Users table does not exist yet. It will be created during sync.');
      process.exit(0);
    }

    // Get current columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    const columnNames = columns.map(col => col.column_name);
    const columnNamesLower = columnNames.map(name => name.toLowerCase());
    
    console.log('\n📋 Current columns in users table:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Check for timestamp columns
    const hasCreatedAt = columnNames.includes('createdAt');
    const hasCreated_at = columnNames.includes('created_at') || columnNamesLower.includes('created_at');
    const hasUpdatedAt = columnNames.includes('updatedAt');
    const hasUpdated_at = columnNames.includes('updated_at') || columnNamesLower.includes('updated_at');

    console.log('\n🔧 Fixing timestamp columns...\n');

    // Handle createdAt -> created_at
    if (hasCreatedAt && !hasCreated_at) {
      console.log('   ⚠️  Found createdAt but need created_at. Renaming...');
      try {
        await sequelize.query(`
          ALTER TABLE users 
          RENAME COLUMN "createdAt" TO created_at;
        `);
        console.log('   ✅ Renamed createdAt to created_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename createdAt:', error.message);
        // Try to add created_at if rename fails
        try {
          await sequelize.query(`
            ALTER TABLE users 
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
          ALTER TABLE users 
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
          ALTER TABLE users 
          RENAME COLUMN "updatedAt" TO updated_at;
        `);
        console.log('   ✅ Renamed updatedAt to updated_at');
      } catch (error) {
        console.log('   ⚠️  Could not rename updatedAt:', error.message);
        // Try to add updated_at if rename fails
        try {
          await sequelize.query(`
            ALTER TABLE users 
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
          ALTER TABLE users 
          ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
        `);
        console.log('   ✅ Added updated_at column');
      } catch (error) {
        console.log('   ❌ Could not add updated_at:', error.message);
      }
    } else if (hasUpdated_at) {
      console.log('   ✅ updated_at column exists');
    }

    // If both exist, migrate data and remove camelCase
    if (hasCreatedAt && hasCreated_at) {
      console.log('   ⚠️  Both createdAt and created_at exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE users 
          SET created_at = "createdAt" 
          WHERE created_at IS NULL AND "createdAt" IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from createdAt to created_at');
      } catch (error) {
        console.log('   ⚠️  Could not migrate createdAt data:', error.message);
      }
    }

    if (hasUpdatedAt && hasUpdated_at) {
      console.log('   ⚠️  Both updatedAt and updated_at exist. Migrating data...');
      try {
        await sequelize.query(`
          UPDATE users 
          SET updated_at = "updatedAt" 
          WHERE updated_at IS NULL AND "updatedAt" IS NOT NULL;
        `);
        console.log('   ✅ Migrated data from updatedAt to updated_at');
      } catch (error) {
        console.log('   ⚠️  Could not migrate updatedAt data:', error.message);
      }
    }

    // Final check
    const [finalColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Final columns in users table:');
    finalColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    console.log('\n✅ Users table fix completed!');
    console.log('\n💡 The users table now uses SNAKE_CASE for timestamp columns.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing users table:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

fixUsersTable();







