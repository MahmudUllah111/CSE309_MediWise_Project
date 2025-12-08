import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixAdsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if ads table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ads'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Ads table does not exist yet. It will be created during sync.');
      process.exit(0);
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name.toLowerCase());
    console.log('Existing columns:', columnNames);

    // Add missing columns - all possible columns from the model
    const columnsToAdd = [
      { name: 'description', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "description" TEXT;', check: 'description' },
      { name: 'imageUrl', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;', check: 'imageurl' },
      { name: 'link', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "link" TEXT;', check: 'link' },
      { name: 'medicineName', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicineName" VARCHAR(500);', check: 'medicinename' },
      { name: 'indications', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "indications" VARCHAR(500);', check: 'indications' },
      { name: 'isNewMedicine', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "isNewMedicine" BOOLEAN DEFAULT false;', check: 'isnewmedicine' },
      { name: 'departmentId', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;', check: 'departmentid' },
      { name: 'targetAudience', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "targetAudience" VARCHAR(50) DEFAULT \'all\';', check: 'targetaudience' },
      { name: 'isActive', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;', check: 'isactive' },
      { name: 'startDate', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP;', check: 'startdate' },
      { name: 'endDate', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP;', check: 'enddate' },
      { name: 'clickCount', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER DEFAULT 0;', check: 'clickcount' },
      { name: 'createdAt', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'createdat' },
      { name: 'updatedAt', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'updatedat' },
    ].filter(col => !columnNames.includes(col.check));

    // Add columns
    for (const column of columnsToAdd) {
      try {
        await sequelize.query(column.sql);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        console.error(`⚠️  Error adding column ${column.name}:`, error.message);
      }
    }

    // Check if departmentId was added or exists, then add foreign key
    const hasDepartmentId = columnNames.includes('departmentid') || columnsToAdd.some(c => c.check === 'departmentid');

    // Add foreign key constraint for departmentId if it exists or was just added
    if (hasDepartmentId) {
      try {
        const [fkExists] = await sequelize.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'ads_departmentId_fkey'
            AND table_name = 'ads'
            AND table_schema = 'public'
          );
        `);

        if (!fkExists[0].exists) {
          await sequelize.query(`
            ALTER TABLE "ads"
            ADD CONSTRAINT "ads_departmentId_fkey"
            FOREIGN KEY ("departmentId")
            REFERENCES "departments" ("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;
          `);
          console.log('✅ Added foreign key constraint for departmentId');
        }
      } catch (fkError) {
        console.log('⚠️  Could not add foreign key constraint (may already exist or departments table missing):', fkError.message);
      }
    }

    console.log('✅ Ads table fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing ads table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
};

fixAdsTable();

