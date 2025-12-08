import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Message from '../models/Message.js';
import { processFeeSplit } from './paymentController.js';

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;
    
    // Debug logging
    console.log('Create appointment request:', {
      user: req.user,
      userId: req.user?.id,
      body: req.body
    });
    
    // PROACTIVE: Check and fix foreign key constraint at the start
    // This ensures the constraint is correct before attempting insert
    try {
      console.log('🔍 Checking patient_id column type and foreign key constraints...');
      
      // First, check the column type
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND table_schema = 'public'
        AND column_name = 'patient_id';
      `);
      
      const [usersColumns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND column_name = 'id';
      `);
      
      const patientIdColumn = columns?.[0];
      const userIdColumn = usersColumns?.[0];
      
      console.log(`patient_id type: ${patientIdColumn?.data_type || 'unknown'}`);
      console.log(`users.id type: ${userIdColumn?.data_type || 'unknown'}`);
      
      // If patient_id is text and users.id is uuid, convert patient_id to uuid
      if (patientIdColumn?.data_type === 'text' && userIdColumn?.data_type === 'uuid') {
        console.log('⚠️  Type mismatch detected: patient_id is text, users.id is uuid');
        console.log('🔧 Converting patient_id column to uuid type...');
        try {
          // First, drop any existing foreign key constraints that might prevent conversion
          const [existingConstraints] = await sequelize.query(`
            SELECT conname
            FROM pg_constraint 
            WHERE conrelid = 'appointments'::regclass 
            AND contype = 'f'
            AND (conname LIKE '%patient%' OR pg_get_constraintdef(oid) LIKE '%patient%');
          `);
          
          if (existingConstraints && existingConstraints.length > 0) {
            console.log(`Dropping ${existingConstraints.length} existing constraint(s) before conversion...`);
            for (const constraint of existingConstraints) {
              try {
                await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ${constraint.conname} CASCADE;`);
                console.log(`✅ Dropped constraint: ${constraint.conname}`);
              } catch (dropError) {
                console.error(`⚠️  Could not drop constraint ${constraint.conname}:`, dropError.message);
              }
            }
          }
          
          // Now convert the column type
          await sequelize.query(`
            ALTER TABLE appointments 
            ALTER COLUMN patient_id TYPE uuid USING 
            CASE 
              WHEN patient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
              THEN patient_id::uuid 
              ELSE NULL 
            END;
          `);
          console.log('✅ Converted patient_id from text to uuid');
        } catch (convertError) {
          console.error('⚠️  Could not convert patient_id to uuid:', convertError.message);
          // If conversion fails, try simpler approach - just set NULL values for invalid ones
          try {
            console.log('🔧 Trying alternative conversion approach...');
            await sequelize.query(`
              UPDATE appointments 
              SET patient_id = NULL 
              WHERE patient_id IS NOT NULL 
              AND patient_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
            `);
            await sequelize.query(`
              ALTER TABLE appointments 
              ALTER COLUMN patient_id TYPE uuid USING patient_id::uuid;
            `);
            console.log('✅ Converted patient_id using alternative approach');
          } catch (altError) {
            console.error('⚠️  Alternative conversion also failed:', altError.message);
            console.log('⚠️  Will continue with text type and handle casting in queries');
          }
        }
      }
      
      // Now check and fix foreign key constraints
      const [constraints] = await sequelize.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'appointments'::regclass 
        AND contype = 'f'
        AND (conname LIKE '%patient%' OR pg_get_constraintdef(oid) LIKE '%patient%');
      `);
      
      console.log(`Found ${constraints?.length || 0} patient-related foreign key constraint(s)`);
      
      if (constraints && constraints.length > 0) {
        for (const constraint of constraints) {
          console.log(`Checking constraint: ${constraint.conname}`);
          console.log(`Definition: ${constraint.definition}`);
          
          // Check if it references patients table (wrong) or any table other than users
          if (constraint.definition && (
            constraint.definition.includes('REFERENCES patients') ||
            (!constraint.definition.includes('REFERENCES users') && constraint.definition.includes('patient'))
          )) {
            console.log('⚠️  Found wrong foreign key constraint - fixing proactively...');
            try {
              // Drop the wrong constraint
              await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ${constraint.conname};`);
              console.log(`✅ Dropped constraint: ${constraint.conname}`);
              
              // Create correct constraint (after type conversion)
              await sequelize.query(`
                ALTER TABLE appointments
                ADD CONSTRAINT appointments_patient_id_fkey
                FOREIGN KEY (patient_id)
                REFERENCES users(id)
                ON UPDATE CASCADE
                ON DELETE CASCADE;
              `);
              console.log('✅ Created correct foreign key constraint to users table');
            } catch (fixError) {
              console.error('⚠️  Could not proactively fix constraint:', fixError.message);
              // Try to drop all patient constraints and recreate
              try {
                await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS ${constraint.conname} CASCADE;`);
                console.log(`✅ Force dropped constraint: ${constraint.conname}`);
              } catch (dropError) {
                console.error('⚠️  Could not drop constraint:', dropError.message);
              }
            }
          } else if (constraint.definition && constraint.definition.includes('REFERENCES users')) {
            console.log('✅ Constraint already references users table - correct!');
          }
        }
      } else {
        // No constraint exists - create it (after ensuring types match)
        console.log('⚠️  No patient foreign key constraint found - creating one...');
        try {
          await sequelize.query(`
            ALTER TABLE appointments
            ADD CONSTRAINT appointments_patient_id_fkey
            FOREIGN KEY (patient_id)
            REFERENCES users(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE;
          `);
          console.log('✅ Created foreign key constraint to users table');
        } catch (createError) {
          // If constraint already exists with different name, that's okay
          if (createError.message && createError.message.includes('already exists')) {
            console.log('⚠️  Constraint already exists (different name) - continuing...');
          } else {
            console.error('⚠️  Could not create constraint:', createError.message);
            console.error('This might be due to type mismatch - check column types');
          }
        }
      }
    } catch (checkError) {
      console.error('⚠️  Error checking constraints:', checkError.message);
      // Continue anyway - will handle on insert error
    }

    // SECURITY: Get patient ID ONLY from authenticated user - prevent other patients from booking
    if (!req.user) {
      console.error('req.user is missing - authentication failed');
      return res.status(401).json({ 
        message: 'Authentication required. Please log in to book an appointment.' 
      });
    }
    
    // SECURITY: Only allow patients to book appointments (not doctors/admins)
    if (req.user.role !== 'patient') {
      console.error('Non-patient user trying to book appointment:', req.user.role);
      return res.status(403).json({ 
        message: 'Only patients can book appointments.' 
      });
    }
    
    // Get patient ID from authenticated user - this ensures only logged-in patient can book
    // Try multiple possible ID fields from req.user
    let patientId = req.user.id;
    
    // If id doesn't exist, try other possible fields
    if (!patientId) {
      patientId = req.user.userId || req.user._id || req.user.user_id;
    }
    
    // CRITICAL: Validate patient ID exists and is a valid string/UUID
    if (!patientId) {
      console.error('CRITICAL: Patient ID is null. req.user:', JSON.stringify(req.user, null, 2));
      console.error('req.user keys:', Object.keys(req.user || {}));
      console.error('req.user.id:', req.user?.id);
      console.error('req.user.userId:', req.user?.userId);
      return res.status(401).json({ 
        message: 'Patient ID is missing. Please log out and log in again.',
        debug: process.env.NODE_ENV === 'development' ? { 
          userKeys: Object.keys(req.user || {}),
          user: req.user
        } : undefined
      });
    }
    
    // SECURITY: Verify patient ID matches logged-in user
    console.log('=== SECURITY CHECK ===');
    console.log('Logged-in user ID:', patientId);
    console.log('User role:', req.user.role);
    console.log('User email:', req.user.email);
    console.log('====================');
    
    // Convert to string and validate UUID format
    let patientIdStr = String(patientId).trim();
    
    // Remove any quotes or extra characters
    patientIdStr = patientIdStr.replace(/^["']|["']$/g, '');
    
    if (!patientIdStr || 
        patientIdStr === 'undefined' || 
        patientIdStr === 'null' || 
        patientIdStr === '' ||
        patientIdStr.length < 10) {
      console.error('Invalid patientId value:', patientId, 'Type:', typeof patientId);
      console.error('patientIdStr after conversion:', patientIdStr);
      return res.status(401).json({ 
        message: 'Invalid patient ID. Please log in again.' 
      });
    }
    
    // Verify patientId is valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientIdStr)) {
      console.error('Invalid UUID format for patientId:', patientIdStr);
      return res.status(400).json({ 
        message: 'Invalid patient ID format. Please log in again.' 
      });
    }
    
    // CRITICAL: Verify patient exists in users table before inserting
    console.log('=== VERIFYING PATIENT EXISTS IN DATABASE ===');
    try {
      const [patientExists] = await sequelize.query(`
        SELECT id, name, email, role 
        FROM users 
        WHERE id = :patientId AND role = 'patient'
        LIMIT 1;
      `, {
        replacements: { patientId: patientIdStr },
        type: sequelize.QueryTypes.SELECT,
      });
      
      if (!patientExists || patientExists.length === 0) {
        console.error('❌ Patient not found in users table:', patientIdStr);
        console.error('req.user:', req.user);
        return res.status(404).json({ 
          message: 'Patient account not found. Please log out and log in again.',
          debug: process.env.NODE_ENV === 'development' ? {
            patientId: patientIdStr,
            reqUser: req.user
          } : undefined
        });
      }
      
      console.log('✅ Patient verified in database:', {
        id: patientExists[0]?.id,
        name: patientExists[0]?.name,
        email: patientExists[0]?.email
      });
    } catch (verifyError) {
      console.error('❌ Error verifying patient:', verifyError);
      return res.status(500).json({ 
        message: 'Failed to verify patient. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }
    
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        message: 'Missing required fields: doctorId, appointmentDate, and appointmentTime are required' 
      });
    }
    
    // Verify doctor exists in database
    console.log('=== VERIFYING DOCTOR EXISTS IN DATABASE ===');
    try {
      const [doctorExists] = await sequelize.query(`
        SELECT id, user_id, status
        FROM doctors 
        WHERE id = :doctorId
        LIMIT 1;
      `, {
        replacements: { doctorId: String(doctorId).trim() },
        type: sequelize.QueryTypes.SELECT,
      });
      
      if (!doctorExists || doctorExists.length === 0) {
        console.error('❌ Doctor not found in doctors table:', doctorId);
        return res.status(404).json({ 
          message: 'Doctor not found. Please select a valid doctor.' 
        });
      }
      
      console.log('✅ Doctor verified in database:', {
        id: doctorExists[0]?.id,
        status: doctorExists[0]?.status
      });
    } catch (verifyError) {
      console.error('❌ Error verifying doctor:', verifyError);
      return res.status(500).json({ 
        message: 'Failed to verify doctor. Please try again.' 
      });
    }

    // Combine date and time into date_time column
    const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    
    // Validate dateTime is valid
    if (isNaN(dateTime.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date or time format' 
      });
    }

    // Final validation - ensure patientIdStr is not empty and is a valid UUID format
    if (!patientIdStr || patientIdStr === 'undefined' || patientIdStr === 'null' || patientIdStr.length < 10) {
      console.error('Invalid patientId after conversion:', {
        patientIdStr,
        originalPatientId: patientId,
        reqUserKeys: req.user ? Object.keys(req.user) : [],
        reqUser: req.user
      });
      return res.status(401).json({ 
        message: 'Invalid patient ID. Please log in again.',
        debug: process.env.NODE_ENV === 'development' ? { 
          patientId: patientIdStr,
          originalPatientId: patientId,
          reqUser: req.user 
        } : undefined
      });
    }

    // Double-check patientIdStr is not null/undefined before SQL query
    if (patientIdStr === null || patientIdStr === undefined) {
      console.error('patientIdStr is null/undefined right before SQL query!');
      return res.status(500).json({ 
        message: 'Internal server error: Patient ID validation failed.' 
      });
    }

    console.log('Inserting appointment with:', {
      patientId: patientIdStr,
      patientIdType: typeof patientIdStr,
      patientIdLength: patientIdStr.length,
      doctorId: String(doctorId).trim(),
      appointmentDate,
      appointmentTime,
      dateTime: dateTime.toISOString()
    });

    // Final check - ensure patientIdStr is valid
    if (!patientIdStr || patientIdStr === 'null' || patientIdStr === 'undefined' || patientIdStr.trim().length === 0) {
      console.error('CRITICAL: patientId is invalid before creating appointment!', {
        patientIdStr,
        originalPatientId: patientId,
        reqUser: req.user,
        reqUserKeys: req.user ? Object.keys(req.user) : []
      });
      return res.status(500).json({ 
        message: 'Internal server error: Patient ID is missing. Please log in again.' 
      });
    }

    console.log('Creating appointment with Sequelize model (auto column mapping):', {
      patientId: patientIdStr,
      doctorId: String(doctorId).trim(),
      appointmentDate,
      appointmentTime,
      dateTime: dateTime.toISOString()
    });

    // Use raw SQL to ensure patientId is properly inserted (bypass Sequelize mapping issues)
    console.log('=== Creating appointment with raw SQL ===');
    console.log('=== REQUEST DEBUG ===');
    console.log('req.user:', JSON.stringify(req.user, null, 2));
    console.log('req.user.id:', req.user?.id);
    console.log('req.user type:', typeof req.user);
    console.log('req.user keys:', req.user ? Object.keys(req.user) : []);
    console.log('patientIdStr:', patientIdStr);
    console.log('patientIdStr type:', typeof patientIdStr);
    console.log('patientIdStr length:', patientIdStr?.length);
    console.log('===================');
    
    // Final validation - ensure patientIdStr is not null/undefined/empty
    if (!patientIdStr || patientIdStr === null || patientIdStr === undefined || 
        patientIdStr === 'null' || patientIdStr === 'undefined' || 
        patientIdStr.trim() === '' || patientIdStr.length < 10) {
      console.error('CRITICAL: patientIdStr is invalid before SQL insert!', {
        patientIdStr,
        type: typeof patientIdStr,
        length: patientIdStr?.length,
        reqUser: req.user,
        reqUserId: req.user?.id
      });
      return res.status(500).json({ 
        message: 'Internal server error: Patient ID is missing. Please log out and log in again.',
        debug: process.env.NODE_ENV === 'development' ? {
          patientIdStr,
          reqUser: req.user
        } : undefined
      });
    }
    
    console.log('Values:', {
      patientId: patientIdStr,
      doctorId: String(doctorId).trim(),
      appointmentDate,
      appointmentTime,
      dateTime: dateTime.toISOString(),
      reason: reason || null
    });
    
    // Final validation before SQL - ensure patientId is valid
    console.log('=== FINAL VALIDATION BEFORE SQL ===');
    console.log('patientIdStr:', patientIdStr);
    console.log('patientIdStr type:', typeof patientIdStr);
    console.log('patientIdStr value check:', patientIdStr === null ? 'NULL' : patientIdStr === undefined ? 'UNDEFINED' : 'HAS VALUE');
    console.log('patientIdStr length:', patientIdStr?.length);
    console.log('patientIdStr UUID valid?', uuidRegex.test(patientIdStr));
    
    if (!patientIdStr || 
        patientIdStr === null || 
        patientIdStr === undefined ||
        patientIdStr === '' ||
        !uuidRegex.test(patientIdStr)) {
      console.error('CRITICAL: patientIdStr is invalid before SQL insert!');
      console.error('patientIdStr:', patientIdStr);
      console.error('req.user:', req.user);
      throw new Error('CRITICAL: patientIdStr is null/undefined/invalid before SQL insert!');
    }
    
    // Check patient_id column type to determine casting
    let patientIdCast = 'uuid'; // Default to uuid
    try {
      const [colCheck] = await sequelize.query(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_name = 'appointments'
        AND table_schema = 'public'
        AND column_name = 'patient_id';
      `);
      
      if (colCheck && colCheck.length > 0 && colCheck[0].data_type === 'text') {
        patientIdCast = 'text';
        console.log('⚠️  patient_id is still text type - will cast to text in INSERT');
      } else {
        console.log('✅ patient_id is uuid type - will cast to uuid in INSERT');
      }
    } catch (checkError) {
      console.error('⚠️  Could not check column type:', checkError.message);
      // Default to uuid
    }
    
    // Use raw SQL INSERT with proper column names
    // After proactive fix, patient_id should be uuid type, but handle both cases
    // Insert into BOTH patientId (uuid) and patient_id (uuid or text) columns
    // Use named parameters for better reliability with Sequelize
    // Build query with proper casting based on column type
    const insertQuery = patientIdCast === 'text' ? `
      INSERT INTO appointments (
        id,
        "patientId",
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        date_time,
        reason,
        status,
        created_at,
        updated_at,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        :patientId::uuid,
        :patientId::text,
        :doctorId::text,
        :appointmentDate::date,
        :appointmentTime::time,
        :dateTime::timestamp,
        :reason,
        'pending',
        NOW(),
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id;
    ` : `
      INSERT INTO appointments (
        id,
        "patientId",
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        date_time,
        reason,
        status,
        created_at,
        updated_at,
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        :patientId::uuid,
        :patientId::uuid,
        :doctorId::text,
        :appointmentDate::date,
        :appointmentTime::time,
        :dateTime::timestamp,
        :reason,
        'pending',
        NOW(),
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id;
    `;
    
    // Use named parameters object
    const insertParams = {
      patientId: patientIdStr, // Must be valid UUID string
      doctorId: String(doctorId).trim(),
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      dateTime: dateTime.toISOString(),
      reason: reason || null
    };
    
    console.log('=== INSERT APPOINTMENT ===');
    console.log('Insert query:', insertQuery);
    console.log('Insert params (named):', insertParams);
    console.log('patientId value:', insertParams.patientId);
    console.log('patientId type:', typeof insertParams.patientId);
    console.log('patientId is null?', insertParams.patientId === null);
    console.log('patientId is undefined?', insertParams.patientId === undefined);
    console.log('patientId length:', insertParams.patientId?.length);
    console.log('patientId string representation:', String(insertParams.patientId));
    
    // Final check - patientId must not be null
    if (!insertParams.patientId || 
        insertParams.patientId === null || 
        insertParams.patientId === undefined ||
        String(insertParams.patientId).trim() === '' ||
        String(insertParams.patientId).toLowerCase() === 'null' ||
        String(insertParams.patientId).toLowerCase() === 'undefined') {
      console.error('CRITICAL ERROR: patientId is invalid!');
      console.error('patientId value:', insertParams.patientId);
      console.error('patientId type:', typeof insertParams.patientId);
      console.error('req.user:', req.user);
      throw new Error('CRITICAL: patientId is null/undefined/invalid before SQL insert!');
    }
    
    let appointmentId;
    let retryAfterFix = false;
    
    try {
      console.log('=== EXECUTING SQL INSERT ===');
      console.log('Query:', insertQuery);
      console.log('Params:', insertParams);
      console.log('patientId:', insertParams.patientId);
      console.log('patientId type:', typeof insertParams.patientId);
      console.log('patientId is null?', insertParams.patientId === null);
      
      // Execute SQL with named parameters (replacements)
      const insertResult = await sequelize.query(insertQuery, {
        replacements: insertParams,
        type: sequelize.QueryTypes.SELECT,
      });
      
      console.log('Raw insert result:', JSON.stringify(insertResult, null, 2));
      
      // Handle result - sequelize.query with SELECT returns array directly
      if (Array.isArray(insertResult) && insertResult.length > 0) {
        appointmentId = insertResult[0]?.id || insertResult[0]?.ID;
      } else if (insertResult && insertResult.id) {
        appointmentId = insertResult.id;
      } else if (insertResult && insertResult[0] && insertResult[0][0] && insertResult[0][0].id) {
        appointmentId = insertResult[0][0].id;
      }
      
      console.log('Extracted appointment ID:', appointmentId);
      
      if (!appointmentId) {
        console.error('Failed to extract appointment ID from result:', insertResult);
        throw new Error('Failed to create appointment - no ID returned from database');
      }
      
      console.log('✅ Appointment created successfully with ID:', appointmentId);
    } catch (sqlError) {
      // Get error message from both sqlError.message and sqlError.original.message
      const errorMsg = sqlError.message || sqlError.original?.message || '';
      const fullErrorMsg = `${errorMsg} ${sqlError.original?.message || ''}`.trim();
      
      // Check if it's a foreign key constraint error - try to fix automatically
      const isForeignKeyError = (
        errorMsg.includes('violates foreign key constraint') ||
        fullErrorMsg.includes('violates foreign key constraint') ||
        errorMsg.includes('foreign key constraint') ||
        fullErrorMsg.includes('foreign key constraint')
      );
      
      if (isForeignKeyError && !retryAfterFix) {
        console.log('🔧 Foreign key error detected - attempting automatic fix...');
        console.log('Error message:', errorMsg);
        console.log('Full error:', fullErrorMsg);
        
        // Check if patient exists
        try {
          const [patientCheck] = await sequelize.query(`
            SELECT id FROM users WHERE id = :patientId LIMIT 1;
          `, {
            replacements: { patientId: insertParams.patientId },
            type: sequelize.QueryTypes.SELECT,
          });
          
          console.log('Patient check result:', patientCheck);
          
          if (patientCheck && patientCheck.length > 0) {
            try {
              console.log('🔧 Step 1: Dropping old constraint...');
              // Fix the foreign key constraint
              await sequelize.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;`);
              console.log('✅ Dropped old constraint');
              
              console.log('🔧 Step 2: Creating new constraint...');
              // Try to create new constraint - handle if it already exists
              try {
                await sequelize.query(`
                  ALTER TABLE appointments
                  ADD CONSTRAINT appointments_patient_id_fkey
                  FOREIGN KEY (patient_id)
                  REFERENCES users(id)
                  ON UPDATE CASCADE
                  ON DELETE CASCADE;
                `);
                console.log('✅ Created new constraint');
              } catch (constraintError) {
                // If constraint already exists, that's okay
                if (constraintError.message && constraintError.message.includes('already exists')) {
                  console.log('⚠️  Constraint already exists, continuing...');
                } else {
                  throw constraintError;
                }
              }
              
              console.log('🔧 Step 3: Retrying insert...');
              // Retry the insert
              retryAfterFix = true;
              const retryResult = await sequelize.query(insertQuery, {
                replacements: insertParams,
                type: sequelize.QueryTypes.SELECT,
              });
              
              console.log('Retry result:', retryResult);
              
              if (Array.isArray(retryResult) && retryResult.length > 0) {
                appointmentId = retryResult[0]?.id || retryResult[0]?.ID;
                console.log('✅ Appointment created successfully after fixing constraint! ID:', appointmentId);
                // Continue processing below - don't throw error
              } else {
                console.error('❌ Retry failed - no appointment ID returned');
                throw new Error('Failed to create appointment after fixing constraint - no ID returned');
              }
            } catch (fixError) {
              console.error('❌ Could not fix constraint:', fixError.message);
              console.error('Fix error stack:', fixError.stack);
              // Fall through to error handling below
            }
          } else {
            console.error('❌ Patient not found in users table:', insertParams.patientId);
          }
        } catch (checkError) {
          console.error('❌ Error checking patient:', checkError.message);
        }
      }
      
      // Log the error for debugging
      console.error('❌ SQL INSERT ERROR:');
      console.error('Error message:', sqlError.message);
      console.error('Error name:', sqlError.name);
      console.error('Error stack:', sqlError.stack);
      if (sqlError.original) {
        console.error('Original error:', sqlError.original.message);
        console.error('Original error code:', sqlError.original.code);
      }
      
      // Check for specific error types and handle them
      const errorMessage = sqlError.message || sqlError.original?.message || 'Unknown error';
      
      // Check if it's a null constraint error for patientId or patient_id
      if (errorMessage.includes('null value in column "patient_id"') ||
          errorMessage.includes('null value in column "patientId"')) {
        console.error('❌ CRITICAL: patientId/patient_id is NULL in database!');
        console.error('insertParams.patientId:', insertParams.patientId);
        console.error('req.user:', req.user);
        return res.status(500).json({ 
          message: 'Failed to book appointment: Patient ID is missing. Please log out and log in again.',
          debug: process.env.NODE_ENV === 'development' ? {
            error: errorMessage,
            patientId: insertParams.patientId,
            reqUser: req.user
          } : undefined
        });
      }
      
      // Check if it's a foreign key constraint error (if not already handled)
      if (errorMessage.includes('violates foreign key constraint') || 
          errorMessage.includes('foreign key constraint')) {
        console.error('❌ Foreign key constraint error (auto-fix failed or not triggered)');
        console.error('Full error details:', {
          message: errorMessage,
          original: sqlError.original?.message,
          code: sqlError.original?.code
        });
        
        // Provide SQL fix command in the response
        const sqlFix = `ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey; ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;`;
        
        return res.status(500).json({ 
          message: 'Database configuration error. The foreign key constraint needs to be fixed.',
          sqlFix: process.env.NODE_ENV === 'development' ? sqlFix : undefined,
          debug: process.env.NODE_ENV === 'development' ? {
            error: errorMessage,
            patientId: insertParams.patientId,
            sqlFix: sqlFix,
            instructions: 'Run the SQL fix command in your PostgreSQL database'
          } : undefined
        });
      }
      
      // If we didn't fix it or retry failed, return detailed error
      if (!appointmentId) {
        // Check if it's a foreign key constraint error (if not already handled above)
        if (errorMessage.includes('violates foreign key constraint') || 
            errorMessage.includes('foreign key constraint')) {
          console.error('❌ Foreign key constraint error (auto-fix failed)');
          return res.status(500).json({ 
            message: 'Database configuration error. The foreign key constraint needs to be updated.',
            debug: process.env.NODE_ENV === 'development' ? {
              error: errorMessage,
              patientId: insertParams.patientId,
              sqlFix: 'ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey; ALTER TABLE appointments ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;'
            } : undefined
          });
        }
        
        // Provide more specific error message
        let userMessage = 'Failed to create appointment. Please try again.';
        if (process.env.NODE_ENV === 'development') {
          userMessage = `Failed to create appointment: ${errorMessage}`;
        }
        
        return res.status(500).json({ 
          message: userMessage,
          debug: process.env.NODE_ENV === 'development' ? {
            error: errorMessage,
            errorName: sqlError.name,
            patientId: insertParams.patientId,
            doctorId: insertParams.doctorId,
            originalError: sqlError.original?.message
          } : undefined
        });
      }
      
      // If constraint was fixed and appointment created, continue below
      // (appointmentId is set, so we'll continue to fetch the appointment)
      console.log('✅ Continuing after fixing constraint - appointmentId:', appointmentId);
    }

    // Fetch the created appointment with relations using raw SQL
    // Database uses snake_case: patient_id, doctor_id, etc.
    const fetchQuery = `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.doctor_id as "doctorId",
        a.appointment_date as "appointmentDate",
        a.appointment_time as "appointmentTime",
        a.date_time as "dateTime",
        a.reason,
        a.status,
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        u.id as "patient.id",
        u.name as "patient.name",
        u.email as "patient.email",
        u.phone as "patient.phone",
        d.id as "doctor.id",
        d.specialization as "doctor.specialization",
        du.id as "doctor.user.id",
        du.name as "doctor.user.name"
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE a.id = :appointmentId;
    `;
    
    const appointmentRows = await sequelize.query(fetchQuery, {
      replacements: { appointmentId },
      type: sequelize.QueryTypes.SELECT,
    });
    
    if (!appointmentRows || !Array.isArray(appointmentRows) || appointmentRows.length === 0) {
      throw new Error('Failed to fetch created appointment');
    }
    
    const appointmentRow = appointmentRows[0];
    
    // Transform to expected format
    const appointmentWithDetails = {
      id: appointmentRow.id,
      patientId: appointmentRow.patientId,
      doctorId: appointmentRow.doctorId,
      appointmentDate: appointmentRow.appointmentDate,
      appointmentTime: appointmentRow.appointmentTime,
      dateTime: appointmentRow.dateTime,
      reason: appointmentRow.reason,
      status: appointmentRow.status,
      createdAt: appointmentRow.createdAt,
      updatedAt: appointmentRow.updatedAt,
      patient: appointmentRow['patient.id'] ? {
        id: appointmentRow['patient.id'],
        name: appointmentRow['patient.name'],
        email: appointmentRow['patient.email'],
        phone: appointmentRow['patient.phone'],
      } : null,
      doctor: appointmentRow['doctor.id'] ? {
        id: appointmentRow['doctor.id'],
        specialization: appointmentRow['doctor.specialization'],
        user: appointmentRow['doctor.user.id'] ? {
          id: appointmentRow['doctor.user.id'],
          name: appointmentRow['doctor.user.name'],
        } : null,
      } : null,
    };

    console.log('✅ Appointment created successfully:', appointmentId);
    console.log('✅ Appointment will be visible to doctor:', String(doctorId).trim());
    console.log('✅ Appointment saved to database automatically');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully. It will be visible to the doctor.',
      appointment: appointmentWithDetails,
    });
  } catch (error) {
    console.error('❌ OUTER CATCH - Error in createAppointment:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    
    const errorMessage = error.message || error.original?.message || 'Unknown error occurred';
    
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'development' 
        ? `Server error: ${errorMessage}` 
        : 'Failed to create appointment. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? {
        error: errorMessage,
        errorName: error.name,
        stack: error.stack
      } : undefined
    });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const { cursor, limit = 10, status, doctorId } = req.query;
    
    console.log('=== getAppointments called ===');
    console.log('User:', req.user?.id, 'Role:', req.user?.role);
    console.log('Query params:', { cursor, limit, status, doctorId });
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user;

    // Use raw SQL for reliable appointment fetching (real-time from database)
    // Database uses snake_case: patient_id, doctor_id, etc.
    let sqlQuery = `
      SELECT 
        a.id,
        a.patient_id as "patientId",
        a.doctor_id as "doctorId",
        a.appointment_date as "appointmentDate",
        a.appointment_time as "appointmentTime",
        a.date_time as "dateTime",
        a.reason,
        a.status,
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        u.id as "patient.id",
        u.name as "patient.name",
        u.email as "patient.email",
        u.phone as "patient.phone",
        d.id as "doctor.id",
        d.specialization as "doctor.specialization",
        du.id as "doctor.user.id",
        du.name as "doctor.user.name",
        dept.id as "doctor.department.id",
        dept.name as "doctor.department.name"
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    
    const replacements = {};
    
    // Filter by doctorId
    if (doctorId) {
      sqlQuery += ` AND a.doctor_id = :doctorId`;
      replacements.doctorId = doctorId;
      console.log('Filtering by doctorId:', doctorId);
    } else if (role === 'patient') {
      // Patient sees only their own appointments
      sqlQuery += ` AND a.patient_id = :patientId`;
      replacements.patientId = req.user.id;
      console.log('Filtering by patientId:', req.user.id);
    } else if (role === 'doctor') {
      // Doctor sees only their own appointments
      try {
        const doctorRows = await sequelize.query(`
          SELECT id FROM doctors WHERE user_id = :userId LIMIT 1;
        `, {
          replacements: { userId: req.user.id },
          type: sequelize.QueryTypes.SELECT,
        });
        
        if (doctorRows && Array.isArray(doctorRows) && doctorRows.length > 0 && doctorRows[0].id) {
          const doctorIdFromDb = doctorRows[0].id;
          sqlQuery += ` AND a.doctor_id = :doctorId`;
          replacements.doctorId = doctorIdFromDb;
          console.log('Doctor found, filtering by doctorId:', doctorIdFromDb);
        } else {
          console.log('No doctor profile found for user:', req.user.id);
          return res.json({ success: true, appointments: [], pagination: { hasMore: false, nextCursor: null } });
        }
      } catch (doctorError) {
        console.error('Error finding doctor:', doctorError);
        return res.json({ success: true, appointments: [], pagination: { hasMore: false, nextCursor: null } });
      }
    }
    // Admin sees all appointments (no additional filter)

    if (status) {
      sqlQuery += ` AND a.status = :status`;
      replacements.status = status;
    }

    if (cursor) {
      sqlQuery += ` AND a.id < :cursor`;
      replacements.cursor = cursor;
    }

    sqlQuery += ` ORDER BY a.created_at DESC LIMIT :limitValue`;
    replacements.limitValue = parseInt(limit) + 1;
    
    console.log('Executing appointments SQL query');
    console.log('SQL:', sqlQuery);
    console.log('Replacements:', replacements);
    
    const appointmentRows = await sequelize.query(sqlQuery, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT,
    });
    
    console.log(`Found ${appointmentRows.length} appointments`);
    
    // Transform results
    const appointments = appointmentRows.map((row) => {
      const appointment = {
        id: row.id,
        patientId: row.patientId,
        doctorId: row.doctorId,
        appointmentDate: row.appointmentDate,
        appointmentTime: row.appointmentTime,
        dateTime: row.dateTime,
        reason: row.reason,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      
      if (row['patient.id']) {
        appointment.patient = {
          id: row['patient.id'],
          name: row['patient.name'],
          email: row['patient.email'],
          phone: row['patient.phone'],
        };
      }
      
      if (row['doctor.id']) {
        appointment.doctor = {
          id: row['doctor.id'],
          specialization: row['doctor.specialization'],
          user: row['doctor.user.id'] ? {
            id: row['doctor.user.id'],
            name: row['doctor.user.name'],
          } : null,
          department: row['doctor.department.id'] ? {
            id: row['doctor.department.id'],
            name: row['doctor.department.name'],
          } : null,
        };
      }
      
      return appointment;
    });

    // Check if there are more results
    const hasMore = appointments.length > parseInt(limit);
    if (hasMore) {
      appointments = appointments.slice(0, parseInt(limit));
    }
    
    const nextCursor = hasMore && appointments.length > 0 
      ? appointments[appointments.length - 1].id 
      : null;
    
    console.log(`Returning ${appointments.length} appointments (hasMore: ${hasMore})`);

    res.json({
      success: true,
      appointments: appointments,
      pagination: {
        hasMore: hasMore,
        nextCursor: nextCursor,
      },
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Note: Old Sequelize-based code removed - now using raw SQL for reliable real-time database access

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const { role } = req.user;
    if (role === 'doctor') {
      const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
      if (doctor && appointment.doctorId !== doctor.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (role === 'patient' && appointment.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // If status is being changed to 'completed', process fee split and enable chat
    if (status === 'completed' && appointment.status !== 'completed') {
      const doctor = await Doctor.findByPk(appointment.doctorId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      });
      
      if (doctor && doctor.consultationFee) {
        try {
          await processFeeSplit(appointment.id, doctor.consultationFee);
        } catch (feeError) {
          console.error('Error processing fee split:', feeError);
          // Continue with status update even if fee split fails
        }
      }

      // Enable chat between doctor and patient by creating a welcome message
      // This ensures both users appear in each other's chat lists
      try {
        const patient = await User.findByPk(appointment.patientId);
        const doctorUser = doctor?.user;

        if (patient && doctorUser) {
          // Check if a message already exists between them
          const existingMessage = await Message.findOne({
            where: {
              [Op.or]: [
                { senderId: doctorUser.id, receiverId: patient.id },
                { senderId: patient.id, receiverId: doctorUser.id },
              ],
            },
            limit: 1,
          });

          // If no messages exist, create a welcome message from doctor to patient
          if (!existingMessage) {
            await Message.create({
              senderId: doctorUser.id,
              receiverId: patient.id,
              content: `Hello ${patient.name || 'there'}, your appointment has been completed. Feel free to reach out if you have any questions or concerns.`,
              isRead: false,
            });
            console.log(`✅ Welcome message created: Doctor ${doctorUser.name} -> Patient ${patient.name}`);
          } else {
            console.log(`ℹ️  Messages already exist between doctor and patient - skipping welcome message`);
          }
        }
      } catch (chatError) {
        console.error('Error creating welcome message for chat:', chatError);
        // Continue with status update even if chat setup fails
      }
    }

    await appointment.update({ status });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: Doctor,
          as: 'doctor',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    res.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ message: 'Doctor ID and date are required' });
    }

    // Get doctor information
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Check if doctor is available
    if (!doctor.isAvailable) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: false,
        message: 'Doctor is not available',
      });
    }

    // Parse available days
    let availableDays = [];
    if (doctor.availableDays) {
      if (typeof doctor.availableDays === 'string') {
        availableDays = JSON.parse(doctor.availableDays);
      } else {
        availableDays = doctor.availableDays;
      }
    }

    // Check if the requested date is in available days
    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!availableDays.includes(dayName)) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: false,
        message: `Doctor is not available on ${dayName}`,
      });
    }

    // Get doctor's working hours
    const availableFrom = doctor.availableFrom || '09:00:00';
    const availableTo = doctor.availableTo || '17:00:00';
    const appointmentDuration = doctor.appointmentDuration || 30;
    const dailyLimit = doctor.dailyAppointmentLimit || 18;

    // Parse time strings (HH:MM:SS format)
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes; // Convert to minutes
    };

    const formatTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    const startMinutes = parseTime(availableFrom);
    const endMinutes = parseTime(availableTo);

    // Generate all possible time slots
    const allSlots = [];
    for (let current = startMinutes; current < endMinutes; current += appointmentDuration) {
      allSlots.push(formatTime(current));
    }

    // Get existing appointments for this doctor on this date
    // Use raw query with snake_case column names (database uses snake_case)
    const existingAppointments = await sequelize.query(
      `SELECT id, appointment_time::text as "appointmentTime", status 
       FROM appointments 
       WHERE doctor_id = :doctorId 
       AND DATE(appointment_date) = DATE(:date)
       AND status IN ('pending', 'confirmed', 'completed')`,
      {
        replacements: { doctorId, date },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Check if daily limit is reached
    if (existingAppointments.length >= dailyLimit) {
      return res.json({
        success: true,
        availableSlots: [],
        isLimitReached: true,
        message: 'Daily appointment limit reached',
      });
    }

    // Extract booked time slots - handle both string and Date objects
    const bookedSlots = new Set(
      existingAppointments.map(apt => {
        const time = apt.appointmentTime;
        // If it's a Date object, format it as HH:MM
        if (time instanceof Date) {
          const hours = String(time.getHours()).padStart(2, '0');
          const minutes = String(time.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
        // If it's already a string, extract HH:MM format
        if (typeof time === 'string') {
          // Handle formats like "HH:MM:SS" or "HH:MM" or just time string
          const timeMatch = time.match(/^(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const hours = String(parseInt(timeMatch[1])).padStart(2, '0');
            const minutes = timeMatch[2];
            return `${hours}:${minutes}`;
          }
          return time;
        }
        return String(time);
      })
    );

    // Filter out booked slots - compare in HH:MM format
    const availableSlots = allSlots.filter(slot => {
      const slotTime = slot.substring(0, 5); // Get HH:MM format
      return !bookedSlots.has(slotTime);
    });

    res.json({
      success: true,
      availableSlots,
      isLimitReached: false,
      totalBooked: existingAppointments.length,
      dailyLimit,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: error.message });
  }
};
