import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixDoctorsTable = async () => {
  try {
    console.log('🔧 Fixing doctors table schema...');
    
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
      console.log('ℹ️  Doctors table does not exist. It will be created during sync.');
      await sequelize.sync({ alter: true });
      console.log('✅ Doctors table created.');
      process.exit(0);
    }

    // Check if userId column exists
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'doctors'
      AND table_schema = 'public'
      AND column_name IN ('userId', 'user_id', 'userid');
    `);

    const userIdColumn = columnInfo.find(col => 
      col.column_name.toLowerCase() === 'userid' || 
      col.column_name === 'userId' || 
      col.column_name === 'user_id'
    );

    if (!userIdColumn) {
      console.log('⚠️  userId column does not exist. Adding it...');
      
      // Check if users table exists first
      const [usersTableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);

      if (!usersTableExists[0].exists) {
        console.error('❌ Users table does not exist. Cannot add userId foreign key.');
        process.exit(1);
      }

      // Add userId column
      try {
        await sequelize.query(`
          ALTER TABLE "doctors"
          ADD COLUMN "userId" UUID;
        `);
        console.log('✅ Added userId column (nullable for now).');

        // Check for any existing data and set userId if possible
        const [doctorsWithoutUserId] = await sequelize.query(`
          SELECT id FROM "doctors" WHERE "userId" IS NULL LIMIT 1;
        `);

        if (doctorsWithoutUserId.length > 0) {
          console.log('⚠️  Found doctors without userId. You may need to update them manually.');
        }

        // Try to add NOT NULL constraint (will fail if there are NULL values, which is OK)
        try {
          await sequelize.query(`
            ALTER TABLE "doctors"
            ALTER COLUMN "userId" SET NOT NULL;
          `);
          console.log('✅ Set userId to NOT NULL.');
        } catch (err) {
          console.log('⚠️  Could not set NOT NULL (there may be existing NULL values).');
        }

        // Add foreign key constraint
        try {
          await sequelize.query(`
            ALTER TABLE "doctors"
            ADD CONSTRAINT "doctors_userId_fkey"
            FOREIGN KEY ("userId")
            REFERENCES "users" ("id")
            ON DELETE NO ACTION
            ON UPDATE CASCADE;
          `);
          console.log('✅ Added foreign key constraint.');
        } catch (err) {
          console.log('⚠️  Could not add foreign key constraint:', err.message);
        }

        // Add unique constraint
        try {
          await sequelize.query(`
            ALTER TABLE "doctors"
            ADD CONSTRAINT "doctors_userId_unique" UNIQUE ("userId");
          `);
          console.log('✅ Added unique constraint on userId.');
        } catch (err) {
          console.log('⚠️  Could not add unique constraint:', err.message);
        }

      } catch (err) {
        console.error('❌ Error adding userId column:', err.message);
        throw err;
      }
    } else {
      console.log(`✅ userId column already exists (as "${userIdColumn.column_name}").`);
      
      // Check if it needs to be renamed
      if (userIdColumn.column_name !== 'userId') {
        console.log(`⚠️  Column is named "${userIdColumn.column_name}" instead of "userId".`);
        console.log('   Sequelize expects "userId", but this should still work.');
      }
    }

    // Now sync all models to ensure everything is up to date
    console.log('\n🔄 Syncing all database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    console.log('\n✅ Doctors table schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing doctors table:', error.message);
    if (error.original) {
      console.error('❌ Original error:', error.original.message);
    }
    process.exit(1);
  }
};

fixDoctorsTable();

