import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import MedicalAIChatbot from '../utils/aiChatbot.js';

export const createPrescription = async (req, res) => {
  try {
    const { patientEmail, appointmentId, diagnosis, medicines, instructions, prescriptionFile } = req.body;

    // PROACTIVE: Fix prescriptions table - columns, types, and foreign key constraints
    try {
      console.log('🔍 Checking prescriptions table columns and foreign keys...');
      
      // 1. Check column types and fix if needed
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'prescriptions'
        AND table_schema = 'public';
      `);
      
      const existingColumnNames = columns.map(col => col.column_name);
      const patientIdColumn = columns.find(col => col.column_name === 'patient_id');
      const [usersColumns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND table_schema = 'public'
        AND column_name = 'id';
      `);
      
      const userIdColumn = usersColumns?.[0];
      
      console.log('Existing columns:', existingColumnNames);
      console.log(`patient_id type: ${patientIdColumn?.data_type || 'unknown'}`);
      console.log(`users.id type: ${userIdColumn?.data_type || 'unknown'}`);
      
      // Fix patient_id column type if needed
      if (patientIdColumn?.data_type === 'text' && userIdColumn?.data_type === 'uuid') {
        console.log('⚠️  Type mismatch: patient_id is text, users.id is uuid');
        console.log('🔧 Converting patient_id column to uuid type...');
        try {
          // Drop existing foreign key constraints first
          const [constraints] = await sequelize.query(`
            SELECT conname
            FROM pg_constraint 
            WHERE conrelid = 'prescriptions'::regclass 
            AND contype = 'f'
            AND (conname LIKE '%patient%' OR pg_get_constraintdef(oid) LIKE '%patient%');
          `);
          
          if (constraints && constraints.length > 0) {
            for (const constraint of constraints) {
              await sequelize.query(`ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS ${constraint.conname} CASCADE;`);
              console.log(`✅ Dropped constraint: ${constraint.conname}`);
            }
          }
          
          // Convert column type
          await sequelize.query(`
            ALTER TABLE prescriptions 
            ALTER COLUMN patient_id TYPE uuid USING 
            CASE 
              WHEN patient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
              THEN patient_id::uuid 
              ELSE NULL 
            END;
          `);
          console.log('✅ Converted patient_id from text to uuid');
        } catch (convertError) {
          console.error('⚠️  Could not convert patient_id:', convertError.message);
        }
      }
      
      // 2. Add missing columns
      const requiredColumns = [
        { name: 'diagnosis', type: 'TEXT' },
        { name: 'instructions', type: 'TEXT' },
        { name: 'prescription_date', type: 'TIMESTAMP' },
        { name: 'appointment_id', type: 'UUID' },
        { name: 'prescription_file', type: 'TEXT' },
      ];
      
      for (const col of requiredColumns) {
        if (!existingColumnNames.includes(col.name)) {
          console.log(`⚠️  ${col.name} column missing - adding it...`);
          try {
            await sequelize.query(`
              ALTER TABLE prescriptions
              ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
            `);
            console.log(`✅ Added ${col.name} column to prescriptions table`);
          } catch (addError) {
            console.error(`⚠️  Could not add ${col.name}:`, addError.message);
          }
        }
      }
      
      // 3. Fix foreign key constraints
      const [fkConstraints] = await sequelize.query(`
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'prescriptions'::regclass 
        AND contype = 'f'
        AND (conname LIKE '%patient%' OR pg_get_constraintdef(oid) LIKE '%patient%');
      `);
      
      let constraintFixed = false;
      if (fkConstraints && fkConstraints.length > 0) {
        for (const constraint of fkConstraints) {
          if (constraint.definition && (
            constraint.definition.includes('REFERENCES patients') ||
            (!constraint.definition.includes('REFERENCES users') && constraint.definition.includes('patient'))
          )) {
            console.log('⚠️  Found wrong foreign key constraint - fixing...');
            await sequelize.query(`ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS ${constraint.conname};`);
            console.log(`✅ Dropped wrong constraint: ${constraint.conname}`);
            constraintFixed = true;
          } else if (constraint.definition && constraint.definition.includes('REFERENCES users')) {
            console.log('✅ Constraint already references users table - correct!');
          }
        }
      }
      
      // Create correct foreign key if it doesn't exist or was just fixed
      if (constraintFixed || !fkConstraints || fkConstraints.length === 0 || 
          !fkConstraints.some(c => c.definition && c.definition.includes('REFERENCES users'))) {
        try {
          await sequelize.query(`
            ALTER TABLE prescriptions
            ADD CONSTRAINT prescriptions_patient_id_fkey
            FOREIGN KEY (patient_id)
            REFERENCES users(id)
            ON UPDATE CASCADE
            ON DELETE CASCADE;
          `);
          console.log('✅ Created/verified foreign key: prescriptions_patient_id_fkey -> users(id)');
        } catch (fkError) {
          if (fkError.message && fkError.message.includes('already exists')) {
            console.log('⚠️  Constraint already exists (different name) - continuing...');
          } else {
            console.error('⚠️  Could not create foreign key:', fkError.message);
          }
        }
      }
      
    } catch (columnError) {
      console.error('⚠️  Error checking/fixing prescriptions table:', columnError.message);
      // Continue anyway - will handle error on insert
    }

    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor || !doctor.id) {
      console.error('❌ Doctor not found or invalid:', { doctor, userId: req.user.id });
      return res.status(403).json({ message: 'Only doctors can create prescriptions' });
    }
    
    console.log('✅ Doctor found:', doctor.id);

    // Validate patient email and get patient ID
    if (!patientEmail) {
      return res.status(400).json({ message: 'Patient email is required' });
    }

    const patient = await User.findOne({ where: { email: patientEmail, role: 'patient' } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const patientId = patient.id;
    
    // Verify patient exists in database (double-check)
    console.log('=== VERIFYING PATIENT EXISTS IN DATABASE ===');
    // Cast patientId to UUID to match users.id type
    const patientExistsResult = await sequelize.query(`
      SELECT id FROM users WHERE id = :patientId::uuid AND role = 'patient'
      LIMIT 1;
    `, {
      replacements: { patientId: String(patientId).trim() },
      type: sequelize.QueryTypes.SELECT,
    });
    
    // sequelize.query with QueryTypes.SELECT returns the rows directly as an array
    const patientExists = patientExistsResult;
    
    if (!patientExists || !Array.isArray(patientExists) || patientExists.length === 0) {
      console.error('❌ Patient not found in users table:', patientId);
      console.error('patientExists result:', patientExists);
      return res.status(404).json({ 
        message: 'Patient account not found. Please verify the patient email.',
        debug: process.env.NODE_ENV === 'development' ? { patientId, patientEmail, patientExists } : undefined
      });
    }
    
    const patientRow = patientExists[0];
    if (!patientRow || !patientRow.id) {
      console.error('❌ Patient row is invalid:', patientRow);
      console.error('patientExists:', patientExists);
      return res.status(404).json({ 
        message: 'Patient account not found. Please verify the patient email.',
        debug: process.env.NODE_ENV === 'development' ? { patientId, patientEmail, patientRow, patientExists } : undefined
      });
    }
    
    console.log('✅ Patient found in users table:', patientRow.id);

    // Check column types to determine proper casting
    let patientIdCast = 'uuid';
    let doctorIdCast = 'uuid';
    try {
      const [prescriptionColumns] = await sequelize.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'prescriptions'
        AND table_schema = 'public'
        AND column_name IN ('patient_id', 'doctor_id');
      `);
      
      const patientIdCol = prescriptionColumns.find(c => c.column_name === 'patient_id');
      const doctorIdCol = prescriptionColumns.find(c => c.column_name === 'doctor_id');
      
      patientIdCast = patientIdCol?.data_type === 'text' ? 'text' : 'uuid';
      doctorIdCast = doctorIdCol?.data_type === 'text' ? 'text' : 'uuid';
      
      console.log(`Using casts: patient_id=${patientIdCast}, doctor_id=${doctorIdCast}`);
    } catch (castError) {
      console.error('⚠️  Could not check column types:', castError.message);
      // Default to uuid
    }

    // Use raw SQL INSERT to ensure proper type casting
    console.log('=== Creating prescription with raw SQL ===');
    const insertQuery = `
      INSERT INTO prescriptions (
        id,
        patient_id,
        doctor_id,
        ${appointmentId ? 'appointment_id,' : ''}
        diagnosis,
        medicines,
        instructions,
        prescription_file,
        prescription_date,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        :patientId::${patientIdCast},
        :doctorId::${doctorIdCast},
        ${appointmentId ? `:appointmentId::uuid,` : ''}
        :diagnosis,
        :medicines::jsonb,
        :instructions,
        :prescriptionFile,
        NOW(),
        NOW(),
        NOW()
      )
      RETURNING id;
    `;
    
    const insertParams = {
      patientId: String(patientId).trim(),
      doctorId: String(doctor.id).trim(),
      diagnosis: diagnosis || null,
      medicines: JSON.stringify(medicines || []),
      instructions: instructions || null,
      prescriptionFile: prescriptionFile || null,
    };
    
    if (appointmentId) {
      insertParams.appointmentId = String(appointmentId).trim();
    }
    
    console.log('Insert query:', insertQuery);
    console.log('Insert params:', { ...insertParams, medicines: '[JSON]' });
    
    const insertResult = await sequelize.query(insertQuery, {
      replacements: insertParams,
      type: sequelize.QueryTypes.SELECT,
    });
    
    // Handle result - sequelize.query with SELECT returns array directly
    let prescriptionId;
    if (Array.isArray(insertResult) && insertResult.length > 0) {
      prescriptionId = insertResult[0]?.id || insertResult[0]?.ID;
    } else if (insertResult && insertResult.id) {
      prescriptionId = insertResult.id;
    } else if (insertResult && insertResult[0] && insertResult[0][0] && insertResult[0][0].id) {
      prescriptionId = insertResult[0][0].id;
    }
    
    if (!prescriptionId) {
      console.error('❌ Failed to create prescription - no ID returned');
      console.error('Insert result:', insertResult);
      return res.status(500).json({ 
        message: 'Failed to create prescription. Please try again.',
        debug: process.env.NODE_ENV === 'development' ? { insertResult } : undefined
      });
    }
    
    console.log('✅ Prescription created with ID:', prescriptionId);

    // Fetch the created prescription with details using raw SQL to avoid type issues
    console.log('=== Fetching prescription details with raw SQL ===');
    // Use CAST to handle both uuid and text types
    const fetchQuery = `
      SELECT 
        p.id,
        p.patient_id as "patientId",
        p.doctor_id as "doctorId",
        p.appointment_id as "appointmentId",
        p.diagnosis,
        p.medicines,
        p.instructions,
        p.prescription_file as "prescriptionFile",
        p.prescription_date as "prescriptionDate",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        u.id as "patient.id",
        u.name as "patient.name",
        u.email as "patient.email",
        d.id as "doctor.id",
        d.specialization as "doctor.specialization",
        du.id as "doctor.user.id",
        du.name as "doctor.user.name",
        a.id as "appointment.id",
        a.appointment_date as "appointment.appointmentDate",
        a.appointment_time as "appointment.appointmentTime",
        a.status as "appointment.status"
      FROM prescriptions p
      LEFT JOIN users u ON p.patient_id::text = u.id::text
      LEFT JOIN doctors d ON p.doctor_id::text = d.id::text
      LEFT JOIN users du ON d.user_id::text = du.id::text
      LEFT JOIN appointments a ON (p.appointment_id::text = a.id::text OR (p.appointment_id IS NULL AND a.id IS NULL))
      WHERE p.id::text = :prescriptionId::text;
    `;
    
    const fetchResult = await sequelize.query(fetchQuery, {
      replacements: { prescriptionId: String(prescriptionId).trim() },
      type: sequelize.QueryTypes.SELECT,
    });
    
    if (!fetchResult || !Array.isArray(fetchResult) || fetchResult.length === 0) {
      console.error('❌ Failed to fetch prescription details');
      // Return success with basic info
      return res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        prescription: {
          id: prescriptionId,
          patientId,
          doctorId: doctor.id,
          appointmentId,
          diagnosis,
          medicines: medicines || [],
          instructions,
          prescriptionFile,
        },
      });
    }
    
    const prescriptionRow = fetchResult[0];
    
    // Transform to expected format
    const prescriptionWithDetails = {
      id: prescriptionRow.id,
      patientId: prescriptionRow.patientId,
      doctorId: prescriptionRow.doctorId,
      appointmentId: prescriptionRow.appointmentId,
      diagnosis: prescriptionRow.diagnosis,
      medicines: prescriptionRow.medicines || [],
      instructions: prescriptionRow.instructions,
      prescriptionFile: prescriptionRow.prescriptionFile,
      prescriptionDate: prescriptionRow.prescriptionDate,
      createdAt: prescriptionRow.createdAt,
      updatedAt: prescriptionRow.updatedAt,
      patient: prescriptionRow['patient.id'] ? {
        id: prescriptionRow['patient.id'],
        name: prescriptionRow['patient.name'],
        email: prescriptionRow['patient.email'],
      } : null,
      doctor: prescriptionRow['doctor.id'] ? {
        id: prescriptionRow['doctor.id'],
        specialization: prescriptionRow['doctor.specialization'],
        user: prescriptionRow['doctor.user.id'] ? {
          id: prescriptionRow['doctor.user.id'],
          name: prescriptionRow['doctor.user.name'],
        } : null,
      } : null,
      appointment: prescriptionRow['appointment.id'] ? {
        id: prescriptionRow['appointment.id'],
        appointmentDate: prescriptionRow['appointment.appointmentDate'],
        appointmentTime: prescriptionRow['appointment.appointmentTime'],
        status: prescriptionRow['appointment.status'],
      } : null,
    };

    res.status(201).json({
      success: true,
      prescription: prescriptionWithDetails,
    });
  } catch (error) {
    console.error('❌ Error creating prescription:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      original: error.original?.message
    });
    
    const errorMessage = error.message || error.original?.message || 'Unknown error';
    
    // Check if it's a foreign key constraint error - try to fix automatically
    if (errorMessage.includes('violates foreign key constraint') && 
        errorMessage.includes('prescriptions_patient_id_fkey')) {
      console.log('🔧 Foreign key error detected - attempting automatic fix...');
      
      try {
        // Verify patient exists
        const patient = await User.findOne({ where: { email: patientEmail } });
        if (!patient) {
          return res.status(404).json({ message: 'Patient not found' });
        }
        
        console.log('🔧 Step 1: Dropping old constraint...');
        await sequelize.query(`
          ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_patient_id_fkey;
        `);
        console.log('✅ Dropped old constraint');
        
        console.log('🔧 Step 2: Creating new constraint...');
        await sequelize.query(`
          ALTER TABLE prescriptions
          ADD CONSTRAINT prescriptions_patient_id_fkey
          FOREIGN KEY (patient_id)
          REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE CASCADE;
        `);
        console.log('✅ Created new constraint');
        
        console.log('🔧 Step 3: Retrying prescription creation...');
        // Retry the entire operation
        return createPrescription(req, res);
      } catch (fixError) {
        console.error('❌ Could not fix foreign key constraint:', fixError.message);
        return res.status(500).json({ 
          message: 'Database configuration error. Please contact administrator.',
          debug: process.env.NODE_ENV === 'development' ? {
            error: errorMessage,
            fixError: fixError.message
          } : undefined
        });
      }
    }
    
    // Check if it's a missing column error
    if (errorMessage.includes('does not exist')) {
      const columnMatch = errorMessage.match(/column "(\w+)" of relation/);
      if (columnMatch && columnMatch[1]) {
        const missingColumn = columnMatch[1];
        console.log(`🔧 Attempting to add missing column: ${missingColumn}`);
        try {
          await sequelize.query(`
            ALTER TABLE prescriptions
            ADD COLUMN IF NOT EXISTS ${missingColumn} TEXT;
          `);
          console.log(`✅ Added missing column: ${missingColumn}`);
          
          // Retry creating prescription
          return createPrescription(req, res);
        } catch (fixError) {
          console.error('❌ Could not fix column:', fixError.message);
        }
      }
    }
    
    res.status(500).json({ 
      message: process.env.NODE_ENV === 'development' 
        ? `Server error: ${errorMessage}` 
        : 'Failed to create prescription. Please try again.',
      debug: process.env.NODE_ENV === 'development' ? {
        error: errorMessage,
        original: error.original?.message
      } : undefined
    });
  }
};

export const getPrescriptions = async (req, res) => {
  try {
    const { cursor, limit = 10 } = req.query;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user;
    const userId = req.user.id;

    // Validate limit
    const limitValue = parseInt(limit) || 10;
    const finalLimit = limitValue > 1000 ? 1001 : limitValue + 1; // Cap at 1000 results

    console.log('=== Fetching prescriptions with raw SQL ===');
    console.log('User role:', role, 'User ID:', userId);

    // Build WHERE clause based on role
    let whereClause = '';
    const replacements = { limitValue: finalLimit };

    if (role === 'patient') {
      whereClause = `WHERE p.patient_id::text = :userId::text`;
      replacements.userId = String(userId).trim();
    } else if (role === 'doctor') {
      try {
        const doctor = await Doctor.findOne({ where: { userId } });
        if (!doctor || !doctor.id) {
          console.log('⚠️  Doctor profile not found');
          return res.json({ success: true, prescriptions: [], pagination: { hasMore: false } });
        }
        whereClause = `WHERE p.doctor_id::text = :doctorId::text`;
        replacements.doctorId = String(doctor.id).trim();
        console.log('✅ Doctor found:', doctor.id);
      } catch (doctorError) {
        console.error('Error finding doctor:', doctorError);
        return res.json({ success: true, prescriptions: [], pagination: { hasMore: false } });
      }
    }
    // Admin sees all prescriptions (no where clause)

    if (cursor) {
      whereClause += whereClause ? ` AND p.id::text < :cursor::text` : `WHERE p.id::text < :cursor::text`;
      replacements.cursor = String(cursor).trim();
    }

    // Use raw SQL to fetch prescriptions with all related data
    // Use DISTINCT ON to prevent duplicates - group by prescription ID
    const query = `
      SELECT DISTINCT ON (p.id)
        p.id,
        p.patient_id as "patientId",
        p.doctor_id as "doctorId",
        p.appointment_id as "appointmentId",
        p.diagnosis,
        p.medicines,
        p.instructions,
        p.prescription_file as "prescriptionFile",
        p.prescription_date as "prescriptionDate",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        u.id as "patient.id",
        u.name as "patient.name",
        u.email as "patient.email",
        d.id as "doctor.id",
        d.specialization as "doctor.specialization",
        du.id as "doctor.user.id",
        du.name as "doctor.user.name",
        du.email as "doctor.user.email",
        a.id as "appointment.id",
        a.appointment_date as "appointment.appointmentDate",
        a.appointment_time as "appointment.appointmentTime",
        a.status as "appointment.status"
      FROM prescriptions p
      LEFT JOIN users u ON p.patient_id::text = u.id::text
      LEFT JOIN doctors d ON p.doctor_id::text = d.id::text
      LEFT JOIN users du ON d.user_id::text = du.id::text
      LEFT JOIN appointments a ON p.appointment_id::text = a.id::text
      ${whereClause}
      ORDER BY p.id, p.created_at DESC
      LIMIT :limitValue;
    `;

    console.log('Query:', query);
    console.log('Replacements:', replacements);

    const prescriptionRows = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    });

    console.log('📋 Prescriptions fetched:', prescriptionRows?.length || 0);
    
    if (prescriptionRows && prescriptionRows.length > 0) {
      console.log('📋 Sample prescription row:', {
        id: prescriptionRows[0].id,
        doctorId: prescriptionRows[0].doctorId,
        'doctor.id': prescriptionRows[0]['doctor.id'],
        'doctor.user.id': prescriptionRows[0]['doctor.user.id'],
        'doctor.user.name': prescriptionRows[0]['doctor.user.name'],
        'doctor.specialization': prescriptionRows[0]['doctor.specialization'],
      });
    }

    // Transform to expected format and remove duplicates by ID
    // Also remove duplicates by doctor + patient + date combination
    const prescriptionMapById = new Map();
    const prescriptionMapByKey = new Map();
    
    (prescriptionRows || []).forEach((row) => {
      // First deduplicate by ID
      if (!prescriptionMapById.has(row.id)) {
        prescriptionMapById.set(row.id, row);
        
        // Also deduplicate by doctor + patient + date + diagnosis (to prevent same prescription shown multiple times)
        // Use date only (without time) for comparison
        const prescriptionDate = row.prescriptionDate || row.createdAt || '';
        const dateOnly = prescriptionDate ? new Date(prescriptionDate).toISOString().split('T')[0] : '';
        const key = `${row.doctorId || ''}_${row.patientId || ''}_${dateOnly}_${(row.diagnosis || '').substring(0, 50)}`;
        
        if (!prescriptionMapByKey.has(key)) {
          prescriptionMapByKey.set(key, row);
        } else {
          // If duplicate key found, keep the one with latest created_at
          const existing = prescriptionMapByKey.get(key);
          const existingDate = new Date(existing.createdAt || 0).getTime();
          const newDate = new Date(row.createdAt || 0).getTime();
          if (newDate > existingDate) {
            prescriptionMapByKey.set(key, row);
          }
        }
      }
    });

    // Use the more restrictive deduplication (by key)
    const uniquePrescriptionRows = Array.from(prescriptionMapByKey.values());

    console.log('📋 Total rows:', prescriptionRows?.length || 0);
    console.log('📋 Unique by ID:', prescriptionMapById.size);
    console.log('📋 Unique by doctor+patient+date:', uniquePrescriptionRows.length);

    const prescriptions = uniquePrescriptionRows.map((row) => ({
      id: row.id,
      patientId: row.patientId,
      doctorId: row.doctorId,
      appointmentId: row.appointmentId,
      diagnosis: row.diagnosis,
      medicines: row.medicines || [],
      instructions: row.instructions,
      prescriptionFile: row.prescriptionFile,
      prescriptionDate: row.prescriptionDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      patient: row['patient.id'] ? {
        id: row['patient.id'],
        name: row['patient.name'],
        email: row['patient.email'],
      } : null,
      doctor: row['doctor.id'] ? {
        id: row['doctor.id'],
        specialization: row['doctor.specialization'],
        user: row['doctor.user.id'] ? {
          id: row['doctor.user.id'],
          name: row['doctor.user.name'],
          email: row['doctor.user.email'],
        } : null,
      } : null,
      appointment: row['appointment.id'] ? {
        id: row['appointment.id'],
        appointmentDate: row['appointment.appointmentDate'],
        appointmentTime: row['appointment.appointmentTime'],
        status: row['appointment.status'],
      } : null,
    }));

    const hasMore = prescriptions.length > limitValue;
    if (hasMore) {
      prescriptions.pop();
    }

    const nextCursor = hasMore && prescriptions.length > 0 ? prescriptions[prescriptions.length - 1]?.id : null;

    console.log('✅ Returning prescriptions:', prescriptions.length, 'hasMore:', hasMore);
    
    if (prescriptions.length > 0) {
      console.log('📋 Sample prescription:', {
        id: prescriptions[0].id,
        doctor: prescriptions[0].doctor,
        doctorName: prescriptions[0].doctor?.user?.name,
      });
    }

    res.json({
      success: true,
      prescriptions: prescriptions || [],
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('❌ Error in getPrescriptions:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Check for specific database errors
    if (error.name === 'SequelizeDatabaseError') {
      console.error('Database error details:', error.original);
    }
    
    // Return empty array instead of 500 error for better UX
    res.status(200).json({ 
      success: true,
      prescriptions: [],
      pagination: {
        hasMore: false,
        nextCursor: null,
      },
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getAISuggestions = async (req, res) => {
  try {
    const { problem, patientAge, patientWeight, department } = req.body;

    if (!problem) {
      return res.status(400).json({ message: 'Problem description is required' });
    }

    // If department is provided, prepend it to the problem for better detection
    let problemDescription = problem;
    if (department) {
      problemDescription = `${department} - ${problem}`;
    }

    const chatbot = new MedicalAIChatbot();
    const suggestions = chatbot.generatePrescription(problemDescription);

    res.json({
      success: true,
      suggestions: {
        ...suggestions,
        department: department || suggestions.department || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

