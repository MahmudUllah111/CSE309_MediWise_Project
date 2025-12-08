import { Op } from 'sequelize';
import User from '../models/User.js';
import multer from 'multer';

// Configure multer to store files in memory (we'll read and store in DB)
const storage = multer.memoryStorage();

const uploadProfileImage = multer({
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

export { uploadProfileImage };

// Search for patient by email (for doctors)
export const searchPatientByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    const { role } = req.user;

    // Only doctors and admins can search for patients
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Email parameter is required' });
    }

    const user = await User.findOne({
      where: {
        email: email.trim(),
        role: 'patient',
      },
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error in searchPatientByEmail:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID (for doctors/admins to view patient profiles)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    // Only doctors and admins can view user details
    if (role !== 'doctor' && role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update patient's own profile
export const updatePatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;

    // Only patients can update their own profile
    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can update their profile' });
    }

    const {
      name,
      phone,
      address,
      dateOfBirth,
      weight,
      height,
      homePhone,
      workPhone,
      allergies,
      bloodPressure,
      pulse,
      removeProfileImage,
    } = req.body;

    const updateData = {};

    // Update allowed fields
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (homePhone !== undefined) updateData.homePhone = homePhone;
    if (workPhone !== undefined) updateData.workPhone = workPhone;
    if (allergies !== undefined) updateData.allergies = Array.isArray(allergies) ? allergies : [];
    if (bloodPressure !== undefined) updateData.bloodPressure = bloodPressure;
    if (pulse !== undefined) updateData.pulse = pulse;

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

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get patient's own profile
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role } = req.user || {};

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access this endpoint' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


