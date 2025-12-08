import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDoctorsUserId = async () => {
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

    // Check for userId columns
    const hasUserId = columnNames.includes('userId');
    const hasUser_id = columnNames.includes('user_id');

    console.log('\n🔧 Fixing userId column...\n');

    // The model uses userId (camelCase) but with underscored: true, Sequelize looks for user_id
    // We need to add explicit field mapping OR ensure user_id exists
    if (hasUserId && !hasUser_id) {
      console.log('   ⚠️  Found userId but need user_id. Renaming...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          RENAME COLUMN "userId" TO user_id;
        `);
        console.log('   ✅ Renamed userId to user_id');
      } catch (error) {
        console.log('   ⚠️  Could not rename userId:', error.message);
      }
    } else if (!hasUserId && !hasUser_id) {
      console.log('   ⚠️  Neither userId nor user_id exists. Adding user_id...');
      try {
        await sequelize.query(`
          ALTER TABLE doctors 
          ADD COLUMN user_id UUID;
        `);
        console.log('   ✅ Added user_id column');
      } catch (error) {
        console.log('   ❌ Could not add user_id:', error.message);
      }
    } else if (hasUser_id) {
      console.log('   ✅ user_id column exists');
    } else if (hasUserId) {
      console.log('   ⚠️  Only userId exists. Model needs field mapping or column rename.');
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

    console.log('\n✅ Doctors userId fix completed!');
    console.log('\n💡 If userId column exists, update Doctor model to add: field: "user_id"');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing doctors userId:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

fixDoctorsUserId();





