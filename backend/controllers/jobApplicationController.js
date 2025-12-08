import JobApplication from '../models/JobApplication.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadResume = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
    }
  },
}).single('resume');

// Create job application
export const createApplication = async (req, res) => {
  try {
    // Get data from body (FormData sends everything as strings)
    const jobId = req.body.jobId;
    const fullName = req.body.fullName;
    const email = req.body.email;
    const phone = req.body.phone;
    const coverLetter = req.body.coverLetter;
    const salaryExpectation = req.body.salaryExpectation;
    
    if (!jobId || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Job ID, Full Name, Email, and Phone Number are required',
      });
    }

    // Check if job exists and is active
    const job = await Job.findByPk(parseInt(jobId));
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (!job.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }

    // Check if deadline has passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline has passed',
      });
    }

    // Check if user already applied
    let applicantId = null;
    if (req.user) {
      applicantId = req.user.id;
      const existingApplication = await JobApplication.findOne({
        where: {
          jobId,
          applicantId,
        },
      });
      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this job',
        });
      }
    } else {
      // Check by email for non-logged in users
      const existingApplication = await JobApplication.findOne({
        where: {
          jobId,
          email,
        },
      });
      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'An application with this email already exists for this job',
        });
      }
    }

    let resumeUrl = null;
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    // Prepare application data
    const applicationData = {
      jobId: parseInt(jobId),
      fullName,
      email,
      phone,
      resume: resumeUrl,
      coverLetter: coverLetter || null,
      salaryExpectation: salaryExpectation || null,
      status: 'pending',
    };

    // Only add applicantId if user is logged in
    if (applicantId) {
      applicationData.applicantId = applicantId;
    }

    const application = await JobApplication.create(applicationData);

    const applicationWithDetails = await JobApplication.findByPk(application.id, {
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'department', 'location', 'type'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: applicationWithDetails,
    });
  } catch (error) {
    console.error('Error creating application:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      original: error.original?.message,
      sql: error.sql,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to submit application';
    if (error.name === 'SequelizeValidationError') {
      errorMessage = 'Validation error: ' + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeDatabaseError') {
      // Show actual database error in development
      const dbError = error.original?.message || error.message;
      errorMessage = process.env.NODE_ENV === 'development' 
        ? `Database error: ${dbError}` 
        : 'Database error. Please try again.';
      console.error('Database error details:', dbError);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get my applications (for logged in users)
export const getMyApplications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const applications = await JobApplication.findAll({
      where: { applicantId: req.user.id },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'department', 'location', 'type', 'isActive'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

// Get all applications (admin only)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await JobApplication.findAll({
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'department', 'location', 'type'],
        },
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'email'],
          required: false, // Left join for non-logged-in applicants
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

// Get applications for a job (admin only)
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await JobApplication.findAll({
      where: { jobId },
      include: [
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

// Update application status (admin only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    await application.update({
      status: status || application.status,
      notes: notes !== undefined ? notes : application.notes,
    });

    const updatedApplication = await JobApplication.findByPk(id, {
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'department'],
        },
        {
          model: User,
          as: 'applicant',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message,
    });
  }
};

