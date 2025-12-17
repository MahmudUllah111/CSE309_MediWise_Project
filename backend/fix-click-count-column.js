import sequelize from './config/database.js';

async function fixClickCountColumn() {
  try {
    console.log('🔧 Fixing click_count column in ads table...');
    
    // Check if ads table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ads'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('⚠️  Ads table does not exist yet');
      process.exit(0);
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public'
      AND column_name IN ('click_count', 'clickCount');
    `);

    const columnNames = columns.map(col => col.column_name);
    const hasClickCount = columnNames.includes('click_count') || columnNames.includes('clickCount');

    if (!hasClickCount) {
      console.log('⚠️  click_count column missing, adding it...');
      
      // Try snake_case first (preferred)
      try {
        await sequelize.query(`
          ALTER TABLE "ads" 
          ADD COLUMN "click_count" INTEGER DEFAULT 0 NOT NULL;
        `);
        console.log('✅ Added click_count column (snake_case)');
      } catch (error) {
        console.log('⚠️  Failed to add click_count, trying clickCount...');
        // Try camelCase as fallback
        try {
          await sequelize.query(`
            ALTER TABLE "ads" 
            ADD COLUMN "clickCount" INTEGER DEFAULT 0 NOT NULL;
          `);
          console.log('✅ Added clickCount column (camelCase)');
        } catch (fallbackError) {
          console.error('❌ Failed to add click_count/clickCount:', fallbackError.message);
          throw fallbackError;
        }
      }
    } else {
      console.log('✅ click_count column already exists');
      
      // Check if it has a default value
      const [columnInfo] = await sequelize.query(`
        SELECT column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'ads'
        AND table_schema = 'public'
        AND column_name IN ('click_count', 'clickCount');
      `);
      
      if (columnInfo.length > 0) {
        const col = columnInfo[0];
        if (!col.column_default) {
          console.log('⚠️  Setting default value for click_count...');
          const colName = columnNames.includes('click_count') ? 'click_count' : 'clickCount';
          await sequelize.query(`
            ALTER TABLE "ads" 
            ALTER COLUMN "${colName}" SET DEFAULT 0;
          `);
          console.log('✅ Set default value for click_count');
        }
        
        // Update existing NULL values to 0
        const colName = columnNames.includes('click_count') ? 'click_count' : 'clickCount';
        const [nullCount] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM "ads"
          WHERE "${colName}" IS NULL;
        `);
        
        if (nullCount[0]?.count > 0) {
          console.log(`⚠️  Found ${nullCount[0].count} rows with NULL click_count, updating...`);
          await sequelize.query(`
            UPDATE "ads"
            SET "${colName}" = 0
            WHERE "${colName}" IS NULL;
          `);
          console.log('✅ Updated NULL values to 0');
        }
      }
    }

    console.log('✅ click_count column fix completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing click_count column:', error);
    process.exit(1);
  }
}

fixClickCountColumn();






