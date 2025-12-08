import sequelize from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const fixMessagesTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if messages table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    if (!results[0].exists) {
      console.log('Messages table does not exist. It will be created on next sync.');
      process.exit(0);
    }

    console.log('Fixing messages table schema...');

    // Drop foreign key constraints if they exist
    try {
      await sequelize.query(`
        ALTER TABLE "messages" 
        DROP CONSTRAINT IF EXISTS "messages_senderId_fkey" CASCADE;
      `);
      console.log('Dropped messages_senderId_fkey constraint');
    } catch (err) {
      console.log('No messages_senderId_fkey constraint to drop');
    }

    try {
      await sequelize.query(`
        ALTER TABLE "messages" 
        DROP CONSTRAINT IF EXISTS "messages_receiverId_fkey" CASCADE;
      `);
      console.log('Dropped messages_receiverId_fkey constraint');
    } catch (err) {
      console.log('No messages_receiverId_fkey constraint to drop');
    }

    // Check current column types
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'messages' 
      AND column_name IN ('senderId', 'receiverId');
    `);

    console.log('Current column types:', columnInfo);

    // Convert TEXT to UUID if needed
    for (const col of columnInfo) {
      if (col.udt_name === 'text' || col.data_type === 'text') {
        console.log(`Converting ${col.column_name} from TEXT to UUID...`);
        
        // First, validate all existing values are valid UUIDs
        const quotedColName = `"${col.column_name}"`;
        const [invalidRows] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM "messages"
          WHERE ${quotedColName}::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        `);

        if (parseInt(invalidRows[0].count) > 0) {
          console.warn(`Warning: ${invalidRows[0].count} rows have invalid UUIDs in ${col.column_name}.`);
          console.warn('These rows will be deleted.');
          
          // Delete invalid rows
          await sequelize.query(`
            DELETE FROM "messages"
            WHERE ${quotedColName}::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
          `);
        }

        // Convert the column type to UUID
        await sequelize.query(`
          ALTER TABLE "messages" 
          ALTER COLUMN ${quotedColName} TYPE UUID 
          USING ${quotedColName}::UUID;
        `);
        console.log(`✓ Converted ${col.column_name} to UUID`);
      } else if (col.udt_name === 'uuid') {
        console.log(`✓ ${col.column_name} is already UUID type`);
      }
    }

    // Now add foreign key constraints
    try {
      await sequelize.query(`
        ALTER TABLE "messages"
        ADD CONSTRAINT "messages_senderId_fkey"
        FOREIGN KEY ("senderId") 
        REFERENCES "users" ("id") 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✓ Added messages_senderId_fkey constraint');
    } catch (err) {
      console.error('Error adding senderId foreign key:', err.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE "messages"
        ADD CONSTRAINT "messages_receiverId_fkey"
        FOREIGN KEY ("receiverId") 
        REFERENCES "users" ("id") 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✓ Added messages_receiverId_fkey constraint');
    } catch (err) {
      console.error('Error adding receiverId foreign key:', err.message);
    }

    console.log('✅ Messages table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing messages table:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

fixMessagesTable();



dotenv.config();

const fixMessagesTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if messages table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    if (!results[0].exists) {
      console.log('Messages table does not exist. It will be created on next sync.');
      process.exit(0);
    }

    console.log('Fixing messages table schema...');

    // Drop foreign key constraints if they exist
    try {
      await sequelize.query(`
        ALTER TABLE "messages" 
        DROP CONSTRAINT IF EXISTS "messages_senderId_fkey" CASCADE;
      `);
      console.log('Dropped messages_senderId_fkey constraint');
    } catch (err) {
      console.log('No messages_senderId_fkey constraint to drop');
    }

    try {
      await sequelize.query(`
        ALTER TABLE "messages" 
        DROP CONSTRAINT IF EXISTS "messages_receiverId_fkey" CASCADE;
      `);
      console.log('Dropped messages_receiverId_fkey constraint');
    } catch (err) {
      console.log('No messages_receiverId_fkey constraint to drop');
    }

    // Check current column types
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'messages' 
      AND column_name IN ('senderId', 'receiverId');
    `);

    console.log('Current column types:', columnInfo);

    // Convert TEXT to UUID if needed
    for (const col of columnInfo) {
      if (col.udt_name === 'text' || col.data_type === 'text') {
        console.log(`Converting ${col.column_name} from TEXT to UUID...`);
        
        // First, validate all existing values are valid UUIDs
        const quotedColName = `"${col.column_name}"`;
        const [invalidRows] = await sequelize.query(`
          SELECT COUNT(*) as count
          FROM "messages"
          WHERE ${quotedColName}::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        `);

        if (parseInt(invalidRows[0].count) > 0) {
          console.warn(`Warning: ${invalidRows[0].count} rows have invalid UUIDs in ${col.column_name}.`);
          console.warn('These rows will be deleted.');
          
          // Delete invalid rows
          await sequelize.query(`
            DELETE FROM "messages"
            WHERE ${quotedColName}::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
          `);
        }

        // Convert the column type to UUID
        await sequelize.query(`
          ALTER TABLE "messages" 
          ALTER COLUMN ${quotedColName} TYPE UUID 
          USING ${quotedColName}::UUID;
        `);
        console.log(`✓ Converted ${col.column_name} to UUID`);
      } else if (col.udt_name === 'uuid') {
        console.log(`✓ ${col.column_name} is already UUID type`);
      }
    }

    // Now add foreign key constraints
    try {
      await sequelize.query(`
        ALTER TABLE "messages"
        ADD CONSTRAINT "messages_senderId_fkey"
        FOREIGN KEY ("senderId") 
        REFERENCES "users" ("id") 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✓ Added messages_senderId_fkey constraint');
    } catch (err) {
      console.error('Error adding senderId foreign key:', err.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE "messages"
        ADD CONSTRAINT "messages_receiverId_fkey"
        FOREIGN KEY ("receiverId") 
        REFERENCES "users" ("id") 
        ON DELETE NO ACTION 
        ON UPDATE CASCADE;
      `);
      console.log('✓ Added messages_receiverId_fkey constraint');
    } catch (err) {
      console.error('Error adding receiverId foreign key:', err.message);
    }

    console.log('✅ Messages table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing messages table:', error);
    console.error('Error details:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
};

fixMessagesTable();





