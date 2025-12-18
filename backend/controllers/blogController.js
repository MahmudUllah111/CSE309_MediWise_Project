import Blog from '../models/Blog.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sequelize from '../config/database.js';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/blogs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadBlogImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
}).single('image');

// Get all blogs (public - only approved)
export const getBlogs = async (req, res) => {
  try {
    const { category, search, limit, offset } = req.query;
    const where = { status: 'approved' };
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const queryOptions = {
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    };
    
    if (limit) {
      queryOptions.limit = parseInt(limit);
    }
    if (offset) {
      queryOptions.offset = parseInt(offset);
    }
    
    let blogs;
    try {
      blogs = await Blog.findAndCountAll(queryOptions);
    } catch (queryError) {
      // If association error, try without include
      if (queryError.name === 'SequelizeEagerLoadingError' || 
          queryError.message?.includes('include') ||
          queryError.message?.includes('association')) {
        console.log('Retrying blog query without author include...');
        const simpleQueryOptions = {
          where: queryOptions.where,
          order: queryOptions.order,
        };
        if (queryOptions.limit) simpleQueryOptions.limit = queryOptions.limit;
        if (queryOptions.offset) simpleQueryOptions.offset = queryOptions.offset;
        blogs = await Blog.findAndCountAll(simpleQueryOptions);
      } else {
        throw queryError;
      }
    }
    
    res.json({
      success: true,
      blogs: blogs.rows || [],
      total: blogs.count || 0,
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.original);
    }
    
    // Always return 200 with empty array for better UX
    res.status(200).json({
      success: true,
      blogs: [],
      total: 0,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single blog by ID
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }
    
    // Increment views
    await blog.increment('views');
    
    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message,
    });
  }
};

// Create new blog (doctor only)
export const createBlog = async (req, res) => {
  try {
    console.log('=== Blog Creation Request ===');
    console.log('User:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('Has file:', !!req.file);
    
    if (!req.user || !req.user.id) {
      console.error('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get data from body (multer puts form data in req.body)
    const title = req.body?.title;
    const excerpt = req.body?.excerpt;
    const content = req.body?.content;
    const category = req.body?.category;
    const tags = req.body?.tags;
    
    console.log('Title:', title ? 'Present' : 'Missing');
    console.log('Content:', content ? `Present (${content.length} chars)` : 'Missing');
    
    if (!title || !title.trim()) {
      console.error('Title is missing or empty');
      return res.status(400).json({
        success: false,
        message: 'Title is required',
      });
    }
    
    if (!content || !content.trim()) {
      console.error('Content is missing or empty');
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/blogs/${req.file.filename}`;
    }
    
    // Safely parse tags
    let tagsArray = [];
    try {
      if (tags) {
        if (Array.isArray(tags)) {
          tagsArray = tags;
        } else if (typeof tags === 'string') {
          tagsArray = JSON.parse(tags);
        }
      }
    } catch (tagsError) {
      console.log('Error parsing tags, using empty array:', tagsError.message);
      tagsArray = [];
    }
    
    // Safely create excerpt
    let blogExcerpt = excerpt;
    if (!blogExcerpt && content) {
      try {
        blogExcerpt = content.substring(0, 200) + '...';
      } catch (excerptError) {
        blogExcerpt = content || 'No excerpt available';
      }
    }
    
    // PROACTIVE: Check and fix blogs table columns
    try {
      console.log('🔍 Checking blogs table columns...');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'blogs'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      const existingColumnNames = columns.map(col => col.column_name);
      console.log('Existing columns:', existingColumnNames);
      console.log('Column details:', columns.map(c => ({ name: c.column_name, type: c.data_type, nullable: c.is_nullable })));
      
      // Check if database uses camelCase or snake_case for timestamps
      const hasCamelCaseCreatedAt = existingColumnNames.includes('createdAt');
      const hasSnakeCaseCreatedAt = existingColumnNames.includes('created_at');
      
      console.log('Has camelCase createdAt:', hasCamelCaseCreatedAt);
      console.log('Has snake_case created_at:', hasSnakeCaseCreatedAt);
      
      // If database has camelCase, we need to handle it differently
      if (hasCamelCaseCreatedAt && !hasSnakeCaseCreatedAt) {
        console.log('⚠️  Database uses camelCase columns - this is unusual but we will handle it');
      }
      
      // Determine which column name to use/create
      const createdAtColName = hasCamelCaseCreatedAt ? 'createdAt' : 'created_at';
      const updatedAtColName = hasCamelCaseCreatedAt ? 'updatedAt' : 'updated_at';
      
      console.log('🔍 Timestamp column naming:', hasCamelCaseCreatedAt ? 'camelCase' : 'snake_case');
      console.log('Using:', { createdAtColName, updatedAtColName });
      
      // Check if created_at/createdAt exists
      if (!hasCamelCaseCreatedAt && !hasSnakeCaseCreatedAt) {
        console.log(`⚠️  ${createdAtColName} column missing - adding it...`);
        await sequelize.query(`
          ALTER TABLE blogs
          ADD COLUMN "${createdAtColName}" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        `);
        console.log(`✅ Added ${createdAtColName} column`);
      } else {
        // Ensure it has a default value
        const createdCol = columns.find(c => c.column_name === createdAtColName);
        if (createdCol && !createdCol.column_default) {
          console.log(`⚠️  ${createdAtColName} has no default - setting default...`);
          await sequelize.query(`
            ALTER TABLE blogs
            ALTER COLUMN "${createdAtColName}" SET DEFAULT CURRENT_TIMESTAMP;
          `);
        }
        // Ensure it's NOT NULL
        if (createdCol && createdCol.is_nullable === 'YES') {
          console.log(`⚠️  ${createdAtColName} is nullable - making it NOT NULL...`);
          await sequelize.query(`
            ALTER TABLE blogs
            ALTER COLUMN "${createdAtColName}" SET NOT NULL;
          `);
        }
      }
      
      // Check if updated_at/updatedAt exists
      const hasCamelCaseUpdatedAt = existingColumnNames.includes('updatedAt');
      const hasSnakeCaseUpdatedAt = existingColumnNames.includes('updated_at');
      
      if (!hasCamelCaseUpdatedAt && !hasSnakeCaseUpdatedAt) {
        console.log(`⚠️  ${updatedAtColName} column missing - adding it...`);
        await sequelize.query(`
          ALTER TABLE blogs
          ADD COLUMN "${updatedAtColName}" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
        `);
        console.log(`✅ Added ${updatedAtColName} column`);
      } else {
        // Ensure it has a default value
        const updatedCol = columns.find(c => c.column_name === updatedAtColName);
        if (updatedCol && !updatedCol.column_default) {
          console.log(`⚠️  ${updatedAtColName} has no default - setting default...`);
          await sequelize.query(`
            ALTER TABLE blogs
            ALTER COLUMN "${updatedAtColName}" SET DEFAULT CURRENT_TIMESTAMP;
          `);
        }
        // Ensure it's NOT NULL
        if (updatedCol && updatedCol.is_nullable === 'YES') {
          console.log(`⚠️  ${updatedAtColName} is nullable - making it NOT NULL...`);
          await sequelize.query(`
            ALTER TABLE blogs
            ALTER COLUMN "${updatedAtColName}" SET NOT NULL;
          `);
        }
      }
      
      // Check for other required columns
      const requiredColumns = [
        { name: 'title', type: 'VARCHAR(500)', nullable: false },
        { name: 'content', type: 'TEXT', nullable: false },
        { name: 'excerpt', type: 'TEXT', nullable: true },
        { name: 'category', type: 'VARCHAR(200)', nullable: true },
        { name: 'image', type: 'VARCHAR(500)', nullable: true },
        { name: 'tags', type: 'TEXT', nullable: true },
        { name: 'views', type: 'INTEGER', nullable: true, default: '0' },
        { name: 'comments', type: 'INTEGER', nullable: true, default: '0' },
        { name: 'status', type: 'VARCHAR(50)', nullable: true, default: "'pending'" },
      ];
      
      for (const col of requiredColumns) {
        if (!existingColumnNames.includes(col.name)) {
          console.log(`⚠️  ${col.name} column missing - adding it...`);
          const nullable = col.nullable ? '' : 'NOT NULL';
          const defaultVal = col.default ? `DEFAULT ${col.default}` : '';
          await sequelize.query(`
            ALTER TABLE blogs
            ADD COLUMN ${col.name} ${col.type} ${nullable} ${defaultVal};
          `);
          console.log(`✅ Added ${col.name} column`);
        }
      }
      
      // Check if author_id exists
      if (!existingColumnNames.includes('author_id')) {
        console.log('⚠️  author_id column missing - adding it...');
        try {
          // First, check if there are existing rows
          const [rowCount] = await sequelize.query(`
            SELECT COUNT(*) as count FROM blogs;
          `);
          const count = parseInt(rowCount[0]?.count || 0);
          
          if (count > 0) {
            // If there are existing rows, we need to set a default value
            // Use the first admin user or current user
            const [adminUsers] = await sequelize.query(`
              SELECT id FROM users WHERE role = 'admin' LIMIT 1;
            `);
            const defaultAuthorId = adminUsers[0]?.id || req.user.id;
            
            // Add column as nullable first
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN author_id UUID;
            `);
            
            // Update existing rows with default author
            await sequelize.query(`
              UPDATE blogs
              SET author_id = :defaultAuthorId::uuid
              WHERE author_id IS NULL;
            `, {
              replacements: { defaultAuthorId: String(defaultAuthorId).trim() }
            });
            
            // Now make it NOT NULL
            await sequelize.query(`
              ALTER TABLE blogs
              ALTER COLUMN author_id SET NOT NULL;
            `);
          } else {
            // No existing rows, can add as NOT NULL directly
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN author_id UUID NOT NULL;
            `);
          }
          
          // Add foreign key constraint
          await sequelize.query(`
            ALTER TABLE blogs
            DROP CONSTRAINT IF EXISTS blogs_author_id_fkey;
          `);
          await sequelize.query(`
            ALTER TABLE blogs
            ADD CONSTRAINT blogs_author_id_fkey
            FOREIGN KEY (author_id)
            REFERENCES users(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE;
          `);
          console.log('✅ Added author_id column and foreign key');
        } catch (addError) {
          console.error('❌ Error adding author_id column:', addError.message);
          // Don't throw, let it try to create and catch in the error handler
        }
      }
      
      // Check if approved_by exists
      if (!existingColumnNames.includes('approved_by')) {
        console.log('⚠️  approved_by column missing - adding it...');
        await sequelize.query(`
          ALTER TABLE blogs
          ADD COLUMN IF NOT EXISTS approved_by UUID;
        `);
        
        // Add foreign key constraint
        await sequelize.query(`
          ALTER TABLE blogs
          DROP CONSTRAINT IF EXISTS blogs_approved_by_fkey;
        `);
        await sequelize.query(`
          ALTER TABLE blogs
          ADD CONSTRAINT blogs_approved_by_fkey
          FOREIGN KEY (approved_by)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
        `);
        console.log('✅ Added approved_by column and foreign key');
      }
      
      // Check if approved_at exists
      if (!existingColumnNames.includes('approved_at')) {
        console.log('⚠️  approved_at column missing - adding it...');
        await sequelize.query(`
          ALTER TABLE blogs
          ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
        `);
        console.log('✅ Added approved_at column');
      }
    } catch (columnError) {
      console.error('⚠️  Error checking/fixing blogs table:', columnError.message);
    }
    
    console.log('Attempting to create blog with:', {
      title: title.substring(0, 50),
      hasExcerpt: !!blogExcerpt,
      hasContent: !!content,
      category: category || 'Health Tips',
      hasImage: !!imageUrl,
      tagsCount: tagsArray.length,
      authorId: req.user.id,
    });
    
    let blog;
    try {
      // Ensure authorId is set
      if (!req.user || !req.user.id) {
        console.error('❌ No user ID available for blog creation');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - User ID is required',
        });
      }
      
      const authorId = String(req.user.id).trim();
      console.log('📝 Using authorId:', authorId);
      
      // Check actual column names in database - check for both camelCase and snake_case
      const [columnCheck] = await sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'blogs'
        AND table_schema = 'public'
        AND column_name IN ('created_at', 'createdAt', 'updated_at', 'updatedAt', 'author_id', 'authorId');
      `);
      
      const actualColumnNames = columnCheck.map(c => c.column_name);
      const usesCamelCase = actualColumnNames.includes('createdAt');
      const createdAtCol = usesCamelCase ? 'createdAt' : 'created_at';
      const updatedAtCol = usesCamelCase ? 'updatedAt' : 'updated_at';
      const authorIdCol = usesCamelCase ? 'authorId' : 'author_id';
      
      console.log('🔍 Database column naming:', usesCamelCase ? 'camelCase' : 'snake_case');
      console.log('Using columns:', { createdAtCol, updatedAtCol, authorIdCol });
      console.log('Available columns:', actualColumnNames);
      
      // If using camelCase, we need to quote the column names in SQL
      const createdAtColQuoted = usesCamelCase ? '"createdAt"' : 'created_at';
      const updatedAtColQuoted = usesCamelCase ? '"updatedAt"' : 'updated_at';
      const authorIdColQuoted = usesCamelCase ? '"authorId"' : 'author_id';
      
      // Prepare blog data - use raw SQL to ensure proper column mapping
      console.log('=== Creating blog with raw SQL ===');
      const insertQuery = `
        INSERT INTO blogs (
          title,
          excerpt,
          content,
          category,
          image,
          tags,
          ${authorIdColQuoted},
          status,
          views,
          comments,
          ${createdAtColQuoted},
          ${updatedAtColQuoted}
        )
        VALUES (
          :title,
          :excerpt,
          :content,
          :category,
          :image,
          :tags::text,
          :authorId::uuid,
          :status,
          0,
          0,
          NOW(),
          NOW()
        )
        RETURNING id;
      `;
      
      console.log('📝 Final INSERT query:', insertQuery);
      
      const insertParams = {
        title: title.trim(),
        excerpt: blogExcerpt ? blogExcerpt.trim() : null,
        content: content.trim(),
        category: category ? category.trim() : 'Health Tips',
        image: imageUrl,
        tags: JSON.stringify(tagsArray),
        authorId: authorId,
        status: 'pending',
      };
      
      console.log('Insert params:', { ...insertParams, tags: '[JSON]' });
      
      let insertResult;
      let blogId;
      
      try {
        console.log('=== Executing INSERT query ===');
        console.log('Query:', insertQuery);
        console.log('Params:', { ...insertParams, tags: '[JSON]' });
        
        // Use SELECT type for RETURNING clause
        insertResult = await sequelize.query(insertQuery, {
          replacements: insertParams,
          type: sequelize.QueryTypes.SELECT,
        });
        
        console.log('Insert result type:', typeof insertResult);
        console.log('Insert result is array:', Array.isArray(insertResult));
        console.log('Insert result:', JSON.stringify(insertResult, null, 2));
        
        // Handle result - sequelize.query with SELECT returns array directly
        if (Array.isArray(insertResult) && insertResult.length > 0) {
          blogId = insertResult[0]?.id || insertResult[0]?.ID || insertResult[0]?.Id;
          console.log('Blog ID from array[0]:', blogId);
        } else if (insertResult && insertResult.id) {
          blogId = insertResult.id;
          console.log('Blog ID from object:', blogId);
        } else if (insertResult && insertResult[0] && insertResult[0][0] && insertResult[0][0].id) {
          blogId = insertResult[0][0].id;
          console.log('Blog ID from nested array:', blogId);
        }
        
        // If still no ID, try to find the last inserted blog
        if (!blogId) {
          console.log('⚠️  No ID from RETURNING, trying to find last inserted blog...');
          // Use the detected column names
          const [lastIdResult] = await sequelize.query(`
            SELECT id FROM blogs 
            WHERE ${authorIdCol} = :authorId::uuid 
            AND title = :title 
            ORDER BY ${createdAtCol} DESC 
            LIMIT 1;
          `, {
            replacements: { 
              authorId: authorId,
              title: title.trim()
            },
            type: sequelize.QueryTypes.SELECT,
          });
          
          console.log('Last ID result:', lastIdResult);
          
          if (Array.isArray(lastIdResult) && lastIdResult.length > 0) {
            blogId = lastIdResult[0]?.id;
          } else if (lastIdResult && lastIdResult.id) {
            blogId = lastIdResult.id;
          }
          
          if (blogId) {
            console.log('✅ Found blog ID from manual query:', blogId);
          } else {
            console.error('❌ Failed to find blog after insert');
            console.error('Insert result:', JSON.stringify(insertResult, null, 2));
            throw new Error('Failed to create blog - no ID returned from database');
          }
        }
      } catch (queryError) {
        console.error('❌ SQL Query Error:', queryError);
        console.error('Error name:', queryError.name);
        console.error('Error message:', queryError.message);
        console.error('Error stack:', queryError.stack);
        console.error('Query:', insertQuery);
        console.error('Params:', insertParams);
        if (queryError.original) {
          console.error('Original error:', queryError.original);
          console.error('Original message:', queryError.original.message);
        }
        throw queryError;
      }
      
      console.log('✅ Blog created successfully with ID:', blogId);
      
      // Fetch the created blog using raw SQL to avoid Sequelize mapping issues
      console.log('=== Fetching created blog with raw SQL ===');
      // Re-check column names for fetch query
      const [fetchColumnCheck] = await sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'blogs'
        AND table_schema = 'public'
        AND column_name IN ('created_at', 'createdAt', 'updated_at', 'updatedAt', 'author_id', 'authorId', 'approved_by', 'approvedBy', 'approved_at', 'approvedAt');
      `);
      
      const fetchColumnNames = fetchColumnCheck.map(c => c.column_name);
      const fetchUsesCamelCase = fetchColumnNames.includes('createdAt');
      const fetchCreatedAtCol = fetchUsesCamelCase ? 'createdAt' : 'created_at';
      const fetchUpdatedAtCol = fetchUsesCamelCase ? 'updatedAt' : 'updated_at';
      const fetchAuthorIdCol = fetchUsesCamelCase ? 'authorId' : 'author_id';
      const fetchApprovedByCol = fetchUsesCamelCase ? 'approvedBy' : 'approved_by';
      const fetchApprovedAtCol = fetchUsesCamelCase ? 'approvedAt' : 'approved_at';
      
      const [blogRows] = await sequelize.query(`
        SELECT 
          b.id,
          b.title,
          b.excerpt,
          b.content,
          b.category,
          b.image,
          b.tags,
          b.views,
          b.comments,
          b.status,
          b.${fetchAuthorIdCol} as "authorId",
          b.${fetchApprovedByCol} as "approvedBy",
          b.${fetchApprovedAtCol} as "approvedAt",
          b.${fetchCreatedAtCol} as "createdAt",
          b.${fetchUpdatedAtCol} as "updatedAt",
          u.id as "author.id",
          u.name as "author.name",
          u.email as "author.email"
        FROM blogs b
        LEFT JOIN users u ON b.${fetchAuthorIdCol}::text = u.id::text
        WHERE b.id = :blogId
        LIMIT 1;
      `, {
        replacements: { blogId: blogId },
        type: sequelize.QueryTypes.SELECT,
      });
      
      if (blogRows && blogRows.length > 0) {
        const row = blogRows[0];
        blog = {
          id: row.id,
          title: row.title,
          excerpt: row.excerpt,
          content: row.content,
          category: row.category,
          image: row.image,
          tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
          views: row.views || 0,
          comments: row.comments || 0,
          status: row.status || 'pending',
          authorId: row.authorId,
          approvedBy: row.approvedBy,
          approvedAt: row.approvedAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          author: row['author.id'] ? {
            id: row['author.id'],
            name: row['author.name'],
            email: row['author.email'],
          } : null,
        };
        console.log('✅ Fetched blog with raw SQL');
      } else {
        console.warn('⚠️  Could not fetch blog after insert, creating minimal blog object');
        blog = {
          id: blogId,
          title: title.trim(),
          excerpt: blogExcerpt ? blogExcerpt.trim() : null,
          content: content.trim(),
          category: category ? category.trim() : 'Health Tips',
          image: imageUrl,
          tags: tagsArray,
          views: 0,
          comments: 0,
          status: 'pending',
          authorId: req.user.id,
        };
      }
    } catch (createError) {
      console.error('Error creating blog record:', createError);
      console.error('Create error details:', {
        name: createError.name,
        message: createError.message,
        stack: createError.stack,
      });
      
      // If column doesn't exist error, try to add it and retry
      if (createError.message?.includes('column') && createError.message?.includes('does not exist')) {
        const columnMatch = createError.message.match(/column "(\w+)" of relation/);
        const missingColumn = columnMatch ? columnMatch[1] : null;
        console.log('⚠️  Missing column detected:', missingColumn, '- attempting to add missing columns...');
        
        try {
          // Check if it's author_id column
          if (missingColumn === 'author_id' || createError.message.includes('author_id')) {
            console.log('🔧 Adding author_id column to blogs table...');
            try {
              // First, check if there are existing rows
              const [rowCount] = await sequelize.query(`
                SELECT COUNT(*) as count FROM blogs;
              `);
              const count = parseInt(rowCount[0]?.count || 0);
              
              if (count > 0) {
                // If there are existing rows, we need to set a default value
                const [adminUsers] = await sequelize.query(`
                  SELECT id FROM users WHERE role = 'admin' LIMIT 1;
                `);
                const defaultAuthorId = adminUsers[0]?.id || req.user.id;
                
                // Add column as nullable first
                await sequelize.query(`
                  ALTER TABLE blogs
                  ADD COLUMN IF NOT EXISTS author_id UUID;
                `);
                
                // Update existing rows with default author
                await sequelize.query(`
                  UPDATE blogs
                  SET author_id = :defaultAuthorId::uuid
                  WHERE author_id IS NULL;
                `, {
                  replacements: { defaultAuthorId: String(defaultAuthorId).trim() }
                });
                
                // Now make it NOT NULL
                await sequelize.query(`
                  ALTER TABLE blogs
                  ALTER COLUMN author_id SET NOT NULL;
                `);
              } else {
                // No existing rows, can add as NOT NULL directly
                await sequelize.query(`
                  ALTER TABLE blogs
                  ADD COLUMN IF NOT EXISTS author_id UUID NOT NULL;
                `);
              }
              
              // Add foreign key constraint
              await sequelize.query(`
                ALTER TABLE blogs
                DROP CONSTRAINT IF EXISTS blogs_author_id_fkey;
              `);
              await sequelize.query(`
                ALTER TABLE blogs
                ADD CONSTRAINT blogs_author_id_fkey
                FOREIGN KEY (author_id)
                REFERENCES users(id)
                ON UPDATE CASCADE
                ON DELETE CASCADE;
              `);
              console.log('✅ Added author_id column and foreign key');
            } catch (addError) {
              console.error('❌ Error adding author_id in error handler:', addError.message);
              throw addError;
            }
          }
          
          // Check if it's approved_by column
          if (missingColumn === 'approved_by' || createError.message.includes('approved_by')) {
            console.log('🔧 Adding approved_by column to blogs table...');
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN IF NOT EXISTS approved_by UUID;
            `);
            
            // Add foreign key constraint
            await sequelize.query(`
              ALTER TABLE blogs
              ADD CONSTRAINT blogs_approved_by_fkey
              FOREIGN KEY (approved_by)
              REFERENCES users(id)
              ON UPDATE CASCADE
              ON DELETE SET NULL;
            `);
            console.log('✅ Added approved_by column and foreign key');
          }
          
          // Check for created_at and updated_at
          if (missingColumn === 'created_at' || createError.message.includes('created_at')) {
            console.log('🔧 Adding created_at column to blogs table...');
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);
            console.log('✅ Added created_at column');
          }
          
          if (missingColumn === 'updated_at' || createError.message.includes('updated_at')) {
            console.log('🔧 Adding updated_at column to blogs table...');
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);
            console.log('✅ Added updated_at column');
          }
          
          // Check for approved_at
          if (missingColumn === 'approved_at' || createError.message.includes('approved_at')) {
            console.log('🔧 Adding approved_at column to blogs table...');
            await sequelize.query(`
              ALTER TABLE blogs
              ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
            `);
            console.log('✅ Added approved_at column');
          }
          
          // Retry blog creation with raw SQL (not Blog.create to avoid Sequelize mapping issues)
          console.log('🔄 Retrying blog creation with raw SQL after adding missing columns...');
          const retryInsertQuery = `
            INSERT INTO blogs (
              title,
              excerpt,
              content,
              category,
              image,
              tags,
              author_id,
              status,
              views,
              comments,
              created_at,
              updated_at
            )
            VALUES (
              :title,
              :excerpt,
              :content,
              :category,
              :image,
              :tags::text,
              :authorId::uuid,
              :status,
              0,
              0,
              NOW(),
              NOW()
            )
            RETURNING id;
          `;
          
          const retryInsertParams = {
            title: title.trim(),
            excerpt: blogExcerpt ? blogExcerpt.trim() : null,
            content: content.trim(),
            category: category ? category.trim() : 'Health Tips',
            image: imageUrl,
            tags: JSON.stringify(tagsArray),
            authorId: String(req.user.id).trim(),
            status: 'pending',
          };
          
          const [retryResult] = await sequelize.query(retryInsertQuery, {
            replacements: retryInsertParams,
            type: sequelize.QueryTypes.SELECT,
          });
          
          let retryBlogId;
          if (Array.isArray(retryResult) && retryResult.length > 0) {
            retryBlogId = retryResult[0]?.id;
          } else if (retryResult && retryResult.id) {
            retryBlogId = retryResult.id;
          }
          
          if (retryBlogId) {
            // Fetch using raw SQL
            const [blogRows] = await sequelize.query(`
              SELECT * FROM blogs WHERE id = :blogId LIMIT 1;
            `, {
              replacements: { blogId: retryBlogId },
              type: sequelize.QueryTypes.SELECT,
            });
            
            if (blogRows && blogRows.length > 0) {
              blog = blogRows[0];
              blog.id = retryBlogId;
            } else {
              blog = { id: retryBlogId, ...blogData };
            }
            console.log('✅ Blog created successfully with ID:', retryBlogId);
          } else {
            throw new Error('Failed to create blog after retry - no ID returned');
          }
        } catch (fixError) {
          console.error('❌ Could not fix missing column:', fixError.message);
          throw createError; // Re-throw original error
        }
        try {
          const missingColumn = createError.message.match(/column "(\w+)" of relation/)?.[1];
          if (missingColumn) {
            const columnDefinitions = {
              'createdat': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
              'updatedat': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
              'views': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "views" INTEGER DEFAULT 0;',
              'comments': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "comments" INTEGER DEFAULT 0;',
              'status': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT \'pending\';',
              'approvedby': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "approvedBy" UUID;',
              'approvedat': 'ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;',
            };

            const columnKey = missingColumn.toLowerCase();
            if (columnDefinitions[columnKey]) {
              await sequelize.query(columnDefinitions[columnKey]);
              console.log(`✅ Added missing column: ${missingColumn}`);
              // Retry creating the blog with raw SQL (not Blog.create)
              const retryInsertQuery = `
                INSERT INTO blogs (
                  title,
                  excerpt,
                  content,
                  category,
                  image,
                  tags,
                  author_id,
                  status,
                  views,
                  comments,
                  created_at,
                  updated_at
                )
                VALUES (
                  :title,
                  :excerpt,
                  :content,
                  :category,
                  :image,
                  :tags::text,
                  :authorId::uuid,
                  :status,
                  0,
                  0,
                  NOW(),
                  NOW()
                )
                RETURNING id;
              `;
              
              const retryInsertParams = {
                title: title.trim(),
                excerpt: blogExcerpt ? blogExcerpt.trim() : null,
                content: content.trim(),
                category: category || 'Health Tips',
                image: imageUrl,
                tags: JSON.stringify(tagsArray),
                authorId: String(req.user.id).trim(),
                status: 'pending',
              };
              
              const [retryResult] = await sequelize.query(retryInsertQuery, {
                replacements: retryInsertParams,
                type: sequelize.QueryTypes.SELECT,
              });
              
              let retryBlogId;
              if (Array.isArray(retryResult) && retryResult.length > 0) {
                retryBlogId = retryResult[0]?.id;
              } else if (retryResult && retryResult.id) {
                retryBlogId = retryResult.id;
              }
              
              if (retryBlogId) {
                const [blogRows] = await sequelize.query(`
                  SELECT * FROM blogs WHERE id = :blogId LIMIT 1;
                `, {
                  replacements: { blogId: retryBlogId },
                  type: sequelize.QueryTypes.SELECT,
                });
                
                if (blogRows && blogRows.length > 0) {
                  blog = blogRows[0];
                  blog.id = retryBlogId;
                } else {
                  blog = { id: retryBlogId, title, excerpt: blogExcerpt, content, category, image: imageUrl, tags: tagsArray, status: 'pending', authorId: req.user.id };
                }
                console.log('✅ Blog created successfully with ID:', retryBlogId);
              } else {
                throw createError;
              }
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        } catch (fixError) {
          console.error('Error fixing missing column:', fixError);
          throw createError; // Throw original error
        }
      }
      // If NOT NULL constraint error for authorId/author_id, ensure it's set and retry
      else if (createError.message?.includes('not-null constraint') && 
               (createError.message?.includes('authorId') || createError.message?.includes('author_id'))) {
        console.log('⚠️  NOT NULL constraint detected for author_id, retrying with raw SQL...');
        try {
          const authorId = String(req.user.id).trim();
          console.log('📝 Retrying with authorId:', authorId);
          
          const insertQuery = `
            INSERT INTO blogs (
              title,
              excerpt,
              content,
              category,
              image,
              tags,
              author_id,
              status,
              views,
              comments,
              created_at,
              updated_at
            )
            VALUES (
              :title,
              :excerpt,
              :content,
              :category,
              :image,
              :tags::text,
              :authorId::uuid,
              :status,
              0,
              0,
              NOW(),
              NOW()
            )
            RETURNING id;
          `;
          
          const insertParams = {
            title: title.trim(),
            excerpt: blogExcerpt ? blogExcerpt.trim() : null,
            content: content.trim(),
            category: category ? category.trim() : 'Health Tips',
            image: imageUrl,
            tags: JSON.stringify(tagsArray),
            authorId: authorId,
            status: 'pending',
          };
          
          let insertResult;
          try {
            insertResult = await sequelize.query(insertQuery, {
              replacements: insertParams,
              type: sequelize.QueryTypes.SELECT,
            });
          } catch (queryError) {
            console.error('❌ SQL Query Error in retry:', queryError);
            throw queryError;
          }
          
          // Handle both array and object formats
          let blogId;
          if (Array.isArray(insertResult) && insertResult.length > 0) {
            blogId = insertResult[0]?.id;
          } else if (insertResult && insertResult.id) {
            blogId = insertResult.id;
          }
          
          if (blogId) {
            // Fetch using raw SQL to avoid Sequelize mapping issues
            const [blogRows] = await sequelize.query(`
              SELECT 
                b.id,
                b.title,
                b.excerpt,
                b.content,
                b.category,
                b.image,
                b.tags,
                b.views,
                b.comments,
                b.status,
                b.author_id as "authorId",
                b.approved_by as "approvedBy",
                b.approved_at as "approvedAt",
                b.created_at as "createdAt",
                b.updated_at as "updatedAt",
                u.id as "author.id",
                u.name as "author.name",
                u.email as "author.email"
              FROM blogs b
              LEFT JOIN users u ON b.author_id::text = u.id::text
              WHERE b.id = :blogId
              LIMIT 1;
            `, {
              replacements: { blogId: blogId },
              type: sequelize.QueryTypes.SELECT,
            });
            
            if (blogRows && blogRows.length > 0) {
              const row = blogRows[0];
              blog = {
                id: row.id,
                title: row.title,
                excerpt: row.excerpt,
                content: row.content,
                category: row.category,
                image: row.image,
                tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
                views: row.views || 0,
                comments: row.comments || 0,
                status: row.status || 'pending',
                authorId: row.authorId,
                approvedBy: row.approvedBy,
                approvedAt: row.approvedAt,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                author: row['author.id'] ? {
                  id: row['author.id'],
                  name: row['author.name'],
                  email: row['author.email'],
                } : null,
              };
            } else {
              blog = { id: blogId, ...insertParams, tags: tagsArray, views: 0, comments: 0, status: 'pending' };
            }
            console.log('✅ Blog created successfully with ID:', blogId);
          } else {
            throw createError;
          }
        } catch (fixError) {
          console.error('Error fixing NOT NULL constraint:', fixError);
          throw createError; // Throw original error
        }
      } else {
        // For other errors, return the error response
        if (createError.name === 'SequelizeDatabaseError') {
          console.error('Database error details:', createError.original);
        }
        
        // Log detailed error information
        console.error('❌ Returning error response for createError');
        console.error('Error name:', createError.name);
        console.error('Error message:', createError.message);
        if (createError.original) {
          console.error('Original error message:', createError.original.message);
          console.error('Original error code:', createError.original.code);
        }
        
        return res.status(500).json({
          success: false,
          message: process.env.NODE_ENV === 'development' 
            ? (createError.message || createError.original?.message || 'Failed to create blog')
            : 'Failed to create blog. Please try again.',
          error: process.env.NODE_ENV === 'development' ? {
            name: createError.name,
            message: createError.message,
            original: createError.original?.message,
            code: createError.original?.code,
          } : undefined,
        });
      }
    }
    
    // Try to fetch blog with author, but don't fail if it doesn't work
    let blogWithAuthor = blog;
    try {
      blogWithAuthor = await Blog.findByPk(blog.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
      });
    } catch (includeError) {
      console.log('Could not fetch blog with author, using blog without include:', includeError.message);
      // Use the blog without author include
    }
    
    res.status(201).json({
      success: true,
      message: 'Blog submitted successfully. Waiting for admin approval.',
      blog: blogWithAuthor || blog,
    });
  } catch (error) {
    console.error('❌ Error creating blog:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.original);
      console.error('SQL:', error.sql);
    }
    
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors?.map(e => e.message) || [error.message],
      });
    }
    
    // Return detailed error in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Failed to create blog. Please try again.';
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
};

// Update blog (author or admin)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, category, tags } = req.body;
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }
    
    // Check if user is author or admin
    if (blog.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    let imageUrl = blog.image;
    if (req.file) {
      // Delete old image if exists
      if (blog.image && fs.existsSync(blog.image.replace('/uploads/', 'uploads/'))) {
        fs.unlinkSync(blog.image.replace('/uploads/', 'uploads/'));
      }
      imageUrl = `/uploads/blogs/${req.file.filename}`;
    }
    
    const tagsArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : blog.tags;
    
    await blog.update({
      title: title || blog.title,
      excerpt: excerpt || blog.excerpt,
      content: content || blog.content,
      category: category || blog.category,
      image: imageUrl,
      tags: tagsArray,
      status: req.user.role === 'admin' ? blog.status : 'pending', // Reset to pending if updated by author
    });
    
    const updatedBlog = await Blog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message,
    });
  }
};

// Delete blog (author or admin)
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }
    
    // Check if user is author or admin
    if (blog.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    // Delete image if exists
    if (blog.image && fs.existsSync(blog.image.replace('/uploads/', 'uploads/'))) {
      fs.unlinkSync(blog.image.replace('/uploads/', 'uploads/'));
    }
    
    await blog.destroy();
    
    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message,
    });
  }
};

// Get pending blogs (admin only)
export const getPendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });
    
    const blogsWithFormattedDates = blogs.map(blog => {
      const plainBlog = blog.get({ plain: true });
      try {
        if (plainBlog.createdAt && !isNaN(new Date(plainBlog.createdAt).getTime())) {
          plainBlog.createdAt = new Date(plainBlog.createdAt).toISOString();
        } else {
          plainBlog.createdAt = new Date().toISOString(); // Fallback to now
        }
        if (plainBlog.updatedAt && !isNaN(new Date(plainBlog.updatedAt).getTime())) {
          plainBlog.updatedAt = new Date(plainBlog.updatedAt).toISOString();
        } else {
          plainBlog.updatedAt = new Date().toISOString(); // Fallback to now
        }
      } catch (e) {
        console.error('Error formatting date for blog:', plainBlog.id, e);
        plainBlog.createdAt = new Date().toISOString();
        plainBlog.updatedAt = new Date().toISOString();
      }
      return plainBlog;
    });

    res.json({
      success: true,
      blogs: blogsWithFormattedDates,
    });
  } catch (error) {
    console.error('Error fetching pending blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending blogs',
      error: error.message,
    });
  }
};

// Approve blog (admin only)
export const approveBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }
    
    await blog.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });
    
    const updatedBlog = await Blog.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
    
    res.json({
      success: true,
      message: 'Blog approved successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error approving blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve blog',
      error: error.message,
    });
  }
};

// Reject blog (admin only)
export const rejectBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByPk(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }
    
    await blog.update({
      status: 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Blog rejected successfully',
    });
  } catch (error) {
    console.error('Error rejecting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject blog',
      error: error.message,
    });
  }
};

// Get my blogs (doctor)
export const getMyBlogs = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        blogs: []
      });
    }

    // Check actual column names in database
    const [columnCheck] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'blogs'
      AND table_schema = 'public'
      AND column_name IN ('created_at', 'createdAt', 'updated_at', 'updatedAt', 'author_id', 'authorId');
    `);
    
    const actualColumnNames = columnCheck.map(c => c.column_name);
    const usesCamelCase = actualColumnNames.includes('createdAt');
    const createdAtCol = usesCamelCase ? 'createdAt' : 'created_at';
    const updatedAtCol = usesCamelCase ? 'updatedAt' : 'updated_at';
    const authorIdCol = usesCamelCase ? 'authorId' : 'author_id';
    
    // Use quoted column names if camelCase
    const createdAtColQuoted = usesCamelCase ? '"createdAt"' : 'created_at';
    const updatedAtColQuoted = usesCamelCase ? '"updatedAt"' : 'updated_at';
    const authorIdColQuoted = usesCamelCase ? '"authorId"' : 'author_id';
    
    // Use raw SQL to fetch blogs with proper column mapping
    const [blogRows] = await sequelize.query(`
      SELECT 
        b.id,
        b.title,
        b.excerpt,
        b.content,
        b.category,
        b.image,
        b.tags,
        b.views,
        b.comments,
        b.status,
        b.${authorIdColQuoted} as "authorId",
        b.${createdAtColQuoted} as "createdAt",
        b.${updatedAtColQuoted} as "updatedAt",
        u.id as "author.id",
        u.name as "author.name",
        u.email as "author.email"
      FROM blogs b
      LEFT JOIN users u ON b.${authorIdColQuoted}::text = u.id::text
      WHERE b.${authorIdColQuoted} = :authorId::uuid
      ORDER BY b.${createdAtColQuoted} DESC;
    `, {
      replacements: { authorId: String(req.user.id).trim() },
      type: sequelize.QueryTypes.SELECT,
    });
    
    // Transform the results to match expected format
    const blogs = (blogRows || []).map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      category: row.category,
      image: row.image,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      views: row.views || 0,
      comments: row.comments || 0,
      status: row.status || 'pending',
      authorId: row.authorId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: row['author.id'] ? {
        id: row['author.id'],
        name: row['author.name'],
        email: row['author.email'],
      } : null,
    }));
    
    res.json({
      success: true,
      blogs: blogs || [],
    });
  } catch (error) {
    console.error('Error fetching my blogs:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.original);
    }
    
    // Always return 200 with empty array for better UX
    res.status(200).json({
      success: true,
      blogs: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

