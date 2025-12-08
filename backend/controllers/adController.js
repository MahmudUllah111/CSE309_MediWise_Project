import { Op } from 'sequelize';
import Ad from '../models/Ad.js';
import Department from '../models/Department.js';
import Doctor from '../models/Doctor.js';
import sequelize from '../config/database.js';

// Helper function to ensure all required columns exist in ads table
const ensureAdsTableColumns = async () => {
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
      return; // Table doesn't exist yet, will be created during sync
    }

    // Get existing columns
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public';
    `);

    const columnNames = columns.map(col => col.column_name.toLowerCase());
    const actualColumnNames = columns.map(col => col.column_name);

    // Check if database uses camelCase or snake_case
    const hasCamelCaseTargetAudience = actualColumnNames.includes('targetAudience');
    const hasSnakeCaseTargetAudience = actualColumnNames.includes('target_audience');
    const hasCamelCaseIsActive = actualColumnNames.includes('isActive');
    const hasSnakeCaseIsActive = actualColumnNames.includes('is_active');
    const hasCamelCaseStartDate = actualColumnNames.includes('startDate');
    const hasSnakeCaseStartDate = actualColumnNames.includes('start_date');
    const hasCamelCaseEndDate = actualColumnNames.includes('endDate');
    const hasSnakeCaseEndDate = actualColumnNames.includes('end_date');
    
    // Determine which column name to use/create
    const targetAudienceColName = hasCamelCaseTargetAudience ? 'targetAudience' : 'target_audience';
    const isActiveColName = hasCamelCaseIsActive ? 'isActive' : 'is_active';
    const startDateColName = hasCamelCaseStartDate ? 'startDate' : 'start_date';
    const endDateColName = hasCamelCaseEndDate ? 'endDate' : 'end_date';
    
    // Check for other camelCase columns
    const hasCamelCaseImageUrl = actualColumnNames.includes('imageUrl');
    const hasSnakeCaseImageUrl = actualColumnNames.includes('image_url');
    const hasCamelCaseMedicineName = actualColumnNames.includes('medicineName');
    const hasSnakeCaseMedicineName = actualColumnNames.includes('medicine_name');
    const hasCamelCaseIsNewMedicine = actualColumnNames.includes('isNewMedicine');
    const hasSnakeCaseIsNewMedicine = actualColumnNames.includes('is_new_medicine');
    const hasCamelCaseDepartmentId = actualColumnNames.includes('departmentId');
    const hasSnakeCaseDepartmentId = actualColumnNames.includes('department_id');
    const hasCamelCaseClickCount = actualColumnNames.includes('clickCount');
    const hasSnakeCaseClickCount = actualColumnNames.includes('click_count');
    
    const imageUrlColName = hasCamelCaseImageUrl ? 'imageUrl' : 'image_url';
    const medicineNameColName = hasCamelCaseMedicineName ? 'medicineName' : 'medicine_name';
    const isNewMedicineColName = hasCamelCaseIsNewMedicine ? 'isNewMedicine' : 'is_new_medicine';
    const departmentIdColName = hasCamelCaseDepartmentId ? 'departmentId' : 'department_id';
    const clickCountColName = hasCamelCaseClickCount ? 'clickCount' : 'click_count';
    
    console.log('🔍 Ads table column naming:', hasCamelCaseTargetAudience ? 'camelCase' : 'snake_case');
    console.log('Using columns:', { 
      targetAudienceColName, 
      isActiveColName, 
      startDateColName, 
      endDateColName,
      imageUrlColName,
      medicineNameColName,
      isNewMedicineColName,
      departmentIdColName,
      clickCountColName
    });

    // Define all required columns
    const requiredColumns = [
      { name: 'description', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "description" TEXT;', check: 'description' },
      { 
        name: 'imageUrl', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${imageUrlColName}" TEXT;`, 
        check: 'imageurl',
        checkSnake: 'image_url'
      },
      { name: 'link', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "link" TEXT;', check: 'link' },
      { 
        name: 'medicineName', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${medicineNameColName}" VARCHAR(500);`, 
        check: 'medicinename',
        checkSnake: 'medicine_name'
      },
      { name: 'indications', sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "indications" VARCHAR(500);', check: 'indications' },
      { 
        name: 'isNewMedicine', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${isNewMedicineColName}" BOOLEAN DEFAULT false;`, 
        check: 'isnewmedicine',
        checkSnake: 'is_new_medicine'
      },
      { 
        name: 'departmentId', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${departmentIdColName}" UUID;`, 
        check: 'departmentid',
        checkSnake: 'department_id'
      },
      { 
        name: 'targetAudience', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${targetAudienceColName}" VARCHAR(50) DEFAULT 'all';`, 
        check: 'targetaudience',
        checkSnake: 'target_audience'
      },
      { 
        name: 'isActive', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${isActiveColName}" BOOLEAN DEFAULT true;`, 
        check: 'isactive',
        checkSnake: 'is_active'
      },
      { 
        name: 'startDate', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${startDateColName}" TIMESTAMP;`, 
        check: 'startdate',
        checkSnake: 'start_date'
      },
      { 
        name: 'endDate', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${endDateColName}" TIMESTAMP;`, 
        check: 'enddate',
        checkSnake: 'end_date'
      },
      { 
        name: 'clickCount', 
        sql: `ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "${clickCountColName}" INTEGER DEFAULT 0;`, 
        check: 'clickcount',
        checkSnake: 'click_count'
      },
      { 
        name: 'createdAt', 
        sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', 
        check: 'createdat',
        checkSnake: 'created_at'
      },
      { 
        name: 'updatedAt', 
        sql: 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;', 
        check: 'updatedat',
        checkSnake: 'updated_at'
      },
    ];

    // Add missing columns
    for (const column of requiredColumns) {
      // For columns with checkSnake, check both camelCase and snake_case
      const columnExists = column.checkSnake 
        ? (columnNames.includes(column.check) || columnNames.includes(column.checkSnake))
        : columnNames.includes(column.check);
      
      if (!columnExists) {
        try {
          await sequelize.query(column.sql);
          console.log(`✅ Added missing column: ${column.name} to ads table`);
        } catch (error) {
          console.log(`⚠️  Could not add ${column.name} column:`, error.message);
          // If targetAudience fails with camelCase, try snake_case
          if (column.name === 'targetAudience' && !hasSnakeCaseTargetAudience) {
            try {
              await sequelize.query(`ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "target_audience" VARCHAR(50) DEFAULT 'all';`);
              console.log(`✅ Added target_audience column (snake_case) to ads table`);
            } catch (snakeError) {
              console.log(`⚠️  Could not add target_audience column:`, snakeError.message);
            }
          }
          // If isActive fails with camelCase, try snake_case
          else if (column.name === 'isActive' && !hasSnakeCaseIsActive) {
            try {
              await sequelize.query(`ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;`);
              console.log(`✅ Added is_active column (snake_case) to ads table`);
            } catch (snakeError) {
              console.log(`⚠️  Could not add is_active column:`, snakeError.message);
            }
          }
          // If clickCount fails with camelCase, try snake_case
          else if (column.name === 'clickCount' && !hasSnakeCaseClickCount) {
            try {
              await sequelize.query(`ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0;`);
              console.log(`✅ Added click_count column (snake_case) to ads table`);
            } catch (snakeError) {
              console.log(`⚠️  Could not add click_count column:`, snakeError.message);
            }
          }
          // If startDate fails with camelCase, try snake_case
          else if (column.name === 'startDate' && !hasSnakeCaseStartDate) {
            try {
              await sequelize.query(`ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;`);
              console.log(`✅ Added start_date column (snake_case) to ads table`);
            } catch (snakeError) {
              console.log(`⚠️  Could not add start_date column:`, snakeError.message);
            }
          }
          // If endDate fails with camelCase, try snake_case
          else if (column.name === 'endDate' && !hasSnakeCaseEndDate) {
            try {
              await sequelize.query(`ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;`);
              console.log(`✅ Added end_date column (snake_case) to ads table`);
            } catch (snakeError) {
              console.log(`⚠️  Could not add end_date column:`, snakeError.message);
            }
          }
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
  } catch (error) {
    console.error('⚠️  Error ensuring ads table columns:', error.message);
    // Don't throw - continue anyway
  }
};

export const getAds = async (req, res) => {
  // Ensure all columns exist before querying
  await ensureAdsTableColumns();
  
  try {
    const { cursor, limit = 10, targetAudience, departmentId, isNewMedicine, includeInactive } = req.query;
    
    // Check if user is admin and wants to see all ads (including inactive)
    const isAdmin = req.user && req.user.role === 'admin';
    const showAll = includeInactive === 'true' || isAdmin;
    
    // If doctor is logged in, get their department automatically
    let doctorDepartmentId = null;
    if (req.user && req.user.role === 'doctor' && !departmentId) {
      try {
        const doctor = await Doctor.findOne({ 
          where: { userId: req.user.id },
          attributes: ['departmentId']
        });
        if (doctor && doctor.departmentId) {
          doctorDepartmentId = doctor.departmentId;
        }
      } catch (doctorError) {
        console.error('Error fetching doctor department:', doctorError);
        // Continue without department filter if error
      }
    }

    // Build where conditions properly
    const whereConditions = {
      [Op.and]: [],
    };

    // Only filter by targetAudience if not admin or if targetAudience is specified
    if (!isAdmin && targetAudience) {
      whereConditions[Op.and].push({
        [Op.or]: [
          { targetAudience: 'all' },
          { targetAudience: targetAudience },
        ],
      });
    } else if (!isAdmin) {
      // For non-admin, default to all target audiences
      whereConditions[Op.and].push({
        [Op.or]: [
          { targetAudience: 'all' },
          { targetAudience: 'doctor' },
          { targetAudience: 'patient' },
        ],
      });
    }

    // Only filter by isActive if not showing all ads
    if (!showAll) {
      whereConditions[Op.and].push({
        isActive: true,
      });
    }

    // Filter by department if provided or if doctor has a department
    // If doctor has a department, show ads for their department OR general ads (no department)
    // If admin explicitly provides departmentId, filter by that
    const finalDepartmentId = departmentId || doctorDepartmentId;
    if (finalDepartmentId) {
      // Show ads for this specific department OR general ads (departmentId = null)
      whereConditions[Op.and].push({
        [Op.or]: [
          { departmentId: finalDepartmentId },
          { departmentId: null }, // Include ads with no specific department (general ads)
        ],
      });
    } else if (doctorDepartmentId === null && req.user && req.user.role === 'doctor') {
      // Doctor has no department, show only general ads
      whereConditions[Op.and].push({
        departmentId: null,
      });
    }

    // Filter by medicine type (new or old)
    if (isNewMedicine !== undefined) {
      whereConditions[Op.and].push({
        isNewMedicine: isNewMedicine === 'true',
      });
    }

    // Add cursor filter if provided
    if (cursor) {
      whereConditions[Op.and].push({
        id: {
          [Op.lt]: cursor,
        },
      });
    }

    const queryOptions = {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
      ],
      limit: Math.min((parseInt(limit) || 1000) + 1, 10001), // Cap at 10000
      order: [['createdAt', 'DESC']],
    };

    // Only add where clause if there are conditions
    if (whereConditions[Op.and].length > 0) {
      queryOptions.where = whereConditions;
    }

    const ads = await Ad.findAll(queryOptions);

    const limitNum = parseInt(limit) || 1000;
    const hasMore = ads.length > limitNum;
    const resultAds = hasMore ? ads.slice(0, limitNum) : ads;
    const nextCursor = hasMore ? resultAds[resultAds.length - 1]?.id : null;

    res.json({
      success: true,
      ads: resultAds || [],
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Return empty array instead of 500 error for better UX
    // Frontend will handle this gracefully with default ads
    res.status(200).json({ 
      success: true,
      ads: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const createAd = async (req, res) => {
  // Ensure all columns exist before creating
  await ensureAdsTableColumns();
  
  try {
    // Proactively check and create missing columns if needed
    const [columnCheck] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public'
      AND column_name IN ('click_count', 'clickCount', 'department_id', 'departmentId', 'target_audience', 'targetAudience', 'is_active', 'isActive', 'start_date', 'startDate', 'end_date', 'endDate', 'medicine_name', 'medicineName', 'is_new_medicine', 'isNewMedicine', 'image_url', 'imageUrl');
    `);
    
    const existingColumns = columnCheck.map(col => col.column_name);
    const hasClickCount = existingColumns.some(col => col === 'click_count' || col === 'clickCount');
    const hasDepartmentId = existingColumns.some(col => col === 'department_id' || col === 'departmentId');
    const hasTargetAudience = existingColumns.some(col => col === 'target_audience' || col === 'targetAudience');
    const hasIsActive = existingColumns.some(col => col === 'is_active' || col === 'isActive');
    const hasStartDate = existingColumns.some(col => col === 'start_date' || col === 'startDate');
    const hasEndDate = existingColumns.some(col => col === 'end_date' || col === 'endDate');
    const hasMedicineName = existingColumns.some(col => col === 'medicine_name' || col === 'medicineName');
    const hasIsNewMedicine = existingColumns.some(col => col === 'is_new_medicine' || col === 'isNewMedicine');
    const hasImageUrl = existingColumns.some(col => col === 'image_url' || col === 'imageUrl');
    
    // Create missing columns proactively
    if (!hasClickCount) {
      console.log('⚠️  click_count column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;');
        console.log('✅ Created click_count column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER DEFAULT 0 NOT NULL;');
          console.log('✅ Created clickCount column');
        } catch (fallbackError) {
          console.error('❌ Failed to create click_count/clickCount column:', fallbackError.message);
        }
      }
    }
    
    if (!hasDepartmentId) {
      console.log('⚠️  department_id column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
        console.log('✅ Created department_id column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;');
          console.log('✅ Created departmentId column');
        } catch (fallbackError) {
          console.error('❌ Failed to create department_id/departmentId column:', fallbackError.message);
        }
      }
    }
    
    if (!hasTargetAudience) {
      console.log('⚠️  target_audience column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "target_audience" VARCHAR(50) DEFAULT \'all\';');
        console.log('✅ Created target_audience column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "targetAudience" VARCHAR(50) DEFAULT \'all\';');
          console.log('✅ Created targetAudience column');
        } catch (fallbackError) {
          console.error('❌ Failed to create target_audience/targetAudience column:', fallbackError.message);
        }
      }
    }
    
    if (!hasIsActive) {
      console.log('⚠️  is_active column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;');
        console.log('✅ Created is_active column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
          console.log('✅ Created isActive column');
        } catch (fallbackError) {
          console.error('❌ Failed to create is_active/isActive column:', fallbackError.message);
        }
      }
    }
    
    if (!hasStartDate) {
      console.log('⚠️  start_date column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;');
        console.log('✅ Created start_date column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP;');
          console.log('✅ Created startDate column');
        } catch (fallbackError) {
          console.error('❌ Failed to create start_date/startDate column:', fallbackError.message);
        }
      }
    }
    
    if (!hasEndDate) {
      console.log('⚠️  end_date column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;');
        console.log('✅ Created end_date column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP;');
          console.log('✅ Created endDate column');
        } catch (fallbackError) {
          console.error('❌ Failed to create end_date/endDate column:', fallbackError.message);
        }
      }
    }
    
    if (!hasMedicineName) {
      console.log('⚠️  medicine_name column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicine_name" VARCHAR(500);');
        console.log('✅ Created medicine_name column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicineName" VARCHAR(500);');
          console.log('✅ Created medicineName column');
        } catch (fallbackError) {
          console.error('❌ Failed to create medicine_name/medicineName column:', fallbackError.message);
        }
      }
    }
    
    if (!hasIsNewMedicine) {
      console.log('⚠️  is_new_medicine column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_new_medicine" BOOLEAN DEFAULT false;');
        console.log('✅ Created is_new_medicine column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "isNewMedicine" BOOLEAN DEFAULT false;');
          console.log('✅ Created isNewMedicine column');
        } catch (fallbackError) {
          console.error('❌ Failed to create is_new_medicine/isNewMedicine column:', fallbackError.message);
        }
      }
    }
    
    if (!hasImageUrl) {
      console.log('⚠️  image_url column missing in createAd, creating it...');
      try {
        await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "image_url" TEXT;');
        console.log('✅ Created image_url column');
      } catch (addError) {
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;');
          console.log('✅ Created imageUrl column');
        } catch (fallbackError) {
          console.error('❌ Failed to create image_url/imageUrl column:', fallbackError.message);
        }
      }
    }
    
    // Validate required fields
    if (!req.body.title && !req.body.medicineName) {
      return res.status(400).json({ 
        success: false,
        message: 'Title or Medicine Name is required' 
      });
    }

    // Clean up empty strings to null for optional fields
    const cleanDepartmentId = req.body.departmentId && 
      typeof req.body.departmentId === 'string' && 
      req.body.departmentId.trim() !== '' 
        ? req.body.departmentId.trim() 
        : (req.body.departmentId || null);

    // Validate departmentId if provided
    if (cleanDepartmentId) {
      try {
        const department = await Department.findByPk(cleanDepartmentId);
        if (!department) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid department selected' 
          });
        }
      } catch (deptError) {
        console.error('Error validating department:', deptError);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid department selected' 
        });
      }
    }

    // Clean up empty strings to null for optional fields
    const adData = {
      ...req.body,
      departmentId: cleanDepartmentId,
      link: req.body.link && typeof req.body.link === 'string' && req.body.link.trim() !== '' 
        ? req.body.link.trim() 
        : null,
      imageUrl: req.body.imageUrl && typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim() !== '' 
        ? req.body.imageUrl.trim() 
        : null,
    };

    console.log('Creating ad with data:', adData);
    
    // Only include fields that exist in the model
    const safeAdData = {
      title: adData.title || adData.medicineName || 'Untitled',
      medicineName: adData.medicineName || null,
      indications: adData.indications || null,
      description: adData.description || null,
      imageUrl: adData.imageUrl || null,
      link: adData.link || null,
      targetAudience: adData.targetAudience || 'doctor',
      isActive: adData.isActive !== undefined ? adData.isActive : true,
      departmentId: adData.departmentId || null,
      isNewMedicine: adData.isNewMedicine || false,
      startDate: adData.startDate || null,
      endDate: adData.endDate || null,
      // Handle slot field if it exists in database (legacy column)
      ...(adData.slot !== undefined ? { slot: adData.slot } : {}),
    };
    
    let ad;
    try {
      ad = await Ad.create(safeAdData);
    } catch (createError) {
      // If target_audience column doesn't exist, add it and retry
      if (createError.message?.includes('target_audience') && createError.message?.includes('does not exist')) {
        console.log('⚠️  target_audience column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "target_audience" VARCHAR(50) DEFAULT \'all\';');
          console.log('✅ Added target_audience column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding target_audience column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If targetAudience column doesn't exist, add it and retry
      else if (createError.message?.includes('targetAudience') && createError.message?.includes('does not exist')) {
        console.log('⚠️  targetAudience column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "targetAudience" VARCHAR(50) DEFAULT \'all\';');
          console.log('✅ Added targetAudience column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding targetAudience column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If is_active column doesn't exist, add it and retry
      else if (createError.message?.includes('is_active') && createError.message?.includes('does not exist')) {
        console.log('⚠️  is_active column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;');
          console.log('✅ Added is_active column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding is_active column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If isActive column doesn't exist, add it and retry
      else if (createError.message?.includes('isActive') && createError.message?.includes('does not exist')) {
        console.log('⚠️  isActive column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
          console.log('✅ Added isActive column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding isActive column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If start_date column doesn't exist, add it and retry
      else if (createError.message?.includes('start_date') && createError.message?.includes('does not exist')) {
        console.log('⚠️  start_date column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;');
          console.log('✅ Added start_date column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding start_date column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If startDate column doesn't exist, add it and retry
      else if (createError.message?.includes('startDate') && createError.message?.includes('does not exist')) {
        console.log('⚠️  startDate column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP;');
          console.log('✅ Added startDate column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding startDate column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If end_date column doesn't exist, add it and retry
      else if (createError.message?.includes('end_date') && createError.message?.includes('does not exist')) {
        console.log('⚠️  end_date column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;');
          console.log('✅ Added end_date column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding end_date column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If endDate column doesn't exist, add it and retry
      else if (createError.message?.includes('endDate') && createError.message?.includes('does not exist')) {
        console.log('⚠️  endDate column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP;');
          console.log('✅ Added endDate column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error adding endDate column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If click_count column doesn't exist, add it and retry
      else if (createError.message?.includes('click_count') && createError.message?.includes('does not exist')) {
        console.log('⚠️  click_count column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;');
          console.log('✅ Added click_count column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try camelCase as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER DEFAULT 0 NOT NULL;');
            console.log('✅ Added clickCount column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding click_count/clickCount column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If clickCount column doesn't exist, add it and retry
      else if (createError.message?.includes('clickCount') && createError.message?.includes('does not exist')) {
        console.log('⚠️  clickCount column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "clickCount" INTEGER DEFAULT 0 NOT NULL;');
          console.log('✅ Added clickCount column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try snake_case as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;');
            console.log('✅ Added click_count column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding clickCount/click_count column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If department_id column doesn't exist, add it and retry
      else if (createError.message?.includes('department_id') && createError.message?.includes('does not exist')) {
        console.log('⚠️  department_id column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
          console.log('✅ Added department_id column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try camelCase as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;');
            console.log('✅ Added departmentId column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding department_id/departmentId column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If departmentId column doesn't exist, add it and retry
      else if (createError.message?.includes('departmentId') && createError.message?.includes('does not exist')) {
        console.log('⚠️  departmentId column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;');
          console.log('✅ Added departmentId column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try snake_case as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
            console.log('✅ Added department_id column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding departmentId/department_id column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If department_id column doesn't exist, add it and retry
      else if (createError.message?.includes('department_id') && createError.message?.includes('does not exist')) {
        console.log('⚠️  department_id column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
          console.log('✅ Added department_id column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try camelCase as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;');
            console.log('✅ Added departmentId column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding department_id/departmentId column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If departmentId column doesn't exist, add it and retry
      else if (createError.message?.includes('departmentId') && createError.message?.includes('does not exist')) {
        console.log('⚠️  departmentId column missing, adding it...');
        try {
          await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "departmentId" UUID;');
          console.log('✅ Added departmentId column');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          // Try snake_case as fallback
          try {
            await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
            console.log('✅ Added department_id column');
            ad = await Ad.create(safeAdData);
          } catch (fallbackError) {
            console.error('Error adding departmentId/department_id column:', fallbackError);
            throw createError; // Throw original error
          }
        }
      }
      // If image_url column NOT NULL constraint error, make it nullable and retry
      else if (createError.message?.includes('image_url') && createError.message?.includes('not-null constraint')) {
        console.log('⚠️  image_url column NOT NULL constraint detected, making it nullable...');
        try {
          await sequelize.query('ALTER TABLE "ads" ALTER COLUMN "image_url" DROP NOT NULL;');
          console.log('✅ Made image_url column nullable');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error fixing image_url column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If slot column NOT NULL constraint error, make it nullable and retry
      else if (createError.message?.includes('slot') && createError.message?.includes('not-null constraint')) {
        console.log('⚠️  Slot column NOT NULL constraint detected, making it nullable...');
        try {
          await sequelize.query('ALTER TABLE "ads" ALTER COLUMN "slot" DROP NOT NULL;');
          console.log('✅ Made slot column nullable');
          // Retry creating the ad
          ad = await Ad.create(safeAdData);
        } catch (fixError) {
          console.error('Error fixing slot column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If any other NOT NULL constraint error, try to make that column nullable
      else if (createError.message?.includes('not-null constraint')) {
        console.log('⚠️  NOT NULL constraint detected, attempting to make column nullable...');
        try {
          // Extract column name from error message
          const columnMatch = createError.message.match(/column "(\w+)" of relation/);
          if (columnMatch && columnMatch[1]) {
            const columnName = columnMatch[1];
            await sequelize.query(`ALTER TABLE "ads" ALTER COLUMN "${columnName}" DROP NOT NULL;`);
            console.log(`✅ Made ${columnName} column nullable`);
            // Retry creating the ad
            ad = await Ad.create(safeAdData);
          } else {
            throw createError;
          }
        } catch (fixError) {
          console.error('Error fixing NOT NULL constraint:', fixError);
          throw createError; // Throw original error
        }
      }
      // If column doesn't exist error, try to add it and retry
      else if (createError.message?.includes('column') && createError.message?.includes('does not exist')) {
        console.log('⚠️  Missing column detected, attempting to add missing columns...');
        try {
          // Try to add missing columns
          const missingColumn = createError.message.match(/column "(\w+)" of relation/)?.[1];
          if (missingColumn) {
            // Map of column names to their SQL definitions
            const columnDefinitions = {
              'description': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "description" TEXT;',
              'imageurl': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "image_url" TEXT;',
              'image_url': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "image_url" TEXT;',
              'link': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "link" TEXT;',
              'medicinename': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicine_name" VARCHAR(500);',
              'medicine_name': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicine_name" VARCHAR(500);',
              'indications': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "indications" VARCHAR(500);',
              'isnewmedicine': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_new_medicine" BOOLEAN DEFAULT false;',
              'is_new_medicine': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_new_medicine" BOOLEAN DEFAULT false;',
              'departmentid': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;',
              'department_id': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;',
              'targetaudience': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "target_audience" VARCHAR(50) DEFAULT \'all\';',
              'target_audience': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "target_audience" VARCHAR(50) DEFAULT \'all\';',
              'isactive': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;',
              'is_active': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;',
              'startdate': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;',
              'start_date': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "start_date" TIMESTAMP;',
              'enddate': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;',
              'end_date': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "end_date" TIMESTAMP;',
              'clickcount': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;',
              'click_count': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;',
              'createdat': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
              'created_at': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
              'updatedat': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
              'updated_at': 'ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
            };

            const columnKey = missingColumn.toLowerCase();
            // Also check for exact match (with underscores)
            const exactKey = missingColumn;
            
            // Special handling for common columns
            if (columnKey === 'clickcount' || columnKey === 'click_count' || missingColumn === 'clickCount' || missingColumn === 'click_count') {
              try {
                await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "click_count" INTEGER DEFAULT 0 NOT NULL;');
                console.log(`✅ Added click_count column`);
                ad = await Ad.create(safeAdData);
              } catch (fallbackError) {
                console.error('Error adding click_count column:', fallbackError);
                throw createError;
              }
            } else if (columnKey === 'medicinename' || columnKey === 'medicine_name' || missingColumn === 'medicineName' || missingColumn === 'medicine_name') {
              try {
                await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "medicine_name" VARCHAR(500);');
                console.log(`✅ Added medicine_name column`);
                ad = await Ad.create(safeAdData);
              } catch (fallbackError) {
                console.error('Error adding medicine_name column:', fallbackError);
                throw createError;
              }
            } else if (columnKey === 'departmentid' || columnKey === 'department_id' || missingColumn === 'departmentId' || missingColumn === 'department_id') {
              try {
                await sequelize.query('ALTER TABLE "ads" ADD COLUMN IF NOT EXISTS "department_id" UUID;');
                console.log(`✅ Added department_id column`);
                ad = await Ad.create(safeAdData);
              } catch (fallbackError) {
                console.error('Error adding department_id column:', fallbackError);
                throw createError;
              }
            } else if (columnDefinitions[columnKey] || columnDefinitions[exactKey]) {
              const sql = columnDefinitions[exactKey] || columnDefinitions[columnKey];
              await sequelize.query(sql);
              console.log(`✅ Added missing column: ${missingColumn}`);
              // Retry creating the ad
              ad = await Ad.create(safeAdData);
            } else {
              console.log(`⚠️  Unknown column: ${missingColumn}`);
              throw createError;
            }
          } else {
            throw createError;
          }
        } catch (fixError) {
          console.error('Error fixing missing column:', fixError);
          throw createError; // Throw original error
        }
      } else {
        throw createError;
      }
    }

    const adWithDepartment = await Ad.findByPk(ad.id, {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
      ],
    });

    res.status(201).json({
      success: true,
      ad: adWithDepartment,
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to create ad',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const updateAd = async (req, res) => {
  // Ensure all columns exist before updating
  await ensureAdsTableColumns();
  
  try {
    const { id } = req.params;
    const ad = await Ad.findByPk(id);

    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }

    // Clean up empty strings to null for optional fields
    const cleanDepartmentId = req.body.departmentId && 
      typeof req.body.departmentId === 'string' && 
      req.body.departmentId.trim() !== '' 
        ? req.body.departmentId.trim() 
        : (req.body.departmentId || null);

    // Validate departmentId if provided
    if (cleanDepartmentId) {
      try {
        const department = await Department.findByPk(cleanDepartmentId);
        if (!department) {
          return res.status(400).json({ 
            success: false,
            message: 'Invalid department selected' 
          });
        }
      } catch (deptError) {
        console.error('Error validating department:', deptError);
        return res.status(400).json({ 
          success: false,
          message: 'Invalid department selected' 
        });
      }
    }

    // Clean up empty strings to null for optional fields
    const updateData = {
      ...req.body,
      departmentId: cleanDepartmentId,
      link: req.body.link && typeof req.body.link === 'string' && req.body.link.trim() !== '' 
        ? req.body.link.trim() 
        : null,
      imageUrl: req.body.imageUrl && typeof req.body.imageUrl === 'string' && req.body.imageUrl.trim() !== '' 
        ? req.body.imageUrl.trim() 
        : null,
    };

    // Only include fields that exist in the model
    const safeUpdateData = {
      title: updateData.title || updateData.medicineName || ad.title || 'Untitled',
      medicineName: updateData.medicineName !== undefined ? updateData.medicineName : ad.medicineName,
      indications: updateData.indications !== undefined ? updateData.indications : ad.indications,
      description: updateData.description !== undefined ? updateData.description : ad.description,
      imageUrl: updateData.imageUrl !== undefined ? updateData.imageUrl : ad.imageUrl,
      link: updateData.link !== undefined ? updateData.link : ad.link,
      targetAudience: updateData.targetAudience !== undefined ? updateData.targetAudience : ad.targetAudience,
      isActive: updateData.isActive !== undefined ? updateData.isActive : ad.isActive,
      departmentId: updateData.departmentId !== undefined ? updateData.departmentId : ad.departmentId,
      isNewMedicine: updateData.isNewMedicine !== undefined ? updateData.isNewMedicine : ad.isNewMedicine,
      startDate: updateData.startDate !== undefined ? updateData.startDate : ad.startDate,
      endDate: updateData.endDate !== undefined ? updateData.endDate : ad.endDate,
    };
    
    await ad.update(safeUpdateData);

    const updatedAd = await Ad.findByPk(id, {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
      ],
    });

    res.json({
      success: true,
      ad: updatedAd,
    });
  } catch (error) {
    console.error('Error updating ad:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to update ad',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ad.findByPk(id);

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    await ad.destroy();

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const incrementAdClick = async (req, res) => {
  // Ensure all columns exist before incrementing
  await ensureAdsTableColumns();
  
  try {
    const { id } = req.params;
    
    // Proactively check and create click_count column if missing
    const [columnCheck] = await sequelize.query(`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ads'
      AND table_schema = 'public'
      AND column_name IN ('click_count', 'clickCount');
    `);
    
    const hasClickCount = columnCheck.length > 0;
    let clickCountColName = null;
    
    if (hasClickCount) {
      clickCountColName = columnCheck[0].column_name;
      console.log(`✅ Found click_count column: ${clickCountColName}`);
    } else {
      console.log('⚠️  click_count column missing, creating it...');
      // Try snake_case first (preferred, matches model field mapping)
      try {
        await sequelize.query(`
          ALTER TABLE "ads" 
          ADD COLUMN "click_count" INTEGER DEFAULT 0 NOT NULL;
        `);
        clickCountColName = 'click_count';
        console.log('✅ Created click_count column (snake_case)');
      } catch (addError) {
        // Try camelCase as fallback
        try {
          await sequelize.query(`
            ALTER TABLE "ads" 
            ADD COLUMN "clickCount" INTEGER DEFAULT 0 NOT NULL;
          `);
          clickCountColName = 'clickCount';
          console.log('✅ Created clickCount column (camelCase)');
        } catch (fallbackError) {
          console.error('❌ Failed to create click_count/clickCount column:', fallbackError.message);
          return res.status(500).json({ 
            success: false,
            message: 'Database error: Could not create click_count column. Please contact administrator.' 
          });
        }
      }
    }
    
    const ad = await Ad.findByPk(id);

    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }

    try {
      // Use raw SQL to increment to avoid Sequelize mapping issues
      if (clickCountColName === 'click_count') {
        await sequelize.query(`
          UPDATE "ads" 
          SET "click_count" = COALESCE("click_count", 0) + 1
          WHERE id = :id::uuid;
        `, {
          replacements: { id: id },
        });
      } else {
        await sequelize.query(`
          UPDATE "ads" 
          SET "clickCount" = COALESCE("clickCount", 0) + 1
          WHERE id = :id::uuid;
        `, {
          replacements: { id: id },
        });
      }
      console.log('✅ Incremented click count for ad:', id);
    } catch (incrementError) {
      console.error('❌ Error incrementing click count:', incrementError);
      // If still fails, try using Sequelize increment as fallback
      try {
        await ad.increment('clickCount');
      } catch (sequelizeError) {
        console.error('❌ Sequelize increment also failed:', sequelizeError);
        throw incrementError; // Throw original error
      }
    }

    res.json({
      success: true,
      message: 'Click counted',
    });
  } catch (error) {
    console.error('❌ Error in incrementAdClick:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to increment click count' 
    });
  }
};

