import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import multer from 'multer';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Review from '../models/Review.js';
import { enrichDoctorWithBengali } from '../utils/translation.js';

export const getDoctors = async (req, res) => {
  try {
    const { departmentId, cursor, limit = 10, status } = req.query;
    
    console.log('=== getDoctors called ===');
    console.log('Query params:', { departmentId, cursor, limit, status });
    
    // Use raw SQL query to fetch ALL doctors from database (real-time)
    // Show all doctors regardless of status - let frontend filter if needed
    const limitValue = parseInt(limit) + 1;
    
    let sqlQuery = `
      SELECT 
        d.id,
        d.specialization,
        d.experience,
        d.qualification,
        d.bio,
        d.status,
        d.consultation_fee as "consultationFee",
        d.available_from as "availableFrom",
        d.available_to as "availableTo",
        d.available_days as "availableDays",
        d.is_available as "isAvailable",
        d.daily_appointment_limit as "dailyAppointmentLimit",
        d.appointment_duration as "appointmentDuration",
        d.user_id as "userId",
        d.department_id as "departmentId",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt",
        u.id as "user.id",
        u.name as "user.name",
        u.email as "user.email",
        u.phone as "user.phone",
        dept.id as "department.id",
        dept.name as "department.name",
        dept.description as "department.description"
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dept ON d.department_id = dept.id
      WHERE 1=1
    `;
    
    const replacements = {};
    
    // Only filter by status if explicitly provided, otherwise show all
    if (status) {
      sqlQuery += ` AND d.status = :statusValue`;
      replacements.statusValue = status;
    }
    
    if (departmentId) {
      sqlQuery += ` AND d.department_id = :departmentId`;
      replacements.departmentId = departmentId;
    }
    
    if (cursor) {
      sqlQuery += ` AND d.id < :cursor`;
      replacements.cursor = cursor;
    }
    
    sqlQuery += ` ORDER BY d.created_at DESC LIMIT :limitValue`;
    replacements.limitValue = limitValue;
    
    console.log('=== Real-time database query ===');
    console.log('Executing SQL query:', sqlQuery);
    console.log('Query replacements:', replacements);
    console.log('Timestamp:', new Date().toISOString());
    
    let rawDoctors;
    try {
      // Force fresh query from database (no cache)
      const rawDoctorsResult = await sequelize.query(sqlQuery, {
        replacements: replacements,
        type: sequelize.QueryTypes.SELECT,
        // Force fresh data from database
        raw: true,
      });
      
      // sequelize.query with QueryTypes.SELECT returns results directly as an array
      rawDoctors = Array.isArray(rawDoctorsResult) ? rawDoctorsResult : [];
      
      console.log(`Raw SQL found ${rawDoctors.length} doctors`);
      if (rawDoctors.length > 0) {
        console.log('Sample raw doctor:', JSON.stringify(rawDoctors[0], null, 2));
      }
    } catch (sqlError) {
      console.error('SQL query error:', sqlError);
      console.error('SQL error details:', sqlError.message);
      console.error('SQL error stack:', sqlError.stack);
      rawDoctors = [];
    }
    
    if (!rawDoctors || !Array.isArray(rawDoctors)) {
      console.error('rawDoctors is not an array:', typeof rawDoctors, rawDoctors);
      rawDoctors = [];
    }
    
    // Transform raw results to match expected format
    const doctors = rawDoctors.map((row) => {
      const doctor = {
        id: row.id,
        specialization: row.specialization,
        experience: row.experience,
        qualification: row.qualification,
        bio: row.bio,
        status: row.status,
        consultationFee: row.consultationFee,
        availableFrom: row.availableFrom,
        availableTo: row.availableTo,
        availableDays: row.availableDays,
        isAvailable: row.isAvailable,
        dailyAppointmentLimit: row.dailyAppointmentLimit,
        appointmentDuration: row.appointmentDuration,
        userId: row.userId,
        departmentId: row.departmentId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
      
      if (row['user.id']) {
        doctor.user = {
          id: row['user.id'],
          name: row['user.name'],
          email: row['user.email'],
          phone: row['user.phone'],
        };
      }
      
      if (row['department.id']) {
        doctor.department = {
          id: row['department.id'],
          name: row['department.name'],
          description: row['department.description'],
        };
      }
      
      return doctor;
    });
    
    console.log(`Transformed ${doctors.length} doctors`);
    
    // Log first doctor details if any found
    if (doctors.length > 0) {
      console.log('First doctor sample:', JSON.stringify(doctors[0], null, 2));
    } else {
      console.log('No doctors found with raw SQL. Checking database directly...');
      // Direct database check
      const [directCheck] = await sequelize.query(`
        SELECT COUNT(*) as count FROM doctors WHERE status = 'approved'
      `);
      console.log('Direct database check - approved doctors:', directCheck[0]?.count || 0);
    }

    // Doctors are already plain objects from raw SQL, no need to convert
    const doctorsData = doctors;

    const hasMore = doctorsData.length > parseInt(limit);
    if (hasMore) {
      doctorsData.pop();
    }

    const nextCursor = hasMore && doctorsData.length > 0 ? doctorsData[doctorsData.length - 1].id : null;

    console.log('Returning doctors:', {
      count: doctorsData.length,
      hasMore,
      nextCursor,
      sampleIds: doctorsData.slice(0, 3).map(d => d.id)
    });

    res.json({
      success: true,
      doctors: doctorsData || [],
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error('Error in getDoctors:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'dateOfBirth'] },
        { model: Department, as: 'department' },
      ],
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const reviews = await Review.findAll({
      where: { doctorId: id },
      include: [{ model: User, as: 'patient', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });

    const avgRating = await Review.findAll({
      where: { doctorId: id },
      attributes: [
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avgRating'],
        [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews'],
      ],
      raw: true,
    });

    res.json({
      success: true,
      doctor,
      reviews,
      rating: avgRating[0] || { avgRating: 0, totalReviews: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const {
      userId,
      departmentId,
      specialization,
      experience,
      qualification,
      bio,
      consultationFee,
      availableFrom,
      availableTo,
    } = req.body;

    const doctor = await Doctor.create({
      userId,
      departmentId,
      specialization,
      experience,
      qualification,
      bio,
      consultationFee,
      availableFrom,
      availableTo,
    });

    const doctorWithDetails = await Doctor.findByPk(doctor.id, {
      include: [
        { model: User, as: 'user' },
        { model: Department, as: 'department' },
      ],
    });

    res.status(201).json({
      success: true,
      doctor: doctorWithDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { removeProfileImage } = req.body;
    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const updateData = { ...req.body };

    // Parse availableDays if it's a JSON string
    if (updateData.availableDays && typeof updateData.availableDays === 'string') {
      try {
        updateData.availableDays = JSON.parse(updateData.availableDays);
      } catch (e) {
        console.error('Error parsing availableDays:', e);
        // If parsing fails, try to set it as an array
        updateData.availableDays = [];
      }
    }

    // Handle profile image upload if present
    if (req.file && req.file.fieldname === 'profileImage') {
      const base64Image = req.file.buffer.toString('base64');
      updateData.profileImage = base64Image;
      updateData.profileImageMimeType = req.file.mimetype;
    }

    // Handle profile image removal
    if (removeProfileImage === 'true' || removeProfileImage === true) {
      updateData.profileImage = null;
      updateData.profileImageMimeType = null;
    }

    // Remove removeProfileImage from updateData to avoid storing it
    delete updateData.removeProfileImage;

    await doctor.update(updateData);

    // Auto-enrich with Bengali if needed
    const updatedDoctor = await Doctor.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Department, as: 'department' },
      ],
    });

    const enrichedDoctor = await enrichDoctorWithBengali(updatedDoctor);
    await enrichedDoctor.save();

    res.json({
      success: true,
      doctor: enrichedDoctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Multer middleware for CV upload
const storage = multer.memoryStorage();

export const uploadCV = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
}).single('cvResume');

// Multer middleware for profile image upload
export const uploadProfileImage = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, and GIF images are allowed'));
    }
  },
}).single('profileImage');

// Search doctors
export const searchDoctors = async (req, res) => {
  try {
    const { q, departmentId, specialization } = req.query;
    const queryOptions = {
      where: { isAvailable: true, status: 'approved' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Department, as: 'department' },
      ],
    };

    if (departmentId) {
      queryOptions.where.departmentId = departmentId;
    }

    if (specialization) {
      queryOptions.where.specialization = {
        [Op.iLike]: `%${specialization}%`,
      };
    }

    if (q) {
      queryOptions.include[0].where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ],
      };
    }

    const doctors = await Doctor.findAll(queryOptions);

    res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Complete doctor profile
export const completeDoctorProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      departmentId,
      specialization,
      experience,
      qualification,
      bio,
      consultationFee,
      availableFrom,
      availableTo,
      availableDays,
      previousJobs,
      education,
      qualificationBn,
      specializationBn,
      previousJobsBn,
    } = req.body;

    // Parse JSON strings if they come as strings
    let parsedAvailableDays = availableDays;
    let parsedPreviousJobs = previousJobs;
    let parsedEducation = education;

    if (typeof availableDays === 'string') {
      try {
        parsedAvailableDays = JSON.parse(availableDays);
      } catch (e) {
        parsedAvailableDays = [];
      }
    }

    if (typeof previousJobs === 'string') {
      try {
        parsedPreviousJobs = JSON.parse(previousJobs);
      } catch (e) {
        parsedPreviousJobs = [];
      }
    }

    if (typeof education === 'string') {
      try {
        parsedEducation = JSON.parse(education);
      } catch (e) {
        parsedEducation = [];
      }
    }

    // Check if doctor profile already exists
    let doctor = await Doctor.findOne({ where: { userId } });

    const doctorData = {
      departmentId,
      specialization,
      experience: parseInt(experience) || 0,
      qualification,
      bio,
      consultationFee: parseFloat(consultationFee) || 0,
      availableFrom,
      availableTo,
      availableDays: Array.isArray(parsedAvailableDays) ? parsedAvailableDays : [],
      previousJobs: Array.isArray(parsedPreviousJobs) ? parsedPreviousJobs : [],
      education: Array.isArray(parsedEducation) ? parsedEducation : [],
      qualificationBn,
      specializationBn,
      previousJobsBn,
    };

    // Handle CV upload if present
    if (req.file && req.file.fieldname === 'cvResume') {
      const base64CV = req.file.buffer.toString('base64');
      doctorData.cvResume = base64CV;
      doctorData.cvResumeFileName = req.file.originalname;
      doctorData.cvResumeMimeType = req.file.mimetype;
    }

    if (doctor) {
      await doctor.update(doctorData);
    } else {
      // Ensure userId is set when creating new doctor
      doctorData.userId = userId;
      
      // Check if userId column exists in database
      try {
        doctor = await Doctor.create(doctorData);
      } catch (createError) {
        console.error('Error creating doctor:', createError);
        
        // If column doesn't exist, try to sync database first
        if (createError.message && createError.message.includes('column') && createError.message.includes('does not exist')) {
          console.log('⚠️  Database column missing, attempting to sync...');
          try {
            await Doctor.sequelize.sync({ alter: true });
            // Retry creation
            doctor = await Doctor.create(doctorData);
          } catch (syncError) {
            console.error('Error syncing database:', syncError);
            return res.status(500).json({ 
              message: 'Database schema needs to be updated. Please contact administrator.',
              error: process.env.NODE_ENV === 'development' ? syncError.message : undefined
            });
          }
        } else {
          throw createError;
        }
      }
    }

    // Auto-enrich with Bengali if needed
    try {
      const updatedDoctor = await Doctor.findByPk(doctor.id, {
        include: [
          { model: User, as: 'user', required: false },
          { model: Department, as: 'department', required: false },
        ],
      });

      const enrichedDoctor = await enrichDoctorWithBengali(updatedDoctor);
      await enrichedDoctor.save();

      return res.json({
        success: true,
        doctor: enrichedDoctor,
      });
    } catch (enrichError) {
      console.error('Error enriching doctor:', enrichError);
      // Return doctor even if enrichment fails
      const updatedDoctor = await Doctor.findByPk(doctor.id, {
        include: [
          { model: User, as: 'user', required: false },
          { model: Department, as: 'department', required: false },
        ],
      });

      return res.json({
        success: true,
        doctor: updatedDoctor,
      });
    }
  } catch (error) {
    console.error('Error in completeDoctorProfile:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Internal server error';
    
    if (error.original) {
      errorMessage = error.original.message || errorMessage;
    }

    // Check for common database errors
    if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
      errorMessage = 'Database schema needs to be updated. Please restart the server or contact administrator.';
    }

    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get doctor profile
export const getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const doctor = await Doctor.findOne({
      where: { userId },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: { exclude: ['password'] },
          required: false
        },
        { 
          model: Department, 
          as: 'department',
          required: false
        },
      ],
    });

    if (!doctor) {
      return res.json({
        success: true,
        doctor: null,
        message: 'Doctor profile not found'
      });
    }

    // Auto-enrich with Bengali if needed
    try {
      const enrichedDoctor = await enrichDoctorWithBengali(doctor);
      return res.json({
        success: true,
        doctor: enrichedDoctor,
      });
    } catch (enrichError) {
      console.error('Error enriching doctor with Bengali:', enrichError);
      // Return doctor even if enrichment fails
      return res.json({
        success: true,
        doctor: doctor,
      });
    }
  } catch (error) {
    console.error('Error in getDoctorProfile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get pending doctors (admin only)
export const getPendingDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Department, as: 'department' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get approved doctors (admin only)
export const getApprovedDoctors = async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const doctors = await Doctor.findAll({
      where: { status: 'approved' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Department, as: 'department' },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve doctor (admin only)
export const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const doctor = await Doctor.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Department, as: 'department' },
      ],
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await doctor.update({
      status: 'approved',
      notes: notes || null,
    });

    res.json({
      success: true,
      message: 'Doctor approved successfully',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject doctor (admin only)
export const rejectDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const doctor = await Doctor.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Department, as: 'department' },
      ],
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    await doctor.update({
      status: 'rejected',
      notes: notes,
    });

    res.json({
      success: true,
      message: 'Doctor application rejected',
      doctor,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor CV
export const getDoctorCV = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findByPk(id, {
      attributes: ['id', 'cvResume', 'cvResumeFileName', 'cvResumeMimeType'],
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.cvResume) {
      return res.status(404).json({ message: 'CV not found' });
    }

    const buffer = Buffer.from(doctor.cvResume, 'base64');

    res.setHeader('Content-Type', doctor.cvResumeMimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${doctor.cvResumeFileName || 'cv.pdf'}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
