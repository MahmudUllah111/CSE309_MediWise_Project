import { Job, User } from '../models/index.js';
import { Op } from 'sequelize';

// Get all jobs (with optional filters)
export const getJobs = async (req, res) => {
  try {
    const { isActive, type, department, limit = 50, offset = 0 } = req.query;
    const whereConditions = {};

    if (isActive !== undefined) {
      whereConditions.isActive = isActive === 'true';
    }

    if (type) {
      whereConditions.type = type;
    }

    if (department) {
      whereConditions.department = { [Op.like]: `%${department}%` };
    }

    const jobs = await Job.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      jobs: jobs.rows,
      total: jobs.count,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message,
    });
  }
};

// Get single job by ID
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id, {
      include: [
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message,
    });
  }
};

// Create new job
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      location,
      type,
      department,
      salary,
      applicationDeadline,
      isActive = true,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required',
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements,
      location,
      type,
      department,
      salary,
      applicationDeadline,
      isActive,
      postedBy: req.user.id,
    });

    const jobWithPoster = await Job.findByPk(job.id, {
      include: [
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      job: jobWithPoster,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message,
    });
  }
};

// Update job
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      requirements,
      location,
      type,
      department,
      salary,
      applicationDeadline,
      isActive,
    } = req.body;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    await job.update({
      title: title || job.title,
      description: description || job.description,
      requirements: requirements !== undefined ? requirements : job.requirements,
      location: location !== undefined ? location : job.location,
      type: type || job.type,
      department: department !== undefined ? department : job.department,
      salary: salary !== undefined ? salary : job.salary,
      applicationDeadline: applicationDeadline !== undefined ? applicationDeadline : job.applicationDeadline,
      isActive: isActive !== undefined ? isActive : job.isActive,
    });

    const updatedJob = await Job.findByPk(id, {
      include: [
        {
          model: User,
          as: 'poster',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    });

    res.json({
      success: true,
      message: 'Job updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message,
    });
  }
};

// Delete job
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    await job.destroy();

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message,
    });
  }
};












