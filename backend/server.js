import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import models from './models/index.js';

import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import adRoutes from './routes/adRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from './routes/userRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import jobApplicationRoutes from './routes/jobApplicationRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

// Verify critical environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set in .env file!');
  console.warn('⚠️  Using default JWT_SECRET for development. Please set JWT_SECRET in .env for production!');
  process.env.JWT_SECRET = 'mediwise_dev_secret_key_change_in_production_2024';
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payments', paymentRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ message: 'MediWise API is running' });
});

// Fix blogs table columns before syncing
const fixBlogsTable = async () => {
  try {
    // Check if blogs table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blogs'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('ℹ️  Blogs table does not exist yet, will be created during sync');
      return;
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'blogs'
      AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name.toLowerCase());

    // Add missing columns
    const columnsToAdd = [
      { name: 'createdAt', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'createdat' },
      { name: 'updatedAt', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'updatedat' },
      { name: 'views', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;', check: 'views' },
      { name: 'comments', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "comments" INTEGER DEFAULT 0;', check: 'comments' },
      { name: 'status', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT \'pending\';', check: 'status' },
      { name: 'approvedBy', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "approvedBy" UUID;', check: 'approvedby' },
      { name: 'approvedAt', sql: 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;', check: 'approvedat' },
    ];

    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.check)) {
        try {
          await sequelize.query(column.sql);
          console.log(`✅ Added ${column.name} column to blogs table`);
        } catch (error) {
          console.log(`⚠️  Could not add ${column.name} column:`, error.message);
        }
      }
    }

    // Fix NOT NULL constraints for optional columns
    const nullableColumns = ['excerpt', 'category', 'image', 'tags', 'approvedBy', 'approvedAt'];
    for (const colName of nullableColumns) {
      if (columnNames.includes(colName.toLowerCase())) {
        try {
          const [colInfo] = await sequelize.query(`
            SELECT is_nullable
            FROM information_schema.columns
            WHERE table_name = 'blogs'
            AND table_schema = 'public'
            AND column_name = '${colName}';
          `);
          
          if (colInfo.length > 0 && colInfo[0].is_nullable === 'NO') {
            await sequelize.query(`ALTER TABLE "blogs" ALTER COLUMN "${colName}" DROP NOT NULL;`);
            console.log(`✅ Made ${colName} column nullable in blogs table`);
          }
        } catch (error) {
          console.log(`⚠️  Could not modify ${colName} column:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('⚠️  Error fixing blogs table:', error.message);
    // Don't throw - continue with sync anyway
  }
};

// Fix messages table before syncing
const fixMessagesTable = async () => {
  try {
    // Check if messages table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('ℹ️  Messages table does not exist yet, will be created during sync');
      return;
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
      AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name.toLowerCase());

    // Add missing columns (skip id as it's the primary key and should be created by Sequelize)
    const columnsToAdd = [
      { name: 'senderId', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "senderId" UUID;', check: 'senderid' },
      { name: 'receiverId', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receiverId" UUID;', check: 'receiverid' },
      { name: 'content', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "content" TEXT;', check: 'content' },
      { name: 'isRead', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false;', check: 'isread' },
      { name: 'readAt', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP;', check: 'readat' },
      { name: 'createdAt', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'createdat' },
      { name: 'updatedAt', sql: 'ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', check: 'updatedat' },
    ];

    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.check)) {
        try {
          await sequelize.query(column.sql);
          console.log(`✅ Added ${column.name} column to messages table`);
        } catch (error) {
          console.log(`⚠️  Could not add ${column.name} column:`, error.message);
        }
      }
    }

    // Add foreign key constraints if they don't exist
    try {
      const [fkExists1] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'messages_senderId_fkey'
          AND table_name = 'messages'
          AND table_schema = 'public'
        );
      `);

      if (!fkExists1[0].exists && columnNames.includes('senderid')) {
        await sequelize.query(`
          ALTER TABLE "messages"
          ADD CONSTRAINT "messages_senderId_fkey"
          FOREIGN KEY ("senderId")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        `);
        console.log('✅ Added foreign key constraint for senderId');
      }
    } catch (fkError) {
      console.log('⚠️  Could not add senderId foreign key constraint:', fkError.message);
    }

    try {
      const [fkExists2] = await sequelize.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'messages_receiverId_fkey'
          AND table_name = 'messages'
          AND table_schema = 'public'
        );
      `);

      if (!fkExists2[0].exists && columnNames.includes('receiverid')) {
        await sequelize.query(`
          ALTER TABLE "messages"
          ADD CONSTRAINT "messages_receiverId_fkey"
          FOREIGN KEY ("receiverId")
          REFERENCES "users" ("id")
          ON DELETE CASCADE
          ON UPDATE CASCADE;
        `);
        console.log('✅ Added foreign key constraint for receiverId');
      }
    } catch (fkError) {
      console.log('⚠️  Could not add receiverId foreign key constraint:', fkError.message);
    }
  } catch (error) {
    console.error('⚠️  Error fixing messages table:', error.message);
    // Don't throw - continue with sync anyway
  }
};

// Fix ads table columns before syncing
const fixAdsTable = async () => {
  try {
    // Check if ads table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ads'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('ℹ️  Ads table does not exist yet, will be created during sync');
      return;
    }

    // Check existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name.toLowerCase());

    // Add missing columns - check all possible column names
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
    ];

    for (const column of columnsToAdd) {
      if (!columnNames.includes(column.check)) {
        try {
          await sequelize.query(column.sql);
          console.log(`✅ Added ${column.name} column to ads table`);
        } catch (error) {
          console.log(`⚠️  Could not add ${column.name} column:`, error.message);
        }
      }
    }

    // Fix slot column if it exists and is NOT NULL - make it nullable
    if (columnNames.includes('slot')) {
      try {
        const [slotInfo] = await sequelize.query(`
          SELECT is_nullable
          FROM information_schema.columns
          WHERE table_name = 'ads'
          AND table_schema = 'public'
          AND column_name = 'slot';
        `);
        
        if (slotInfo.length > 0 && slotInfo[0].is_nullable === 'NO') {
          await sequelize.query('ALTER TABLE "ads" ALTER COLUMN "slot" DROP NOT NULL;');
          console.log('✅ Made slot column nullable in ads table');
        }
      } catch (error) {
        console.log('⚠️  Could not modify slot column:', error.message);
      }
    }

    // Fix image_url column if it exists and is NOT NULL - make it nullable
    if (columnNames.includes('image_url')) {
      try {
        const [imageUrlInfo] = await sequelize.query(`
          SELECT is_nullable
          FROM information_schema.columns
          WHERE table_name = 'ads'
          AND table_schema = 'public'
          AND column_name = 'image_url';
        `);
        
        if (imageUrlInfo.length > 0 && imageUrlInfo[0].is_nullable === 'NO') {
          await sequelize.query('ALTER TABLE "ads" ALTER COLUMN "image_url" DROP NOT NULL;');
          console.log('✅ Made image_url column nullable in ads table');
        }
      } catch (error) {
        console.log('⚠️  Could not modify image_url column:', error.message);
      }
    }

    // Add foreign key constraint for departmentId if it exists or was just added
    if (columnNames.includes('departmentid') || columnsToAdd.find(c => c.check === 'departmentid')) {
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
  } catch (error) {
    console.error('⚠️  Error fixing ads table:', error.message);
    // Don't throw - continue with sync anyway
  }
};

// Fix database constraints before syncing
const fixDatabaseConstraints = async () => {
  try {
    // Check if doctors table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'doctors'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('ℹ️  Doctors table does not exist yet, will be created during sync');
      return;
    }

    // Check if userId column exists
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type
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
      console.log('⚠️  userId column does not exist in doctors table, adding it...');
      
      // Check if users table exists first
      const [usersTableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);

      if (!usersTableExists[0].exists) {
        console.log('⚠️  Users table does not exist yet, will be created during sync');
        return;
      }

      // Add userId column
      try {
        await sequelize.query(`
          ALTER TABLE "doctors"
          ADD COLUMN "userId" UUID;
        `);
        console.log('✅ Added userId column to doctors table.');

        // Try to add foreign key constraint
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
        } catch (fkError) {
          console.log('⚠️  Could not add foreign key constraint (may already exist):', fkError.message);
        }

        // Try to add unique constraint
        try {
          await sequelize.query(`
            ALTER TABLE "doctors"
            ADD CONSTRAINT "doctors_userId_unique" UNIQUE ("userId");
          `);
          console.log('✅ Added unique constraint on userId.');
        } catch (uniqueError) {
          console.log('⚠️  Could not add unique constraint (may already exist):', uniqueError.message);
        }
      } catch (addColumnError) {
        console.error('⚠️  Error adding userId column:', addColumnError.message);
        // Continue anyway - sync might handle it
      }
      return;
    }

    const columnName = userIdColumn.column_name; // Use actual column name from database

    // Check for duplicate userId values
    try {
      const [duplicates] = await sequelize.query(`
        SELECT "${columnName}", COUNT(*) as count
        FROM "doctors"
        WHERE "${columnName}" IS NOT NULL
        GROUP BY "${columnName}"
        HAVING COUNT(*) > 1;
      `);

      if (duplicates.length > 0) {
        console.log('⚠️  Found duplicate userId values in doctors table, fixing...');
        // Keep only the first record for each userId, delete the rest
        for (const dup of duplicates) {
          const userIdValue = dup[columnName];
          const [records] = await sequelize.query(`
            SELECT id FROM "doctors"
            WHERE "${columnName}" = $1
            ORDER BY "createdAt" ASC;
          `, {
            bind: [userIdValue]
          });

          // Delete all except the first one
          if (records.length > 1) {
            const idsToDelete = records.slice(1).map(r => r.id);
            await sequelize.query(`
              DELETE FROM "doctors"
              WHERE id = ANY($1::uuid[]);
            `, {
              bind: [idsToDelete]
            });
            console.log(`✓ Removed ${idsToDelete.length} duplicate doctor records for ${columnName}: ${userIdValue}`);
          }
        }
      }
    } catch (dupError) {
      console.log('⚠️  Could not check for duplicates:', dupError.message);
    }

    // Check for NULL userId values
    try {
      const [nullUsers] = await sequelize.query(`
        SELECT id FROM "doctors"
        WHERE "${columnName}" IS NULL;
      `);

      if (nullUsers.length > 0) {
        console.log(`⚠️  Found ${nullUsers.length} doctors with NULL ${columnName}, removing...`);
        await sequelize.query(`
          DELETE FROM "doctors"
          WHERE "${columnName}" IS NULL;
        `);
        console.log(`✓ Removed doctors with NULL ${columnName}`);
      }
    } catch (nullError) {
      console.log('⚠️  Could not check for NULL values:', nullError.message);
    }

    // Try to set NOT NULL constraint if column is nullable
    if (userIdColumn.is_nullable === 'YES') {
      try {
        const [nullCount] = await sequelize.query(`
          SELECT COUNT(*) as count FROM "doctors" WHERE "${columnName}" IS NULL;
        `);
        
        if (parseInt(nullCount[0].count) === 0) {
          await sequelize.query(`
            ALTER TABLE "doctors"
            ALTER COLUMN "${columnName}" SET NOT NULL;
          `);
          console.log(`✓ Set ${columnName} to NOT NULL`);
        }
      } catch (err) {
        console.log(`⚠️  Could not set ${columnName} to NOT NULL:`, err.message);
      }
    }
  } catch (error) {
    console.error('⚠️  Error fixing database constraints:', error.message);
    // Don't throw - continue with sync anyway
  }
};

const syncDatabase = async () => {
  let retries = 5;
  let delay = 2000; // Start with 2 seconds delay

  while (retries > 0) {
    try {
      console.log(`Attempting to connect to database... (${6 - retries}/5)`);
      await sequelize.authenticate();
      console.log('✅ Database connection established successfully.');

      // Sync all models - this will create/update tables to match models
      const forceSync = process.env.FORCE_SYNC === 'true';
      
      if (forceSync) {
        console.log('⚠️  Force syncing database (dropping and recreating tables)...');
        await sequelize.sync({ force: true });
      } else {
        try {
          // First, fix any data issues before syncing
          await fixDatabaseConstraints();
          await fixAdsTable();
          await fixBlogsTable();
          await fixMessagesTable();
          
          // Then sync with alter
          await sequelize.sync({ alter: true });
        } catch (syncError) {
          console.error('⚠️  Error during database sync:', syncError.message);
          if (syncError.original) {
            console.error('⚠️  Original error:', syncError.original.message);
          }
          
          // If sync fails, try to continue anyway - tables might already be correct
          console.log('⚠️  Continuing with existing database structure...');
        }
      }
      console.log('✅ Database models synchronized.');

      // Create default admin user
      const adminUser = await models.User.findOne({ where: { email: 'admin@mediwise.com' } });
      if (!adminUser) {
        await models.User.create({
          name: 'Admin User',
          email: 'admin@mediwise.com',
          password: 'admin123',
          role: 'admin',
          phone: '+1234567890',
        });
        console.log('✅ Default admin user created: admin@mediwise.com / admin123');
      } else {
        // Update admin password if it's not properly hashed
        if (!adminUser.password || !adminUser.password.startsWith('$2')) {
          console.log('⚠️  Admin password needs to be rehashed, updating...');
          adminUser.password = 'admin123';
          await adminUser.save();
          console.log('✅ Admin password updated');
        }
        console.log('ℹ️  Admin user already exists: admin@mediwise.com');
      }

      // Create default departments
      const departments = await models.Department.findAll();
      if (departments.length === 0) {
        await models.Department.bulkCreate([
          { name: 'Cardiology', description: 'Heart and cardiovascular system', icon: '❤️' },
          { name: 'Neurology', description: 'Brain and nervous system', icon: '🧠' },
          { name: 'Orthopedics', description: 'Bones and joints', icon: '🦴' },
          { name: 'Pediatrics', description: 'Children health care', icon: '👶' },
          { name: 'Dermatology', description: 'Skin conditions', icon: '🧴' },
          { name: 'General Medicine', description: 'General health care', icon: '🩺' },
        ]);
        console.log('✅ Default departments created.');
      }
      
      // Success - break out of retry loop
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ Unable to connect to the database after 5 attempts');
        console.error('❌ Error:', error.message);
        if (error.original) {
          console.error('❌ Original error:', error.original.message);
        }
        console.error('\n⚠️  Please check:');
        console.error('   1. PostgreSQL is installed and running');
        console.error('   2. Database credentials in .env file are correct');
        console.error('   3. Database "' + (process.env.DB_NAME || 'mediwise') + '" exists');
        console.error('   4. PostgreSQL is listening on port ' + (process.env.DB_PORT || 5432));
        console.error('\n💡 To create the database, run:');
        console.error('   psql -U postgres -c "CREATE DATABASE ' + (process.env.DB_NAME || 'mediwise') + ';"');
        console.error('\n⚠️  Server will continue running, but database features may not work.');
      } else {
        console.error(`❌ Database connection failed. Retrying in ${delay/1000} seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  syncDatabase();
});

export default app;

